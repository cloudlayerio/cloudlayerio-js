/**
 * Base error class for all CloudLayer SDK errors.
 */
export class CloudLayerError extends Error {
	constructor(message: string, options?: { cause?: unknown }) {
		super(message, options);
		this.name = "CloudLayerError";
	}
}

/**
 * Thrown when the CloudLayer client is configured with invalid options.
 */
export class CloudLayerConfigError extends CloudLayerError {
	constructor(message: string) {
		super(message);
		this.name = "CloudLayerConfigError";
	}
}

/**
 * Thrown when the CloudLayer API returns an error response (4xx/5xx).
 */
export class CloudLayerApiError extends CloudLayerError {
	/** HTTP status code. */
	readonly status: number;
	/** HTTP status text. */
	readonly statusText: string;
	/** Parsed response body (if available). */
	readonly body: unknown;
	/** Request path that caused the error. */
	readonly requestPath: string;
	/** HTTP method of the request. */
	readonly requestMethod: string;

	constructor(
		message: string,
		options: {
			status: number;
			statusText: string;
			body?: unknown;
			requestPath: string;
			requestMethod: string;
		},
	) {
		super(message);
		this.name = "CloudLayerApiError";
		this.status = options.status;
		this.statusText = options.statusText;
		this.body = options.body;
		this.requestPath = options.requestPath;
		this.requestMethod = options.requestMethod;
	}
}

/**
 * Thrown when the API rejects the request due to invalid or missing authentication.
 * HTTP 401 (Unauthorized) or 403 (Forbidden).
 */
export class CloudLayerAuthError extends CloudLayerApiError {
	constructor(options: {
		status: number;
		statusText: string;
		body?: unknown;
		requestPath: string;
		requestMethod: string;
	}) {
		const message =
			options.status === 401
				? "Authentication failed: invalid or missing API key"
				: "Authorization failed: insufficient permissions";
		super(message, options);
		this.name = "CloudLayerAuthError";
	}
}

/**
 * Thrown when the API rate limit is exceeded (HTTP 429).
 */
export class CloudLayerRateLimitError extends CloudLayerApiError {
	/**
	 * Seconds to wait before retrying, parsed from the `Retry-After` header.
	 * `undefined` if the header is not present.
	 */
	readonly retryAfter: number | undefined;

	constructor(options: {
		status: number;
		statusText: string;
		body?: unknown;
		requestPath: string;
		requestMethod: string;
		retryAfter?: number;
	}) {
		const retryMsg = options.retryAfter ? ` Retry after ${options.retryAfter}s.` : "";
		super(`Rate limit exceeded.${retryMsg}`, options);
		this.name = "CloudLayerRateLimitError";
		this.retryAfter = options.retryAfter;
	}
}

/**
 * Thrown when a request times out.
 */
export class CloudLayerTimeoutError extends CloudLayerError {
	/** Timeout duration in milliseconds. */
	readonly timeout: number;
	/** Request path that timed out. */
	readonly requestPath: string;
	/** HTTP method of the request. */
	readonly requestMethod: string;

	constructor(options: { timeout: number; requestPath: string; requestMethod: string }) {
		super(
			`Request timed out after ${options.timeout}ms: ${options.requestMethod} ${options.requestPath}`,
		);
		this.name = "CloudLayerTimeoutError";
		this.timeout = options.timeout;
		this.requestPath = options.requestPath;
		this.requestMethod = options.requestMethod;
	}
}

/**
 * Thrown when a network error occurs (DNS failure, connection refused, etc.).
 */
export class CloudLayerNetworkError extends CloudLayerError {
	/** Request path that failed. */
	readonly requestPath: string;
	/** HTTP method of the request. */
	readonly requestMethod: string;

	constructor(
		message: string,
		options: { cause?: unknown; requestPath: string; requestMethod: string },
	) {
		super(message, { cause: options.cause });
		this.name = "CloudLayerNetworkError";
		this.requestPath = options.requestPath;
		this.requestMethod = options.requestMethod;
	}
}

/**
 * Thrown when client-side input validation fails before making the API request.
 */
export class CloudLayerValidationError extends CloudLayerError {
	/** The field that failed validation. */
	readonly field: string;

	constructor(field: string, message: string) {
		super(`Validation error on "${field}": ${message}`);
		this.name = "CloudLayerValidationError";
		this.field = field;
	}
}
