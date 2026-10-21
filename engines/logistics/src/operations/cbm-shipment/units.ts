import type { dimensionUnits, weightUnits } from './schema.ts';

/** SI prefixes and international yard/pound agreement (1959), exact decimal factors. */
export const METRES: Readonly<Record<(typeof dimensionUnits)[number], string>> = {
  mm: '0.001',
  cm: '0.01',
  m: '1',
  in: '0.0254',
  ft: '0.3048',
};
export const KILOGRAMS: Readonly<Record<(typeof weightUnits)[number], string>> = {
  kg: '1',
  g: '0.001',
  lb: '0.45359237',
};
export { CUBIC_FEET_PER_CUBIC_METRE } from '../cbm-compute/units.ts';
