/**
 * CSS unit string or pixel number.
 *
 * @example
 * "10px"
 * "1in"
 * "2.5cm"
 * 100 // pixels
 */
export type LayoutDimension = string | number;

/**
 * Values for the `waitUntil` option controlling when Puppeteer
 * considers navigation complete.
 */
export type WaitUntilOption = "load" | "domcontentloaded" | "networkidle0" | "networkidle2";

/**
 * Options for `waitForSelector` and `waitForFrameSelector`.
 */
export interface WaitForSelectorOptions {
	/** CSS selector to wait for. */
	selector: string;
	/** Additional wait conditions. */
	options?: {
		/** Wait for the element to be visible. */
		visible?: boolean;
		/** Wait for the element to be hidden. */
		hidden?: boolean;
		/** Maximum wait time in milliseconds. */
		timeout?: number;
	};
}

/**
 * Browser viewport configuration.
 *
 * Controls the size and device emulation of the headless browser
 * used for rendering.
 */
export interface Viewport {
	/** Viewport width in pixels. */
	width: number;
	/** Viewport height in pixels. */
	height: number;
	/**
	 * Device scale factor (DPI).
	 * @default 1
	 */
	deviceScaleFactor: number;
	/** Emulate a mobile device. */
	isMobile: boolean;
	/** Emulate touch events. */
	hasTouch: boolean;
	/** Render in landscape orientation. */
	isLandscape: boolean;
}

/**
 * Puppeteer browser rendering options.
 *
 * Controls how the headless browser loads and renders the page
 * before generating the output document.
 */
export interface PuppeteerOptions {
	/**
	 * When to consider navigation complete.
	 * @default "networkidle2" (for URL endpoints; undefined for HTML endpoints)
	 */
	waitUntil?: WaitUntilOption;

	/**
	 * Wait for an iframe to be present before rendering.
	 */
	waitForFrame?: boolean;

	/**
	 * Wait for an iframe to be attached to the DOM.
	 */
	waitForFrameAttachment?: boolean;

	/**
	 * Wait condition for iframe navigation.
	 */
	waitForFrameNavigation?: WaitUntilOption;

	/**
	 * Wait for all images in an iframe to load.
	 */
	waitForFrameImages?: boolean;

	/**
	 * Wait for a CSS selector within an iframe before rendering.
	 */
	waitForFrameSelector?: WaitForSelectorOptions;

	/**
	 * Wait for a CSS selector on the page before rendering.
	 */
	waitForSelector?: WaitForSelectorOptions;

	/**
	 * Use CSS page size (`@page`) instead of configured dimensions.
	 */
	preferCSSPageSize?: boolean;

	/**
	 * Scale factor for the page content.
	 */
	scale?: number;

	/**
	 * Page height. Overrides format-based height.
	 */
	height?: LayoutDimension;

	/**
	 * Page width. Overrides format-based width.
	 */
	width?: LayoutDimension;

	/**
	 * Render in landscape orientation.
	 */
	landscape?: boolean;

	/**
	 * Page ranges to include (e.g., `"1-3"`, `"1,3,5"`).
	 * PDF output only.
	 */
	pageRanges?: string;

	/**
	 * Automatically scroll to the bottom of the page before rendering.
	 * Useful for triggering lazy-loaded content.
	 */
	autoScroll?: boolean;

	/**
	 * Browser viewport configuration.
	 *
	 * **Note:** The field name uses a capital P (`viewPort`) to match
	 * the legacy API spelling.
	 */
	viewPort?: Viewport;

	/**
	 * IANA time zone ID to emulate (e.g., `"America/New_York"`).
	 */
	timeZone?: string;

	/**
	 * CSS media type to emulate.
	 * - `"screen"` — standard screen rendering
	 * - `"print"` — print stylesheet rendering
	 * - `null` — no emulation
	 */
	emulateMediaType?: "screen" | "print" | null;
}
