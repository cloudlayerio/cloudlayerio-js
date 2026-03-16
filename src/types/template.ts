/**
 * Template-specific request options.
 *
 * Templates can be referenced by ID (server-side lookup) or provided
 * as Base64-encoded content. Provide either `templateId` or `template`,
 * but not both.
 *
 * When using multipart form data, the `template` and `data` fields
 * are sent as file uploads.
 */
export interface TemplateOptions {
	/**
	 * ID of a saved template on the server.
	 * Mutually exclusive with `template`.
	 */
	templateId?: string;

	/**
	 * Base64-encoded template content.
	 * Mutually exclusive with `templateId`.
	 */
	template?: string;

	/**
	 * Data object to merge with the template.
	 * The shape depends on the template's expected variables.
	 *
	 * @example
	 * ```ts
	 * { name: "John", items: [{ qty: 2, price: 9.99 }] }
	 * ```
	 */
	data?: Record<string, unknown>;

	/**
	 * Optional name for the template.
	 */
	name?: string;
}
