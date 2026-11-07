import type { CsvColumnType, CsvToJsonParams } from './schema.ts';
import type { CsvTable } from './table.ts';
import { type CsvValue, columnType, convertValue, parseNullTokens } from './values.ts';

export interface CsvColumnInfo {
  name: string;
  type: CsvColumnType;
  sample: string;
  included: boolean;
}

export interface SelectedTable {
  headers: string[];
  rows: CsvValue[][];
  columns: CsvColumnInfo[];
  /** Present when maxRows dropped rows. */
  truncated?: { kept: number; total: number };
}

type SelectParams = Pick<
  CsvToJsonParams,
  'inferTypes' | 'emptyAsNull' | 'nullValues' | 'maxRows' | 'excludeColumns'
>;

function excludedIndexes(list: string): Set<number> {
  if (list === '') return new Set();
  return new Set(list.split(',').map((n) => Number(n) - 1));
}

function firstNonEmpty(rows: readonly string[][], index: number): string {
  return rows.find((row) => row[index] !== '')?.[index] ?? '';
}

/** Applies maxRows, value conversion and column exclusion; reports every source column. */
export function selectColumns(table: CsvTable, params: SelectParams): SelectedTable {
  const limit = Number(params.maxRows || '0');
  const sourceRows = limit > 0 ? table.rows.slice(0, limit) : table.rows;
  const options = { ...params, nullTokens: parseNullTokens(params.nullValues) };
  const converted = sourceRows.map((row) => row.map((cell) => convertValue(cell, options)));
  const excluded = excludedIndexes(params.excludeColumns);
  const keep = table.headers.map((_, i) => i).filter((i) => !excluded.has(i));

  const columns = table.headers.map((name, i) => ({
    name,
    type: columnType(converted.map((row) => row[i])),
    sample: firstNonEmpty(sourceRows, i),
    included: !excluded.has(i),
  }));
  const selected: SelectedTable = {
    headers: keep.map((i) => table.headers[i]),
    rows: converted.map((row) => keep.map((i) => row[i])),
    columns,
  };
  if (sourceRows.length < table.rows.length) {
    selected.truncated = { kept: sourceRows.length, total: table.rows.length };
  }
  return selected;
}
