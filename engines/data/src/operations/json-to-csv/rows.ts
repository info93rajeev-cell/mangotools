/**
 * Turns a parsed JSON value into a header list and flat row objects: an array of objects (or a
 * single object, treated as one row) becomes a table whose headers are the first object's own key
 * order, with any keys discovered later appended in discovery order (`keys: union`), or only the
 * first object's keys (`keys: first`). Nested values follow the `nested` param (see flatten.ts).
 */
import { toFlatRow } from './flatten.ts';
import { isPlainObject, type JsonRow } from './records.ts';
import type { JsonToCsvParams } from './schema.ts';

export type { JsonRow } from './records.ts';

export type JsonToCsvFailure =
  | { tag: 'root-invalid' }
  | { tag: 'empty-array' }
  | { tag: 'item-not-object'; item: number }
  | { tag: 'nested-value'; item: number; key: string }
  | { tag: 'no-columns' };

export function isJsonToCsvFailure(value: unknown): value is JsonToCsvFailure {
  return typeof value === 'object' && value !== null && 'tag' in value;
}

function fail(failure: JsonToCsvFailure): never {
  throw failure;
}

function toItemList(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (isPlainObject(value)) return [value];
  fail({ tag: 'root-invalid' });
}

function addHeaders(row: JsonRow, headers: string[], seen: Set<string>): void {
  for (const key of Object.keys(row)) {
    if (!seen.has(key)) {
      seen.add(key);
      headers.push(key);
    }
  }
}

export interface JsonRowTable {
  headers: string[];
  rows: JsonRow[];
}

type TableOptions = Pick<JsonToCsvParams, 'nested' | 'keys'>;

/** Builds a header list and validated, flat row objects from the records value. */
export function buildRowTable(value: unknown, options: TableOptions): JsonRowTable {
  const items = toItemList(value);
  if (items.length === 0) fail({ tag: 'empty-array' });
  const headers: string[] = [];
  const seen = new Set<string>();
  const rows: JsonRow[] = [];
  items.forEach((item, index) => {
    if (!isPlainObject(item)) fail({ tag: 'item-not-object', item: index + 1 });
    const flat = toFlatRow(item, options.nested);
    if ('nestedKey' in flat) fail({ tag: 'nested-value', item: index + 1, key: flat.nestedKey });
    if (options.keys === 'union' || index === 0) addHeaders(flat.row, headers, seen);
    rows.push(flat.row);
  });
  if (headers.length === 0) fail({ tag: 'no-columns' });
  return { headers, rows };
}
