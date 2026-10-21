import { weightUnits } from '../weight-chargeable/units.ts';

export { weightUnits };
export type WeightUnit = (typeof weightUnits)[number];

/** Length units a package, custom container or stack-height limit may use. */
export const loadLengthUnits = ['mm', 'cm', 'm', 'in', 'ft'] as const;
export type LoadLengthUnit = (typeof loadLengthUnits)[number];

/**
 * Placement runs in exact integers of 0.1 µm ("sub-units"), so every value entered with up to three
 * decimal places in any supported unit is represented exactly (1 in = 254,000; 1 ft = 3,048,000).
 * Values with more decimals (from the shared unit converter) are rounded to the nearest 0.1 µm.
 */
export const SUB_PER_UNIT: Readonly<Record<LoadLengthUnit, string>> = {
  mm: '10000',
  cm: '100000',
  m: '10000000',
  in: '254000',
  ft: '3048000',
};

/** Centimetres per sub-unit and cubic metres per cubed sub-unit (1 sub-unit = 1e-7 m). */
export const CM_PER_SUB = '0.00001';

/** Exact metres in one unit, for volumes computed from the dimensions as entered. */
export const M_PER_UNIT: Readonly<Record<LoadLengthUnit, string>> = {
  mm: '0.001',
  cm: '0.01',
  m: '1',
  in: '0.0254',
  ft: '0.3048',
};

/** Exact kilograms in one weight unit (1 lb = 0.45359237 kg, international pound). */
export const KG_PER_WEIGHT_UNIT: Readonly<Record<WeightUnit, string>> = {
  kg: '1',
  g: '0.001',
  lb: '0.45359237',
};

/**
 * Weights are compared in exact integers of nanograms (1 kg = 10^12 ng), so a pound value with up to
 * three decimals is exact. Item weights round up and payloads round down when finer values arrive, so a
 * plan never exceeds a payload because of rounding.
 */
export const NG_PER_KG = '1000000000000';
export const KG_PER_NG = '0.000000000001';

/** Converted values from the shared unit converter keep up to 12 decimal places. */
export const INPUT_DECIMALS = 12;

export const MAX_PACKAGE_ROWS = 50;
export const MAX_PIECES_PER_PACKAGE = '100000';
export const MAX_TOTAL_PIECES = 250000;
export const MAX_ITEM_WEIGHT_KG = '100000';
export const MAX_PAYLOAD_KG = '1000000';
/** Planning limits that keep one calculation fast and bounded on any device. */
export const MAX_CONTAINERS = 20;
export const MAX_BLOCKS = 5000;
export const MAX_DESCRIPTION_LENGTH = 120;
