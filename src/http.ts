import {
	CloudLayerApiError,
	CloudLayerAuthError,
	CloudLayerNetworkError,
	CloudLayerRateLimitError,
	CloudLayerTimeoutError,
} from "./errors.js";
import type { CloudLayerResponseHeaders } from "./types/response.js";

/** @internal */
export interface HttpConfig {
	apiKey: string;
	baseUrl: string;
	apiVersion: "v1" | "v2";
	timeout: number;
	maxRetries: number;
	headers: Record<string, string>;
}

/** @internal */
export interface RequestOptions {
	/** Query parameters for GET requests. */
	params?: Record<string, string | number | boolean | undefined>;
	/** JSON body for POST requests. */
	body?: unknown;
	/** FormData for multipart uploads. */
	formData?: FormData;
	/** User-provided abort signal. */
	signal?: AbortSignal;
	/** Per-request timeout override in ms. */
	timeout?: number;
	/**
	 * If true, the path is used as-is without prepending the API version.
	 * Used for endpoints with hardcoded version prefixes (e.g., `/v2/templates`).
	 */
	absolutePath?: boolean;
	/**
	 * If true, this is a "safe" (idempotent/read-only) operation
	 * eligible for automatic retries on 429/5xx.
	 */
	retryable?: boolean;
}

/** @internal */
export interface HttpResponse<T> {
	data: T;
	status: number;
	headers: Headers;
	cloudlayerHeaders: CloudLayerResponseHeaders;
	filename?: string;
}

/**
 * Parse CloudLayer custom response headers.
 * @internal
 */
function parseCloudLayerHeaders(headers: Headers): CloudLayerResponseHeaders {
	const get = (name: string): string | undefined => headers.get(name) ?? undefined;
	const getNum = (name: string): number | undefined => {
		const val = headers.get(name);
		if (val == null) return undefined;
		const num = Number(val);
		return Number.isNaN(num) ? undefined : num;
	};

	return {
		"cl-worker-job-id": get("cl-worker-job-id"),
		"cl-cluster-id": get("cl-cluster-id"),
		"cl-worker": get("cl-worker"),
		"cl-bandwidth": getNum("cl-bandwidth"),
		"cl-process-time": getNum("cl-process-time"),
		"cl-calls-remaining": getNum("cl-calls-remaining"),
		"cl-charged-time": getNum("cl-charged-time"),
		"cl-bandwidth-cost": getNum("cl-bandwidth-cost"),
		"cl-process-time-cost": getNum("cl-process-time-cost"),
		"cl-api-credit-cost": getNum("cl-api-credit-cost"),
	};
}

/**
 * Parse filename from Content-Disposition header.
 * @internal
 */
function parseFilename(headers: Headers): string | undefined {
	const disposition = headers.get("content-disposition");
	if (!disposition) return undefined;
	const match = disposition.match(/filename="?([^";\s]+)"?/);
	return match?.[1];
}

/**
 * Combine multiple abort signals into one.
 * Uses AbortSignal.any() where available, falls back to manual listener approach.
 * @internal
 */
function combineSignals(signals: AbortSignal[]): { signal: AbortSignal; cleanup: () => void } {
	// Filter out undefined signals
	const validSignals = signals.filter(Boolean);
	if (validSignals.length === 0) {
		const controller = new AbortController();
		return { signal: controller.signal, cleanup: () => {} };
	}
	if (validSignals.length === 1) {
		return { signal: validSignals[0], cleanup: () => {} };
	}

	// Use AbortSignal.any() if available (Node 20.3+, modern browsers)
	if ("any" in AbortSignal) {
		const signal = AbortSignal.any(validSignals);
		return { signal, cleanup: () => {} };
	}

	// Manual fallback for Node 18
	const controller = new AbortController();
	const onAbort = () => controller.abort();

	for (const sig of validSignals) {
		if (sig.aborted) {
			controller.abort();
			return { signal: controller.signal, cleanup: () => {} };
		}
		sig.addEventListener("abort", onAbort, { once: true });
	}

	const cleanup = () => {
		for (const sig of validSignals) {
			sig.removeEventListener("abort", onAbort);
		}
	};

	return { signal: controller.signal, cleanup };
}

/**
 * Internal HTTP transport for CloudLayer API requests.
 * @internal
 */
export class HttpTransport {
	constructor(private readonly config: HttpConfig) {}

	/**
	 * Make an HTTP GET request.
	 */
	async get<T>(path: string, options?: RequestOptions): Promise<HttpResponse<T>> {
		return this.request<T>("GET", path, options);
	}

	/**
	 * Make an HTTP POST request with JSON body.
	 */
	async post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<HttpResponse<T>> {
		return this.request<T>("POST", path, { ...options, body });
	}

	/**
	 * Make an HTTP POST request with multipart form data.
	 */
	async postMultipart<T>(
		path: string,
		formData: FormData,
		options?: RequestOptions,
	): Promise<HttpResponse<T>> {
		return this.request<T>("POST", path, { ...options, formData });
	}

	/**
	 * Make an HTTP DELETE request.
	 */
	async delete<T>(path: string, options?: RequestOptions): Promise<HttpResponse<T>> {
		return this.request<T>("DELETE", path, options);
	}

