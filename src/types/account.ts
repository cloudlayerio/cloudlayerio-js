/**
 * Account information returned by `getAccount()`.
 *
 * Contains usage statistics, plan limits, and subscription details.
 */
export interface AccountInfo {
	/** Account email address. */
	email: string;

	/** Maximum API calls allowed per billing period. */
	callsLimit: number;

	/** API calls used in current billing period. */
	calls: number;

	/** Storage space used in bytes. */
	storageUsed: number;

	/** Maximum storage space in bytes. */
	storageLimit: number;

	/** Stripe price ID of the current subscription. */
	subscription: string;

	/** Total bandwidth used in bytes. */
	bytesTotal: number;

	/** Maximum bandwidth in bytes. */
	bytesLimit: number;

	/** Total compute time used in milliseconds. */
	computeTimeTotal: number;

	/**
	 * Maximum compute time in milliseconds.
	 * `-1` indicates unlimited.
	 */
	computeTimeLimit: number;

	/**
	 * Subscription type.
	 * - `"usage"` — pay-per-use billing
	 * - `"limit"` — fixed call limit billing
	 */
	subType: "usage" | "limit";

	/** User ID. */
	uid: string;

	/**
	 * Remaining API credits. Only present on subscriptions with credit.
	 */
	credit?: number;

	/** Whether the subscription is currently active. */
	subActive: boolean;

	/** Additional fields from Firestore job counts. */
	[key: string]: unknown;
}

/**
 * API status response from `getStatus()`.
 *
 * **Note:** The legacy API returns `{ status: "ok " }` with a trailing
 * space. This is a known quirk — the SDK preserves it as-is.
 */
export interface StatusResponse {
	/** API status string. */
	status: string;
}
