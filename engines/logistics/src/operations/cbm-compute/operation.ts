import { defineOperation, type OpWarning, ok, type WorkingStep, warning } from '@mangotools/core';
import { isZero, mul, toFixedString } from '@mangotools/engine-numeric';
import { readCount, readPositive } from '../../lib/read-input.ts';
import { type CbmInput, cbmInput, cbmOutput, cbmParams } from './schema.ts';
import {
  CUBIC_FEET_PER_CUBIC_METRE,
  CUBIC_METRES_PER_CUBED_UNIT,
  DIMENSION_DECIMALS,
  MAX_QUANTITY,
} from './units.ts';

interface Measured {
  length: string;
  width: string;
  height: string;
  quantity: string;
}

/** Reads the three dimensions and the quantity, stopping at the first invalid field. */
function measure(input: CbmInput) {
  const length = readPositive(input.length, 'length', DIMENSION_DECIMALS);
  if (!length.ok) return length;
  const width = readPositive(input.width, 'width', DIMENSION_DECIMALS);
  if (!width.ok) return width;
  const height = readPositive(input.height, 'height', DIMENSION_DECIMALS);
  if (!height.ok) return height;
  const quantity = readCount(input.quantity, 'quantity', MAX_QUANTITY);
  if (!quantity.ok) return quantity;
  const value: Measured = {
    length: length.value,
    width: width.value,
    height: height.value,
    quantity: quantity.value,
  };
  return ok(value);
}

const step = (
  ref: string,
  formulaKey: string,
  variables: Record<string, string>,
  result: string,
): WorkingStep => ({ ref, formulaKey, variables, result });

export const cbmCompute = defineOperation({
  id: 'logistics.cbm.compute',
  major: 1,
  title: 'Carton volume (CBM)',
  summary:
    'CBM per carton, total CBM and cubic feet from carton dimensions (cm, m, mm or inch) and quantity.',
  input: cbmInput,
  params: cbmParams,
  output: cbmOutput,
  errors: [
    'LOGISTICS_MISSING_INPUT',
    'LOGISTICS_INVALID_NUMBER',
    'LOGISTICS_TOO_MANY_DECIMALS',
    'LOGISTICS_NOT_POSITIVE',
    'LOGISTICS_QUANTITY_NOT_POSITIVE',
    'LOGISTICS_QUANTITY_NOT_WHOLE',
    'LOGISTICS_QUANTITY_TOO_LARGE',
  ],
  runtimes: ['worker', 'node'],
  cost: { weight: 'light' },
  exposure: 'internal',
  dataClass: 'public',
  run(input, params) {
    const measured = measure(input);
    if (!measured.ok) return measured;
    const { length, width, height, quantity } = measured.value;
    const factor = CUBIC_METRES_PER_CUBED_UNIT[input.unit];
    // Exact values: no rounding until each output is formatted below.
    const perCarton = mul(mul(mul(length, width), height), factor);
    const total = mul(perCarton, quantity);
    const cftPerCarton = mul(perCarton, CUBIC_FEET_PER_CUBIC_METRE);
    const cftTotal = mul(total, CUBIC_FEET_PER_CUBIC_METRE);
    const shown = (value: string) => toFixedString(value, params.decimals, params.rounding);
    const cft = CUBIC_FEET_PER_CUBIC_METRE;
    const working = [
      step(
        'cbmPerCarton',
        'cbm.perCarton',
        { length, width, height, unit: input.unit, factor },
        perCarton,
      ),
      step('totalCbm', 'cbm.total', { cbm: perCarton, quantity }, total),
      step('cftPerCarton', 'cbm.cftPerCarton', { cbm: perCarton, factor: cft }, cftPerCarton),
      step('totalCft', 'cbm.cftTotal', { cbm: total, factor: cft }, cftTotal),
    ];
    const cbmPerCarton = shown(perCarton);
    const warnings: OpWarning[] = [];
    if (isZero(cbmPerCarton)) {
      const details = { smallest: smallestStep(params.decimals) };
      warnings.push(warning('LOGISTICS_VOLUME_ROUNDS_TO_ZERO', { details }));
    }
    return ok(
      {
        cbmPerCarton,
        totalCbm: shown(total),
        cftPerCarton: shown(cftPerCarton),
        totalCft: shown(cftTotal),
        quantity,
        working,
      },
      warnings,
    );
  },
});

/** The smallest non-zero value at `decimals` places: 3 → "0.001", 0 → "1". */
function smallestStep(decimals: number): string {
  return decimals === 0 ? '1' : `0.${'0'.repeat(decimals - 1)}1`;
}
