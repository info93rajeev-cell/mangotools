import { err, ok, type Result } from '@mangotools/core';
import { compare, parseDecimal } from '@mangotools/engine-numeric';

type Raw = string | number | undefined;

const text = (raw: string | number) => (typeof raw === 'number' ? String(raw) : raw);

/** A required measurement greater than zero, with at most `maxDecimals` decimal places. */
export function readPositive(raw: Raw, path: string, maxDecimals: number): Result<string> {
  if (raw === undefined || text(raw).trim() === '') return err('CIVIL_MISSING_INPUT', { path });
  const parsed = parseDecimal(text(raw), { maxDecimals });
  if (!parsed.ok) {
    return parsed.code === 'TOO_MANY_DECIMALS'
      ? err('CIVIL_TOO_MANY_DECIMALS', { path, details: { max: maxDecimals } })
      : err('CIVIL_INVALID_NUMBER', { path });
  }
  if (compare(parsed.value, '0') <= 0) return err('CIVIL_NOT_POSITIVE', { path });
  return ok(parsed.value);
}

/** A required measurement that may be zero, with at most `maxDecimals` decimal places. */
export function readNonNegative(raw: Raw, path: string, maxDecimals: number): Result<string> {
  if (raw === undefined || text(raw).trim() === '') return err('CIVIL_MISSING_INPUT', { path });
  const parsed = parseDecimal(text(raw), { maxDecimals });
  if (!parsed.ok) {
    return parsed.code === 'TOO_MANY_DECIMALS'
      ? err('CIVIL_TOO_MANY_DECIMALS', { path, details: { max: maxDecimals } })
      : err('CIVIL_INVALID_NUMBER', { path });
  }
  if (compare(parsed.value, '0') < 0) return err('CIVIL_NOT_NEGATIVE', { path });
  return ok(parsed.value);
}

/** A required whole number from 1 to `max` ("12" and "12.0" are both 12). */
export function readCount(raw: Raw, path: string, max: string): Result<string> {
  if (raw === undefined || text(raw).trim() === '') return err('CIVIL_MISSING_INPUT', { path });
  const parsed = parseDecimal(text(raw));
  if (!parsed.ok) return err('CIVIL_INVALID_NUMBER', { path });
  if (compare(parsed.value, '0') <= 0) return err('CIVIL_QUANTITY_NOT_POSITIVE', { path });
  if (parsed.value.includes('.')) return err('CIVIL_QUANTITY_NOT_WHOLE', { path });
  if (compare(parsed.value, max) > 0) {
    return err('CIVIL_QUANTITY_TOO_LARGE', { path, details: { max: '1,000,000' } });
  }
  return ok(parsed.value);
}

/** A required percentage in [min, max], with at most `maxDecimals` decimal places. */
export function readPercent(
  raw: Raw,
  path: string,
  range: { min: string; max: string; maxDecimals: number; rangeCode: string },
): Result<string> {
  if (raw === undefined || text(raw).trim() === '') return err('CIVIL_MISSING_INPUT', { path });
  const parsed = parseDecimal(text(raw), { maxDecimals: range.maxDecimals });
  if (!parsed.ok) {
    return parsed.code === 'TOO_MANY_DECIMALS'
      ? err('CIVIL_TOO_MANY_DECIMALS', { path, details: { max: range.maxDecimals } })
      : err('CIVIL_INVALID_NUMBER', { path });
  }
  const outside = compare(parsed.value, range.min) < 0 || compare(parsed.value, range.max) > 0;
  if (outside) return err(range.rangeCode, { path });
  return ok(parsed.value);
}

/** An optional measurement: blank means "not supplied" (`null`); otherwise it must be > 0. */
export function readOptionalPositive(
  raw: Raw,
  path: string,
  maxDecimals: number,
): Result<string | null> {
  if (raw === undefined || text(raw).trim() === '') return ok(null);
  return readPositive(raw, path, maxDecimals);
}

/** A required whole number in [1, max]; anything else returns `rangeCode` (with `max` in details). */
export function readWholeInRange(
  raw: Raw,
  path: string,
  range: { max: string; rangeCode: string },
): Result<string> {
  if (raw === undefined || text(raw).trim() === '') return err('CIVIL_MISSING_INPUT', { path });
  const parsed = parseDecimal(text(raw));
  if (!parsed.ok) return err('CIVIL_INVALID_NUMBER', { path });
  const whole = !parsed.value.includes('.');
  const inRange = compare(parsed.value, '1') >= 0 && compare(parsed.value, range.max) <= 0;
  if (!whole || !inRange) return err(range.rangeCode, { path, details: { max: range.max } });
  return ok(parsed.value);
}
