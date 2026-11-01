import type { CsvRow } from './parse.ts';

export interface CsvTable {
  headers: string[];
  rows: string[][];
}

export interface CsvTableOptions {
  header: boolean;
  trim: boolean;
  skipEmptyRows: boolean;
}

export type CsvTableFailure =
  | { tag: 'no-header' }
  | { tag: 'duplicate-header'; name: string; line: number; column: number }
  | { tag: 'inconsistent-columns'; line: number; expected: number; actual: number };

export function isCsvTableFailure(value: unknown): value is CsvTableFailure {
  return typeof value === 'object' && value !== null && 'tag' in value;
}

function fail(failure: CsvTableFailure): never {
  throw failure;
}

/**
 * A row parsed from a fully blank input line: exactly one empty field. Skipped rather than turned
 * into a header or a data row, so a blank line (including the trailing newline every pasted CSV
 * ends with) never causes a spurious "inconsistent columns" error.
 */
function isBlankRow(row: CsvRow): boolean {
  return row.fields.length === 1 && row.fields[0] === '';
}

function checkHeaders(headers: string[], line: number): void {
  const seen = new Set<string>();
  headers.forEach((name, index) => {
    if (seen.has(name)) fail({ tag: 'duplicate-header', name, line, column: index + 1 });
    seen.add(name);
  });
}

function checkWidth(width: number, row: CsvRow): string[] {
  if (row.fields.length !== width) {
    fail({
      tag: 'inconsistent-columns',
      line: row.line,
      expected: width,
      actual: row.fields.length,
    });
  }
  return row.fields;
}

const isEmptyRow = (row: CsvRow) => row.fields.every((field) => field === '');

function prepareRows(rows: CsvRow[], options: CsvTableOptions): CsvRow[] {
  const trimmed = options.trim
    ? rows.map((row) => ({ line: row.line, fields: row.fields.map((f) => f.trim()) }))
    : rows;
  const kept = trimmed.filter((row) => !isBlankRow(row));
  return options.skipEmptyRows ? kept.filter((row) => !isEmptyRow(row)) : kept;
}

/**
 * Builds a header + rows table from tokenized rows, skipping blank lines. With `header` off the
 * columns are named column_1 … column_n after the first row's width.
 */
export function buildCsvTable(
  rows: CsvRow[],
  options: CsvTableOptions = { header: true, trim: false, skipEmptyRows: false },
): CsvTable {
  const dataRows = prepareRows(rows, options);
  if (dataRows.length === 0) fail({ tag: 'no-header' });
  if (!options.header) {
    const width = dataRows[0].fields.length;
    const headers = Array.from({ length: width }, (_, i) => `column_${i + 1}`);
    return { headers, rows: dataRows.map((row) => checkWidth(width, row)) };
  }
  const [headerRow, ...rest] = dataRows;
  checkHeaders(headerRow.fields, headerRow.line);
  const width = headerRow.fields.length;
  return { headers: headerRow.fields, rows: rest.map((row) => checkWidth(width, row)) };
}
