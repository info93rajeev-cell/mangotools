import { err, ok, type Result } from '@mangotools/core';
import { compare, isNegative, isZero, parseDecimal } from '@mangotools/engine-numeric';
import type { RateBasis } from './freight-cost.ts';

/** Most containers one estimate may price. */
export const MAX_CONTAINER_COUNT = '10000';
/** Most pallets one estimate may price. */
export const MAX_PALLET_COUNT = '100000';
/** Most kilograms one estimate may price. */
export const MAX_KG = '100000000';
/** Most cubic metres one estimate may price. */
export const MAX_CBM = '1000000';
/** Exact CBM handed over from another calculation may carry up to 12 decimal places. */
export const CBM_DECIMALS = 12;

type Raw = string | number | undefined;

const LIMITS: Record<RateBasis, { max: string; label: string; whole?: string }> = {
  'per-container': {
    max: MAX_CONTAINER_COUNT,
    label: '10,000',
    whole: 'LOGISTICS_CONTAINER_COUNT_NOT_WHOLE',
  },
  'per-pallet': {
    max: MAX_PALLET_COUNT,
    label: '100,000',
    whole: 'LOGISTICS_PALLET_COUNT_NOT_WHOLE',
  },
  'per-kg': { max: MAX_KG, label: '100,000,000' },
  'per-cbm': { max: MAX_CBM, label: '1,000,000' },
};

/**
 * The quantity a rate is multiplied by: a whole number of containers (1–10,000) for per-container,
 * a whole number of pallets (1–100,000) for per-pallet, a positive weight in kg (up to
 * 100,000,000) for per-kg, or a positive volume in m³ (up to 1,000,000) for per-cbm; at most 12
 * decimal places.
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
  const limit = LIMITS[basis];
  if (limit.whole && parsed.value.includes('.')) return err(limit.whole, { path });
  if (compare(parsed.value, limit.max) > 0) {
    return err('LOGISTICS_RATE_QUANTITY_TOO_LARGE', { path, details: { max: limit.label } });
  }
  return ok(parsed.value);
}
