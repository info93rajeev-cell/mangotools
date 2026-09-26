/** Public, stated limits for PDF Merge (founder-approved). Checked before any file is parsed. */
export const MAX_FILE_MB = 25;
export const MAX_TOTAL_MB = 75;
export const MAX_FILE_COUNT = 20;

export const MAX_FILE_BYTES = MAX_FILE_MB * 1024 * 1024;
export const MAX_TOTAL_BYTES = MAX_TOTAL_MB * 1024 * 1024;
