import type { HttpTransport } from "../http.js";

/** Options for listing public templates. */
export interface ListTemplatesOptions {
	/** Filter by template type. */
	type?: string;
	/** Filter by category. */
	category?: string;
	/** Filter by tags (comma-separated). */
	tags?: string;
	/** Expand template details. */
	expand?: boolean;
}

/** Public template summary. */
export interface PublicTemplate {
	id: string;
	[key: string]: unknown;
}

/**
 * List public templates.
 * This endpoint does NOT require API key auth (uses rate limiting only).
 * Always uses /v2/templates regardless of client API version.
 */
export async function listTemplates(
	http: HttpTransport,
	options?: ListTemplatesOptions,
): Promise<PublicTemplate[]> {
	const params: Record<string, string | number | boolean | undefined> = {};
	if (options?.type) params.type = options.type;
	if (options?.category) params.category = options.category;
	if (options?.tags) params.tags = options.tags;
	if (options?.expand !== undefined) params.expand = options.expand;

	const result = await http.get<PublicTemplate[]>("/v2/templates", {
		absolutePath: true,
		retryable: true,
		params,
	});
	return result.data;
}

/**
 * Get a public template by ID.
 * This endpoint does NOT require API key auth.
 * Always uses /v2/template/:id regardless of client API version.
 */
export async function getTemplate(
	http: HttpTransport,
	templateId: string,
): Promise<PublicTemplate> {
	const result = await http.get<PublicTemplate>(`/v2/template/${templateId}`, {
		absolutePath: true,
		retryable: true,
	});
	return result.data;
}
