import type { HttpTransport } from "../http.js";
import type {
	StorageDetail,
	StorageListItem,
	StorageNotAllowedResponse,
	StorageParams,
} from "../types/storage.js";

/** List all storage configurations for the authenticated user. */
export async function listStorage(http: HttpTransport): Promise<StorageListItem[]> {
	const result = await http.get<StorageListItem[]>("/storage", { retryable: true });
	return result.data;
}

/** Get a specific storage configuration by ID. */
export async function getStorage(http: HttpTransport, storageId: string): Promise<StorageDetail> {
	const result = await http.get<StorageDetail>(`/storage/${storageId}`, { retryable: true });
	return result.data;
}

/**
 * Add a new storage configuration.
 * Returns the created storage config, or a "not allowed" response
 * if the user's plan doesn't support custom storage.
 */
export async function addStorage(
	http: HttpTransport,
	config: StorageParams,
): Promise<StorageDetail | StorageNotAllowedResponse> {
	const result = await http.post<StorageDetail | StorageNotAllowedResponse>("/storage", config);
	return result.data;
}

/** Delete a storage configuration by ID. */
export async function deleteStorage(http: HttpTransport, storageId: string): Promise<void> {
	await http.delete(`/storage/${storageId}`);
}
