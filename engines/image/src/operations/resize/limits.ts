/** Public, stated limits for Image Resize (founder-approved). Checked before any image is decoded. */
export const MAX_FILE_MB = 25;
export const MAX_FILE_BYTES = MAX_FILE_MB * 1024 * 1024;

/** Decoded pixel-area caps — the real memory risk, since a small file can decode to a huge bitmap. */
export const MAX_SOURCE_MEGAPIXELS = 40;
export const MAX_SOURCE_PIXELS = MAX_SOURCE_MEGAPIXELS * 1_000_000;
export const MAX_OUTPUT_MEGAPIXELS = 40;
export const MAX_OUTPUT_PIXELS = MAX_OUTPUT_MEGAPIXELS * 1_000_000;

/**
 * A single-axis sanity cap, independent of the megapixel checks above: a pathological image that is
 * only a few pixels tall but tens of millions of pixels wide (or vice versa) would pass a pure
 * megapixel check while still being unusable. Generous enough never to bind on a normal photo.
 */
export const MAX_SINGLE_AXIS_PIXELS = 20_000;
