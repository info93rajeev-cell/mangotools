import Big from 'big.js';

/**
 * Decimal arithmetic for money and percentages. Values cross this boundary as plain decimal
 * strings ("1180.00", "-2.5"); big.js objects never leave this module.
 */

export type RoundingMode = 'half-up' | 'half-even';

/** Isolated big.js constructor so global configuration is never shared. */
const D = Big();
D.DP = 20; // decimal places kept by division before explicit rounding
D.RM = Big.roundHalfUp;
D.NE = -40;
D.PE = 60;

const MODE: Record<RoundingMode, Big.RoundingMode> = {
  'half-up': Big.roundHalfUp, // halves round away from zero (commercial rounding)
  'half-even': Big.roundHalfEven,
};

export type ParseResult =
  | { ok: true; value: string; decimals: number }
  | { ok: false; code: 'NOT_A_NUMBER' | 'TOO_MANY_DECIMALS' };

const DECIMAL_PATTERN = /^-?(?:\d+(?:\.\d*)?|\.\d+)$/;

/** Parses user text such as "1000", "1000.50", "-2.5" or ".5". Rejects exponents, commas and spaces. */
export function parseDecimal(text: string, options: { maxDecimals?: number } = {}): ParseResult {
  const trimmed = text.trim();
  if (!DECIMAL_PATTERN.test(trimmed)) return { ok: false, code: 'NOT_A_NUMBER' };
  const fraction = trimmed.split('.')[1] ?? '';
  if (options.maxDecimals !== undefined && fraction.length > options.maxDecimals) {
    return { ok: false, code: 'TOO_MANY_DECIMALS' };
  }
  const normalised = trimmed.endsWith('.') ? trimmed.slice(0, -1) : trimmed;
  return { ok: true, value: new D(normalised).toFixed(), decimals: fraction.length };
}

export function add(a: string, b: string): string {
  return new D(a).plus(b).toFixed();
}

export function sub(a: string, b: string): string {
  return new D(a).minus(b).toFixed();
}

export function mul(a: string, b: string): string {
  return new D(a).times(b).toFixed();
}

/** Division kept to `scale` decimal places (half-up) before any presentation rounding. */
export function div(a: string, b: string, scale = 20): string {
  if (new D(b).eq(0)) throw new RangeError('Division by zero');
  return new D(a).div(b).round(scale, Big.roundHalfUp).toFixed();
}

export function round(value: string, decimals: number, mode: RoundingMode = 'half-up'): string {
  return new D(value).round(decimals, MODE[mode]).toFixed();
}

/** Rounds and always prints exactly `decimals` digits after the point ("90" → "90.00"). */
export function toFixedString(
  value: string,
  decimals: number,
  mode: RoundingMode = 'half-up',
): string {
  const fixed = new D(value).toFixed(decimals, MODE[mode]);
  return fixed === `-${(0).toFixed(decimals)}` ? (0).toFixed(decimals) : fixed;
}

export function compare(a: string, b: string): -1 | 0 | 1 {
  return new D(a).cmp(b) as -1 | 0 | 1;
}

export function isZero(value: string): boolean {
  return new D(value).eq(0);
}

export function isNegative(value: string): boolean {
  return new D(value).lt(0);
}
