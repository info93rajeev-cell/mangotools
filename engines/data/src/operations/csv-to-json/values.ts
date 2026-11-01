import type { CsvColumnType } from './schema.ts';

export type CsvValue = string | number | boolean | null;

export interface ValueOptions {
  inferTypes: boolean;
  emptyAsNull: boolean;
  nullTokens: ReadonlySet<string>;
}

const NUMBER_SHAPE = /^-?(0|[1-9]\d*)(\.\d+)?$/;

/**
 * A number only when converting is lossless: the text must be the exact form JavaScript prints
 * for that number. "00124", "1.50", "1e5" and integers beyond 2^53 therefore stay strings.
 */
function toNumber(text: string): number | null {
  if (!NUMBER_SHAPE.test(text)) return null;
  const n = Number(text);
  return Number.isFinite(n) && String(n) === text ? n : null;
}

/** Splits the user's comma-separated null tokens, ignoring empty entries. */
export function parseNullTokens(list: string): Set<string> {
  return new Set(
    list
      .split(',')
      .map((token) => token.trim())
      .filter((token) => token !== ''),
  );
}

export function convertValue(text: string, options: ValueOptions): CsvValue {
  if (options.nullTokens.has(text)) return null;
  if (text === '' && options.emptyAsNull) return null;
  if (!options.inferTypes) return text;
  const lower = text.toLowerCase();
  if (lower === 'true') return true;
  if (lower === 'false') return false;
  return toNumber(text) ?? text;
}

function typeOf(value: CsvValue): CsvColumnType {
  if (value === null) return 'null';
  if (typeof value === 'number') return 'number';
  if (typeof value === 'boolean') return 'boolean';
  return 'string';
}

/** The single JSON type of a column's non-null values; all-null → null, several → mixed. */
export function columnType(values: readonly CsvValue[]): CsvColumnType {
  const types = new Set(values.filter((v) => v !== null).map(typeOf));
  if (types.size === 0) return values.length > 0 ? 'null' : 'string';
  if (types.size > 1) return 'mixed';
  return [...types][0];
}
