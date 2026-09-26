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
