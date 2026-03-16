import { describe, expect, it } from "vitest";
import { CloudLayer } from "../src/client.js";
import { CloudLayerConfigError } from "../src/errors.js";

describe("CloudLayer", () => {
	const validConfig = { apiKey: "test-key", apiVersion: "v2" as const };

	describe("constructor", () => {
		it("creates instance with valid config", () => {
			const client = new CloudLayer(validConfig);
			expect(client).toBeInstanceOf(CloudLayer);
			expect(client.apiVersion).toBe("v2");
			expect(client.baseUrl).toBe("https://api.cloudlayer.io");
		});

		it("accepts v1 apiVersion", () => {
			const client = new CloudLayer({ ...validConfig, apiVersion: "v1" });
			expect(client.apiVersion).toBe("v1");
		});

		it("accepts custom baseUrl", () => {
			const client = new CloudLayer({ ...validConfig, baseUrl: "https://custom.api.com" });
			expect(client.baseUrl).toBe("https://custom.api.com");
		});

		it("throws CloudLayerConfigError on missing apiKey", () => {
			expect(() => new CloudLayer({ apiKey: "", apiVersion: "v2" })).toThrow(CloudLayerConfigError);
		});

		it("throws on missing apiVersion", () => {
			expect(() => new CloudLayer({ apiKey: "test", apiVersion: "" as "v1" })).toThrow(
				"apiVersion is required",
			);
		});

		it("throws on invalid baseUrl", () => {
			expect(() => new CloudLayer({ ...validConfig, baseUrl: "not-a-url" })).toThrow(
				"not a valid URL",
			);
		});

		it("throws on non-positive timeout", () => {
			expect(() => new CloudLayer({ ...validConfig, timeout: -1 })).toThrow(
				"timeout must be a positive number",
			);
		});

		it("throws on maxRetries > 5", () => {
			expect(() => new CloudLayer({ ...validConfig, maxRetries: 6 })).toThrow(
				"maxRetries must be between 0 and 5",
			);
		});

		it("throws on maxRetries < 0", () => {
			expect(() => new CloudLayer({ ...validConfig, maxRetries: -1 })).toThrow(
				"maxRetries must be between 0 and 5",
			);
		});
	});
});
