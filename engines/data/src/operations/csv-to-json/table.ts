import type { CsvRow } from './parse.ts';

export interface CsvTable {
  headers: string[];
  objects: Record<string, string>[];
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

function toObject(headers: string[], row: CsvRow): Record<string, string> {
  if (row.fields.length !== headers.length) {
    fail({
      tag: 'inconsistent-columns',
      line: row.line,
      expected: headers.length,
      actual: row.fields.length,
    });
  }
  const obj: Record<string, string> = {};
  headers.forEach((name, index) => {
    obj[name] = row.fields[index];
  });
  return obj;
}

/** Builds a header + row-object table from tokenized rows, skipping blank lines. */
export function buildCsvTable(rows: CsvRow[]): CsvTable {
  const dataRows = rows.filter((row) => !isBlankRow(row));
  if (dataRows.length === 0) fail({ tag: 'no-header' });
  const [headerRow, ...rest] = dataRows;
  checkHeaders(headerRow.fields, headerRow.line);
  return { headers: headerRow.fields, objects: rest.map((row) => toObject(headerRow.fields, row)) };
}
