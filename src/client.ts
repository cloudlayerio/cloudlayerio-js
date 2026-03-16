import * as accountApi from "./api/account.js";
import * as assetsApi from "./api/assets.js";
import * as conversion from "./api/conversion.js";
import * as jobsApi from "./api/jobs.js";
import * as storageApi from "./api/storage.js";
import * as templatesApi from "./api/templates.js";
import { CloudLayerConfigError } from "./errors.js";
import { HttpTransport } from "./http.js";
import type {
	DocxToHtmlOptions,
	DocxToPdfOptions,
	HtmlToImageOptions,
	HtmlToPdfOptions,
	MergePdfsOptions,
	PdfToDocxOptions,
	TemplateToImageOptions,
	TemplateToPdfOptions,
	UrlToImageOptions,
	UrlToPdfOptions,
} from "./types/endpoints.js";
import type { Job } from "./types/job.js";
import type { ConversionResult } from "./types/response.js";

/**
 * Configuration for the CloudLayer SDK client.
 */
export interface CloudLayerConfig {
	/** Your CloudLayer.io API key (required). */
	apiKey: string;

	/**
	 * API version to use: "v1" or "v2" (required).
	 *
	 * - **v1**: Sync by default. Conversion endpoints return raw binary (PDF/image buffer).
	 * - **v2**: Async by default. Conversion endpoints return a Job object (JSON).
	 *   Use `downloadJobResult()` to fetch the binary output.
	 */
	apiVersion: "v1" | "v2";

	/**
	 * Base URL for the CloudLayer.io API.
	 * @default "https://api.cloudlayer.io"
	 */
	baseUrl?: string;

	/**
	 * Default request timeout in milliseconds.
	 * @default 30000
	 */
	timeout?: number;

	/**
	 * Maximum retries for safe operations (data endpoints only, not conversions).
	 * Must be between 0 and 5.
	 * @default 2
	 */
	maxRetries?: number;

	/**
	 * Additional headers to include on all requests.
	 */
	headers?: Record<string, string>;
}

/**
 * Official CloudLayer.io SDK client for document generation.
 *
 * @example
 * ```ts
 * import { CloudLayer } from "@cloudlayerio/sdk";
 *
 * const client = new CloudLayer({
 *   apiKey: "your-api-key",
 *   apiVersion: "v2",
 * });
 * ```
 */
export class CloudLayer {
	readonly apiVersion: "v1" | "v2";
	readonly baseUrl: string;

	/** @internal */
	readonly http: HttpTransport;

	private readonly config: Readonly<Required<CloudLayerConfig>>;

	constructor(config: CloudLayerConfig) {
		if (!config.apiKey || typeof config.apiKey !== "string") {
			throw new CloudLayerConfigError("apiKey is required and must be a non-empty string");
		}

		if (config.apiVersion !== "v1" && config.apiVersion !== "v2") {
			throw new CloudLayerConfigError('apiVersion is required and must be "v1" or "v2"');
		}

		const baseUrl = config.baseUrl ?? "https://api.cloudlayer.io";
		try {
			new URL(baseUrl);
		} catch {
			throw new CloudLayerConfigError(`baseUrl "${baseUrl}" is not a valid URL`);
		}

		const timeout = config.timeout ?? 30000;
		if (typeof timeout !== "number" || timeout <= 0) {
			throw new CloudLayerConfigError("timeout must be a positive number");
		}

		const maxRetries = config.maxRetries ?? 2;
		if (typeof maxRetries !== "number" || maxRetries < 0 || maxRetries > 5) {
			throw new CloudLayerConfigError("maxRetries must be between 0 and 5");
		}

		this.config = Object.freeze({
			apiKey: config.apiKey,
			apiVersion: config.apiVersion,
			baseUrl,
			timeout,
			maxRetries,
			headers: config.headers ?? {},
		});

		this.apiVersion = this.config.apiVersion;
		this.baseUrl = this.config.baseUrl;

		this.http = new HttpTransport({
			apiKey: this.config.apiKey,
			baseUrl: this.config.baseUrl,
			apiVersion: this.config.apiVersion,
			timeout: this.config.timeout,
			maxRetries: this.config.maxRetries,
			headers: this.config.headers,
		});
	}

	// ---- Conversion Methods ----

	/** Render a URL as a PDF document. */
	async urlToPdf(options: UrlToPdfOptions): Promise<ConversionResult<Job | Buffer>> {
		return conversion.urlToPdf(this.http, this.apiVersion, options);
	}

	/** Render a URL as an image. */
	async urlToImage(options: UrlToImageOptions): Promise<ConversionResult<Job | Buffer>> {
		return conversion.urlToImage(this.http, this.apiVersion, options);
	}

	/** Render Base64-encoded HTML as a PDF document. */
	async htmlToPdf(options: HtmlToPdfOptions): Promise<ConversionResult<Job | Buffer>> {
		return conversion.htmlToPdf(this.http, this.apiVersion, options);
	}

	/** Render Base64-encoded HTML as an image. */
	async htmlToImage(options: HtmlToImageOptions): Promise<ConversionResult<Job | Buffer>> {
		return conversion.htmlToImage(this.http, this.apiVersion, options);
	}

	/** Render a template with data as a PDF document. */
	async templateToPdf(options: TemplateToPdfOptions): Promise<ConversionResult<Job | Buffer>> {
		return conversion.templateToPdf(this.http, this.apiVersion, options);
	}

