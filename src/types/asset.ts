/**
 * A CloudLayer.io generated asset (output file).
 *
 * Assets are created when conversion jobs complete successfully.
 * Each asset has a downloadable URL and optional preview.
 */
export interface Asset {
	/** User ID that owns this asset. */
	uid: string;

	/** Unique asset identifier. */
	id?: string;

	/** Internal file identifier in storage. */
	fileId: string;

	/** Internal preview file identifier. */
	previewFileId?: string;

	/** Asset type (e.g., "pdf", "image"). */
	type?: string;

	/** File extension (e.g., "pdf", "png"). */
	ext?: string;

	/** Preview file extension. */
	previewExt?: string;

	/** Downloadable URL for the asset. */
	url?: string;

	/** Downloadable URL for the preview image. */
	previewUrl?: string;

	/** File size in bytes. */
	size?: number;

	/** Creation timestamp (Unix milliseconds or Firestore timestamp). */
	timestamp?: number;

	/** Project ID this asset belongs to. */
	projectId?: string;

	/** ID of the job that created this asset. */
	jobId?: string;

	/** Asset name. */
	name?: string;
}
