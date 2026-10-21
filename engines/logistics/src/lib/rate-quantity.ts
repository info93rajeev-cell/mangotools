import { err, ok, type Result } from '@mangotools/core';
import { compare, isNegative, isZero, parseDecimal } from '@mangotools/engine-numeric';
import type { RateBasis } from './freight-cost.ts';

/** Most containers one estimate may price. */
export const MAX_CONTAINER_COUNT = '10000';
/** Most cubic metres one estimate may price. */
export const MAX_CBM = '1000000';
/** Exact CBM handed over from another calculation may carry up to 12 decimal places. */
export const CBM_DECIMALS = 12;

type Raw = string | number | undefined;

/**
 * The quantity a rate is multiplied by: a whole number of containers (1–10,000) for per-container,
 * or a positive volume in m³ (up to 1,000,000, at most 12 decimal places) for per-cbm.
 */
export function readRateQuantity(raw: Raw, basis: RateBasis, path: string): Result<string> {
  const text = raw === undefined ? '' : String(raw);
  if (text.trim() === '') return err('LOGISTICS_MISSING_INPUT', { path });
  const parsed = parseDecimal(text, { maxDecimals: CBM_DECIMALS });
  if (!parsed.ok) {
    return parsed.code === 'TOO_MANY_DECIMALS'
      ? err('LOGISTICS_TOO_MANY_DECIMALS', { path, details: { max: CBM_DECIMALS } })
      : err('LOGISTICS_INVALID_NUMBER', { path });
  }
  if (isNegative(parsed.value) || isZero(parsed.value)) {
    return err('LOGISTICS_RATE_QUANTITY_NOT_POSITIVE', { path });
  }
  if (basis === 'per-container') {
    if (parsed.value.includes('.')) return err('LOGISTICS_CONTAINER_COUNT_NOT_WHOLE', { path });
    if (compare(parsed.value, MAX_CONTAINER_COUNT) > 0) {
      return err('LOGISTICS_RATE_QUANTITY_TOO_LARGE', { path, details: { max: '10,000' } });
    }
    return ok(parsed.value);
  }
  if (compare(parsed.value, MAX_CBM) > 0) {
    return err('LOGISTICS_RATE_QUANTITY_TOO_LARGE', { path, details: { max: '1,000,000' } });
  }
  return ok(parsed.value);
}
