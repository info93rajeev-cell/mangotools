/** Public, stated limits for JPG to PDF (founder-approved). Checked before any file is parsed. */
export const MAX_FILE_MB = 15;
export const MAX_TOTAL_MB = 75;
export const MAX_FILE_COUNT = 50;

export const MAX_FILE_BYTES = MAX_FILE_MB * 1024 * 1024;
export const MAX_TOTAL_BYTES = MAX_TOTAL_MB * 1024 * 1024;