	/**
	 * Core request method with timeout, error mapping, and retry support.
	 */
	private async request<T>(
		method: string,
		path: string,
		options?: RequestOptions,
	): Promise<HttpResponse<T>> {
		const retryable = options?.retryable ?? false;
		const maxAttempts = retryable ? this.config.maxRetries + 1 : 1;
		let lastError: unknown;

		for (let attempt = 0; attempt < maxAttempts; attempt++) {
			try {
				return await this.executeRequest<T>(method, path, options);
			} catch (error) {
				lastError = error;

				// Only retry on retryable status codes
				if (!retryable || attempt >= maxAttempts - 1) throw error;

				if (error instanceof CloudLayerRateLimitError) {
					const waitMs = error.retryAfter ? error.retryAfter * 1000 : this.backoffMs(attempt);
					await this.sleep(waitMs);
					continue;
				}

				if (error instanceof CloudLayerApiError && error.status >= 500) {
					await this.sleep(this.backoffMs(attempt));
					continue;
				}

				// Non-retryable error — throw immediately
				throw error;
			}
		}

		throw lastError;
	}

	/**
	 * Execute a single HTTP request attempt.
	 */
	private async executeRequest<T>(
		method: string,
		path: string,
		options?: RequestOptions,
	): Promise<HttpResponse<T>> {
		const url = this.buildUrl(path, options);
		const timeout = options?.timeout ?? this.config.timeout;

		// Build combined abort signal (timeout + user signal)
		const timeoutSignal = AbortSignal.timeout(timeout);
		const signals: AbortSignal[] = [timeoutSignal];
		if (options?.signal) signals.push(options.signal);
		const { signal, cleanup } = combineSignals(signals);

		const headers: Record<string, string> = {
			"X-API-Key": this.config.apiKey,
			...this.config.headers,
		};

		let fetchBody: BodyInit | undefined;

		if (options?.formData) {
			// Multipart — let fetch set Content-Type with boundary
			fetchBody = options.formData;
		} else if (options?.body !== undefined) {
			headers["Content-Type"] = "application/json";
			fetchBody = JSON.stringify(options.body);
		}

		let response: Response;
		try {
			response = await fetch(url, {
				method,
				headers,
				body: fetchBody,
				signal,
			});
		} catch (error) {
			cleanup();
			if (error instanceof DOMException && error.name === "AbortError") {
				// Determine if it was a timeout or user cancellation
				if (options?.signal?.aborted) {
					throw new CloudLayerTimeoutError({
						timeout,
						requestPath: path,
						requestMethod: method,
					});
				}
				throw new CloudLayerTimeoutError({
					timeout,
					requestPath: path,
					requestMethod: method,
				});
			}
			throw new CloudLayerNetworkError(
				`Network error: ${error instanceof Error ? error.message : String(error)}`,
				{ cause: error, requestPath: path, requestMethod: method },
			);
		} finally {
			cleanup();
		}

		// Handle error responses
		if (!response.ok) {
			await this.handleErrorResponse(response, path, method);
		}

		// Handle empty responses (204 No Content)
		if (response.status === 204) {
			return {
				data: undefined as T,
				status: response.status,
				headers: response.headers,
				cloudlayerHeaders: parseCloudLayerHeaders(response.headers),
			};
		}

		// Determine response type
		const contentType = response.headers.get("content-type") ?? "";
		const cloudlayerHeaders = parseCloudLayerHeaders(response.headers);
		const filename = parseFilename(response.headers);

		if (contentType.includes("application/json") || contentType.includes("text/json")) {
			const data = (await response.json()) as T;
			return {
				data,
				status: response.status,
				headers: response.headers,
				cloudlayerHeaders,
				filename,
			};
		}

		// Binary response (v1 sync mode)
		const buffer = Buffer.from(await response.arrayBuffer());
		return {
			data: buffer as T,
			status: response.status,
			headers: response.headers,
			cloudlayerHeaders,
			filename,
		};
	}

	/**
	 * Build the full request URL.
	 */
	private buildUrl(path: string, options?: RequestOptions): string {
		const fullPath = options?.absolutePath
			? `${this.config.baseUrl}${path}`
			: `${this.config.baseUrl}/${this.config.apiVersion}${path}`;

		if (!options?.params) return fullPath;

		const url = new URL(fullPath);
		for (const [key, value] of Object.entries(options.params)) {
			if (value !== undefined && value !== null) {
				url.searchParams.set(key, String(value));
			}
		}
		return url.toString();
	}

	/**
	 * Map HTTP error responses to appropriate error classes.
	 */
	private async handleErrorResponse(
		response: Response,
		requestPath: string,
		requestMethod: string,
	): Promise<never> {
		let body: unknown;
		try {
			body = await response.json();
		} catch {
			body = await response.text().catch(() => undefined);
		}

		const baseOpts = {
			status: response.status,
			statusText: response.statusText,
			body,
			requestPath,
			requestMethod,
		};

		if (response.status === 401 || response.status === 403) {
			throw new CloudLayerAuthError(baseOpts);
		}

		if (response.status === 429) {
			const retryAfterHeader = response.headers.get("retry-after");
			const retryAfter = retryAfterHeader ? Number(retryAfterHeader) : undefined;
			throw new CloudLayerRateLimitError({
				...baseOpts,
				retryAfter: retryAfter && !Number.isNaN(retryAfter) ? retryAfter : undefined,
			});
		}

		const message =
			body && typeof body === "object" && "message" in body
				? String((body as { message: unknown }).message)
				: `API error: ${response.status} ${response.statusText}`;

		throw new CloudLayerApiError(message, baseOpts);
	}

	/**
	 * Calculate exponential backoff with jitter.
	 */
	private backoffMs(attempt: number): number {
		const baseMs = 1000 * 2 ** attempt; // 1s, 2s, 4s
		const jitter = Math.random() * 500;
		return baseMs + jitter;
	}

	/**
	 * Sleep for the specified duration.
	 */
	private sleep(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}
}
