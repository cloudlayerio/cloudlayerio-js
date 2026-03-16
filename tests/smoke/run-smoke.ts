import { CloudLayer } from "../../src/client.js";

const apiKey = process.env.CLOUDLAYER_API_KEY?.trim();
if (!apiKey) {
	console.error("Set CLOUDLAYER_API_KEY env var");
	process.exit(1);
}

const client = new CloudLayer({ apiKey, apiVersion: "v2" });

let passed = 0;
let failed = 0;

async function test(name: string, fn: () => Promise<void>) {
	try {
		await fn();
		console.log(`  ✓ ${name}`);
		passed++;
	} catch (error) {
		console.error(`  ✗ ${name}`);
		console.error(`    ${error instanceof Error ? error.message : error}`);
		failed++;
	}
}

console.log("\nSmoke Tests (Live API)\n");

await test("getStatus — API is reachable", async () => {
	const status = await client.getStatus();
	if (!status.status) throw new Error("No status field");
	console.log(`    Status: "${status.status}"`);
});

await test("getAccount — auth works", async () => {
	const account = await client.getAccount();
	if (!account.email) throw new Error("No email field");
	console.log(`    Account: ${account.email} | Plan: ${account.subType} | Active: ${account.subActive}`);
});

await test("listJobs — returns array", async () => {
	const jobs = await client.listJobs();
	if (!Array.isArray(jobs)) throw new Error("Not an array");
	console.log(`    Jobs: ${jobs.length}`);
});

await test("listStorage — returns array", async () => {
	const storages = await client.listStorage();
	if (!Array.isArray(storages)) throw new Error("Not an array");
	console.log(`    Storage configs: ${storages.length}`);
});

await test("listTemplates — public templates", async () => {
	const templates = await client.listTemplates();
	if (!Array.isArray(templates)) throw new Error("Not an array");
	console.log(`    Public templates: ${templates.length}`);
});

// Use v1 client for binary conversion test (v2 requires storage which may not be on the plan)
const v1Client = new CloudLayer({ apiKey, apiVersion: "v1" });

await test("urlToPdf v1 sync — returns binary PDF", async () => {
	const result = await v1Client.urlToPdf({
		url: "https://example.com",
		format: "a4",
	});
	const data = result.data;
	if (!Buffer.isBuffer(data)) throw new Error("Expected binary buffer from v1");
	console.log(`    PDF: ${data.length} bytes`);
	// Verify PDF magic bytes
	if (data[0] !== 0x25 || data[1] !== 0x50) throw new Error("Not a valid PDF");
	console.log(`    Valid PDF header confirmed`);
});

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
