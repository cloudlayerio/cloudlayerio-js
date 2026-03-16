import type { HtmlOptions } from "./html.js";
import type { ImageOptions } from "./image.js";
import type { BaseOptions } from "./options.js";
import type { PdfOptions } from "./pdf.js";
import type { PuppeteerOptions } from "./puppeteer.js";
import type { TemplateOptions } from "./template.js";
import type { UrlOptions } from "./url.js";

/**
 * Options for `urlToPdf()` — render a URL as a PDF document.
 */
export type UrlToPdfOptions = UrlOptions & PuppeteerOptions & PdfOptions & BaseOptions;

/**
 * Options for `urlToImage()` — render a URL as an image.
 */
export type UrlToImageOptions = UrlOptions & PuppeteerOptions & ImageOptions & BaseOptions;

/**
 * Options for `htmlToPdf()` — render Base64-encoded HTML as a PDF.
 */
export type HtmlToPdfOptions = HtmlOptions & PuppeteerOptions & PdfOptions & BaseOptions;

/**
 * Options for `htmlToImage()` — render Base64-encoded HTML as an image.
 */
export type HtmlToImageOptions = HtmlOptions & PuppeteerOptions & ImageOptions & BaseOptions;

/**
 * Options for `templateToPdf()` — render a template with data as a PDF.
 */
export type TemplateToPdfOptions = TemplateOptions & PuppeteerOptions & PdfOptions & BaseOptions;

/**
 * Options for `templateToImage()` — render a template with data as an image.
 */
export type TemplateToImageOptions = TemplateOptions &
	PuppeteerOptions &
	ImageOptions &
	BaseOptions;

/**
 * File input for document conversion endpoints.
 * Accepts a Buffer, Blob, Uint8Array, or file path string (Node.js only).
 */
export type FileInput = Buffer | Blob | Uint8Array | string;

/**
 * Options for `docxToPdf()` — convert a DOCX file to PDF.
 */
export type DocxToPdfOptions = BaseOptions & { file: FileInput };

/**
 * Options for `docxToHtml()` — convert a DOCX file to HTML.
 */
export type DocxToHtmlOptions = BaseOptions & { file: FileInput };

/**
 * Options for `pdfToDocx()` — convert a PDF file to DOCX.
 */
export type PdfToDocxOptions = BaseOptions & { file: FileInput };

/**
 * Options for `mergePdfs()` — merge multiple PDFs into one.
 *
 * URLs are specified using the standard `url` (single) or `batch.urls`
 * (multiple) fields from `UrlOptions`, **not** a top-level `urls` array.
 */
export type MergePdfsOptions = UrlOptions & BaseOptions;
