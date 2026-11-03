import { isJsonBigNumber } from './lossless.ts';
/**
 * Locating the records inside a JSON document: following a dot path of keys from the root, and
 * listing the dot paths (up to three levels deep) that hold an array of objects, so a page can
 * offer them as choices.
 */

export type JsonRow = Record<string, unknown>;

const MAX_PATH_DEPTH = 3;
const MAX_PATHS = 20;

export function isPlainObject(value: unknown): value is JsonRow {
  return (
    typeof value === 'object' && value !== null && !Array.isArray(value) && !isJsonBigNumber(value)
  );
}

function isRecordArray(value: unknown): boolean {
  return Array.isArray(value) && value.length > 0 && value.every(isPlainObject);
}

/** The value at a dot path, or `undefined` when a key on the way is missing. */
export function valueAtPath(root: unknown, path: string): unknown {
  if (path === '') return root;
  let current: unknown = root;
  for (const key of path.split('.')) {
    if (!isPlainObject(current) || !Object.hasOwn(current, key)) return undefined;
    current = current[key];
  }
  return current;
}

function collectPaths(value: unknown, prefix: string, depth: number, out: string[]): void {
  if (!isPlainObject(value) || depth >= MAX_PATH_DEPTH) return;
  for (const key of Object.keys(value)) {
    if (out.length >= MAX_PATHS) return;
    if (key.includes('.') || /\s/.test(key) || key === '') continue;
    const path = prefix === '' ? key : `${prefix}.${key}`;
    const child = value[key];
    if (isRecordArray(child)) out.push(path);
    else collectPaths(child, path, depth + 1, out);
  }
}

/** "" when the root is an array of objects or an object, then nested arrays of objects. */
export function findRecordPaths(root: unknown): string[] {
  const out: string[] = [];
  if (isRecordArray(root) || isPlainObject(root)) out.push('');
  collectPaths(root, '', 0, out);
  return out;
}
