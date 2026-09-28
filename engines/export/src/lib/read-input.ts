import { err, ok, type Result } from '@mangotools/core';
import { compare, parseDecimal } from '@mangotools/engine-numeric';

type Raw = string | number | undefined;

const text = (raw: string | number) => (typeof raw === 'number' ? String(raw) : raw).trim();

/** A required line of text, 1..maxLen characters after trimming. */
export function readRequiredText(raw: Raw, path: string, maxLen: number): Result<string> {
  if (raw === undefined || text(raw) === '') return err('EXPORT_MISSING_INPUT', { path });
  const value = text(raw);
  if (value.length > maxLen) return err('EXPORT_TEXT_TOO_LONG', { path, details: { max: maxLen } });
  return ok(value);
}

/** An optional line of text, up to maxLen characters; blank becomes null. */
export function readOptionalText(raw: Raw, path: string, maxLen: number): Result<string | null> {
  if (raw === undefined || text(raw) === '') return ok(null);
  const value = text(raw);
  if (value.length > maxLen) return err('EXPORT_TEXT_TOO_LONG', { path, details: { max: maxLen } });
  return ok(value);
}

/** A required measurement greater than zero, with at most `maxDecimals` decimal places. */
export function readPositive(raw: Raw, path: string, maxDecimals: number): Result<string> {
  if (raw === undefined || text(raw) === '') return err('EXPORT_MISSING_INPUT', { path });
  const parsed = parseDecimal(text(raw), { maxDecimals });
  if (!parsed.ok) {
    return parsed.code === 'TOO_MANY_DECIMALS'
      ? err('EXPORT_TOO_MANY_DECIMALS', { path, details: { max: maxDecimals } })
      : err('EXPORT_INVALID_NUMBER', { path });
  }
  if (compare(parsed.value, '0') <= 0) return err('EXPORT_NOT_POSITIVE', { path });
  return ok(parsed.value);
}

/** An optional measurement that may be zero, with at most `maxDecimals` decimal places. */
export function readOptionalNonNegative(
  raw: Raw,
  path: string,
  maxDecimals: number,
): Result<string | null> {
  if (raw === undefined || text(raw) === '') return ok(null);
  const parsed = parseDecimal(text(raw), { maxDecimals });
  if (!parsed.ok) {
    return parsed.code === 'TOO_MANY_DECIMALS'
      ? err('EXPORT_TOO_MANY_DECIMALS', { path, details: { max: maxDecimals } })
      : err('EXPORT_INVALID_NUMBER', { path });
  }
  if (compare(parsed.value, '0') < 0) return err('EXPORT_NOT_NEGATIVE', { path });
  return ok(parsed.value);
}

/** An optional whole number greater than zero (a count). */
export function readOptionalPositiveInt(raw: Raw, path: string): Result<string | null> {
  if (raw === undefined || text(raw) === '') return ok(null);
  const parsed = parseDecimal(text(raw));
  if (!parsed.ok) return err('EXPORT_INVALID_NUMBER', { path });
  if (compare(parsed.value, '0') <= 0) return err('EXPORT_NOT_POSITIVE', { path });
  if (parsed.value.includes('.')) return err('EXPORT_NOT_WHOLE', { path });
  return ok(parsed.value);
}

const DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * A required calendar date in YYYY-MM-DD form. Uses the numeric `Date.UTC` constructor purely as a
 * deterministic calendar-arithmetic check on the given digits (never the current time), matching the
 * pattern already used by `engines/data`'s timestamp-convert operation: day-of-month validity is
 * confirmed by checking the constructed date didn't roll over, so 2026-02-30 is rejected outright.
 */
export function readDate(raw: Raw, path: string): Result<string> {
  if (raw === undefined || text(raw) === '') return err('EXPORT_MISSING_INPUT', { path });
  const value = text(raw);
  const m = DATE.exec(value);
  if (!m) return err('EXPORT_INVALID_DATE', { path });
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (month < 1 || month > 12) return err('EXPORT_INVALID_DATE', { path });
  const constructed = new Date(Date.UTC(year, month - 1, day));
  const rolledOver = constructed.getUTCDate() !== day || constructed.getUTCMonth() !== month - 1;
  if (rolledOver) return err('EXPORT_INVALID_DATE', { path });
  return ok(value);
}

const GSTIN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

/**
 * An optional GSTIN (not every exporter is GST-registered), checked against the standard 15-character
 * format only when given.
 */
export function readOptionalGstin(raw: Raw, path: string): Result<string | null> {
  if (raw === undefined || text(raw) === '') return ok(null);
  const value = text(raw).toUpperCase();
  if (!GSTIN.test(value)) return err('EXPORT_GSTIN_INVALID_FORMAT', { path });
  return ok(value);
}

const HSN = /^\d{4}(\d{2}(\d{2})?)?$/;

/** A required HSN code: numeric, 4, 6 or 8 digits (the three standard GST HSN lengths). */
export function readHsn(raw: Raw, path: string): Result<string> {
  if (raw === undefined || text(raw) === '') return err('EXPORT_MISSING_INPUT', { path });
  const value = text(raw);
  if (!HSN.test(value)) return err('EXPORT_HSN_INVALID_FORMAT', { path });
  return ok(value);
}
