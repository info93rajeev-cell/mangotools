/** Supported dimension units. All three excavation dimensions use the same unit. */
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

/** Exact cubic-metre value of one cubed unit (the unit's metre factor, cubed). */
export const CUBIC_METRES_PER_CUBED_UNIT: Readonly<Record<LengthUnit, string>> = {
  mm: '0.000000001',
  cm: '0.000001',
  m: '1',
  in: '0.000016387064',
  ft: '0.028316846592',
};

/** Cubic feet per cubic metre, as decided for Phase 1 (exact value 35.314666721…). */
export const CUBIC_FEET_PER_CUBIC_METRE = '35.3146667';

/** Decimal places allowed in an excavation dimension. */
export const DIMENSION_DECIMALS = 3;

/** Largest number of pits/trenches accepted. */
export const MAX_QUANTITY = '1000000';

/** Bulking/swell percentage range: 0 (no bulking) to 50 (an implausibly high rate signals a mistake). */
export const BULKING_MIN = '0';
export const BULKING_MAX = '50';
export const BULKING_DECIMALS = 2;

/**
 * Soft sanity ceiling per dimension, in metres, once converted from the input unit. Flags likely
 * unit-confusion mistakes (e.g. typing metres when centimetres were meant) with a warning, not a hard
 * error — a real excavation this large is implausible but not impossible to describe.
 */
export const MAX_REALISTIC_DIMENSION_M = '100';
