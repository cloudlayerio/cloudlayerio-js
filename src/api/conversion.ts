import type { HttpTransport } from "../http.js";
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
} from "../types/endpoints.js";
import type { Job } from "../types/job.js";
import type { ConversionResult } from "../types/response.js";
import {
	validateBaseOptions,
	validateFileInput,
	validateHtmlOptions,
	validateImageOptions,
	validateTemplateOptions,
	validateUrlOptions,
} from "../utils/validation.js";

type ApiVersion = "v1" | "v2";

/** Cast options to a plain object for validation/serialization. */
function asRecord(options: object): Record<string, unknown> {
	return options as unknown as Record<string, unknown>;
}

/** Strip SDK-only fields from the request body before sending to the API. */
function stripSdkFields(options: Record<string, unknown>): Record<string, unknown> {
	const { file, signal, ...rest } = options;
	return rest;
}

/** Build FormData for file upload endpoints. */
function buildFileFormData(
	file: Buffer | Blob | Uint8Array | string,
	options: Record<string, unknown>,
): FormData {
	const formData = new FormData();

	if (typeof file === "string") {
		// File path — read synchronously (Node.js only)
		const fs = require("node:fs") as typeof import("node:fs");
		const buffer = fs.readFileSync(file);
		formData.append("file", new Blob([buffer]));
	} else if (file instanceof Blob) {
		formData.append("file", file);
	} else {
		// Buffer or Uint8Array — convert to Uint8Array for safe Blob construction
		formData.append("file", new Blob([new Uint8Array(file)]));
	}

	const cleaned = stripSdkFields(options);
	for (const [key, value] of Object.entries(cleaned)) {
		if (value !== undefined && key !== "file") {
			formData.append(key, typeof value === "object" ? JSON.stringify(value) : String(value));
		}
	}

	return formData;
}

/** Post a JSON conversion request. */
async function postConversion<T>(
	http: HttpTransport,
	path: string,
	body: Record<string, unknown>,
): Promise<ConversionResult<T>> {
	const result = await http.post<T>(path, stripSdkFields(body));
	return {
		data: result.data,
		headers: result.cloudlayerHeaders,
		status: result.status,
		filename: result.filename,
	};
}

/** Post a multipart conversion request. */
async function postMultipartConversion<T>(
	http: HttpTransport,
	path: string,
	formData: FormData,
): Promise<ConversionResult<T>> {
	const result = await http.postMultipart<T>(path, formData);
	return {
		data: result.data,
		headers: result.cloudlayerHeaders,
		status: result.status,
		filename: result.filename,
	};
}

// ---- URL Conversion ----

export async function urlToPdf(
	http: HttpTransport,
	_apiVersion: ApiVersion,
	options: UrlToPdfOptions,
): Promise<ConversionResult<Job | Buffer>> {
	const opts = asRecord(options);
	validateBaseOptions(opts);
	validateUrlOptions(opts);
	return postConversion(http, "/url/pdf", opts);
}

export async function urlToImage(
	http: HttpTransport,
	_apiVersion: ApiVersion,
	options: UrlToImageOptions,
): Promise<ConversionResult<Job | Buffer>> {
	const opts = asRecord(options);
	validateBaseOptions(opts);
	validateUrlOptions(opts);
	validateImageOptions(opts);
	return postConversion(http, "/url/image", opts);
}

// ---- HTML Conversion ----

export async function htmlToPdf(
	http: HttpTransport,
	_apiVersion: ApiVersion,
	options: HtmlToPdfOptions,
): Promise<ConversionResult<Job | Buffer>> {
	const opts = asRecord(options);
	validateBaseOptions(opts);
	validateHtmlOptions(opts);
	return postConversion(http, "/html/pdf", opts);
}

export async function htmlToImage(
	http: HttpTransport,
	_apiVersion: ApiVersion,
	options: HtmlToImageOptions,
): Promise<ConversionResult<Job | Buffer>> {
	const opts = asRecord(options);
	validateBaseOptions(opts);
	validateHtmlOptions(opts);
	validateImageOptions(opts);
	return postConversion(http, "/html/image", opts);
}

// ---- Template Conversion ----

export async function templateToPdf(
	http: HttpTransport,
	_apiVersion: ApiVersion,
	options: TemplateToPdfOptions,
): Promise<ConversionResult<Job | Buffer>> {
	const opts = asRecord(options);
	validateBaseOptions(opts);
	validateTemplateOptions(opts);

	// JSON mode (templateId or base64 template string) — all template strings go as JSON
	return postConversion(http, "/template/pdf", opts);
}

