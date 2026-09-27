import { defineOperation, type OpWarning, ok, warning } from '@mangotools/core';
import { compare, mul, toFixedString } from '@mangotools/engine-numeric';
import { computeBrickwork } from './compute.ts';
import { measure } from './measure.ts';
import { buildOutput, workingSteps } from './output.ts';
import {
  brickworkQuantityInput,
  brickworkQuantityOutput,
  brickworkQuantityParams,
} from './schema.ts';
import type { Measured } from './types.ts';
import { MAX_REALISTIC_DIMENSION_M, METRES_PER_UNIT } from './units.ts';

/** Standing estimation-aid warnings shown on every result, regardless of input. */
function standingWarnings(): OpWarning[] {
  return [
    warning('CIVIL_ESTIMATION_AID_ONLY'),
    warning('CIVIL_VERIFY_BRICKWORK_BEFORE_CONSTRUCTION'),
    warning('CIVIL_BRICKWORK_CONDITIONS_VARY'),
    warning('CIVIL_NOT_PROFESSIONAL_REPLACEMENT_MASON'),
    warning('CIVIL_BRICKWORK_SCOPE_LIMIT'),
  ];
}

/** True when any wall dimension, converted to metres, exceeds the soft sanity ceiling. */
function hasUnrealisticWallDimension(m: Measured): boolean {
  const factor = METRES_PER_UNIT[m.unit];
  return [m.wallLength, m.wallHeight, m.wallThickness]
    .map((dimension) => mul(dimension, factor))
    .some((metres) => compare(metres, MAX_REALISTIC_DIMENSION_M) > 0);
}

export const brickworkQuantity = defineOperation({
  id: 'civil.brickwork.quantity',
  major: 1,
  title: 'Brickwork quantity (brick count)',
  summary:
    'Estimated brick count and brickwork volume for a rectangular wall, from wall and brick dimensions, openings, mortar joint and wastage %.',
  input: brickworkQuantityInput,
  params: brickworkQuantityParams,
  output: brickworkQuantityOutput,
  errors: [
    'CIVIL_MISSING_INPUT',
    'CIVIL_INVALID_NUMBER',
    'CIVIL_TOO_MANY_DECIMALS',
    'CIVIL_NOT_POSITIVE',
    'CIVIL_NOT_NEGATIVE',
    'CIVIL_QUANTITY_NOT_POSITIVE',
    'CIVIL_QUANTITY_NOT_WHOLE',
    'CIVIL_QUANTITY_TOO_LARGE',
    'CIVIL_WASTAGE_OUT_OF_RANGE',
    'CIVIL_OPENING_EXCEEDS_WALL_AREA',
  ],
  runtimes: ['worker', 'node'],
  cost: { weight: 'light' },
  exposure: 'internal',
  dataClass: 'public',
  run(input, params) {
    const measured = measure(input);
    if (!measured.ok) return measured;
    const computed = computeBrickwork(measured.value);
    if (!computed.ok) return computed;
    const shown = (value: string) => toFixedString(value, params.decimals, params.rounding);
    const working = workingSteps(measured.value, computed.value);
    const warnings = standingWarnings();
    if (hasUnrealisticWallDimension(measured.value)) {
      warnings.push(warning('CIVIL_DIMENSION_UNREALISTIC', { details: { max: '100' } }));
    }
    return ok(buildOutput(measured.value, computed.value, shown, working), warnings);
  },
});
