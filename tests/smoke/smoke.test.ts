import { describe, expect, it } from "vitest";
import { CloudLayer } from "../../src/client.js";

const apiKey = process.env.CLOUDLAYER_API_KEY?.trim();

describe.skipIf(!apiKey)("Smoke Tests (Live API)", () => {
	const client = new CloudLayer({
		apiKey: apiKey as string,
		apiVersion: "v2",
	});

	it("getStatus — API is reachable", async () => {
		const status = await client.getStatus();
		expect(status).toHaveProperty("status");
		console.log("Status:", JSON.stringify(status));
	});

	it("getAccount — auth works", async () => {
		const account = await client.getAccount();
		expect(account).toHaveProperty("email");
		expect(account).toHaveProperty("uid");
		expect(account).toHaveProperty("subType");
		console.log(
			"Account:",
			account.email,
			"| Plan:",
			account.subType,
			"| Active:",
			account.subActive,
		);
	});

	it("listJobs — returns array", async () => {
		const jobs = await client.listJobs();
		expect(Array.isArray(jobs)).toBe(true);
		console.log("Jobs count:", jobs.length);
	});

	it("listStorage — returns array", async () => {
		const storages = await client.listStorage();
		expect(Array.isArray(storages)).toBe(true);
		console.log("Storage configs:", storages.length);
	});

	it("listTemplates — public templates (no auth required)", async () => {
		const templates = await client.listTemplates();
		expect(Array.isArray(templates)).toBe(true);
		console.log("Public templates:", templates.length);
	});

	it("urlToPdf v2 — returns Job object", async () => {
		const result = await client.urlToPdf({
			url: "https://example.com",
			async: false,
			storage: true,
		});
		const job = result.data;
		expect(job).toHaveProperty("id");
		expect(job).toHaveProperty("status");
		console.log("Job:", job.id, "| Status:", job.status);

		if (job.status === "success" && job.assetUrl) {
			console.log("Asset URL:", job.assetUrl);
			const pdf = await client.downloadJobResult(job);
			expect(Buffer.isBuffer(pdf)).toBe(true);
			expect(pdf.length).toBeGreaterThan(0);
			console.log("Downloaded PDF:", pdf.length, "bytes");
		}
	}, 60000);
});
