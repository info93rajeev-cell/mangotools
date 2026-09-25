import { err, ok, type Result } from '@mangotools/core';
import { compare, parseDecimal } from '@mangotools/engine-numeric';

type Raw = string | number | undefined;

const text = (raw: string | number) => (typeof raw === 'number' ? String(raw) : raw);

/** A required measurement greater than zero, with at most `maxDecimals` decimal places. */
export function readPositive(raw: Raw, path: string, maxDecimals: number): Result<string> {
  if (raw === undefined || text(raw).trim() === '') return err('LOGISTICS_MISSING_INPUT', { path });
  const parsed = parseDecimal(text(raw), { maxDecimals });
  if (!parsed.ok) {
    return parsed.code === 'TOO_MANY_DECIMALS'
      ? err('LOGISTICS_TOO_MANY_DECIMALS', { path, details: { max: maxDecimals } })
      : err('LOGISTICS_INVALID_NUMBER', { path });
  }
  if (compare(parsed.value, '0') <= 0) return err('LOGISTICS_NOT_POSITIVE', { path });
  return ok(parsed.value);
}

/** A required whole number from 1 to `max` ("12" and "12.0" are both 12). */
export function readCount(raw: Raw, path: string, max: string): Result<string> {
  if (raw === undefined || text(raw).trim() === '') return err('LOGISTICS_MISSING_INPUT', { path });
  const parsed = parseDecimal(text(raw));
  if (!parsed.ok) return err('LOGISTICS_INVALID_NUMBER', { path });
  if (compare(parsed.value, '0') <= 0) return err('LOGISTICS_QUANTITY_NOT_POSITIVE', { path });
  if (parsed.value.includes('.')) return err('LOGISTICS_QUANTITY_NOT_WHOLE', { path });
  if (compare(parsed.value, max) > 0) {
    return err('LOGISTICS_QUANTITY_TOO_LARGE', { path, details: { max: '1,000,000' } });
  }
  return ok(parsed.value);
}

/** A required whole number in [min, max]; anything else outside the range gets `rangeCode`. */
export function readWholeInRange(
  raw: Raw,
  path: string,
  range: { min: string; max: string; rangeCode: string },
): Result<string> {
  if (raw === undefined || text(raw).trim() === '') return err('LOGISTICS_MISSING_INPUT', { path });
  const parsed = parseDecimal(text(raw));
  if (!parsed.ok) return err('LOGISTICS_INVALID_NUMBER', { path });
  if (compare(parsed.value, '0') <= 0) return err('LOGISTICS_NOT_POSITIVE', { path });
  const outside = compare(parsed.value, range.min) < 0 || compare(parsed.value, range.max) > 0;
  if (parsed.value.includes('.') || outside) return err(range.rangeCode, { path });
  return ok(parsed.value);
}
