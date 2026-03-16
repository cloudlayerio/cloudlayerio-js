import { afterEach, describe, expect, it, vi } from "vitest";
import { CloudLayer } from "../../src/client.js";
import { CloudLayerValidationError } from "../../src/errors.js";

function mockFetchJson(body: unknown, status = 200, headers: Record<string, string> = {}) {
	return vi.fn().mockResolvedValue(
		new Response(JSON.stringify(body), {
			status,
			headers: { "Content-Type": "application/json", ...headers },
		}),
	);
}

function mockFetchBinary(data: Uint8Array, contentType = "application/pdf") {
	return vi.fn().mockResolvedValue(
		new Response(data, {
			status: 200,
			headers: { "Content-Type": contentType },
		}),
	);
}

const JOB_PENDING = {
	id: "job-1",
	uid: "user-1",
	status: "pending",
	timestamp: Date.now(),
};

const JOB_SUCCESS = {
	id: "job-1",
	uid: "user-1",
	status: "success",
	timestamp: Date.now(),
	assetUrl: "https://storage.example.com/output.pdf",
};

describe("Conversion API", () => {
	const originalFetch = globalThis.fetch;

	afterEach(() => {
		globalThis.fetch = originalFetch;
		vi.restoreAllMocks();
	});

	function createClient(apiVersion: "v1" | "v2" = "v2") {
		return new CloudLayer({
			apiKey: "test-key",
			apiVersion,
			baseUrl: "https://api.test.com",
		});
	}

	describe("urlToPdf", () => {
		it("sends POST to /url/pdf with correct body", async () => {
			const mockFn = mockFetchJson(JOB_PENDING, 202);
			globalThis.fetch = mockFn;

			const client = createClient();
			await client.urlToPdf({ url: "https://example.com" });

			const [url, init] = mockFn.mock.calls[0];
			expect(url).toBe("https://api.test.com/v2/url/pdf");
			expect(init.method).toBe("POST");
			expect(JSON.parse(init.body)).toEqual({ url: "https://example.com" });
		});

		it("returns Job for v2", async () => {
			globalThis.fetch = mockFetchJson(JOB_PENDING, 202);
			const client = createClient("v2");
			const result = await client.urlToPdf({ url: "https://example.com" });
			expect(result.data).toEqual(JOB_PENDING);
			expect(result.status).toBe(202);
		});

		it("returns binary for v1", async () => {
			const pdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46]);
			globalThis.fetch = mockFetchBinary(pdfBytes);
			const client = createClient("v1");
			const result = await client.urlToPdf({ url: "https://example.com" });
			expect(Buffer.isBuffer(result.data)).toBe(true);
		});

		it("passes puppeteer options through", async () => {
			const mockFn = mockFetchJson(JOB_PENDING, 202);
			globalThis.fetch = mockFn;

			const client = createClient();
			await client.urlToPdf({
				url: "https://example.com",
				viewPort: {
					width: 1920,
					height: 1080,
					deviceScaleFactor: 2,
					isMobile: false,
					hasTouch: false,
					isLandscape: false,
				},
				waitUntil: "networkidle0",
			});

			const body = JSON.parse(mockFn.mock.calls[0][1].body);
			expect(body.viewPort.width).toBe(1920);
			expect(body.waitUntil).toBe("networkidle0");
		});

		it("passes PDF options through", async () => {
			const mockFn = mockFetchJson(JOB_PENDING, 202);
			globalThis.fetch = mockFn;

			const client = createClient();
			await client.urlToPdf({
				url: "https://example.com",
				format: "a4",
				margin: { top: "10px", bottom: "10px" },
				printBackground: true,
			});

			const body = JSON.parse(mockFn.mock.calls[0][1].body);
			expect(body.format).toBe("a4");
			expect(body.margin.top).toBe("10px");
			expect(body.printBackground).toBe(true);
		});

		it("sends batch.urls for batch mode", async () => {
			const mockFn = mockFetchJson(JOB_PENDING, 202);
			globalThis.fetch = mockFn;

			const client = createClient();
			await client.urlToPdf({
				batch: { urls: ["https://a.com", "https://b.com"] },
			});

			const body = JSON.parse(mockFn.mock.calls[0][1].body);
			expect(body.batch.urls).toEqual(["https://a.com", "https://b.com"]);
		});
	});

	describe("urlToImage", () => {
		it("sends POST to /url/image", async () => {
			const mockFn = mockFetchJson(JOB_PENDING, 202);
			globalThis.fetch = mockFn;

			const client = createClient();
			await client.urlToImage({ url: "https://example.com", imageType: "png" });

			const [url] = mockFn.mock.calls[0];
			expect(url).toBe("https://api.test.com/v2/url/image");
		});
	});

	describe("htmlToPdf", () => {
		it("sends POST to /html/pdf with html field", async () => {
			const mockFn = mockFetchJson(JOB_PENDING, 202);
			globalThis.fetch = mockFn;

			const client = createClient();
			const html = Buffer.from("<html><body>Hello</body></html>").toString("base64");
			await client.htmlToPdf({ html });

			const body = JSON.parse(mockFn.mock.calls[0][1].body);
			expect(body.html).toBe(html);
		});
	});

	describe("htmlToImage", () => {
		it("sends POST to /html/image", async () => {
			const mockFn = mockFetchJson(JOB_PENDING, 202);
			globalThis.fetch = mockFn;

			const client = createClient();
			await client.htmlToImage({
				html: Buffer.from("<html></html>").toString("base64"),
				imageType: "png",
			});

			const [url] = mockFn.mock.calls[0];
			expect(url).toBe("https://api.test.com/v2/html/image");
		});
	});

	describe("templateToPdf", () => {
		it("sends JSON with templateId", async () => {
			const mockFn = mockFetchJson(JOB_PENDING, 202);
			globalThis.fetch = mockFn;

			const client = createClient();
			await client.templateToPdf({
				templateId: "tmpl-123",
				data: { name: "John" },
			});

			const body = JSON.parse(mockFn.mock.calls[0][1].body);
			expect(body.templateId).toBe("tmpl-123");
			expect(body.data).toEqual({ name: "John" });
		});
	});

	describe("templateToImage", () => {
		it("sends JSON with templateId", async () => {
			const mockFn = mockFetchJson(JOB_PENDING, 202);
			globalThis.fetch = mockFn;

			const client = createClient();
			await client.templateToImage({
				templateId: "tmpl-456",
				data: { title: "Test" },
			});

			const [url] = mockFn.mock.calls[0];
			expect(url).toBe("https://api.test.com/v2/template/image");
		});
	});

	describe("docxToPdf", () => {
		it("sends multipart with file", async () => {
			const mockFn = mockFetchJson(JOB_PENDING, 202);
			globalThis.fetch = mockFn;

			const client = createClient();
			await client.docxToPdf({ file: Buffer.from("fake docx") });

			const [, init] = mockFn.mock.calls[0];
			expect(init.body).toBeInstanceOf(FormData);
		});
	});

	describe("docxToHtml", () => {
		it("sends multipart to /docx/html", async () => {
			const mockFn = mockFetchJson(JOB_PENDING, 202);
			globalThis.fetch = mockFn;

			const client = createClient();
			await client.docxToHtml({ file: new Blob(["fake docx"]) });

			const [url] = mockFn.mock.calls[0];
			expect(url).toBe("https://api.test.com/v2/docx/html");
		});
	});

	describe("pdfToDocx", () => {
		it("sends multipart to /pdf/docx", async () => {
			const mockFn = mockFetchJson(JOB_PENDING, 202);
			globalThis.fetch = mockFn;

			const client = createClient();
			await client.pdfToDocx({ file: new Uint8Array([1, 2, 3]) });

			const [url] = mockFn.mock.calls[0];
			expect(url).toBe("https://api.test.com/v2/pdf/docx");
		});
	});

	describe("mergePdfs", () => {
		it("sends POST to /pdf/merge with url", async () => {
			const mockFn = mockFetchJson(JOB_PENDING, 202);
			globalThis.fetch = mockFn;

			const client = createClient();
			await client.mergePdfs({ url: "https://example.com/doc.pdf" });

			const [url] = mockFn.mock.calls[0];
			expect(url).toBe("https://api.test.com/v2/pdf/merge");
		});

		it("sends batch.urls for multiple PDFs", async () => {
			const mockFn = mockFetchJson(JOB_PENDING, 202);
			globalThis.fetch = mockFn;

			const client = createClient();
			await client.mergePdfs({
				batch: { urls: ["https://a.com/1.pdf", "https://b.com/2.pdf"] },
			});

			const body = JSON.parse(mockFn.mock.calls[0][1].body);
			expect(body.batch.urls).toEqual(["https://a.com/1.pdf", "https://b.com/2.pdf"]);
		});
	});

	describe("downloadJobResult", () => {
		it("downloads binary from assetUrl", async () => {
			const pdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46]);
			globalThis.fetch = vi
				.fn()
				.mockResolvedValue(
					new Response(pdfBytes, { status: 200, headers: { "Content-Type": "application/pdf" } }),
				);

			const client = createClient();
			const buffer = await client.downloadJobResult(JOB_SUCCESS);
			expect(Buffer.isBuffer(buffer)).toBe(true);
			expect(buffer[0]).toBe(0x25);
		});

		it("throws on missing assetUrl", async () => {
			const client = createClient();
			await expect(
				client.downloadJobResult({ ...JOB_SUCCESS, assetUrl: undefined }),
			).rejects.toThrow("has no assetUrl");
		});

		it("throws on 403 (expired URL)", async () => {
			globalThis.fetch = vi.fn().mockResolvedValue(new Response(null, { status: 403 }));
			const client = createClient();
			await expect(client.downloadJobResult(JOB_SUCCESS)).rejects.toThrow("403 Forbidden");
		});
	});

	describe("waitForJob", () => {
		it("polls until success", async () => {
			const mockFn = vi
				.fn()
				.mockResolvedValueOnce(
					new Response(JSON.stringify({ ...JOB_PENDING }), {
						status: 200,
						headers: { "Content-Type": "application/json" },
					}),
				)
				.mockResolvedValueOnce(
					new Response(JSON.stringify({ ...JOB_SUCCESS }), {
						status: 200,
						headers: { "Content-Type": "application/json" },
					}),
				);
			globalThis.fetch = mockFn;

			const client = createClient();
			const job = await client.waitForJob("job-1", { interval: 2000, maxWait: 10000 });
			expect(job.status).toBe("success");
			expect(mockFn).toHaveBeenCalledTimes(2);
		});

		it("throws on job error", async () => {
			globalThis.fetch = mockFetchJson({
				...JOB_PENDING,
				status: "error",
				error: "Render failed",
			});

			const client = createClient();
			await expect(client.waitForJob("job-1", { interval: 2000 })).rejects.toThrow("Render failed");
		});

		it("rejects interval < 2000ms", async () => {
			const client = createClient();
			await expect(client.waitForJob("job-1", { interval: 500 })).rejects.toThrow(
				CloudLayerValidationError,
			);
		});

		it("uses 5000ms default interval", async () => {
			globalThis.fetch = mockFetchJson(JOB_SUCCESS);
			const client = createClient();
			// Just verify it doesn't throw — default interval is 5000ms
			const job = await client.waitForJob("job-1");
			expect(job.status).toBe("success");
		});
	});
});
