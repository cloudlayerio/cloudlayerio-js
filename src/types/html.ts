/**
 * HTML-specific request options.
 *
 * The `html` field must contain **Base64-encoded** HTML content.
 * The server validates that the content is valid Base64.
 *
 * **Note:** The SDK provides a convenience method that auto-encodes
 * raw HTML to Base64. You can also encode manually:
 * ```ts
 * const html = btoa('<html><body>Hello</body></html>');
 * ```
 *
 * **waitUntil note:** Unlike URL endpoints which default to `"networkidle2"`,
 * HTML endpoints default `waitUntil` to `undefined` to avoid unnecessary
 * processing time.
 */
export interface HtmlOptions {
	/**
	 * Base64-encoded HTML content to render.
	 *
	 * The server rejects non-Base64 content with a validation error.
	 */
	html: string;
}
