import type { CsvValue } from './values.ts';

export interface RenderOptions {
  shape: 'objects' | 'arrays' | 'ndjson';
  pretty: boolean;
  metadata: boolean;
  /** arrays shape: put the header names in the first array. */
  headerRow: boolean;
}

function toObjects(headers: readonly string[], rows: readonly CsvValue[][]) {
  return rows.map((row) => {
    // Null prototype: a header named __proto__ must become a plain key, not change the prototype.
    const obj: Record<string, CsvValue> = Object.create(null);
    headers.forEach((name, index) => {
      obj[name] = row[index];
    });
    return obj;
  });
}

/** Serializes converted rows in the requested shape. */
export function renderJson(
  headers: readonly string[],
  rows: readonly CsvValue[][],
  options: RenderOptions,
): string {
  if (options.shape === 'ndjson') {
    return toObjects(headers, rows)
      .map((obj) => JSON.stringify(obj))
      .join('\n');
  }
  const arrays = options.headerRow ? [headers, ...rows] : rows;
  const data = options.shape === 'arrays' ? arrays : toObjects(headers, rows);
  const body = options.metadata
    ? { meta: { rowCount: rows.length, columnCount: headers.length, columns: headers }, data }
    : data;
  return JSON.stringify(body, null, options.pretty ? 2 : undefined);
}
