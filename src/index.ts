export type { CloudLayerConfig } from "./client.js";
export { CloudLayer } from "./client.js";

// Error classes
export {
	CloudLayerApiError,
	CloudLayerAuthError,
	CloudLayerConfigError,
	CloudLayerError,
	CloudLayerNetworkError,
	CloudLayerRateLimitError,
	CloudLayerTimeoutError,
	CloudLayerValidationError,
} from "./errors.js";

// Re-export all types for SDK consumers
export type {
	// Account
	AccountInfo,
	// Error
	ApiErrorBody,
	// Asset
	Asset,
	// URL
	Authentication,
	// Base options
	BaseOptions,
	Batch,
	// Response
	CloudLayerResponseHeaders,
	ConversionResult,
	Cookie,
	// Composite endpoint options
	DocxToHtmlOptions,
	DocxToPdfOptions,
	FileInput,
	// PDF
	HeaderFooterTemplate,
	HeaderFooterTemplateMethod,
	// HTML
	HtmlOptions,
	HtmlToImageOptions,
	HtmlToPdfOptions,
	// Image
	ImageOptions,
	ImageType,
	// Job
	Job,
	JobStatus,
	JobType,
	// Puppeteer/browser
	LayoutDimension,
	Margin,
	MergePdfsOptions,
	PDFFormat,
	PdfOptions,
	PdfToDocxOptions,
	PreviewOptions,
	PuppeteerOptions,
	StatusResponse,
	// Storage
	StorageDetail,
	StorageListItem,
	StorageNotAllowedResponse,
	StorageParams,
	StorageRequestOptions,
	// Template
	TemplateOptions,
	TemplateToImageOptions,
	TemplateToPdfOptions,
	UrlOptions,
	UrlToImageOptions,
	UrlToPdfOptions,
	Viewport,
	WaitForSelectorOptions,
	WaitUntilOption,
} from "./types/index.js";
