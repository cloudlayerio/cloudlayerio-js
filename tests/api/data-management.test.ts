import { afterEach, describe, expect, it, vi } from "vitest";
import { CloudLayer } from "../../src/client.js";
import { CloudLayerApiError } from "../../src/errors.js";

function mockFetchJson(body: unknown, status = 200) {
	return vi.fn().mockResolvedValue(
		new Response(JSON.stringify(body), {
			status,
			headers: { "Content-Type": "application/json" },
		}),
	);
}

describe("Data Management API", () => {
	const originalFetch = globalThis.fetch;

	afterEach(() => {
		globalThis.fetch = originalFetch;
		vi.restoreAllMocks();
	});

	function createClient() {
		return new CloudLayer({
			apiKey: "test-key",
			apiVersion: "v2",
			baseUrl: "https://api.test.com",
		});
	}

	describe("Jobs", () => {
		it("listJobs sends GET to /jobs", async () => {
			const jobs = [
				{ id: "j1", uid: "u1", status: "success", timestamp: 1 },
				{ id: "j2", uid: "u1", status: "pending", timestamp: 2 },
			];
			const mockFn = mockFetchJson(jobs);
			globalThis.fetch = mockFn;

			const client = createClient();
			const result = await client.listJobs();

			expect(result).toEqual(jobs);
			const [url, init] = mockFn.mock.calls[0];
			expect(url).toBe("https://api.test.com/v2/jobs");
			expect(init.method).toBe("GET");
		});

		it("getJob sends GET to /jobs/:id", async () => {
			const job = { id: "j1", uid: "u1", status: "success", timestamp: 1 };
			const mockFn = mockFetchJson(job);
			globalThis.fetch = mockFn;

			const client = createClient();
			const result = await client.getJob("j1");

			expect(result).toEqual(job);
			expect(mockFn.mock.calls[0][0]).toBe("https://api.test.com/v2/jobs/j1");
		});

		it("getJob throws on 404", async () => {
			globalThis.fetch = vi.fn().mockResolvedValue(
				new Response(JSON.stringify({ message: "Not Found" }), {
					status: 404,
					statusText: "Not Found",
					headers: { "Content-Type": "application/json" },
				}),
			);

			const client = createClient();
			await expect(client.getJob("missing")).rejects.toThrow(CloudLayerApiError);
		});
	});

	describe("Assets", () => {
		it("listAssets sends GET to /assets", async () => {
			const assets = [{ uid: "u1", fileId: "f1" }];
			const mockFn = mockFetchJson(assets);
			globalThis.fetch = mockFn;

			const client = createClient();
			const result = await client.listAssets();

			expect(result).toEqual(assets);
			expect(mockFn.mock.calls[0][0]).toBe("https://api.test.com/v2/assets");
		});

		it("getAsset sends GET to /assets/:id", async () => {
			const asset = { uid: "u1", fileId: "f1", id: "a1" };
			globalThis.fetch = mockFetchJson(asset);

			const client = createClient();
			const result = await client.getAsset("a1");
			expect(result).toEqual(asset);
		});
	});

	describe("Storage", () => {
		it("listStorage sends GET to /storage", async () => {
			const storages = [{ id: "s1", title: "My S3" }];
			const mockFn = mockFetchJson(storages);
			globalThis.fetch = mockFn;

			const client = createClient();
			const result = await client.listStorage();

			expect(result).toEqual(storages);
			expect(mockFn.mock.calls[0][0]).toBe("https://api.test.com/v2/storage");
		});

		it("getStorage sends GET to /storage/:id", async () => {
			const storage = { id: "s1", title: "My S3", uid: "u1", data: "encrypted" };
			globalThis.fetch = mockFetchJson(storage);

			const client = createClient();
			const result = await client.getStorage("s1");
			expect(result).toEqual(storage);
		});

		it("addStorage sends POST with config", async () => {
			const created = { id: "s1", title: "New S3", uid: "u1", data: "encrypted" };
			const mockFn = mockFetchJson(created);
			globalThis.fetch = mockFn;

			const client = createClient();
			const result = await client.addStorage({
				title: "New S3",
				region: "us-east-1",
				accessKeyId: "AKIA...",
				secretAccessKey: "secret",
				bucket: "my-bucket",
			});

			expect(result).toEqual(created);
			const body = JSON.parse(mockFn.mock.calls[0][1].body);
			expect(body.title).toBe("New S3");
			expect(body.region).toBe("us-east-1");
		});

		it("addStorage handles plan-not-allowed response", async () => {
			const notAllowed = {
				allowed: false,
				reason: "Plan does not support storage",
				statusCode: 401,
			};
			globalThis.fetch = mockFetchJson(notAllowed);

			const client = createClient();
			const result = await client.addStorage({
				title: "S3",
				region: "us-east-1",
				accessKeyId: "key",
				secretAccessKey: "secret",
				bucket: "bucket",
			});

			expect(result).toEqual(notAllowed);
		});

		it("deleteStorage sends DELETE to /storage/:id", async () => {
			const mockFn = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
			globalThis.fetch = mockFn;

			const client = createClient();
			await client.deleteStorage("s1");

			expect(mockFn.mock.calls[0][0]).toBe("https://api.test.com/v2/storage/s1");
			expect(mockFn.mock.calls[0][1].method).toBe("DELETE");
		});
	});

	describe("Account", () => {
		it("getAccount returns AccountInfo", async () => {
			const account = {
				email: "test@example.com",
				callsLimit: 1000,
				calls: 42,
				storageUsed: 0,
				storageLimit: 1073741824,
				subscription: "price_xxx",
				bytesTotal: 50000,
				bytesLimit: 1073741824,
				computeTimeTotal: 30000,
				computeTimeLimit: -1,
				subType: "usage",
				uid: "u1",
				subActive: true,
			};
			globalThis.fetch = mockFetchJson(account);

			const client = createClient();
			const result = await client.getAccount();
			expect(result.email).toBe("test@example.com");
			expect(result.subType).toBe("usage");
		});

		it("getStatus returns status", async () => {
			globalThis.fetch = mockFetchJson({ status: "ok " });

			const client = createClient();
			const result = await client.getStatus();
			expect(result.status).toBe("ok ");
		});
	});

	describe("Templates", () => {
		it("listTemplates sends GET to /v2/templates (absolutePath)", async () => {
			const templates = [{ id: "t1", name: "Invoice" }];
			const mockFn = mockFetchJson(templates);
			globalThis.fetch = mockFn;

			const client = createClient();
			const result = await client.listTemplates();

			expect(result).toEqual(templates);
			expect(mockFn.mock.calls[0][0]).toBe("https://api.test.com/v2/templates");
		});

		it("listTemplates sends query params", async () => {
			const mockFn = mockFetchJson([]);
			globalThis.fetch = mockFn;

			const client = createClient();
			await client.listTemplates({ type: "invoice", category: "business" });

			const url = mockFn.mock.calls[0][0];
			expect(url).toContain("type=invoice");
			expect(url).toContain("category=business");
		});

		it("getTemplate sends GET to /v2/template/:id", async () => {
			const template = { id: "t1", name: "Invoice" };
			const mockFn = mockFetchJson(template);
			globalThis.fetch = mockFn;

			const client = createClient();
			const result = await client.getTemplate("t1");

			expect(result).toEqual(template);
			expect(mockFn.mock.calls[0][0]).toBe("https://api.test.com/v2/template/t1");
		});
	});
});
