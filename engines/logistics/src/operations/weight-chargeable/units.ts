import { lengthUnits } from '../cbm-compute/units.ts';

export type { LengthUnit } from '../cbm-compute/units.ts';
export { lengthUnits };

/** Supported units for the actual weight of one package. */
export const weightUnits = ['kg', 'g', 'lb'] as const;
export type WeightUnit = (typeof weightUnits)[number];

/**
 * Exact cubic centimetres in one cubed unit, as decimal strings: 1 m = 100 cm, 1 mm = 0.1 cm,
 * 1 in = 2.54 cm (international inch), so 1 in³ = 16.387064 cm³.
 */
export const CUBIC_CM_PER_CUBED_UNIT = {
  m: '1000000',
  cm: '1',
  mm: '0.001',
  in: '16.387064',
} as const;

/** Exact kilograms in one weight unit: 1 lb = 0.45359237 kg (international pound, 1959). */
export const KG_PER_WEIGHT_UNIT: Readonly<Record<WeightUnit, string>> = {
  kg: '1',
  g: '0.001',
  lb: '0.45359237',
};

/** The divisor is cm³ per kg and must be a whole number in this range. */
export const DIVISOR_MIN = '1000';
export const DIVISOR_MAX = '10000';

/** Largest actual weight of one package, in kg after conversion. */
export const MAX_WEIGHT_KG = '100000';

/** Decimal places allowed in a dimension or an actual weight. */
export const INPUT_DECIMALS = 3;
