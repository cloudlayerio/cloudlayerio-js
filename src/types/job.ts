/**
 * All supported job types for document generation.
 */
export type JobType =
	| "url-image"
	| "url-pdf"
	| "html-image"
	| "html-pdf"
	| "template-pdf"
	| "template-image"
	| "docx-pdf"
	| "docx-html"
	| "image-pdf"
	| "pdf-image"
	| "pdf-docx"
	| "merge-pdf";

/**
 * Job processing status.
 */
export type JobStatus = "pending" | "success" | "error";

/**
 * A CloudLayer.io processing job.
 *
 * Jobs are created when a conversion is requested. In async mode,
 * the job is returned immediately with `status: "pending"`. Poll
 * with `getJob()` or use `waitForJob()` to wait for completion.
 *
 * **v2 note:** When returned from v2 conversion endpoints (not from `getJob()`),
 * the following fields are stripped and will be `undefined`:
 * `bandwidthCost`, `processTime`, `processTimeCost`, `size`,
 * `totalCost`, `apiKeyUsed`, `type`. These fields ARE present
 * when fetched via `getJob()`.
 */
export interface Job {
	/** Unique job identifier. */
	id: string;

	/** User ID that owns this job. */
	uid: string;

	/** Optional job name. */
	name?: string;

	/**
	 * Job type. May be `undefined` when returned from v2 conversion endpoints.
	 */
	type?: JobType;

	/** Current job status. */
	status: JobStatus;

	/** Job creation timestamp (Unix milliseconds or Firestore timestamp). */
	timestamp: number;

	/** Name of the worker that processed this job. */
	workerName?: string;

	/** Processing time in milliseconds. */
	processTime?: number;

	/** API key used for this request. */
	apiKeyUsed?: string;

	/** Cost of processing time (usage plans). */
	processTimeCost?: number;

	/** Cost of API credit consumed (credit plans). */
	apiCreditCost?: number;

	/** Cost of bandwidth consumed. */
	bandwidthCost?: number;

	/** Total cost of the job. */
	totalCost?: number;

	/** Output file size in bytes. */
	size?: number;

	/** Original request parameters. */
	params?: Record<string, unknown>;

	/** URL to download the generated asset. */
	assetUrl?: string;

	/** URL to download the preview image. */
	previewUrl?: string;

	/** Self-referencing URL to this job's detail endpoint. */
	self?: string;

	/** ID of the generated asset. */
	assetId?: string;

	/** Project ID this job belongs to. */
	projectId?: string;

	/** Error message if the job failed. */
	error?: string;
}
