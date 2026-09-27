import { defineOperation, type OpWarning, ok, type WorkingStep, warning } from '@mangotools/core';
import { add, compare, mul, toFixedString } from '@mangotools/engine-numeric';
import { readCount, readPercent, readPositive } from '../../lib/read-input.ts';
import {
  type ExcavationVolumeInput,
  excavationVolumeInput,
  excavationVolumeOutput,
  excavationVolumeParams,
} from './schema.ts';
import {
  BULKING_DECIMALS,
  BULKING_MAX,
  BULKING_MIN,
  CUBIC_FEET_PER_CUBIC_METRE,
  CUBIC_METRES_PER_CUBED_UNIT,
  DIMENSION_DECIMALS,
  MAX_QUANTITY,
  MAX_REALISTIC_DIMENSION_M,
  METRES_PER_UNIT,
} from './units.ts';

interface Measured {
  length: string;
  width: string;
  depth: string;
  quantity: string;
  bulkingPercent: string;
}

/** Reads the three dimensions, the pit/trench count and the bulking %, stopping at the first invalid field. */
function measure(input: ExcavationVolumeInput) {
  const length = readPositive(input.length, 'length', DIMENSION_DECIMALS);
  if (!length.ok) return length;
  const width = readPositive(input.width, 'width', DIMENSION_DECIMALS);
  if (!width.ok) return width;
  const depth = readPositive(input.depth, 'depth', DIMENSION_DECIMALS);
  if (!depth.ok) return depth;
  const quantity = readCount(input.quantity, 'quantity', MAX_QUANTITY);
  if (!quantity.ok) return quantity;
  const bulkingPercent = readPercent(input.bulkingPercent, 'bulkingPercent', {
    min: BULKING_MIN,
    max: BULKING_MAX,
    maxDecimals: BULKING_DECIMALS,
    rangeCode: 'CIVIL_BULKING_OUT_OF_RANGE',
  });
  if (!bulkingPercent.ok) return bulkingPercent;
  const value: Measured = {
    length: length.value,
    width: width.value,
    depth: depth.value,
    quantity: quantity.value,
    bulkingPercent: bulkingPercent.value,
  };
  return ok(value);
}

const step = (
  ref: string,
  formulaKey: string,
  variables: Record<string, string>,
  result: string,
): WorkingStep => ({ ref, formulaKey, variables, result });

/** Standing estimation-aid warnings shown on every result, regardless of input. */
function standingWarnings(): OpWarning[] {
  return [
    warning('CIVIL_ESTIMATION_AID_ONLY'),
    warning('CIVIL_VERIFY_BEFORE_EXCAVATION'),
    warning('CIVIL_EXCAVATION_CONDITIONS_VARY'),
    warning('CIVIL_BULKING_VARIES'),
    warning('CIVIL_NOT_PROFESSIONAL_REPLACEMENT_CONTRACTOR'),
    warning('CIVIL_EXCAVATION_SCOPE_LIMIT'),
  ];
}

export const excavationVolume = defineOperation({
  id: 'civil.excavation.volume',
  major: 1,
  title: 'Excavation volume (earthwork)',
  summary:
    'Excavation/earthwork volume for a rectangular pit, trench or footing pit, from dimensions, quantity and bulking/swell %.',
  input: excavationVolumeInput,
  params: excavationVolumeParams,
  output: excavationVolumeOutput,
  errors: [
    'CIVIL_MISSING_INPUT',
    'CIVIL_INVALID_NUMBER',
    'CIVIL_TOO_MANY_DECIMALS',
    'CIVIL_NOT_POSITIVE',
    'CIVIL_QUANTITY_NOT_POSITIVE',
    'CIVIL_QUANTITY_NOT_WHOLE',
    'CIVIL_QUANTITY_TOO_LARGE',
    'CIVIL_BULKING_OUT_OF_RANGE',
  ],
  runtimes: ['worker', 'node'],
  cost: { weight: 'light' },
  exposure: 'internal',
  dataClass: 'public',
  run(input, params) {
    const measured = measure(input);
    if (!measured.ok) return measured;
    const { length, width, depth, quantity, bulkingPercent } = measured.value;
    const factor = CUBIC_METRES_PER_CUBED_UNIT[input.unit];
    // Exact values: no rounding until each output is formatted below.
    const oneExcavationVolume = mul(mul(mul(length, width), depth), factor);
    const neatVolume = mul(oneExcavationVolume, quantity);
    const bulkingVolume = mul(neatVolume, mul(bulkingPercent, '0.01'));
    const looseVolume = add(neatVolume, bulkingVolume);
    const looseVolumeFt3 = mul(looseVolume, CUBIC_FEET_PER_CUBIC_METRE);
    const shown = (value: string) => toFixedString(value, params.decimals, params.rounding);
    const working = [
      step(
        'excavationVolume',
        'excavation.oneVolume',
        { length, width, depth, unit: input.unit, factor },
        oneExcavationVolume,
      ),
      step('neatVolume', 'excavation.neatVolume', { oneExcavationVolume, quantity }, neatVolume),
      step(
        'bulkingVolume',
        'excavation.bulkingVolume',
        { neatVolume, bulkingPercent },
        bulkingVolume,
      ),
      step('looseVolume', 'excavation.looseVolume', { neatVolume, bulkingVolume }, looseVolume),
      step(
        'looseVolumeFt3',
        'excavation.looseVolumeFt3',
        { looseVolume, factor: CUBIC_FEET_PER_CUBIC_METRE },
        looseVolumeFt3,
      ),
    ];
    const warnings = standingWarnings();
    if (hasUnrealisticDimension(length, width, depth, input.unit)) {
      warnings.push(warning('CIVIL_DIMENSION_UNREALISTIC', { details: { max: '100' } }));
    }
    return ok(
      {
        excavationType: input.excavationType,
        unit: input.unit,
        quantity,
        bulkingPercent,
        neatVolumeM3: shown(neatVolume),
        bulkingVolumeM3: shown(bulkingVolume),
        looseVolumeM3: shown(looseVolume),
        looseVolumeFt3: shown(looseVolumeFt3),
        working,
      },
      warnings,
    );
  },
});

/** True when any dimension, converted to metres, exceeds the soft sanity ceiling (§ units.ts). */
function hasUnrealisticDimension(
  length: string,
  width: string,
  depth: string,
  unit: ExcavationVolumeInput['unit'],
): boolean {
  const factor = METRES_PER_UNIT[unit];
  return [length, width, depth]
    .map((dimension) => mul(dimension, factor))
    .some((metres) => compare(metres, MAX_REALISTIC_DIMENSION_M) > 0);
}
