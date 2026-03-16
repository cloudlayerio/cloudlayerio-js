import type { HttpTransport } from "../http.js";
import type { Asset } from "../types/asset.js";

/** List all assets for the authenticated user. */
export async function listAssets(http: HttpTransport): Promise<Asset[]> {
	const result = await http.get<Asset[]>("/assets", { retryable: true });
	return result.data;
}

/** Get a specific asset by ID. */
export async function getAsset(http: HttpTransport, assetId: string): Promise<Asset> {
	const result = await http.get<Asset>(`/assets/${assetId}`, { retryable: true });
	return result.data;
}
