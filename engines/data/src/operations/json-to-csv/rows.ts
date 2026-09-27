/**
 * Turns a parsed JSON value into a header list and row objects: an array of objects (or a single
 * object, treated as one row) becomes a table whose headers are the first object's own key order,
 * with any keys discovered later appended in discovery order. A nested object or array value is
 * rejected in v1 rather than flattened.
 */

export type JsonRow = Record<string, unknown>;

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

function isPlainObject(value: unknown): value is JsonRow {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toItemList(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (isPlainObject(value)) return [value];
  fail({ tag: 'root-invalid' });
}

function collectHeaders(row: JsonRow, item: number, headers: string[], seen: Set<string>): void {
  for (const key of Object.keys(row)) {
    const value = row[key];
    if (isPlainObject(value) || Array.isArray(value)) fail({ tag: 'nested-value', item, key });
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

/** Builds a header list (first-object order, later keys appended) and validated row objects. */
export function buildRowTable(value: unknown): JsonRowTable {
  const items = toItemList(value);
  if (items.length === 0) fail({ tag: 'empty-array' });
  const headers: string[] = [];
  const seen = new Set<string>();
  const rows: JsonRow[] = [];
  items.forEach((item, index) => {
    if (!isPlainObject(item)) fail({ tag: 'item-not-object', item: index + 1 });
    collectHeaders(item, index + 1, headers, seen);
    rows.push(item);
  });
  if (headers.length === 0) fail({ tag: 'no-columns' });
  return { headers, rows };
}
