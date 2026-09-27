/** Resize-specific limits (founder-approved). `MAX_FILE_*`/`MAX_SOURCE_*` are shared engine-wide — see
 * `../../lib/limits.ts`. Only the *requested output* cap and the single-axis sanity cap are specific to
 * Resize's own target-dimension inputs, which no other operation in this engine has. */
export const MAX_OUTPUT_MEGAPIXELS = 40;
export const MAX_OUTPUT_PIXELS = MAX_OUTPUT_MEGAPIXELS * 1_000_000;

/**
 * A single-axis sanity cap, independent of the megapixel checks above: a pathological image that is
 * only a few pixels tall but tens of millions of pixels wide (or vice versa) would pass a pure
 * megapixel check while still being unusable. Generous enough never to bind on a normal photo.
 */
export const MAX_SINGLE_AXIS_PIXELS = 20_000;
