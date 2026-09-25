/** Supported length units. All three carton dimensions use the same unit. */
export const lengthUnits = ['cm', 'm', 'mm', 'in'] as const;
export type LengthUnit = (typeof lengthUnits)[number];

/**
 * Exact cubic-metre value of one cubed unit (the unit's metre factor, cubed). Decimal strings, so no
 * floating point is involved: 1 cm = 0.01 m, 1 mm = 0.001 m, 1 in = 0.0254 m (international inch).
 */
export const CUBIC_METRES_PER_CUBED_UNIT: Readonly<Record<LengthUnit, string>> = {
  m: '1',
  cm: '0.000001',
  mm: '0.000000001',
  in: '0.000016387064',
};

/** Cubic feet per cubic metre, as decided for Phase 1 (exact value 35.314666721…). */
export const CUBIC_FEET_PER_CUBIC_METRE = '35.3146667';

/** Largest number of cartons accepted. */
export const MAX_QUANTITY = '1000000';

/** Decimal places allowed in a carton dimension. */
export const DIMENSION_DECIMALS = 3;
