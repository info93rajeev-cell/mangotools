/**
 * Display formatting for decimal strings produced by engines. Pure string operations: values are
 * never converted to floating point, so what is shown is exactly what the engine returned.
 */

export type Grouping = 'indian' | 'international' | 'none';
export type Currency = 'INR';
export type ValueFormat = 'text' | 'money' | 'percent' | 'number' | 'code';

export interface FormatOptions {
  currency?: Currency | undefined;
}

const DECIMAL = /^(-?)(\d*)(?:\.(\d*))?$/;
const MINUS = '−';

/** 1234567 → 12,34,567 (lakh/crore grouping). */
export function groupIndian(digits: string): string {
  if (digits.length <= 3) return digits;
  const last3 = digits.slice(-3);
  const rest = digits.slice(0, -3);
  return `${rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',')},${last3}`;
}

/** 1234567 → 1,234,567. */
export function groupInternational(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Groups the integer part and pads (never rounds) the fraction to `minDecimals`.
 * Returns the input unchanged if it is not a plain decimal.
 */
export function formatDecimal(value: string, grouping: Grouping, minDecimals = 0): string {
  const match = DECIMAL.exec(value.trim());
  if (!match) return value;
  const [, sign = '', intRaw = '', fracRaw = ''] = match;
  const int = intRaw.replace(/^0+(?=\d)/, '') || '0';
  const grouped =
    grouping === 'indian'
      ? groupIndian(int)
      : grouping === 'international'
        ? groupInternational(int)
        : int;
  const frac = fracRaw.padEnd(minDecimals, '0');
  const isZero = /^0*$/.test(int + frac);
  const prefix = sign && !isZero ? MINUS : '';
  return `${prefix}${grouped}${frac ? `.${frac}` : ''}`;
}

export function formatMoney(value: string, options: FormatOptions = {}): string {
  if (options.currency === 'INR') {
    const text = formatDecimal(value, 'indian', 2);
    return text.startsWith(MINUS) ? `${MINUS}₹${text.slice(1)}` : `₹${text}`;
  }
  return formatDecimal(value, 'international', 2);
}

export function formatPercent(value: string): string {
  const text = formatDecimal(value, 'international');
  return DECIMAL.test(value.trim()) ? `${text}%` : value;
}

/** Formats a value by its preset output format. Text and code are shown as they are. */
export function formatValue(
  format: ValueFormat,
  value: string,
  options: FormatOptions = {},
): string {
  switch (format) {
    case 'money':
      return formatMoney(value, options);
    case 'percent':
      return formatPercent(value);
    case 'number':
      return formatDecimal(value, 'international');
    default:
      return value;
  }
}

/** Human-readable byte size: 1 536 → "1.5 KB". Uses integer arithmetic on bytes. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${value >= 10 ? Math.round(value) : Math.round(value * 10) / 10} ${units[unit]}`;
}
