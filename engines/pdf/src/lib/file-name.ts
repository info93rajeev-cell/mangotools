/** Filename characters unsafe across common filesystems, plus control characters. */
// biome-ignore lint/suspicious/noControlCharactersInRegex: control characters are exactly what must be stripped from a file name.
const UNSAFE_CHARS = /[\\/:*?"<>|\u0000-\u001f]/g;

/**
 * Normalizes a user-entered output file name: trims spaces, removes unsafe characters, and
 * ensures a single ".pdf" extension. Falls back to `defaultName` for anything that is empty,
 * unsafe-only, or only a placeholder like "." or "..", per the founder-approved rule: never
 * reject a custom name, only sanitize or fall back. Shared by every operation in this engine
 * that produces a downloadable PDF (`pdf.merge@1`'s own "merged.pdf", `pdf.jpgToPdf@1`'s own
 * "images.pdf", `pdf.split@1`'s own per-run default) — extracted here once `pdf.split@1` became
 * the third operation needing this identical logic, a pure move with the default name now a
 * parameter instead of a module-level constant, verified against both existing operations' own
 * tests with zero behavior change before `pdf.split@1` was built on top.
 */
export function sanitizeOutputFileName(name: string | undefined, defaultName: string): string {
  const cleaned = (name ?? '').trim().replace(UNSAFE_CHARS, '');
  const base = cleaned.replace(/\.pdf$/i, '').trim();
  if (base === '' || base === '.' || base === '..') return defaultName;
  return `${base}.pdf`;
}
