/**
 * Custom response headers returned by CloudLayer.io conversion endpoints.
 *
 * These headers provide billing, performance, and tracking information.
 * They are only present on conversion endpoint responses, not on
 * data management endpoints (jobs, assets, storage, etc.).
 */
export interface CloudLayerResponseHeaders {
	/** Job ID assigned by the worker. Always present. */
	"cl-worker-job-id"?: string;

	/** Cluster ID that processed the request. Always present. */
	"cl-cluster-id"?: string;

	/** Worker name that processed the request. Present on completed (non-pending) jobs. */
	"cl-worker"?: string;

	/** Output file size in bytes. Present on completed jobs. */
	"cl-bandwidth"?: number;

	/** Processing time in milliseconds. Present on completed jobs. */
	"cl-process-time"?: number;

	/** Remaining API calls. Present for `limit` subscription type. */
	"cl-calls-remaining"?: number;

	/** Charged compute time in milliseconds. Present for `usage` subscription type. */
	"cl-charged-time"?: number;

	/** Bandwidth cost. Present for `usage` subscription type. */
	"cl-bandwidth-cost"?: number;

	/** Processing time cost. Present for `usage` subscription type. */
	"cl-process-time-cost"?: number;

	/** API credit cost. Present for non-`usage` subscription types. */
	"cl-api-credit-cost"?: number;
}

/**
 * Wraps a conversion endpoint response with parsed custom headers.
 *
 * @template T - The response data type (`Job` for v2, `Buffer` for v1).
 */
export interface ConversionResult<T> {
	/** Response data — a `Job` object (v2) or binary buffer (v1). */
	data: T;

	/** Parsed CloudLayer.io custom response headers. */
	headers: CloudLayerResponseHeaders;

	/** HTTP response status code. */
	status: number;

	/**
	 * Output filename parsed from the `Content-Disposition` header.
	 * Only present on v1 binary responses.
	 */
	filename?: string;
}
