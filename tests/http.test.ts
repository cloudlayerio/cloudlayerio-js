import { afterEach, describe, expect, it, vi } from "vitest";
import {
	CloudLayerApiError,
	CloudLayerAuthError,
	CloudLayerNetworkError,
	CloudLayerRateLimitError,
} from "../src/errors.js";
import { HttpTransport } from "../src/http.js";

function createTransport(overrides?: Partial<ConstructorParameters<typeof HttpTransport>[0]>) {
	return new HttpTransport({
		apiKey: "test-api-key",
		baseUrl: "https://api.test.com",
		apiVersion: "v2",
		timeout: 5000,
		maxRetries: 2,
		headers: {},
		...overrides,
	});
}

function mockFetchResponse(body: unknown, init?: ResponseInit) {
	return vi.fn().mockResolvedValue(
		new Response(JSON.stringify(body), {
			status: 200,
			headers: { "Content-Type": "application/json" },
			...init,
		}),
	);
}

describe("HttpTransport", () => {
	const originalFetch = globalThis.fetch;

	afterEach(() => {
		globalThis.fetch = originalFetch;
		vi.restoreAllMocks();
	});

	describe("headers", () => {
		it("sends X-API-Key header on every request", async () => {
			const mockFn = mockFetchResponse({ ok: true });
			globalThis.fetch = mockFn;

			const transport = createTransport();
			await transport.get("/test");

			const [, init] = mockFn.mock.calls[0];
			expect(init.headers["X-API-Key"]).toBe("test-api-key");
		});

		it("sends Content-Type: application/json for POST with body", async () => {
			const mockFn = mockFetchResponse({ ok: true });
			globalThis.fetch = mockFn;

			const transport = createTransport();
			await transport.post("/test", { data: "value" });

			const [, init] = mockFn.mock.calls[0];
			expect(init.headers["Content-Type"]).toBe("application/json");
		});

		it("merges custom headers", async () => {
			const mockFn = mockFetchResponse({ ok: true });
			globalThis.fetch = mockFn;

			const transport = createTransport({ headers: { "X-Custom": "value" } });
			await transport.get("/test");

			const [, init] = mockFn.mock.calls[0];
			expect(init.headers["X-Custom"]).toBe("value");
			expect(init.headers["X-API-Key"]).toBe("test-api-key");
		});
	});

	describe("URL construction", () => {
		it("builds URL with API version prefix", async () => {
			const mockFn = mockFetchResponse({ ok: true });
			globalThis.fetch = mockFn;

			const transport = createTransport();
			await transport.get("/jobs");

			const [url] = mockFn.mock.calls[0];
			expect(url).toBe("https://api.test.com/v2/jobs");
		});

		it("supports absolutePath to bypass version prefix", async () => {
			const mockFn = mockFetchResponse({ ok: true });
			globalThis.fetch = mockFn;

			const transport = createTransport();
			await transport.get("/v2/templates", { absolutePath: true });

			const [url] = mockFn.mock.calls[0];
			expect(url).toBe("https://api.test.com/v2/templates");
		});

		it("encodes query params correctly", async () => {
			const mockFn = mockFetchResponse({ ok: true });
			globalThis.fetch = mockFn;

			const transport = createTransport();
			await transport.get("/test", {
				params: { type: "pdf", limit: 10, empty: undefined },
			});

			const [url] = mockFn.mock.calls[0];
			expect(url).toContain("type=pdf");
			expect(url).toContain("limit=10");
			expect(url).not.toContain("empty");
		});
	});

	describe("request methods", () => {
		it("GET sends no body", async () => {
			const mockFn = mockFetchResponse({ ok: true });
			globalThis.fetch = mockFn;

			const transport = createTransport();
			await transport.get("/test");

			const [, init] = mockFn.mock.calls[0];
			expect(init.method).toBe("GET");
			expect(init.body).toBeUndefined();
		});

		it("POST sends JSON body", async () => {
			const mockFn = mockFetchResponse({ ok: true });
			globalThis.fetch = mockFn;

			const transport = createTransport();
			await transport.post("/test", { url: "https://example.com" });

			const [, init] = mockFn.mock.calls[0];
			expect(init.method).toBe("POST");
			expect(JSON.parse(init.body)).toEqual({ url: "https://example.com" });
		});

		it("DELETE sends no body", async () => {
			const mockFn = mockFetchResponse({ ok: true });
			globalThis.fetch = mockFn;

			const transport = createTransport();
			await transport.delete("/storage/abc");

			const [, init] = mockFn.mock.calls[0];
			expect(init.method).toBe("DELETE");
			expect(init.body).toBeUndefined();
		});

		it("postMultipart sends FormData without Content-Type", async () => {
			const mockFn = mockFetchResponse({ ok: true });
			globalThis.fetch = mockFn;

			const transport = createTransport();
			const formData = new FormData();
			formData.append("file", new Blob(["test"]), "test.docx");
			await transport.postMultipart("/docx/pdf", formData);

			const [, init] = mockFn.mock.calls[0];
			expect(init.method).toBe("POST");
			expect(init.body).toBeInstanceOf(FormData);
			// Content-Type should NOT be manually set for FormData
			expect(init.headers["Content-Type"]).toBeUndefined();
		});
	});

	describe("response handling", () => {
		it("parses JSON responses", async () => {
			globalThis.fetch = mockFetchResponse({ id: "job-123", status: "pending" });

			const transport = createTransport();
			const result = await transport.get("/jobs/123");

			expect(result.data).toEqual({ id: "job-123", status: "pending" });
			expect(result.status).toBe(200);
		});

		it("handles 204 No Content", async () => {
			globalThis.fetch = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));

			const transport = createTransport();
			const result = await transport.delete("/storage/abc");

			expect(result.status).toBe(204);
			expect(result.data).toBeUndefined();
		});

		it("parses binary responses as Buffer", async () => {
			const pdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46]); // %PDF
			globalThis.fetch = vi.fn().mockResolvedValue(
				new Response(pdfBytes, {
					status: 200,
					headers: { "Content-Type": "application/pdf" },
				}),
			);

			const transport = createTransport();
			const result = await transport.get<Buffer>("/url/pdf");

			expect(Buffer.isBuffer(result.data)).toBe(true);
			expect(result.data[0]).toBe(0x25);
		});

		it("parses CloudLayer custom headers", async () => {
			globalThis.fetch = vi.fn().mockResolvedValue(
				new Response(JSON.stringify({ id: "job-1" }), {
					status: 200,
					headers: {
						"Content-Type": "application/json",
						"cl-worker-job-id": "job-1",
						"cl-cluster-id": "cluster-a",
						"cl-process-time": "1500",
						"cl-bandwidth": "50000",
					},
				}),
			);

			const transport = createTransport();
			const result = await transport.get("/url/pdf");

			expect(result.cloudlayerHeaders["cl-worker-job-id"]).toBe("job-1");
			expect(result.cloudlayerHeaders["cl-cluster-id"]).toBe("cluster-a");
			expect(result.cloudlayerHeaders["cl-process-time"]).toBe(1500);
			expect(result.cloudlayerHeaders["cl-bandwidth"]).toBe(50000);
		});

		it("parses Content-Disposition filename", async () => {
			globalThis.fetch = vi.fn().mockResolvedValue(
				new Response(JSON.stringify({ ok: true }), {
					status: 200,
					headers: {
						"Content-Type": "application/json",
						"Content-Disposition": 'attachment; filename="output.pdf"',
					},
				}),
			);

			const transport = createTransport();
			const result = await transport.get("/url/pdf");

			expect(result.filename).toBe("output.pdf");
		});
	});

	describe("error handling", () => {
		it("throws CloudLayerAuthError on 401", async () => {
			globalThis.fetch = vi.fn().mockResolvedValue(
				new Response(JSON.stringify({ message: "Unauthorized" }), {
					status: 401,
					statusText: "Unauthorized",
					headers: { "Content-Type": "application/json" },
				}),
			);

			const transport = createTransport();
			await expect(transport.get("/test")).rejects.toThrow(CloudLayerAuthError);
		});

		it("throws CloudLayerAuthError on 403", async () => {
			globalThis.fetch = vi.fn().mockResolvedValue(
				new Response(JSON.stringify({ message: "Forbidden" }), {
					status: 403,
					statusText: "Forbidden",
					headers: { "Content-Type": "application/json" },
				}),
			);

			const transport = createTransport();
			await expect(transport.get("/test")).rejects.toThrow(CloudLayerAuthError);
		});

		it("throws CloudLayerRateLimitError on 429 with Retry-After", async () => {
			globalThis.fetch = vi.fn().mockResolvedValue(
				new Response(JSON.stringify({ message: "Too Many Requests" }), {
					status: 429,
					statusText: "Too Many Requests",
					headers: {
						"Content-Type": "application/json",
						"Retry-After": "60",
					},
				}),
			);

			const transport = createTransport();
			try {
				await transport.get("/test");
			} catch (error) {
				expect(error).toBeInstanceOf(CloudLayerRateLimitError);
				expect((error as CloudLayerRateLimitError).retryAfter).toBe(60);
			}
		});

		it("throws CloudLayerApiError on 400", async () => {
			globalThis.fetch = vi.fn().mockResolvedValue(
				new Response(JSON.stringify({ message: "Bad Request" }), {
					status: 400,
					statusText: "Bad Request",
					headers: { "Content-Type": "application/json" },
				}),
			);

			const transport = createTransport();
			const err = await transport.get("/test").catch((e) => e);
			expect(err).toBeInstanceOf(CloudLayerApiError);
			expect(err.status).toBe(400);
			expect(err.requestPath).toBe("/test");
			expect(err.requestMethod).toBe("GET");
		});

		it("throws CloudLayerApiError on 500", async () => {
			globalThis.fetch = vi.fn().mockResolvedValue(
				new Response(JSON.stringify({ message: "Internal Server Error" }), {
					status: 500,
					statusText: "Internal Server Error",
					headers: { "Content-Type": "application/json" },
				}),
			);

			const transport = createTransport();
			await expect(transport.get("/test")).rejects.toThrow(CloudLayerApiError);
		});

		it("throws CloudLayerNetworkError on fetch failure", async () => {
			globalThis.fetch = vi.fn().mockRejectedValue(new TypeError("fetch failed"));

			const transport = createTransport();
			await expect(transport.get("/test")).rejects.toThrow(CloudLayerNetworkError);
		});

		it("includes request path and method in errors", async () => {
			globalThis.fetch = vi.fn().mockResolvedValue(
				new Response(JSON.stringify({ message: "Not Found" }), {
					status: 404,
					statusText: "Not Found",
					headers: { "Content-Type": "application/json" },
				}),
			);

			const transport = createTransport();
			const err = await transport.post("/jobs/missing", {}).catch((e) => e);
			expect(err.requestPath).toBe("/jobs/missing");
			expect(err.requestMethod).toBe("POST");
		});
	});

	describe("retry logic", () => {
		it("retries on 500 for retryable requests", async () => {
			const mockFn = vi
				.fn()
				.mockResolvedValueOnce(
					new Response(JSON.stringify({ message: "error" }), {
						status: 500,
						statusText: "Internal Server Error",
						headers: { "Content-Type": "application/json" },
					}),
				)
				.mockResolvedValueOnce(
					new Response(JSON.stringify({ ok: true }), {
						status: 200,
						headers: { "Content-Type": "application/json" },
					}),
				);
			globalThis.fetch = mockFn;

			const transport = createTransport({ maxRetries: 2 });
			const result = await transport.get("/jobs", { retryable: true });

			expect(result.data).toEqual({ ok: true });
			expect(mockFn).toHaveBeenCalledTimes(2);
		});

		it("does NOT retry on 500 for non-retryable requests", async () => {
			const mockFn = vi.fn().mockResolvedValue(
				new Response(JSON.stringify({ message: "error" }), {
					status: 500,
					statusText: "Internal Server Error",
					headers: { "Content-Type": "application/json" },
				}),
			);
			globalThis.fetch = mockFn;

			const transport = createTransport({ maxRetries: 2 });
			await expect(transport.get("/url/pdf")).rejects.toThrow(CloudLayerApiError);
			expect(mockFn).toHaveBeenCalledTimes(1);
		});

		it("does NOT retry on 400 even if retryable", async () => {
			const mockFn = vi.fn().mockResolvedValue(
				new Response(JSON.stringify({ message: "bad request" }), {
					status: 400,
					statusText: "Bad Request",
					headers: { "Content-Type": "application/json" },
				}),
			);
			globalThis.fetch = mockFn;

			const transport = createTransport({ maxRetries: 2 });
			await expect(transport.get("/test", { retryable: true })).rejects.toThrow(CloudLayerApiError);
			expect(mockFn).toHaveBeenCalledTimes(1);
		});

		it("exhausts retries and throws last error", async () => {
			const mockFn = vi.fn().mockResolvedValue(
				new Response(JSON.stringify({ message: "error" }), {
					status: 502,
					statusText: "Bad Gateway",
					headers: { "Content-Type": "application/json" },
				}),
			);
			globalThis.fetch = mockFn;

			const transport = createTransport({ maxRetries: 1 });
			await expect(transport.get("/test", { retryable: true })).rejects.toThrow(CloudLayerApiError);
			// 1 initial + 1 retry = 2 attempts
			expect(mockFn).toHaveBeenCalledTimes(2);
		});

		it("respects maxRetries ceiling of 0", async () => {
			const mockFn = vi.fn().mockResolvedValue(
				new Response(JSON.stringify({ message: "error" }), {
					status: 500,
					statusText: "Internal Server Error",
					headers: { "Content-Type": "application/json" },
				}),
			);
			globalThis.fetch = mockFn;

			const transport = createTransport({ maxRetries: 0 });
			await expect(transport.get("/test", { retryable: true })).rejects.toThrow(CloudLayerApiError);
			expect(mockFn).toHaveBeenCalledTimes(1);
		});
	});
});
