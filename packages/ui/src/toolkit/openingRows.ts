import { convertUnitText } from '../format/units.ts';
import { parseRows, serializeRows } from './itemRows.ts';

/**
 * Repeatable opening/deduction rows (width × height × quantity) shared by the civil calculators.
 * The form holds them as JSON text; fully blank rows are allowed while typing and are ignored by
 * the engine.
 */
export const OPENING_FIELDS = ['type', 'width', 'height', 'quantity'] as const;
export const OPENING_MEASURE_FIELDS = ['width', 'height', 'quantity'] as const;
export type OpeningField = (typeof OPENING_FIELDS)[number];
export type OpeningRowValues = Record<OpeningField, string>;

export const MAX_OPENING_ROWS = 20;
const NUMERIC = new Set<string>(OPENING_MEASURE_FIELDS);
const DEFAULTS = { type: '', quantity: '1' };

/** Rows from the form value; an empty value means no rows (not one blank row). */
export function readOpeningRows(raw: string): OpeningRowValues[] {
  if (raw.trim() === '' || raw.trim() === '[]') return [];
  return parseRows(raw, OPENING_FIELDS, DEFAULTS) as OpeningRowValues[];
}

/** The form value for rows: '' when there are none. */
export function writeOpeningRows(rows: readonly OpeningRowValues[]): string {
  if (rows.length === 0) return '';
  // A row with no width and no height is still being added: send it as blank (ignored), so a
  // fresh row's default quantity never triggers a "missing width" error before anything is typed.
  const started = rows.map((row) =>
    row.width.trim() === '' && row.height.trim() === '' ? { ...row, quantity: '' } : row,
  );
  return serializeRows(started, OPENING_FIELDS, NUMERIC);
}

export const blankOpeningRow = (): OpeningRowValues => ({
  type: '',
  width: '',
  height: '',
  quantity: '1',
});

/** Converts every row's width and height when the length unit changes. */
export function convertOpeningsText(raw: string, from: string, to: string): string {
  const rows = readOpeningRows(raw).map((row) => ({
    ...row,
    width: convertUnitText(row.width, 'length', from, to),
    height: convertUnitText(row.height, 'length', from, to),
  }));
  return writeOpeningRows(rows);
}

const ROW_PATH = /^openings\[(\d+)\]\.(type|width|height|quantity)$/;

/** The row and field an engine error path such as "openings[1].width" points at. */
export function openingRowError(path: string | undefined) {
  const match = path ? ROW_PATH.exec(path) : null;
  return match ? { index: Number(match[1]), field: match[2] as OpeningField } : null;
}
