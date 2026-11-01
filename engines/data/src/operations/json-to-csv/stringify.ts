/**
 * Proper CSV field escaping and row joining — never plain string concatenation. A field is quoted
 * when it contains the delimiter, a double quote, a CR, an LF, or leading/trailing whitespace; a
 * quote inside a quoted field is doubled, per RFC 4180. Rows are joined with `\n` for a stable,
 * simple output line ending.
 */
import type { JsonToCsvDelimiter } from './schema.ts';

export const DELIMITER_CHAR: Readonly<Record<JsonToCsvDelimiter, string>> = {
  comma: ',',
  semicolon: ';',
  tab: '\t',
  pipe: '|',
};

/** OWASP "CSV injection": cells starting with these can run as formulas in spreadsheet software. */
const FORMULA_TRIGGER = /^[=+\-@\t\r]/;

function needsQuoting(value: string, delimiter: string): boolean {
  return /["\r\n]/.test(value) || value.includes(delimiter) || value !== value.trim();
}

export function escapeCsvField(value: string, delimiter = ','): string {
  return needsQuoting(value, delimiter) ? `"${value.replace(/"/g, '""')}"` : value;
}

/** A JSON value as CSV cell text: null/undefined become an empty cell, others their JS string form. */
export function toCellText(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  return String(value);
}

/** True for a text value (not a number) that a spreadsheet could read as a formula. */
export function isFormulaLike(value: unknown): boolean {
  return typeof value === 'string' && FORMULA_TRIGGER.test(value);
}

export interface CsvWriteOptions {
  delimiter: JsonToCsvDelimiter;
  header: boolean;
  formulaGuard: boolean;
}

function cellOf(value: unknown, options: CsvWriteOptions): string {
  const text = toCellText(value);
  return options.formulaGuard && isFormulaLike(value) ? `'${text}` : text;
}

export function buildCsv(
  headers: string[],
  rows: Record<string, unknown>[],
  options: CsvWriteOptions,
): string {
  const sep = DELIMITER_CHAR[options.delimiter];
  const line = (cells: string[]) => cells.map((c) => escapeCsvField(c, sep)).join(sep);
  const lines = options.header ? [line(headers)] : [];
  for (const row of rows) lines.push(line(headers.map((h) => cellOf(row[h], options))));
  return `${lines.join('\n')}\n`;
}
