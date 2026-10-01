import { add, compare, div, mul } from '@mangotools/engine-numeric';
import {
  CUBIC_METRES_PER_CUBIC_FOOT,
  CUBIC_METRES_PER_CUBIC_YARD,
  type LengthUnit,
  MAX_REALISTIC_DIMENSION_M,
  METRES_PER_UNIT,
  SQUARE_METRES_PER_SQUARE_FOOT,
} from './units-v2.ts';

/** Exact square feet for square metres. */
export const toFt2 = (m2: string): string => div(m2, SQUARE_METRES_PER_SQUARE_FOOT, 20);
/** Exact cubic feet for cubic metres. */
export const toFt3 = (m3: string): string => div(m3, CUBIC_METRES_PER_CUBIC_FOOT, 20);
/** Exact cubic yards for cubic metres. */
export const toYd3 = (m3: string): string => div(m3, CUBIC_METRES_PER_CUBIC_YARD, 20);

/** A length in metres. */
export const inMetres = (value: string, unit: LengthUnit): string =>
  mul(value, METRES_PER_UNIT[unit]);

/** An area entered in a unit's own squared form, in m². */
export const areaInM2 = (value: string, unit: LengthUnit): string =>
  mul(value, mul(METRES_PER_UNIT[unit], METRES_PER_UNIT[unit]));

/** `base × (1 + percent / 100)`, exact. */
export const withAllowance = (base: string, percent: string): string =>
  mul(base, div(add('100', percent), '100', 20));

/** True when any of the dimensions, in metres, exceeds the soft sanity ceiling. */
export function anyUnrealistic(dimensions: readonly string[], unit: LengthUnit): boolean {
  return dimensions.some((d) => compare(inMetres(d, unit), MAX_REALISTIC_DIMENSION_M) > 0);
}

/**
 * `numerator ÷ denominator × (1 + percent / 100)` as ONE division, so a purchase quantity that is
 * exactly whole stays exactly whole before it is rounded up (no intermediate rounding can push it
 * over a whole number).
 */
export const ratioWithAllowance = (numerator: string, denominator: string, percent: string) =>
  div(mul(numerator, add('100', percent)), mul(denominator, '100'), 20);
