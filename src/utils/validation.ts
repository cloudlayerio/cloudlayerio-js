import { CloudLayerValidationError } from "../errors.js";

/** Validate that a URL string is well-formed. */
export function validateUrl(value: string, field: string): void {
	try {
		new URL(value);
	} catch {
		throw new CloudLayerValidationError(field, `"${value}" is not a valid URL`);
	}
}

/** Validate base options that apply to all conversion endpoints. */
export function validateBaseOptions(options: Record<string, unknown>): void {
	if (options.timeout !== undefined) {
		const timeout = options.timeout as number;
		if (typeof timeout !== "number" || timeout < 1000) {
			throw new CloudLayerValidationError("timeout", "must be at least 1000ms");
		}
	}

	if (options.async === true && !options.storage) {
		throw new CloudLayerValidationError(
			"storage",
			"storage must be set when async is true (use `true` for default storage or `{ id: '...' }` for a specific config)",
		);
	}

	if (options.storage && typeof options.storage === "object" && "id" in options.storage) {
		const storageId = (options.storage as { id: unknown }).id;
		if (!storageId || typeof storageId !== "string") {
			throw new CloudLayerValidationError("storage.id", "storage id is required");
		}
	}

	if (options.webhook !== undefined) {
		const webhook = options.webhook as string;
		if (typeof webhook !== "string" || !webhook.startsWith("https://")) {
			throw new CloudLayerValidationError("webhook", "webhook URL must use HTTPS protocol");
		}
		validateUrl(webhook, "webhook");
	}
}

/** Validate URL endpoint options (url/batch, auth, cookies). */
export function validateUrlOptions(options: Record<string, unknown>): void {
	const url = options.url as string | undefined;
	const batch = options.batch as { urls?: string[] } | undefined;

	if (url && batch?.urls?.length) {
		throw new CloudLayerValidationError(
			"url",
			"you must specify either 'url' or 'batch.urls' but not both",
		);
	}

	if (!url && (!batch?.urls || batch.urls.length === 0)) {
		throw new CloudLayerValidationError("url", "either 'url' or 'batch.urls' is required");
	}

	if (url) {
		validateUrl(url, "url");
	}

	if (batch?.urls) {
		if (batch.urls.length > 20) {
			throw new CloudLayerValidationError("batch.urls", "maximum 20 URLs per batch");
		}
		for (let i = 0; i < batch.urls.length; i++) {
			validateUrl(batch.urls[i], `batch.urls[${i}]`);
		}
	}

	const auth = options.authentication as { username?: string; password?: string } | undefined;
	if (auth) {
		if (!auth.username || !auth.password) {
			throw new CloudLayerValidationError(
				"authentication",
				"both username and password are required",
			);
		}
	}

	const cookies = options.cookies as Array<{ name?: string; value?: string }> | undefined;
	if (cookies) {
		for (let i = 0; i < cookies.length; i++) {
			if (!cookies[i].name || !cookies[i].value) {
				throw new CloudLayerValidationError(
					`cookies[${i}]`,
					"name and value are required for each cookie",
				);
			}
		}
	}
}

/** Validate HTML endpoint options. */
export function validateHtmlOptions(options: Record<string, unknown>): void {
	const html = options.html as string | undefined;
	if (!html || typeof html !== "string") {
		throw new CloudLayerValidationError("html", "html is required");
	}
}

/** Validate template endpoint options. */
export function validateTemplateOptions(options: Record<string, unknown>): void {
	const templateId = options.templateId as string | undefined;
	const template = options.template as string | undefined;

	if (templateId && template) {
		throw new CloudLayerValidationError(
			"template",
			"provide either 'templateId' or 'template', not both",
		);
	}

	if (!templateId && !template) {
		throw new CloudLayerValidationError(
			"template",
			"either 'templateId' or 'template' is required",
		);
	}
}

/** Validate image-specific options. */
export function validateImageOptions(options: Record<string, unknown>): void {
	const quality = options.quality as number | undefined;
	if (quality !== undefined && (typeof quality !== "number" || quality < 0 || quality > 100)) {
		throw new CloudLayerValidationError("quality", "must be between 0 and 100");
	}
}

/** Validate file input for document conversion endpoints. */
export function validateFileInput(options: Record<string, unknown>): void {
	if (!options.file) {
		throw new CloudLayerValidationError("file", "file is required");
	}
}
