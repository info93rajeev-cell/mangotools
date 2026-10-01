import type { UnitFamily } from '@mangotools/schemas';

/**
 * Exact unit factors (to each family's base unit) used to CONVERT a typed value when its unit
 * selector changes, so "5 m" becomes "16.404199475066 ft" rather than silently becoming "5 ft".
 * Option values match the civil presets' unit option values.
 */
interface Factor {
  numerator: string;
  denominator?: string;
}

const factor = (numerator: string, denominator?: string): Factor => ({ numerator, denominator });

const FACTORS: Readonly<Record<UnitFamily, Readonly<Record<string, Factor>>>> = {
  length: {
    mm: factor('0.001'),
    cm: factor('0.01'),
    m: factor('1'),
    in: factor('0.0254'),
    ft: factor('0.3048'),
  },
  area: {
    mm: factor('0.000001'),
    cm: factor('0.0001'),
    m: factor('1'),
    in: factor('0.00064516'),
    ft: factor('0.09290304'),
    m2: factor('1'),
    ft2: factor('0.09290304'),
  },
  volume: {
    l: factor('0.001'),
    m3: factor('1'),
    ft3: factor('0.028316846592'),
    yd3: factor('0.764554857984'),
  },
  coverage: {
    'm2-per-l': factor('1'),
    'ft2-per-gal': factor('0.09290304', '3.785411784'),
  },
  liquid: { l: factor('1'), gal: factor('3.785411784') },
};

/** Enough precision for small measurements without displaying binary floating-point drift. */
const CONVERTED_DECIMALS = 12;

const NUMBER = /^-?(?:\d+(?:\.\d*)?|\.\d+)$/;

interface Rational {
  numerator: bigint;
  denominator: bigint;
}

const powerOfTen = (places: number) => 10n ** BigInt(places);

function decimalRational(text: string): Rational {
  const negative = text.startsWith('-');
  const unsigned = negative ? text.slice(1) : text;
  const [whole = '0', fraction = ''] = unsigned.split('.');
  const numerator = BigInt(`${whole || '0'}${fraction}` || '0');
  return {
    numerator: negative ? -numerator : numerator,
    denominator: powerOfTen(fraction.length),
  };
}

function factorRational(value: Factor): Rational {
  const top = decimalRational(value.numerator);
  const bottom = decimalRational(value.denominator ?? '1');
  return {
    numerator: top.numerator * bottom.denominator,
    denominator: top.denominator * bottom.numerator,
  };
}

function formatRatio(numerator: bigint, denominator: bigint): string {
  const negative = numerator < 0n;
  const magnitude = negative ? -numerator : numerator;
  const scale = powerOfTen(CONVERTED_DECIMALS);
  const scaled = magnitude * scale;
  const quotient = scaled / denominator;
  const remainder = scaled % denominator;
  const rounded = remainder * 2n >= denominator ? quotient + 1n : quotient;
  const digits = rounded.toString().padStart(CONVERTED_DECIMALS + 1, '0');
  const whole = digits.slice(0, -CONVERTED_DECIMALS);
  const fraction = digits.slice(-CONVERTED_DECIMALS).replace(/0+$/, '');
  const value = fraction ? `${whole}.${fraction}` : whole;
  return negative && value !== '0' ? `-${value}` : value;
}

/**
 * Converts typed text between two units of a family. Blank or non-numeric text, and unknown
 * units, are returned unchanged (the engine then explains any problem next to the field).
 */
export function convertUnitText(text: string, family: UnitFamily, from: string, to: string) {
  const trimmed = text.replace(/[\s,_]/g, '');
  const a = FACTORS[family][from];
  const b = FACTORS[family][to];
  if (from === to || a === undefined || b === undefined || !NUMBER.test(trimmed)) return text;
  const input = decimalRational(trimmed);
  const fromFactor = factorRational(a);
  const toFactor = factorRational(b);
  return formatRatio(
    input.numerator * fromFactor.numerator * toFactor.denominator,
    input.denominator * fromFactor.denominator * toFactor.numerator,
  );
}