	/** Render a template with data as an image. */
	async templateToImage(options: TemplateToImageOptions): Promise<ConversionResult<Job | Buffer>> {
		return conversion.templateToImage(this.http, this.apiVersion, options);
	}

	/** Convert a DOCX file to PDF. */
	async docxToPdf(options: DocxToPdfOptions): Promise<ConversionResult<Job | Buffer>> {
		return conversion.docxToPdf(this.http, this.apiVersion, options);
	}

	/** Convert a DOCX file to HTML. */
	async docxToHtml(options: DocxToHtmlOptions): Promise<ConversionResult<Job | Buffer>> {
		return conversion.docxToHtml(this.http, this.apiVersion, options);
	}

	/** Convert a PDF file to DOCX. */
	async pdfToDocx(options: PdfToDocxOptions): Promise<ConversionResult<Job | Buffer>> {
		return conversion.pdfToDocx(this.http, this.apiVersion, options);
	}

	/** Merge multiple PDFs into one. */
	async mergePdfs(options: MergePdfsOptions): Promise<ConversionResult<Job | Buffer>> {
		return conversion.mergePdfs(this.http, this.apiVersion, options);
	}

	// ---- Utility Methods ----

	/**
	 * Download binary content from a completed Job's `assetUrl`.
	 * Essential for v2 users who need the actual PDF/image/DOCX file.
	 *
	 * @param job - A completed Job with an `assetUrl` field.
	 * @returns The binary content as a Buffer.
	 * @throws If the Job has no `assetUrl` or the download fails.
	 */
	async downloadJobResult(job: Job): Promise<Buffer> {
		if (!job.assetUrl) {
			throw new Error(`Job ${job.id} has no assetUrl — job may not be complete or may have failed`);
		}
		return conversion.downloadJobResult(job.assetUrl);
	}

	/**
	 * Poll a job until it completes or fails.
	 *
	 * **Cost note:** Each poll is a Firestore document read on the server.
	 * Default interval is 5 seconds. Minimum interval is 2 seconds.
	 *
	 * @param jobId - The job ID to poll.
	 * @param options - Polling options.
	 * @param options.interval - Poll interval in ms (default 5000, minimum 2000).
	 * @param options.maxWait - Maximum wait time in ms (default 300000 / 5 min).
	 * @param options.signal - AbortSignal to cancel polling.
	 * @returns The completed Job.
	 * @throws If the job fails, times out, or is cancelled.
	 */
	async waitForJob(
		jobId: string,
		options?: { interval?: number; maxWait?: number; signal?: AbortSignal },
	): Promise<Job> {
		return conversion.waitForJob(this.http, jobId, options);
	}

	// ---- Jobs ----

	/**
	 * List all jobs for the authenticated user.
	 * **Warning:** Returns ALL jobs with no pagination (legacy API limitation).
	 */
	async listJobs(): Promise<Job[]> {
		return jobsApi.listJobs(this.http);
	}

	/** Get a specific job by ID. */
	async getJob(jobId: string): Promise<Job> {
		return jobsApi.getJob(this.http, jobId);
	}

	// ---- Assets ----

	/**
	 * List all assets for the authenticated user.
	 * **Warning:** Returns ALL assets with no pagination (legacy API limitation).
	 */
	async listAssets(): Promise<import("./types/asset.js").Asset[]> {
		return assetsApi.listAssets(this.http);
	}

	/** Get a specific asset by ID. */
	async getAsset(assetId: string): Promise<import("./types/asset.js").Asset> {
		return assetsApi.getAsset(this.http, assetId);
	}

	// ---- Storage ----

	/** List all storage configurations. */
	async listStorage(): Promise<import("./types/storage.js").StorageListItem[]> {
		return storageApi.listStorage(this.http);
	}

	/** Get a specific storage configuration by ID. */
	async getStorage(storageId: string): Promise<import("./types/storage.js").StorageDetail> {
		return storageApi.getStorage(this.http, storageId);
	}

	/**
	 * Add a new storage configuration.
	 * May return `{ allowed: false }` if the user's plan doesn't support custom storage.
	 */
	async addStorage(
		config: import("./types/storage.js").StorageParams,
	): Promise<
		| import("./types/storage.js").StorageDetail
		| import("./types/storage.js").StorageNotAllowedResponse
	> {
		return storageApi.addStorage(this.http, config);
	}

	/** Delete a storage configuration by ID. */
	async deleteStorage(storageId: string): Promise<void> {
		return storageApi.deleteStorage(this.http, storageId);
	}

	// ---- Account ----

	/** Get account information (usage, limits, plan details). */
	async getAccount(): Promise<import("./types/account.js").AccountInfo> {
		return accountApi.getAccount(this.http);
	}

	/**
	 * Get API status.
	 * Returns `{ status: "ok " }` (trailing space is a legacy quirk).
	 */
	async getStatus(): Promise<import("./types/account.js").StatusResponse> {
		return accountApi.getStatus(this.http);
	}

	// ---- Templates (Public) ----

	/**
	 * List public templates. Does not require API key auth.
	 * Always uses /v2/templates regardless of client API version.
	 */
	async listTemplates(
		options?: templatesApi.ListTemplatesOptions,
	): Promise<templatesApi.PublicTemplate[]> {
		return templatesApi.listTemplates(this.http, options);
	}

	/**
	 * Get a public template by ID. Does not require API key auth.
	 * Always uses /v2/template/:id regardless of client API version.
	 */
	async getTemplate(templateId: string): Promise<templatesApi.PublicTemplate> {
		return templatesApi.getTemplate(this.http, templateId);
	}
}
