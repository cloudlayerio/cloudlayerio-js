/**
 * Shape of an API error response body from CloudLayer.io.
 */
export interface ApiErrorBody {
	/** HTTP status code. */
	statusCode?: number;
	/** Error type or name. */
	error?: string;
	/** Human-readable error message. */
	message?: string;
	/** Detailed validation errors (if applicable). */
	details?: Record<string, unknown>;
}
