/**
 * HTTP Basic Authentication credentials.
 */
export interface Authentication {
	/** Username for Basic Auth. */
	username: string;
	/** Password for Basic Auth. */
	password: string;
}

/**
 * Batch of URLs to process in a single request.
 * Batch mode is always asynchronous.
 */
export interface Batch {
	/**
	 * URLs to process.
	 * @minItems 1
	 * @maxItems 20
	 */
	urls: string[];
}

/**
 * Browser cookie to set before page navigation.
 */
export interface Cookie {
	/** Cookie name (required). */
	name: string;
	/** Cookie value (required). */
	value: string;
	/** URL to associate the cookie with. */
	url?: string;
	/** Cookie domain. */
	domain?: string;
	/** Cookie path. */
	path?: string;
	/** Cookie expiration as a Unix timestamp (seconds). */
	expires?: number;
	/** HTTP-only flag. */
	httpOnly?: boolean;
	/** Secure flag (HTTPS only). */
	secure?: boolean;
	/** SameSite policy. */
	sameSite?: "Strict" | "Lax";
}

/**
 * URL-specific request options.
 *
 * Used for URL-to-PDF, URL-to-Image, and PDF merge endpoints.
 * Provide either `url` for a single page or `batch` for multiple pages.
 */
export interface UrlOptions {
	/**
	 * URL to render. Must be a valid URL (RFC 3986).
	 * Mutually exclusive with `batch`.
	 */
	url?: string;

	/**
	 * HTTP Basic Auth credentials for the target URL.
	 */
	authentication?: Authentication;

	/**
	 * Batch of URLs to process. Implies async mode.
	 * Mutually exclusive with `url`.
	 */
	batch?: Batch;

	/**
	 * Cookies to set in the browser before navigating to the URL.
	 */
	cookies?: Cookie[];
}
