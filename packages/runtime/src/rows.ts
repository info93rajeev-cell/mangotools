import type { RowColumn, RowsSpec } from '@mangotools/schemas';
import { normalizeNumberText } from './number-text.ts';

/**
 * Runtime representation of a generic `kind: 'rows'` field (TASK-008L PR 3).
 *
 * - In the form, the whole list is one JSON string: an array of row objects whose values are strings,
 *   with keys in column order. That is deterministic and survives samples, transfers and presets.
 * - Row identity for rendering (React keys) is the UI's concern and is never part of the value, so
 *   persisted or computed data never depends on unstable ids.
 * - Add and remove respect `minRows`/`maxRows` and preserve row order; at a limit they return the
 *   same array unchanged.
 */

export type Row = Record<string, string>;

const NUMERIC_COLUMNS = new Set<RowColumn['kind']>(['number', 'money', 'percent']);

const columnDefault = (column: RowColumn): string =>
  column.default ?? (column.kind === 'enum' ? (column.options?.[0]?.value ?? '') : '');

/** A new row: every column at its default (enums at their first option). */
export function emptyRow(spec: RowsSpec): Row {
  const row: Row = {};
  for (const [key, column] of Object.entries(spec.columns)) row[key] = columnDefault(column);
  return row;
}

/** Keeps known columns only, in column order, as strings; absent cells take the column default. */
function normaliseRow(spec: RowsSpec, raw: unknown): Row {
  const source = raw !== null && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const row: Row = {};
  for (const [key, column] of Object.entries(spec.columns)) {
    const value = source[key];
    row[key] = typeof value === 'string' ? value : columnDefault(column);
  }
  return row;
}

/** Rows a fresh or reset form starts with: `defaultRows`, or `minRows` empty rows. */
export function initialRows(spec: RowsSpec): Row[] {
  if (spec.defaultRows) return spec.defaultRows.map((row) => normaliseRow(spec, row));
  return Array.from({ length: spec.minRows ?? 0 }, () => emptyRow(spec));
}

/** Deterministic form value for `rows`. */
export function serializeRows(spec: RowsSpec, rows: readonly Row[]): string {
  return JSON.stringify(rows.map((row) => normaliseRow(spec, row)));
}

/** Reads a form value back into rows; malformed text falls back to the initial rows. */
export function parseRows(spec: RowsSpec, raw: string): Row[] {
  if (raw.trim() === '') return initialRows(spec);
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return initialRows(spec);
  }
  if (!Array.isArray(parsed)) return initialRows(spec);
  return parsed.slice(0, spec.maxRows).map((row) => normaliseRow(spec, row));
}

/** Appends an empty row unless `maxRows` is reached. */
export function addRow(spec: RowsSpec, rows: readonly Row[]): readonly Row[] {
  return rows.length >= spec.maxRows ? rows : [...rows, emptyRow(spec)];
}

/** Removes the row at `index` unless that would go below `minRows` or the index is out of range. */
export function removeRow(spec: RowsSpec, rows: readonly Row[], index: number): readonly Row[] {
  const outOfRange = index < 0 || index >= rows.length;
  return outOfRange || rows.length <= (spec.minRows ?? 0)
    ? rows
    : rows.filter((_, i) => i !== index);
}

/** A row is blank when every non-enum cell is empty; blank rows are not sent to the engine. */
function isBlank(spec: RowsSpec, row: Row): boolean {
  return Object.entries(spec.columns).every(
    ([key, column]) => column.kind === 'enum' || (row[key] ?? '').trim() === '',
  );
}

/**
 * The engine payload: one object per non-blank row, in order. Numeric cells get the platform's
 * number-text normalisation and stay decimal strings; empty cells are left out (an absent optional
 * value such as an open slab bound).
 */
export function rowsRequest(spec: RowsSpec, rows: readonly Row[]): Record<string, string>[] {
  const out: Record<string, string>[] = [];
  for (const row of rows) {
    if (isBlank(spec, row)) continue;
    const item: Record<string, string> = {};
    for (const [key, column] of Object.entries(spec.columns)) {
      const text = (row[key] ?? '').trim();
      const value = NUMERIC_COLUMNS.has(column.kind) ? normalizeNumberText(text) : text;
      if (value !== '') item[key] = value;
    }
    out.push(item);
  }
  return out;
}
