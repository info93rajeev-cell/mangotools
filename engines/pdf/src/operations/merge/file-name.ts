export const DEFAULT_OUTPUT_FILE_NAME = 'merged.pdf';

/** Filename characters unsafe across common filesystems, plus control characters. */
// biome-ignore lint/suspicious/noControlCharactersInRegex: control characters are exactly what must be stripped from a file name.
const UNSAFE_CHARS = /[\\/:*?"<>|\u0000-\u001f]/g;

/**
 * Normalizes a user-entered output file name: trims spaces, removes unsafe characters, and
 * ensures a single ".pdf" extension. Falls back to the default name for anything that is empty,
 * unsafe-only, or only a placeholder like "." or "..", per the founder-approved rule: never
 * reject a custom name, only sanitize or fall back.
 */
export function sanitizeOutputFileName(name: string | undefined): string {
  const cleaned = (name ?? '').trim().replace(UNSAFE_CHARS, '');
  const base = cleaned.replace(/\.pdf$/i, '').trim();
  if (base === '' || base === '.' || base === '..') return DEFAULT_OUTPUT_FILE_NAME;
  return `${base}.pdf`;
}
