import type { PreviewOptions } from "./pdf.js";

/**
 * Supported output image formats.
 */
export type ImageType = "jpg" | "jpeg" | "png" | "svg" | "webp";

/**
 * Image-specific generation options.
 *
 * Controls the output image format, quality, and processing.
 */
export interface ImageOptions {
	/**
	 * Output image format.
	 * @default "png"
	 */
	imageType?: ImageType;

	/**
	 * Image quality (0-100). Applies to JPEG and WebP formats.
	 * @default 80
	 * @minimum 0
	 * @maximum 100
	 */
	quality?: number;

	/**
	 * Trim whitespace from the image edges.
	 */
	trim?: boolean;

	/**
	 * Render with a transparent background (PNG and WebP only).
	 */
	transparent?: boolean;

	/**
	 * Generate a preview image (thumbnail) of the output.
	 * - `true` — generate with default settings
	 * - `PreviewOptions` — generate with custom settings
	 */
	generatePreview?: PreviewOptions | boolean;
}
