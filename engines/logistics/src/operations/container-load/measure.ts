import { compare, mul, round } from '@mangotools/engine-numeric';
import { CM_PER_SUB, KG_PER_NG, type LoadLengthUnit, NG_PER_KG, SUB_PER_UNIT } from './units.ts';

/** Nearest whole number of a non-negative decimal string, as an exact bigint. */
export function nearestInt(value: string): bigint {
  return BigInt(round(value, 0, 'half-up'));
}

/** Smallest whole number ≥ value, for a non-negative decimal string. */
export function ceilInt(value: string): bigint {
  const near = round(value, 0, 'half-up');
  return compare(near, value) < 0 ? BigInt(near) + 1n : BigInt(near);
}

/** Largest whole number ≤ value, for a non-negative decimal string. */
export function floorInt(value: string): bigint {
  const near = round(value, 0, 'half-up');
  return compare(near, value) > 0 ? BigInt(near) - 1n : BigInt(near);
}

/** A length in exact 0.1 µm sub-units (nearest). */
export function toSub(value: string, unit: LoadLengthUnit): bigint {
  return nearestInt(mul(value, SUB_PER_UNIT[unit]));
}

/** Exact centimetres for a sub-unit length, as a decimal string. */
export function subToCm(value: bigint): string {
  return mul(value.toString(), CM_PER_SUB);
}

/** A piece weight in nanograms, rounded up so a plan can never exceed a payload by rounding. */
export function itemWeightNg(kg: string): bigint {
  return ceilInt(mul(kg, NG_PER_KG));
}

/** A payload in nanograms, rounded down for the same reason. */
export function payloadNg(kg: string): bigint {
  return floorInt(mul(kg, NG_PER_KG));
}

/** Exact kilograms for a nanogram value. */
export function ngToKg(value: bigint): string {
  return mul(value.toString(), KG_PER_NG);
}
