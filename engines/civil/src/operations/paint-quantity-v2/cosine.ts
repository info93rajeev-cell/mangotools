import { add, div, mul, sub } from '@mangotools/engine-numeric';
import { PI } from '../../lib/units-v2.ts';

const INTERNAL_SCALE = 20;
const SERIES_TERMS = 16;

/** Cosine of a decimal degree angle in [0, 89], kept as decimal strings throughout. */
export function cosineDegrees(degrees: string): string {
  const radians = div(mul(degrees, PI), '180', INTERNAL_SCALE);
  const squared = mul(radians, radians);
  let term = '1';
  let total = '1';
  for (let index = 1; index <= SERIES_TERMS; index += 1) {
    const denominator = String((2 * index - 1) * (2 * index));
    term = div(mul(term, squared), denominator, INTERNAL_SCALE);
    total = index % 2 === 1 ? sub(total, term) : add(total, term);
  }
  return total;
}