export async function templateToImage(
	http: HttpTransport,
	_apiVersion: ApiVersion,
	options: TemplateToImageOptions,
): Promise<ConversionResult<Job | Buffer>> {
	const opts = asRecord(options);
	validateBaseOptions(opts);
	validateTemplateOptions(opts);
	validateImageOptions(opts);
	return postConversion(http, "/template/image", opts);
}

// ---- Document Conversion ----

export async function docxToPdf(
	http: HttpTransport,
	_apiVersion: ApiVersion,
	options: DocxToPdfOptions,
): Promise<ConversionResult<Job | Buffer>> {
	const opts = asRecord(options);
	validateBaseOptions(opts);
	validateFileInput(opts);
	const formData = buildFileFormData(options.file, opts);
	return postMultipartConversion(http, "/docx/pdf", formData);
}

export async function docxToHtml(
	http: HttpTransport,
	_apiVersion: ApiVersion,
	options: DocxToHtmlOptions,
): Promise<ConversionResult<Job | Buffer>> {
	const opts = asRecord(options);
	validateBaseOptions(opts);
	validateFileInput(opts);
	const formData = buildFileFormData(options.file, opts);
	return postMultipartConversion(http, "/docx/html", formData);
}

export async function pdfToDocx(
	http: HttpTransport,
	_apiVersion: ApiVersion,
	options: PdfToDocxOptions,
): Promise<ConversionResult<Job | Buffer>> {
	const opts = asRecord(options);
	validateBaseOptions(opts);
	validateFileInput(opts);
	const formData = buildFileFormData(options.file, opts);
	return postMultipartConversion(http, "/pdf/docx", formData);
}

export async function mergePdfs(
	http: HttpTransport,
	_apiVersion: ApiVersion,
	options: MergePdfsOptions,
): Promise<ConversionResult<Job | Buffer>> {
	const opts = asRecord(options);
	validateBaseOptions(opts);
	validateUrlOptions(opts);
	return postConversion(http, "/pdf/merge", opts);
}

// ---- Utilities ----

/**
 * Download binary content from a Job's assetUrl.
 * Essential for v2 users who need the actual PDF/image/DOCX binary.
 */
export async function downloadJobResult(assetUrl: string): Promise<Buffer> {
	const response = await fetch(assetUrl);
	if (!response.ok) {
		if (response.status === 403) {
			throw new Error(
				`Failed to download job result: 403 Forbidden. The asset URL may have expired (presigned URLs have a TTL). URL: ${assetUrl}`,
			);
		}
		throw new Error(
			`Failed to download job result: ${response.status} ${response.statusText}. URL: ${assetUrl}`,
		);
	}
	return Buffer.from(await response.arrayBuffer());
}

/**
 * Poll for job completion.
 */
export async function waitForJob(
	http: HttpTransport,
	jobId: string,
	options?: { interval?: number; maxWait?: number; signal?: AbortSignal },
): Promise<Job> {
	const { CloudLayerValidationError } = await import("../errors.js");

	const interval = options?.interval ?? 5000;
	const maxWait = options?.maxWait ?? 300000;

	if (interval < 2000) {
		throw new CloudLayerValidationError(
			"interval",
			"minimum polling interval is 2000ms (each poll is a Firestore read on the server)",
		);
	}

	const startTime = Date.now();

	while (true) {
		if (options?.signal?.aborted) {
			throw new Error("Job polling cancelled");
		}

		const result = await http.get<Job>(`/jobs/${jobId}`, { retryable: true });
		const job = result.data;

		if (job.status === "success") return job;
		if (job.status === "error") {
			throw new Error(`Job ${jobId} failed: ${job.error ?? "unknown error"}`);
		}

		if (Date.now() - startTime + interval > maxWait) {
			throw new Error(`Job ${jobId} did not complete within ${maxWait}ms`);
		}

		await new Promise<void>((resolve, reject) => {
			const timer = setTimeout(resolve, interval);
			if (options?.signal) {
				const onAbort = () => {
					clearTimeout(timer);
					reject(new Error("Job polling cancelled"));
				};
				options.signal.addEventListener("abort", onAbort, { once: true });
			}
		});
	}
}
