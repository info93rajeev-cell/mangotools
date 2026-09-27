/** Supported dimension units. Wall dimensions and brick dimensions each pick their own unit. */
export const lengthUnits = ['mm', 'cm', 'm', 'in', 'ft'] as const;
export type LengthUnit = (typeof lengthUnits)[number];

/**
 * One input unit in metres, as an exact decimal string: 1 mm = 0.001 m, 1 cm = 0.01 m, 1 in = 0.0254 m
 * and 1 ft = 0.3048 m (both international, 1959).
 */
export const METRES_PER_UNIT: Readonly<Record<LengthUnit, string>> = {
  mm: '0.001',
  cm: '0.01',
  m: '1',
  in: '0.0254',
  ft: '0.3048',
};

/** Cubic feet per cubic metre, as decided for Phase 1 (exact value 35.314666721…). */
export const CUBIC_FEET_PER_CUBIC_METRE = '35.3146667';

/** Square feet per square metre, as decided for Phase 1 (exact value 10.7639104167…). */
export const SQUARE_FEET_PER_SQUARE_METRE = '10.7639104';

/** Decimal places allowed in a wall or brick dimension. */
export const DIMENSION_DECIMALS = 3;

/** Largest number of walls accepted. */
export const MAX_QUANTITY = '1000000';

/** Wastage percentage range: 0 (no wastage) to 50 (an implausibly high rate signals a mistake). */
export const WASTAGE_MIN = '0';
export const WASTAGE_MAX = '50';
export const WASTAGE_DECIMALS = 2;

/**
 * Soft sanity ceiling per wall dimension, in metres, once converted from the input unit. Flags likely
 * unit-confusion mistakes (e.g. typing metres when centimetres were meant) with a warning, not a hard
 * error. Not applied to brick dimensions, which are always small.
 */
export const MAX_REALISTIC_DIMENSION_M = '100';
