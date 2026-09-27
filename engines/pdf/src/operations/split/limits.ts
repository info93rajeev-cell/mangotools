/** Public, stated limit for PDF Split (founder-approved). Checked before the file is parsed. Split
 * works on a single PDF, so — unlike `pdf.merge@1`/`pdf.jpgToPdf@1` — there is no file-count or
 * combined-total-size limit to define. */
export const MAX_FILE_MB = 25;
export const MAX_FILE_BYTES = MAX_FILE_MB * 1024 * 1024;
