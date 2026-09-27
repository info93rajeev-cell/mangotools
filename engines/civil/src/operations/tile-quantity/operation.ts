import { defineOperation, type OpWarning, ok, warning } from '@mangotools/core';
import { compare, mul, toFixedString } from '@mangotools/engine-numeric';
import { computeTiles } from './compute.ts';
import { measure } from './measure.ts';
import { buildOutput, workingSteps } from './output.ts';
import { tileQuantityInput, tileQuantityOutput, tileQuantityParams } from './schema.ts';
import type { Measured } from './types.ts';
import { MAX_REALISTIC_DIMENSION_M, METRES_PER_UNIT } from './units.ts';

/** Standing estimation-aid warnings shown on every result, regardless of input. */
function standingWarnings(): OpWarning[] {
  return [
    warning('CIVIL_ESTIMATION_AID_ONLY'),
    warning('CIVIL_VERIFY_TILE_BEFORE_INSTALLATION'),
    warning('CIVIL_TILE_CONDITIONS_VARY'),
    warning('CIVIL_NOT_PROFESSIONAL_REPLACEMENT_MASON'),
    warning('CIVIL_TILE_SCOPE_LIMIT'),
  ];
}

/** True when either surface dimension, converted to metres, exceeds the soft sanity ceiling. */
function hasUnrealisticDimension(m: Measured): boolean {
  const factor = METRES_PER_UNIT[m.unit];
  return [m.surfaceLength, m.surfaceWidth]
    .map((dimension) => mul(dimension, factor))
    .some((metres) => compare(metres, MAX_REALISTIC_DIMENSION_M) > 0);
}

export const tileQuantity = defineOperation({
  id: 'civil.tile.quantity',
  major: 1,
  title: 'Tile / flooring quantity',
  summary:
    'Estimated tile count for a rectangular floor or wall, with wastage allowance and optional boxes required.',
  input: tileQuantityInput,
  params: tileQuantityParams,
  output: tileQuantityOutput,
  errors: [
    'CIVIL_MISSING_INPUT',
    'CIVIL_INVALID_NUMBER',
    'CIVIL_TOO_MANY_DECIMALS',
    'CIVIL_NOT_POSITIVE',
    'CIVIL_QUANTITY_NOT_POSITIVE',
    'CIVIL_QUANTITY_NOT_WHOLE',
    'CIVIL_QUANTITY_TOO_LARGE',
    'CIVIL_WASTAGE_OUT_OF_RANGE',
    'CIVIL_TILES_PER_BOX_NOT_POSITIVE',
    'CIVIL_TILES_PER_BOX_NOT_WHOLE',
    'CIVIL_TILES_PER_BOX_TOO_LARGE',
  ],
  runtimes: ['worker', 'node'],
  cost: { weight: 'light' },
  exposure: 'internal',
  dataClass: 'public',
  run(input, params) {
    const measured = measure(input);
    if (!measured.ok) return measured;
    const computed = computeTiles(measured.value);
    if (!computed.ok) return computed;
    const shown = (value: string) => toFixedString(value, params.decimals, params.rounding);
    const working = workingSteps(measured.value, computed.value);
    const warnings = standingWarnings();
    if (hasUnrealisticDimension(measured.value)) {
      warnings.push(warning('CIVIL_DIMENSION_UNREALISTIC', { details: { max: '100' } }));
    }
    return ok(buildOutput(measured.value, computed.value, shown, working), warnings);
  },
});
