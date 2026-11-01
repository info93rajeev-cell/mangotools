/** Shapes and pure helpers for the CSV → JSON studio. The engine does the conversion. */

export type CsvColumnType = 'string' | 'number' | 'boolean' | 'null' | 'mixed';
export type CsvShape = 'objects' | 'arrays' | 'ndjson';
export type CsvDelimiterChoice = 'comma' | 'semicolon' | 'tab' | 'pipe' | 'auto';

export interface CsvColumnInfo {
  name: string;
  type: CsvColumnType;
  sample: string;
  included: boolean;
}

export interface CsvResult {
  text: string;
  rowCount: number;
  columnCount: number;
  headers: string[];
  columns: CsvColumnInfo[];
  delimiter: Exclude<CsvDelimiterChoice, 'auto'>;
  sourceRowCount: number;
}

/** Reads the engine result, tolerating an older result shape without the new fields. */
export function readCsvResult(value: Record<string, unknown> | undefined): CsvResult | null {
  if (!value || typeof value.text !== 'string') return null;
  const headers = Array.isArray(value.headers) ? (value.headers as string[]) : [];
  return {
    text: value.text,
    rowCount: Number(value.rowCount ?? 0),
    columnCount: Number(value.columnCount ?? headers.length),
    headers,
    columns: Array.isArray(value.columns) ? (value.columns as CsvColumnInfo[]) : [],
    delimiter: (value.delimiter as CsvResult['delimiter']) ?? 'comma',
    sourceRowCount: Number(value.sourceRowCount ?? value.rowCount ?? 0),
  };
}

export const PREVIEW_ROW_LIMIT = 200;

export interface PreviewTable {
  headers: string[];
  rows: string[][];
}

function cell(value: unknown): string {
  if (value === null) return 'null';
  if (value === undefined) return '';
  return typeof value === 'object' ? JSON.stringify(value) : String(value);
}

function objectsTable(headers: string[], items: unknown[]): PreviewTable {
  const rows = items
    .slice(0, PREVIEW_ROW_LIMIT)
    .map((item) => headers.map((h) => cell((item as Record<string, unknown>)[h])));
  return { headers, rows };
}

/** Rebuilds a small table from the engine's JSON text for the Preview Table tab. */
export function previewTable(result: CsvResult, shape: CsvShape): PreviewTable {
  try {
    if (shape === 'ndjson') {
      const items = result.text
        .split('\n')
        .filter((line) => line.trim() !== '')
        .map((line) => JSON.parse(line) as unknown);
      return objectsTable(result.headers, items);
    }
    const parsed = JSON.parse(result.text) as unknown;
    const data = Array.isArray(parsed) ? parsed : (parsed as { data?: unknown[] }).data;
    if (!Array.isArray(data)) return { headers: result.headers, rows: [] };
    if (shape === 'objects') return objectsTable(result.headers, data);
    const arrays = data as unknown[][];
    const body = arrays.length > result.rowCount ? arrays.slice(1) : arrays;
    return {
      headers: result.headers,
      rows: body.slice(0, PREVIEW_ROW_LIMIT).map((row) => row.map(cell)),
    };
  } catch {
    return { headers: result.headers, rows: [] };
  }
}

export interface TypeCounts {
  string: number;
  number: number;
  boolean: number;
  null: number;
  mixed: number;
}

/** How many included columns have each JSON type. */
export function countColumnTypes(columns: readonly CsvColumnInfo[]): TypeCounts {
  const counts: TypeCounts = { string: 0, number: 0, boolean: 0, null: 0, mixed: 0 };
  for (const column of columns) if (column.included) counts[column.type]++;
  return counts;
}

/** Toggles one column (0-based) in the engine's 1-based excludeColumns list. */
export function toggleExcluded(list: string, index: number, include: boolean): string {
  const set = new Set(list === '' ? [] : list.split(',').map(Number));
  if (include) set.delete(index + 1);
  else set.add(index + 1);
  return [...set].sort((a, b) => a - b).join(',');
}

export function utf8Bytes(text: string): number {
  return new TextEncoder().encode(text).length;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} bytes`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export const SHAPE_LABEL: Readonly<Record<CsvShape, string>> = {
  objects: 'Array of objects',
  arrays: 'Array of arrays',
  ndjson: 'JSON Lines',
};

export const DELIMITER_LABEL: Readonly<Record<CsvDelimiterChoice, string>> = {
  comma: 'Comma (,)',
  semicolon: 'Semicolon (;)',
  tab: 'Tab',
  pipe: 'Pipe (|)',
  auto: 'Auto detect',
};
