/** Presentation-only percentage, calculated with integers from exact decimal strings. */
function scaled(value: string, places: number): bigint {
  const [whole = '0', fraction = ''] = value.split('.');
  return BigInt(whole + fraction.padEnd(places, '0'));
}
export function volumeShare(part: string, total: string): string {
  const places = Math.max(part.split('.')[1]?.length ?? 0, total.split('.')[1]?.length ?? 0);
  const denominator = scaled(total, places);
  if (denominator === 0n) return '0.0';
  const numerator = scaled(part, places) * 1000n;
  const tenths = (numerator * 2n + denominator) / (denominator * 2n);
  return `${tenths / 10n}.${tenths % 10n}`;
}
