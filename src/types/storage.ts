/**
 * S3-compatible storage configuration for creating a new storage backend.
 *
 * Storage configs are used with `async: true` to store generated
 * documents in your own S3 bucket.
 */
export interface StorageParams {
	/**
	 * Display name for this storage configuration.
	 * **Note:** This is `title`, not `name`.
	 */
	title: string;

	/** AWS region (e.g., `"us-east-1"`). */
	region: string;

	/** AWS access key ID. */
	accessKeyId: string;

	/** AWS secret access key. */
	secretAccessKey: string;

	/** S3 bucket name. */
	bucket: string;

	/**
	 * Custom S3-compatible endpoint URL.
	 * Use for non-AWS S3 services (MinIO, DigitalOcean Spaces, etc.).
	 * Must be a valid URL.
	 */
	endpoint?: string;
}

/**
 * Summary of a storage configuration (returned by `listStorage()`).
 * Does not include credentials.
 */
export interface StorageListItem {
	/** Storage config ID. */
	id: string;
	/** Display name. */
	title: string;
}

/**
 * Full storage configuration detail (returned by `getStorage()`).
 */
export interface StorageDetail {
	/** Encrypted storage data. */
	data: string;
	/** Storage config ID. */
	id: string;
	/** Display name. */
	title: string;
	/** Owner user ID. */
	uid: string;
}

/**
 * Response when storage creation is not allowed by the user's plan.
 */
export interface StorageNotAllowedResponse {
	allowed: false;
	reason: string;
	statusCode: number;
}
