import { describe, expect, it } from "vitest";
import { CloudLayerValidationError } from "../src/errors.js";
import {
	validateBaseOptions,
	validateFileInput,
	validateHtmlOptions,
	validateImageOptions,
	validateTemplateOptions,
	validateUrlOptions,
} from "../src/utils/validation.js";

describe("Validation", () => {
	describe("validateUrlOptions", () => {
		it("accepts valid url", () => {
			expect(() => validateUrlOptions({ url: "https://example.com" })).not.toThrow();
		});

		it("rejects missing url and batch", () => {
			expect(() => validateUrlOptions({})).toThrow(CloudLayerValidationError);
		});

		it("rejects both url and batch.urls", () => {
			expect(() =>
				validateUrlOptions({
					url: "https://example.com",
					batch: { urls: ["https://a.com"] },
				}),
			).toThrow("not both");
		});

		it("rejects invalid url format", () => {
			expect(() => validateUrlOptions({ url: "not-a-url" })).toThrow("not a valid URL");
		});

		it("rejects batch > 20 URLs", () => {
			const urls = Array.from({ length: 21 }, (_, i) => `https://example.com/${i}`);
			expect(() => validateUrlOptions({ batch: { urls } })).toThrow("maximum 20");
		});

		it("validates each batch URL", () => {
			expect(() =>
				validateUrlOptions({ batch: { urls: ["https://valid.com", "invalid"] } }),
			).toThrow("not a valid URL");
		});

		it("rejects auth without username", () => {
			expect(() =>
				validateUrlOptions({
					url: "https://example.com",
					authentication: { password: "pass" },
				}),
			).toThrow("username and password");
		});

		it("rejects cookie without name", () => {
			expect(() =>
				validateUrlOptions({
					url: "https://example.com",
					cookies: [{ value: "v" }],
				}),
			).toThrow("name and value");
		});
	});

	describe("validateBaseOptions", () => {
		it("accepts valid options", () => {
			expect(() => validateBaseOptions({ timeout: 5000 })).not.toThrow();
		});

		it("rejects timeout < 1000", () => {
			expect(() => validateBaseOptions({ timeout: 500 })).toThrow("at least 1000ms");
		});

		it("rejects async without storage", () => {
			expect(() => validateBaseOptions({ async: true })).toThrow("storage must be set");
		});

		it("accepts async with storage true", () => {
			expect(() => validateBaseOptions({ async: true, storage: true })).not.toThrow();
		});

		it("accepts async with storage id", () => {
			expect(() => validateBaseOptions({ async: true, storage: { id: "s1" } })).not.toThrow();
		});

		it("rejects storage with empty id", () => {
			expect(() => validateBaseOptions({ storage: { id: "" } })).toThrow("id is required");
		});

		it("rejects non-HTTPS webhook", () => {
			expect(() => validateBaseOptions({ webhook: "http://example.com" })).toThrow("HTTPS");
		});

		it("accepts HTTPS webhook", () => {
			expect(() => validateBaseOptions({ webhook: "https://example.com/hook" })).not.toThrow();
		});
	});

	describe("validateHtmlOptions", () => {
		it("accepts valid html", () => {
			expect(() => validateHtmlOptions({ html: "PGh0bWw+" })).not.toThrow();
		});

		it("rejects missing html", () => {
			expect(() => validateHtmlOptions({})).toThrow("html is required");
		});

		it("rejects empty html", () => {
			expect(() => validateHtmlOptions({ html: "" })).toThrow("html is required");
		});
	});

	describe("validateTemplateOptions", () => {
		it("accepts templateId", () => {
			expect(() => validateTemplateOptions({ templateId: "t1" })).not.toThrow();
		});

		it("accepts template", () => {
			expect(() => validateTemplateOptions({ template: "base64content" })).not.toThrow();
		});

		it("rejects both templateId and template", () => {
			expect(() => validateTemplateOptions({ templateId: "t1", template: "content" })).toThrow(
				"not both",
			);
		});

		it("rejects neither templateId nor template", () => {
			expect(() => validateTemplateOptions({})).toThrow("is required");
		});
	});

	describe("validateImageOptions", () => {
		it("accepts valid quality", () => {
			expect(() => validateImageOptions({ quality: 80 })).not.toThrow();
		});

		it("rejects quality > 100", () => {
			expect(() => validateImageOptions({ quality: 101 })).toThrow("between 0 and 100");
		});

		it("rejects quality < 0", () => {
			expect(() => validateImageOptions({ quality: -1 })).toThrow("between 0 and 100");
		});

		it("allows missing quality", () => {
			expect(() => validateImageOptions({})).not.toThrow();
		});
	});

	describe("validateFileInput", () => {
		it("accepts Buffer", () => {
			expect(() => validateFileInput({ file: Buffer.from("test") })).not.toThrow();
		});

		it("rejects missing file", () => {
			expect(() => validateFileInput({})).toThrow("file is required");
		});
	});
});
