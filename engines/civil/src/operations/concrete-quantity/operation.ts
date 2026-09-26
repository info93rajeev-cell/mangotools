import { defineOperation, type OpWarning, ok, type WorkingStep, warning } from '@mangotools/core';
import { add, compare, mul, toFixedString } from '@mangotools/engine-numeric';
import { readCount, readPercent, readPositive } from '../../lib/read-input.ts';
import {
  type ConcreteQuantityInput,
  concreteQuantityInput,
  concreteQuantityOutput,
  concreteQuantityParams,
} from './schema.ts';
import {
  CUBIC_FEET_PER_CUBIC_METRE,
  CUBIC_METRES_PER_CUBED_UNIT,
  DIMENSION_DECIMALS,
  MAX_QUANTITY,
  MAX_REALISTIC_DIMENSION_M,
  METRES_PER_UNIT,
  WASTAGE_DECIMALS,
  WASTAGE_MAX,
  WASTAGE_MIN,
} from './units.ts';

interface Measured {
  length: string;
  width: string;
  depth: string;
  quantity: string;
  wastagePercent: string;
}

/** Reads the three dimensions, the member count and the wastage %, stopping at the first invalid field. */
function measure(input: ConcreteQuantityInput) {
  const length = readPositive(input.length, 'length', DIMENSION_DECIMALS);
  if (!length.ok) return length;
  const width = readPositive(input.width, 'width', DIMENSION_DECIMALS);
  if (!width.ok) return width;
  const depth = readPositive(input.depth, 'depth', DIMENSION_DECIMALS);
  if (!depth.ok) return depth;
  const quantity = readCount(input.quantity, 'quantity', MAX_QUANTITY);
  if (!quantity.ok) return quantity;
  const wastagePercent = readPercent(input.wastagePercent, 'wastagePercent', {
    min: WASTAGE_MIN,
    max: WASTAGE_MAX,
    maxDecimals: WASTAGE_DECIMALS,
    rangeCode: 'CIVIL_WASTAGE_OUT_OF_RANGE',
  });
  if (!wastagePercent.ok) return wastagePercent;
  const value: Measured = {
    length: length.value,
    width: width.value,
    depth: depth.value,
    quantity: quantity.value,
    wastagePercent: wastagePercent.value,
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
    warning('CIVIL_VERIFY_BEFORE_CONSTRUCTION'),
    warning('CIVIL_LOCAL_PRACTICE_VARIES'),
    warning('CIVIL_NOT_PROFESSIONAL_REPLACEMENT'),
    warning('CIVIL_VOLUME_ONLY'),
  ];
}

export const concreteQuantity = defineOperation({
  id: 'civil.concrete.quantity',
  major: 1,
  title: 'Concrete quantity (volume)',
  summary:
    'Concrete volume for a rectangular slab, beam, column or footing, from dimensions, member count and wastage %.',
  input: concreteQuantityInput,
  params: concreteQuantityParams,
  output: concreteQuantityOutput,
  errors: [
    'CIVIL_MISSING_INPUT',
    'CIVIL_INVALID_NUMBER',
    'CIVIL_TOO_MANY_DECIMALS',
    'CIVIL_NOT_POSITIVE',
    'CIVIL_QUANTITY_NOT_POSITIVE',
    'CIVIL_QUANTITY_NOT_WHOLE',
    'CIVIL_QUANTITY_TOO_LARGE',
    'CIVIL_WASTAGE_OUT_OF_RANGE',
  ],
  runtimes: ['worker', 'node'],
  cost: { weight: 'light' },
  exposure: 'internal',
  dataClass: 'public',
  run(input, params) {
    const measured = measure(input);
    if (!measured.ok) return measured;
    const { length, width, depth, quantity, wastagePercent } = measured.value;
    const factor = CUBIC_METRES_PER_CUBED_UNIT[input.unit];
    // Exact values: no rounding until each output is formatted below.
    const memberVolume = mul(mul(mul(length, width), depth), factor);
    const baseVolume = mul(memberVolume, quantity);
    const wastageVolume = mul(baseVolume, mul(wastagePercent, '0.01'));
    const totalVolume = add(baseVolume, wastageVolume);
    const totalVolumeFt3 = mul(totalVolume, CUBIC_FEET_PER_CUBIC_METRE);
    const shown = (value: string) => toFixedString(value, params.decimals, params.rounding);
    const working = [
      step(
        'memberVolume',
        'concrete.memberVolume',
        { length, width, depth, unit: input.unit, factor },
        memberVolume,
      ),
      step('baseVolume', 'concrete.baseVolume', { memberVolume, quantity }, baseVolume),
      step(
        'wastageVolume',
        'concrete.wastageVolume',
        { baseVolume, wastagePercent },
        wastageVolume,
      ),
      step('totalVolume', 'concrete.totalVolume', { baseVolume, wastageVolume }, totalVolume),
      step(
        'totalVolumeFt3',
        'concrete.totalVolumeFt3',
        { totalVolume, factor: CUBIC_FEET_PER_CUBIC_METRE },
        totalVolumeFt3,
      ),
    ];
    const warnings = standingWarnings();
    if (hasUnrealisticDimension(length, width, depth, input.unit)) {
      warnings.push(warning('CIVIL_DIMENSION_UNREALISTIC', { details: { max: '100' } }));
    }
    return ok(
      {
        memberType: input.memberType,
        unit: input.unit,
        quantity,
        wastagePercent,
        baseVolumeM3: shown(baseVolume),
        wastageVolumeM3: shown(wastageVolume),
        totalVolumeM3: shown(totalVolume),
        totalVolumeFt3: shown(totalVolumeFt3),
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
  unit: ConcreteQuantityInput['unit'],
): boolean {
  const factor = METRES_PER_UNIT[unit];
  return [length, width, depth]
    .map((dimension) => mul(dimension, factor))
    .some((metres) => compare(metres, MAX_REALISTIC_DIMENSION_M) > 0);
}
