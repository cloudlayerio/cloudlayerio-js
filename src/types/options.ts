/**
 * Reference to a saved storage configuration by ID.
 *
 * Storage configs are managed via the storage CRUD endpoints
 * (`addStorage`, `listStorage`, `deleteStorage`). The actual S3
 * credentials live on the storage config, not on each request.
 */
export interface StorageRequestOptions {
	/** ID of a saved storage configuration. */
	id: string;
}

/**
 * Base options shared by all CloudLayer.io API endpoints.
 *
 * These fields can be included on any conversion request alongside
 * the endpoint-specific options (PDF, image, URL, HTML, template, etc.).
 */
export interface BaseOptions {
	/**
	 * Optional name for the job.
	 */
	name?: string;

	/**
	 * Request timeout in milliseconds.
	 * @default 30000
	 * @minimum 1000
	 */
	timeout?: number;

	/**
	 * Delay in milliseconds before processing starts.
	 * @default 0
	 */
	delay?: number;

	/**
	 * Custom filename for the output file.
	 * Used in the `Content-Disposition` header.
	 */
	filename?: string;

	/**
	 * If `true`, the response uses `Content-Disposition: inline`
	 * instead of `attachment`.
	 */
	inline?: boolean;

	/**
	 * If `true`, the job runs asynchronously and returns a `Job` object
	 * instead of the binary output. Requires `storage` to be set.
	 *
	 * **v2 note:** v2 endpoints default to `async: true` via server-side
	 * interceptor. Send `async: false` explicitly for synchronous behavior.
	 */
	async?: boolean;

	/**
	 * Storage configuration for async job output.
	 *
	 * - `true` — use the account's default storage
	 * - `{ id: "..." }` — use a specific saved storage config
	 *
	 * Required when `async` is `true`.
	 */
	storage?: StorageRequestOptions | boolean;

	/**
	 * HTTPS webhook URL to call when an async job completes.
	 * Must use the `https://` protocol.
	 */
	webhook?: string;

	/**
	 * API version override for this request.
	 * Normally set by the client's `apiVersion` config.
	 */
	apiVer?: string;

	/**
	 * Project ID to associate this job with.
	 */
	projectId?: string;
}
