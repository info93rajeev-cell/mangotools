import { err, ok, type Result } from '@mangotools/core';
import { compare, isNegative, isZero, parseDecimal } from '@mangotools/engine-numeric';
import type { FreightTerms } from './freight-cost.ts';

/** Money inputs (rate, minimum and other charges) use the currency's two minor-unit decimals. */
export const MONEY_DECIMALS = 2;
/** A sanity cap on any one money input: one trillion in the selected currency. */
export const MAX_MONEY = '1000000000000';

type Raw = string | number | undefined;

const text = (raw: Raw) => (raw === undefined ? '' : typeof raw === 'number' ? String(raw) : raw);

/** A money amount; `positive` rejects zero as well as negative values. Empty → null. */
function readAmount(raw: Raw, path: string, positive: boolean): Result<string | null> {
  if (text(raw).trim() === '') return ok(null);
  const parsed = parseDecimal(text(raw), { maxDecimals: MONEY_DECIMALS });
  if (!parsed.ok) {
    return parsed.code === 'TOO_MANY_DECIMALS'
      ? err('LOGISTICS_TOO_MANY_DECIMALS', { path, details: { max: MONEY_DECIMALS } })
      : err('LOGISTICS_INVALID_NUMBER', { path });
  }
  if (positive && (isNegative(parsed.value) || isZero(parsed.value))) {
    return err('LOGISTICS_NOT_POSITIVE', { path });
  }
  if (isNegative(parsed.value)) return err('LOGISTICS_AMOUNT_NEGATIVE', { path });
  if (compare(parsed.value, MAX_MONEY) > 0) {
    return err('LOGISTICS_AMOUNT_TOO_LARGE', { path, details: { max: '1,000,000,000,000' } });
  }
  return ok(parsed.value);
}

export interface RawFreightTerms {
  rate?: Raw;
  minimumCharge?: Raw;
  otherCharges?: Raw;
}

/** Field paths for the three money inputs, so each tool can name its own fields. */
export interface FreightTermPaths {
  rate: string;
  minimumCharge: string;
  otherCharges: string;
}

/** Validates the rate (required, > 0), minimum charge and other charges (optional, ≥ 0). */
export function readFreightTerms(
  raw: RawFreightTerms,
  paths: FreightTermPaths,
): Result<FreightTerms> {
  const rate = readAmount(raw.rate, paths.rate, true);
  if (!rate.ok) return rate;
  if (rate.value === null) return err('LOGISTICS_MISSING_INPUT', { path: paths.rate });
  const minimumCharge = readAmount(raw.minimumCharge, paths.minimumCharge, false);
  if (!minimumCharge.ok) return minimumCharge;
  const otherCharges = readAmount(raw.otherCharges, paths.otherCharges, false);
  if (!otherCharges.ok) return otherCharges;
  return ok({
    rate: rate.value,
    minimumCharge: minimumCharge.value,
    otherCharges: otherCharges.value,
  });
}
