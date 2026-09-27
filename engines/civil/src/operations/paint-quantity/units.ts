/** Supported dimension units. All dimensions share the same unit selector in v1. */
export const lengthUnits = ['mm', 'cm', 'm', 'in', 'ft'] as const;
export type LengthUnit = (typeof lengthUnits)[number];

/**
 * One input unit in metres, as an exact decimal string: 1 mm = 0.001 m, 1 cm = 0.01 m, 1 in = 0.0254 m
 * and 1 ft = 0.3048 m (both international, 1959). Used only for the soft unrealistic-dimension
 * sanity check below — the area/coverage/litres math itself stays entirely in the selected unit's own
 * squared form (see compute.ts), since coverage per litre is defined in that same unit.
 */
export const METRES_PER_UNIT: Readonly<Record<LengthUnit, string>> = {
  mm: '0.001',
  cm: '0.01',
  m: '1',
  in: '0.0254',
  ft: '0.3048',
};

/** Decimal places allowed in a surface dimension, opening area or coverage figure. */
export const DIMENSION_DECIMALS = 3;

/** Largest number of identical surfaces accepted. */
export const MAX_QUANTITY = '1000000';

/** Largest number of coats accepted (a higher figure signals a mistake, not a real paint job). */
export const MAX_COATS = '20';

/** Wastage percentage range: 0 (no wastage) to 50 (an implausibly high rate signals a mistake). */
export const WASTAGE_MIN = '0';
export const WASTAGE_MAX = '50';
export const WASTAGE_DECIMALS = 2;

/**
 * Soft sanity ceiling per surface dimension, in metres, once converted from the input unit. Flags
 * likely unit-confusion mistakes (e.g. typing metres when centimetres were meant) with a warning, not
 * a hard error.
 */
export const MAX_REALISTIC_DIMENSION_M = '100';
