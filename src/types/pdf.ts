import type { ImageType } from "./image.js";
import type { LayoutDimension } from "./puppeteer.js";

/**
 * Supported PDF page formats.
 */
export type PDFFormat =
	| "letter"
	| "legal"
	| "tabloid"
	| "ledger"
	| "a0"
	| "a1"
	| "a2"
	| "a3"
	| "a4"
	| "a5"
	| "a6";

/**
 * Page margins with CSS dimension values.
 */
export interface Margin {
	/** Left margin (e.g., `"10px"`, `"1in"`, `20`). */
	left?: LayoutDimension;
	/** Right margin. */
	right?: LayoutDimension;
	/** Top margin. */
	top?: LayoutDimension;
	/** Bottom margin. */
	bottom?: LayoutDimension;
}

/**
 * Method for extracting or defining header/footer content.
 */
export type HeaderFooterTemplateMethod = "template" | "extract";

/**
 * Configuration for PDF header or footer content.
 */
export interface HeaderFooterTemplate {
	/**
	 * Method for obtaining header/footer content.
	 * - `"template"` — use the `template`/`templateString` field
	 * - `"extract"` — extract from a page element via `selector`
	 */
	method?: HeaderFooterTemplateMethod;

	/**
	 * CSS selector to extract header/footer content from the page.
	 * Used with `method: "extract"`.
	 */
	selector?: string;

	/** Margins around the header/footer. */
	margin?: Margin;

	/** CSS styles to apply to the header/footer. */
	style?: Record<string, unknown>;

	/** CSS styles to apply to images in the header/footer. */
	imageStyle?: Record<string, unknown>;

	/**
	 * HTML template string for the header/footer.
	 * Used with `method: "template"`.
	 */
	template?: string;

	/**
	 * Alternative template string field.
	 */
	templateString?: string;
}

/**
 * Options for generating a preview image of the output document.
 */
export interface PreviewOptions {
	/** Preview image width in pixels. */
	width?: number;
	/** Preview image height in pixels. */
	height?: number;
	/**
	 * Preview image format.
	 * @default "png"
	 */
	type?: ImageType;
	/**
	 * Preview image quality (0-100).
	 * Required field.
	 */
	quality: number;
	/**
	 * Maintain aspect ratio when resizing.
	 */
	maintainAspectRatio?: boolean;
}

/**
 * PDF-specific generation options.
 *
 * Controls the output PDF format, margins, headers/footers,
 * and optional preview image generation.
 */
export interface PdfOptions {
	/**
	 * Print background graphics and colors.
	 */
	printBackground?: boolean;

	/**
	 * Paper format (e.g., `"letter"`, `"a4"`).
	 * Ignored if `width`/`height` are set in PuppeteerOptions.
	 */
	format?: PDFFormat;

	/**
	 * Page margins.
	 */
	margin?: Margin;

	/**
	 * Header template configuration.
	 */
	headerTemplate?: HeaderFooterTemplate;

	/**
	 * Footer template configuration.
	 */
	footerTemplate?: HeaderFooterTemplate;

	/**
	 * Generate a preview image of the PDF.
	 * - `true` — generate with default settings
	 * - `PreviewOptions` — generate with custom settings
	 */
	generatePreview?: PreviewOptions | boolean;
}
