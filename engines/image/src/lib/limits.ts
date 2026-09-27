/** Public, stated limits shared by every operation in this engine (founder-approved). */
export const MAX_FILE_MB = 25;
export const MAX_FILE_BYTES = MAX_FILE_MB * 1024 * 1024;

/** Decoded pixel-area cap — the real memory risk, since a small file can decode to a huge bitmap. */
export const MAX_SOURCE_MEGAPIXELS = 40;
export const MAX_SOURCE_PIXELS = MAX_SOURCE_MEGAPIXELS * 1_000_000;
