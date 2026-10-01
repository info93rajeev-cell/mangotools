import type { UnitFamily } from '@mangotools/schemas';

/**
 * Exact unit factors (to each family's base unit) used to CONVERT a typed value when its unit
 * selector changes, so "5 m" becomes "16.404199 ft" rather than silently turning into "5 ft".
 * Option values match the civil presets' unit option values.
 */
const FACTORS: Readonly<Record<UnitFamily, Readonly<Record<string, number>>>> = {
  length: { mm: 0.001, cm: 0.01, m: 1, in: 0.0254, ft: 0.3048 },
  area: { m2: 1, ft2: 0.09290304 },
  volume: { l: 0.001, m3: 1, ft3: 0.028316846592, yd3: 0.764554857984 },
  coverage: { 'm2-per-l': 1, 'ft2-per-gal': 0.09290304 / 3.785411784 },
  liquid: { l: 1, gal: 3.785411784 },
};

/** Decimal places kept in a converted value (the civil engines accept up to 6). */
const CONVERTED_DECIMALS = 6;

const NUMBER = /^-?(?:\d+(?:\.\d*)?|\.\d+)$/;

/**
 * Converts typed text between two units of a family. Blank or non-numeric text, and unknown
 * units, are returned unchanged (the engine then explains any problem next to the field).
 */
export function convertUnitText(text: string, family: UnitFamily, from: string, to: string) {
  const trimmed = text.replace(/[\s,_]/g, '');
  const a = FACTORS[family][from];
  const b = FACTORS[family][to];
  if (from === to || a === undefined || b === undefined || !NUMBER.test(trimmed)) return text;
  const converted = (Number(trimmed) * a) / b;
  const fixed = converted.toFixed(CONVERTED_DECIMALS);
  const stripped = fixed.includes('.') ? fixed.replace(/0+$/, '').replace(/\.$/, '') : fixed;
  return stripped === '-0' ? '0' : stripped;
}
