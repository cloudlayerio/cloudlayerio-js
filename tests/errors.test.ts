import { describe, expect, it } from "vitest";
import {
	CloudLayerApiError,
	CloudLayerAuthError,
	CloudLayerConfigError,
	CloudLayerError,
	CloudLayerNetworkError,
	CloudLayerRateLimitError,
	CloudLayerTimeoutError,
	CloudLayerValidationError,
} from "../src/errors.js";

describe("Error classes", () => {
	it("CloudLayerError is instanceof Error", () => {
		const err = new CloudLayerError("test");
		expect(err).toBeInstanceOf(Error);
		expect(err).toBeInstanceOf(CloudLayerError);
		expect(err.name).toBe("CloudLayerError");
	});

	it("CloudLayerConfigError", () => {
		const err = new CloudLayerConfigError("bad config");
		expect(err).toBeInstanceOf(CloudLayerError);
		expect(err.name).toBe("CloudLayerConfigError");
		expect(err.message).toBe("bad config");
	});

	it("CloudLayerApiError includes request details", () => {
		const err = new CloudLayerApiError("Not Found", {
			status: 404,
			statusText: "Not Found",
			body: { message: "Not Found" },
			requestPath: "/jobs/123",
			requestMethod: "GET",
		});
		expect(err).toBeInstanceOf(CloudLayerError);
		expect(err.status).toBe(404);
		expect(err.requestPath).toBe("/jobs/123");
		expect(err.requestMethod).toBe("GET");
		expect(err.body).toEqual({ message: "Not Found" });
	});

	it("CloudLayerAuthError for 401", () => {
		const err = new CloudLayerAuthError({
			status: 401,
			statusText: "Unauthorized",
			requestPath: "/test",
			requestMethod: "GET",
		});
		expect(err).toBeInstanceOf(CloudLayerApiError);
		expect(err.name).toBe("CloudLayerAuthError");
		expect(err.message).toContain("invalid or missing API key");
	});

	it("CloudLayerAuthError for 403", () => {
		const err = new CloudLayerAuthError({
			status: 403,
			statusText: "Forbidden",
			requestPath: "/test",
			requestMethod: "GET",
		});
		expect(err.message).toContain("insufficient permissions");
	});

	it("CloudLayerRateLimitError includes retryAfter", () => {
		const err = new CloudLayerRateLimitError({
			status: 429,
			statusText: "Too Many Requests",
			requestPath: "/test",
			requestMethod: "GET",
			retryAfter: 60,
		});
		expect(err).toBeInstanceOf(CloudLayerApiError);
		expect(err.retryAfter).toBe(60);
		expect(err.message).toContain("60s");
	});

	it("CloudLayerRateLimitError without retryAfter", () => {
		const err = new CloudLayerRateLimitError({
			status: 429,
			statusText: "Too Many Requests",
			requestPath: "/test",
			requestMethod: "GET",
		});
		expect(err.retryAfter).toBeUndefined();
	});

	it("CloudLayerTimeoutError", () => {
		const err = new CloudLayerTimeoutError({
			timeout: 5000,
			requestPath: "/url/pdf",
			requestMethod: "POST",
		});
		expect(err).toBeInstanceOf(CloudLayerError);
		expect(err.timeout).toBe(5000);
		expect(err.message).toContain("5000ms");
		expect(err.message).toContain("POST /url/pdf");
	});

	it("CloudLayerNetworkError includes cause", () => {
		const cause = new TypeError("fetch failed");
		const err = new CloudLayerNetworkError("Network error", {
			cause,
			requestPath: "/test",
			requestMethod: "GET",
		});
		expect(err).toBeInstanceOf(CloudLayerError);
		expect(err.cause).toBe(cause);
		expect(err.requestPath).toBe("/test");
	});

	it("CloudLayerValidationError includes field", () => {
		const err = new CloudLayerValidationError("url", "must be a valid URL");
		expect(err).toBeInstanceOf(CloudLayerError);
		expect(err.field).toBe("url");
		expect(err.message).toContain("url");
		expect(err.message).toContain("must be a valid URL");
	});
});
