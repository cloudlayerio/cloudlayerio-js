# @cloudlayerio/sdk

Official TypeScript/JavaScript SDK for the [cloudlayer.io](https://cloudlayer.io) document generation API.

**Convert URLs, HTML, and templates to PDF and images** with a simple, type-safe API.

## Installation

```bash
npm install @cloudlayerio/sdk
```

## Quick Start

```typescript
import { CloudLayer } from "@cloudlayerio/sdk";

const client = new CloudLayer({
  apiKey: process.env.CLOUDLAYER_API_KEY!,
  apiVersion: "v2",
});

// Generate a PDF from a URL (v2 returns a Job object)
const result = await client.urlToPdf({
  url: "https://example.com",
  format: "a4",
  margin: { top: "20px", bottom: "20px" },
});

// Download the binary PDF from the Job's asset URL
const job = result.data; // Job object
const pdfBuffer = await client.downloadJobResult(job);
```

## Requirements

- Node.js >= 18.13.0 (for native `fetch` and `FormData` support)
- Or any modern browser

## API Version Differences

The SDK requires you to choose an API version:

| Feature | v1 | v2 |
|---------|----|----|
| Default mode | Synchronous (returns binary) | Asynchronous (returns Job) |
| Sync response | Raw binary (PDF/image buffer) | JSON Job object |
| Async response | JSON Job object | JSON Job object |
| Binary access | Direct from response | Via `downloadJobResult()` |

```typescript
// v1: Synchronous, returns binary directly
const v1Client = new CloudLayer({ apiKey: "...", apiVersion: "v1" });
const { data: pdfBuffer } = await v1Client.urlToPdf({ url: "https://example.com" });

// v2: Async by default, returns Job
const v2Client = new CloudLayer({ apiKey: "...", apiVersion: "v2" });
const { data: job } = await v2Client.urlToPdf({ url: "https://example.com" });
const pdfBuffer = await v2Client.downloadJobResult(job);
```

## Configuration

```typescript
const client = new CloudLayer({
  apiKey: "your-api-key",       // Required
  apiVersion: "v2",             // Required: "v1" or "v2"
  baseUrl: "https://api.cloudlayer.io", // Optional (default)
  timeout: 30000,               // Optional: request timeout in ms (default 30000)
  maxRetries: 2,                // Optional: retries for data endpoints (default 2, max 5)
  headers: {},                  // Optional: additional headers
});
```

## Conversion Methods

### URL to PDF/Image

```typescript
const result = await client.urlToPdf({
  url: "https://example.com",
  format: "letter",
  margin: { top: "1in", bottom: "1in", left: "0.5in", right: "0.5in" },
  printBackground: true,
  viewPort: { width: 1920, height: 1080, deviceScaleFactor: 1, isMobile: false, hasTouch: false, isLandscape: false },
  waitUntil: "networkidle0",
});

const imageResult = await client.urlToImage({
  url: "https://example.com",
  imageType: "png",
  quality: 90,
});
```

### HTML to PDF/Image

HTML content must be Base64-encoded:

```typescript
const html = btoa("<html><body><h1>Hello World</h1></body></html>");

const result = await client.htmlToPdf({ html });
const imageResult = await client.htmlToImage({ html, imageType: "webp" });
```

### Template Rendering

```typescript
// By template ID
const result = await client.templateToPdf({
  templateId: "your-template-id",
  data: { name: "John Doe", items: [{ qty: 2, price: 9.99 }] },
});

// By base64-encoded template
const result = await client.templateToImage({
  template: btoa("<html><body>{{name}}</body></html>"),
  data: { name: "Jane" },
  imageType: "png",
});
```

### File Conversion

```typescript
import { readFileSync } from "node:fs";

// DOCX to PDF
const docxBuffer = readFileSync("document.docx");
const result = await client.docxToPdf({ file: docxBuffer });

// DOCX to HTML
const htmlResult = await client.docxToHtml({ file: docxBuffer });

// PDF to DOCX
const pdfBuffer = readFileSync("document.pdf");
const docxResult = await client.pdfToDocx({ file: pdfBuffer });
```

### PDF Merge

```typescript
const result = await client.mergePdfs({
  batch: {
    urls: [
      "https://example.com/page1.pdf",
      "https://example.com/page2.pdf",
    ],
  },
});
```

### Batch Processing

Process up to 20 URLs in one request (always async):

```typescript
const result = await client.urlToPdf({
  batch: { urls: ["https://a.com", "https://b.com", "https://c.com"] },
  storage: true,
});
```

## Async Mode & Job Polling

```typescript
// v2 is async by default — use waitForJob to poll for completion
const { data: job } = await client.urlToPdf({
  url: "https://example.com",
  storage: true,
});

// Poll until complete (default: 5s interval, 5 min timeout)
const completedJob = await client.waitForJob(job.id, {
  interval: 5000,  // min 2000ms
  maxWait: 300000,
});

// Download the binary result
const pdf = await client.downloadJobResult(completedJob);
```

## Data Management

```typescript
// List all jobs
const jobs = await client.listJobs();

// Get specific job
const job = await client.getJob("job-id");

// List all assets
const assets = await client.listAssets();

// Get specific asset
const asset = await client.getAsset("asset-id");

// Storage management
const storages = await client.listStorage();
const created = await client.addStorage({
  title: "My S3 Bucket",
  region: "us-east-1",
  accessKeyId: "AKIA...",
  secretAccessKey: "...",
  bucket: "my-bucket",
});
await client.deleteStorage("storage-id");

// Account info
const account = await client.getAccount();
const status = await client.getStatus();

// Public templates (no auth required)
const templates = await client.listTemplates({ type: "invoice" });
const template = await client.getTemplate("template-id");
```

## Error Handling

```typescript
import {
  CloudLayerApiError,
  CloudLayerAuthError,
  CloudLayerRateLimitError,
  CloudLayerTimeoutError,
  CloudLayerNetworkError,
  CloudLayerValidationError,
} from "@cloudlayerio/sdk";

try {
  await client.urlToPdf({ url: "https://example.com" });
} catch (error) {
  if (error instanceof CloudLayerAuthError) {
    console.error("Invalid API key");
  } else if (error instanceof CloudLayerRateLimitError) {
    console.error(`Rate limited. Retry after ${error.retryAfter}s`);
  } else if (error instanceof CloudLayerTimeoutError) {
    console.error(`Request timed out after ${error.timeout}ms`);
  } else if (error instanceof CloudLayerApiError) {
    console.error(`API error ${error.status}: ${error.message}`);
  } else if (error instanceof CloudLayerValidationError) {
    console.error(`Invalid input: ${error.field} — ${error.message}`);
  } else if (error instanceof CloudLayerNetworkError) {
    console.error("Network error:", error.message);
  }
}
```

## Performance Notes

- **`listJobs()` and `listAssets()`** return ALL records (no server-side pagination). For accounts with many jobs/assets, these responses can be large.
- **`waitForJob()`** polls every 5 seconds by default. Each poll reads a Firestore document on the server. Minimum interval is 2 seconds.
- **Conversion endpoints are NOT retried** automatically — they are expensive operations. Data endpoints (jobs, assets, storage, account) are retried on 429/5xx with exponential backoff.

## TypeScript

Full type safety for all request options and responses:

```typescript
import type {
  UrlToPdfOptions,
  Job,
  AccountInfo,
  CloudLayerResponseHeaders,
} from "@cloudlayerio/sdk";
```

## Other SDKs

- **Python:** [cloudlayerio](https://pypi.org/project/cloudlayerio/) ([GitHub](https://github.com/cloudlayerio/cloudlayerio-python))
- **Go:** [cloudlayerio-go](https://pkg.go.dev/github.com/cloudlayerio/cloudlayerio-go) ([GitHub](https://github.com/cloudlayerio/cloudlayerio-go))
- **PHP:** [cloudlayerio/cloudlayerio-php](https://packagist.org/packages/cloudlayerio/cloudlayerio-php) ([GitHub](https://github.com/cloudlayerio/cloudlayerio-php))
- **.NET C#:** [cloudlayerio-dotnet](https://www.nuget.org/packages/cloudlayerio-dotnet/) ([GitHub](https://github.com/cloudlayerio/cloudlayerio-dotnet))

## License

Apache-2.0
