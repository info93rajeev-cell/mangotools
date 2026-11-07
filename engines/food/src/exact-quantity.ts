/**
 * Exact quantities as fractions of big integers. Recipe scaling divides by servings (e.g. 50 ÷ 3),
 * which decimals cannot hold exactly, so all arithmetic stays rational and is turned into a decimal
 * string only for output.
 */
export interface Fraction {
  n: bigint;
  d: bigint;
}

const DECIMAL = /^(?:0|[1-9]\d*)(?:\.\d+)?$/;

function gcd(a: bigint, b: bigint): bigint {
  let x = a < 0n ? -a : a;
  let y = b;
  while (y !== 0n) [x, y] = [y, x % y];
  return x;
}

export function fraction(n: bigint, d = 1n): Fraction {
  const g = gcd(n, d) || 1n;
  return { n: n / g, d: d / g };
}

export const ZERO = fraction(0n);

/** Parses a plain non-negative decimal string; null when it is not one. */
export function parseQuantity(text: string): Fraction | null {
  if (!DECIMAL.test(text)) return null;
  const [whole = '0', part = ''] = text.split('.');
  return fraction(BigInt(whole + part), 10n ** BigInt(part.length));
}

export const mulF = (a: Fraction, b: Fraction): Fraction => fraction(a.n * b.n, a.d * b.d);
export const divF = (a: Fraction, b: Fraction): Fraction => fraction(a.n * b.d, a.d * b.n);
export const addF = (a: Fraction, b: Fraction): Fraction =>
  fraction(a.n * b.d + b.n * a.d, a.d * b.d);
export const subF = (a: Fraction, b: Fraction): Fraction =>
  fraction(a.n * b.d - b.n * a.d, a.d * b.d);
export const cmpF = (a: Fraction, b: Fraction): number => {
  const diff = a.n * b.d - b.n * a.d;
  return diff < 0n ? -1 : diff > 0n ? 1 : 0;
};
export const ceilF = (a: Fraction): Fraction => fraction((a.n + a.d - 1n) / a.d);

function trim(digits: string, scale: number): string {
  if (scale === 0) return digits;
  const padded = digits.padStart(scale + 1, '0');
  const text = `${padded.slice(0, -scale)}.${padded.slice(-scale)}`;
  return text.replace(/0+$/, '').replace(/\.$/, '');
}

/** True when the fraction has a finite decimal expansion (denominator of only 2s and 5s). */
function finiteScale(a: Fraction): number | null {
  let d = a.d;
  let twos = 0;
  let fives = 0;
  while (d % 2n === 0n) [d, twos] = [d / 2n, twos + 1];
  while (d % 5n === 0n) [d, fives] = [d / 5n, fives + 1];
  return d === 1n ? Math.max(twos, fives) : null;
}

/** Exact decimal when possible; otherwise rounded half-up to 3 decimals with `exact: false`. */
export function toDecimal(a: Fraction): { text: string; exact: boolean } {
  const scale = finiteScale(a);
  if (scale !== null)
    return { text: trim(((a.n * 10n ** BigInt(scale)) / a.d).toString(), scale), exact: true };
  const scaled = (a.n * 1000n * 2n + a.d) / (2n * a.d);
  return { text: trim(scaled.toString(), 3), exact: false };
}

/** Formats a fraction as currency decimal string with 2 decimal places (paise), rounded half-up. */
export function toMoneyDecimal(a: Fraction): string {
  if (a.n === 0n) return '0.00';
  const isNeg = a.n < 0n;
  const absN = isNeg ? -a.n : a.n;
  const scaled = (absN * 100n * 2n + a.d) / (2n * a.d);
  if (scaled === 0n) return '0.00';
  const str = scaled.toString().padStart(3, '0');
  const formatted = `${str.slice(0, -2)}.${str.slice(-2)}`;
  return isNeg ? `-${formatted}` : formatted;
}
