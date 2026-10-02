import { err, ok, type Result } from '@mangotools/core';
import { add, compare, mul } from '@mangotools/engine-numeric';
import { z } from 'zod';
import { readCount, readPositive } from './read-input.ts';
import { MAX_COUNT, MEASURE_DECIMALS } from './units-v2.ts';

/**
 * Repeatable opening/deduction rows (doors, windows, columns, …) shared by the civil `@2`
 * operations. Each row is width × height × quantity, in the operation's own length unit. A form
 * field can only hold a string, so the list arrives either as an array or as its JSON text.
 */
const decimal = z.union([z.string(), z.number()]);
export const openingTypes = ['door', 'window', 'other'] as const;
export type OpeningType = (typeof openingTypes)[number];
const openingType = z.enum(openingTypes);
const openingRow = z.strictObject({
  type: openingType.optional(),
  width: decimal.optional(),
  height: decimal.optional(),
  quantity: decimal.optional(),
});
export const openingsInput = z.union([z.string(), z.array(openingRow)]).optional();
export type OpeningsInput = z.infer<typeof openingsInput>;

export const MAX_OPENING_ROWS = 20;

export interface OpeningRow {
  type?: OpeningType;
  width: string;
  height: string;
  quantity: string;
}

const blank = (v: unknown) => v === undefined || String(v).trim() === '';

function rowsOf(raw: OpeningsInput): Result<unknown[]> {
  if (raw === undefined) return ok([]);
  if (Array.isArray(raw)) return ok(raw);
  if (raw.trim() === '') return ok([]);
  try {
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) return ok(parsed);
  } catch {
    // fall through to the typed error below
  }
  return err('CIVIL_OPENINGS_INVALID', { path: 'openings' });
}

function readRow(row: unknown, index: number): Result<OpeningRow | null> {
  const parsed = openingRow.safeParse(row);
  if (!parsed.success) return err('CIVIL_OPENINGS_INVALID', { path: 'openings' });
  const { type, width, height, quantity } = parsed.data;
  if (blank(width) && blank(height) && blank(quantity)) return ok(null);
  const at = (field: string) => `openings[${index}].${field}`;
  const w = readPositive(width, at('width'), MEASURE_DECIMALS);
  if (!w.ok) return w;
  const h = readPositive(height, at('height'), MEASURE_DECIMALS);
  if (!h.ok) return h;
  const q = blank(quantity) ? ok('1') : readCount(quantity, at('quantity'), MAX_COUNT);
  if (!q.ok) return q;
  return ok({
    ...(type ? { type } : {}),
    width: w.value,
    height: h.value,
    quantity: q.value,
  });
}

/** Reads every opening row; fully blank rows are ignored, partly filled rows are validated. */
export function readOpenings(raw: OpeningsInput): Result<OpeningRow[]> {
  const rows = rowsOf(raw);
  if (!rows.ok) return rows;
  if (rows.value.length > MAX_OPENING_ROWS) {
    return err('CIVIL_OPENINGS_TOO_MANY', {
      path: 'openings',
      details: { max: MAX_OPENING_ROWS },
    });
  }
  const out: OpeningRow[] = [];
  for (const [index, row] of rows.value.entries()) {
    const read = readRow(row, index);
    if (!read.ok) return read;
    if (read.value) out.push(read.value);
  }
  return ok(out);
}

/** Σ(width × height × quantity), exact, in the input unit's own squared area. */
export function openingsArea(rows: readonly OpeningRow[]): string {
  return rows.reduce((sum, r) => add(sum, mul(mul(r.width, r.height), r.quantity)), '0');
}

/** Rejects deductions that leave nothing to calculate (net area zero or negative). */
export function checkDeductions(grossArea: string, deductedArea: string): Result<true> {
  if (compare(deductedArea, grossArea) >= 0) {
    return err('CIVIL_DEDUCTIONS_EXCEED_AREA', { path: 'openings' });
  }
  return ok(true);
}
