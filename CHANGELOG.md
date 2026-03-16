# Changelog

## 0.1.0 (Unreleased)

### Added
- Initial SDK release
- Full TypeScript type system matching CloudLayer.io v1/v2 API
- 10 conversion methods: `urlToPdf`, `urlToImage`, `htmlToPdf`, `htmlToImage`, `templateToPdf`, `templateToImage`, `docxToPdf`, `docxToHtml`, `pdfToDocx`, `mergePdfs`
- Data management: `listJobs`, `getJob`, `listAssets`, `getAsset`, `listStorage`, `getStorage`, `addStorage`, `deleteStorage`, `getAccount`, `getStatus`, `listTemplates`, `getTemplate`
- Utility methods: `downloadJobResult`, `waitForJob`
- 7 error classes: `CloudLayerError`, `CloudLayerConfigError`, `CloudLayerApiError`, `CloudLayerAuthError`, `CloudLayerRateLimitError`, `CloudLayerTimeoutError`, `CloudLayerNetworkError`, `CloudLayerValidationError`
- Automatic retries with exponential backoff for data endpoints
- Client-side input validation
- Dual ESM/CJS output with TypeScript declarations
