/**
 * One record as flat cells. Scalars stay as they are. A nested object or array is rejected,
 * written as JSON text, or (for objects) flattened into dot-path keys, depending on `nested`.
 */
import { isPlainObject, type JsonRow } from './records.ts';
import type { JsonToCsvNested } from './schema.ts';

/** Deeper objects than this are written as JSON text instead of flattened further. */
const MAX_FLATTEN_DEPTH = 32;

/** A flat row, or the key of the first nested value when `nested` is `reject`. */
export type FlatRowResult = { row: JsonRow } | { nestedKey: string };

function isNested(value: unknown): boolean {
  return isPlainObject(value) || Array.isArray(value);
}

function flattenInto(out: JsonRow, value: JsonRow, prefix: string, depth: number): void {
  for (const key of Object.keys(value)) {
    const path = prefix === '' ? key : `${prefix}.${key}`;
    const child = value[key];
    const canDescend =
      isPlainObject(child) && Object.keys(child).length > 0 && depth < MAX_FLATTEN_DEPTH;
    if (canDescend) flattenInto(out, child, path, depth + 1);
    // A literal key "a.b" and a flattened path a → b share one column; the first value wins.
    else if (!Object.hasOwn(out, path)) out[path] = isNested(child) ? JSON.stringify(child) : child;
  }
}

export function toFlatRow(row: JsonRow, nested: JsonToCsvNested): FlatRowResult {
  if (nested === 'flatten') {
    const out: JsonRow = {};
    flattenInto(out, row, '', 0);
    return { row: out };
  }
  const out: JsonRow = {};
  for (const key of Object.keys(row)) {
    const value = row[key];
    if (!isNested(value)) out[key] = value;
    else if (nested === 'json') out[key] = JSON.stringify(value);
    else return { nestedKey: key };
  }
  return { row: out };
}
