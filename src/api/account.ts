import type { HttpTransport } from "../http.js";
import type { AccountInfo, StatusResponse } from "../types/account.js";

/** Get account information for the authenticated user. */
export async function getAccount(http: HttpTransport): Promise<AccountInfo> {
	const result = await http.get<AccountInfo>("/account", { retryable: true });
	return result.data;
}

/**
 * Get the API status.
 * Returns `{ status: "ok " }` (with trailing space — legacy quirk).
 */
export async function getStatus(http: HttpTransport): Promise<StatusResponse> {
	const result = await http.get<StatusResponse>("/getStatus", { retryable: true });
	return result.data;
}
