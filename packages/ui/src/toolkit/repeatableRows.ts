import { addRow, parseRows, type Row, removeRow, serializeRows } from '@mangotools/runtime';
import type { RowsSpec } from '@mangotools/schemas';

/**
 * Pure editing logic for a generic `kind: 'rows'` field (TASK-008L PR 4A). Parsing, row limits and
 * serialization come from `@mangotools/runtime`'s rows helpers; this module only turns user actions
 * into the next form value and reports which controls are available. Row identity for rendering is
 * kept by the component and never enters the value.
 */

export interface RowsState {
  rows: Row[];
  canAdd: boolean;
  canRemove: boolean;
}

export function rowsState(spec: RowsSpec, value: string): RowsState {
  const rows = parseRows(spec, value);
  return {
    rows,
    canAdd: rows.length < spec.maxRows,
    canRemove: rows.length > (spec.minRows ?? 0),
  };
}

/** The form value after appending a row, or the same value at `maxRows`. */
export function valueAfterAdd(spec: RowsSpec, value: string): string {
  const rows = parseRows(spec, value);
  const next = addRow(spec, rows);
  return next === rows ? value : serializeRows(spec, next);
}

/** The form value after removing row `index`, or the same value at `minRows`/out of range. */
export function valueAfterRemove(spec: RowsSpec, value: string, index: number): string {
  const rows = parseRows(spec, value);
  const next = removeRow(spec, rows, index);
  return next === rows ? value : serializeRows(spec, next);
}

/** The form value after one cell edit; text is kept exactly as typed (never a number). */
export function valueAfterCellEdit(
  spec: RowsSpec,
  value: string,
  index: number,
  column: string,
  text: string,
): string {
  if (!(column in spec.columns)) return value;
  const rows = parseRows(spec, value);
  if (index < 0 || index >= rows.length) return value;
  return serializeRows(
    spec,
    rows.map((row, i) => (i === index ? { ...row, [column]: text } : row)),
  );
}

export interface RowCellError {
  index: number;
  column: string;
}

/**
 * The row cell an engine error path points at, for the simple forms `<field>.<row>.<column>` and
 * `<field>[<row>].<column>` with a known column. Deeper paths (for example
 * `feeLines.2.priceSlabs.1.max`) are not mapped here; they stay whole-field errors.
 */
export function rowCellError(
  fieldKey: string,
  spec: RowsSpec,
  path: string | undefined,
): RowCellError | null {
  if (!path) return null;
  const rest = path.startsWith(`${fieldKey}.`)
    ? path.slice(fieldKey.length + 1)
    : path.startsWith(`${fieldKey}[`)
      ? path.slice(fieldKey.length).replace(/^\[(\d+)\]/, '$1')
      : null;
  const match = rest === null ? null : /^(\d+)\.([A-Za-z][A-Za-z0-9]*)$/.exec(rest);
  if (!match) return null;
  const column = match[2] ?? '';
  return column in spec.columns ? { index: Number(match[1]), column } : null;
}

/** Whether an engine error path belongs to this rows field at all (cell or whole field). */
export function isRowsFieldPath(fieldKey: string, path: string | undefined): boolean {
  return (
    path === fieldKey ||
    (path?.startsWith(`${fieldKey}.`) ?? false) ||
    (path?.startsWith(`${fieldKey}[`) ?? false)
  );
}

/** After removing row `index` from `count` rows, the row whose remove control should get focus. */
export function focusIndexAfterRemove(index: number, count: number): number | null {
  const remaining = count - 1;
  if (remaining <= 0) return null;
  return Math.min(index, remaining - 1);
}
