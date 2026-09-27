/**
 * Proper CSV field escaping and row joining — never plain string concatenation. A field is quoted
 * when it contains a comma, a double quote, a CR, an LF, or leading/trailing whitespace; a quote
 * inside a quoted field is doubled, per RFC 4180. Rows are joined with `\n` for a stable, simple
 * output line ending.
 */

const NEEDS_QUOTING = /[",\r\n]/;

function needsQuoting(value: string): boolean {
  return NEEDS_QUOTING.test(value) || value !== value.trim();
}

export function escapeCsvField(value: string): string {
  return needsQuoting(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/** A JSON value as CSV cell text: null/undefined become an empty cell, others their JS string form. */
export function toCellText(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  return String(value);
}

export function buildCsv(headers: string[], rows: Record<string, unknown>[]): string {
  const lines = [headers.map(escapeCsvField).join(',')];
  for (const row of rows) {
    lines.push(headers.map((h) => escapeCsvField(toCellText(row[h]))).join(','));
  }
  return `${lines.join('\n')}\n`;
}
