import { DIMENSION_DECIMALS, lengthUnits, MAX_QUANTITY } from '../cbm-compute/units.ts';

export type { LengthUnit } from '../cbm-compute/units.ts';
export { DIMENSION_DECIMALS, lengthUnits, MAX_QUANTITY };

/** Exact centimetres in one unit: 1 m = 100 cm, 1 mm = 0.1 cm, 1 in = 2.54 cm (international inch). */
export const CM_PER_UNIT: Readonly<Record<(typeof lengthUnits)[number], string>> = {
  m: '100',
  cm: '1',
  mm: '0.1',
  in: '2.54',
};

/** Cubic centimetres to cubic metres (1 cm³ = 0.000001 m³), applied once dimensions are in cm. */
export const CM3_TO_M3 = '0.000001';

/** The usable-space percentage must be a whole number in this range. */
export const USABLE_PERCENT_MIN = '1';
export const USABLE_PERCENT_MAX = '100';
