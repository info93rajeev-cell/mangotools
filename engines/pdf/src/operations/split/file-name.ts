// biome-ignore lint/suspicious/noControlCharactersInRegex: control characters are exactly what must be stripped from a file name.
const UNSAFE_CHARS = /[\\/:*?"<>|\u0000-\u001f]/g;

function stripExtension(name: string): string {
  return name.replace(/\.[a-z0-9]+$/i, '');
}

function sanitizeBase(base: string): string {
  const cleaned = base.trim().replace(UNSAFE_CHARS, '').trim();
  return cleaned === '' || cleaned === '.' || cleaned === '..' ? '' : cleaned;
}

/**
 * The default output name when the user hasn't typed a custom one: the original file's own base name
 * plus the extracted page range, e.g. `document-pages-3-7.pdf` for `document.pdf` with pages 3–7. This
 * is a genuinely new naming shape (derived from the *original* file, unlike `pdf.merge@1`/
 * `pdf.jpgToPdf@1`'s own fixed "merged.pdf"/"images.pdf" defaults, which don't derive from any input
 * file's name), so it lives here rather than in `lib/file-name.ts` — `sanitizeOutputFileName` there
 * still does the actual user-override-or-fallback work, this only computes what to fall back to.
 */
export function defaultSplitFileName(
  originalName: string,
  startPage: number,
  endPage: number,
): string {
  const base = sanitizeBase(stripExtension(originalName));
  const stem = base !== '' ? base : 'document';
  return `${stem}-pages-${startPage}-${endPage}.pdf`;
}
