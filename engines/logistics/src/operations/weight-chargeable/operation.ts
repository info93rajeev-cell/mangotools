import { defineOperation, err, ok, type Result, type WorkingStep } from '@mangotools/core';
import { compare, div, mul, toFixedString } from '@mangotools/engine-numeric';
import { readCount, readPositive, readWholeInRange } from '../../lib/read-input.ts';
import { MAX_QUANTITY } from '../cbm-compute/units.ts';
import {
  type BilledOn,
  type ChargeableInput,
  chargeableInput,
  chargeableOutput,
  chargeableParams,
} from './schema.ts';
import {
  CUBIC_CM_PER_CUBED_UNIT,
  DIVISOR_MAX,
  DIVISOR_MIN,
  INPUT_DECIMALS,
  KG_PER_WEIGHT_UNIT,
  MAX_WEIGHT_KG,
} from './units.ts';

interface Checked {
  length: string;
  width: string;
  height: string;
  quantity: string;
  weight: string;
  weightKg: string;
  divisor: string;
}

/** Reads every input in field order, stopping at the first invalid one. */
function check(input: ChargeableInput): Result<Checked> {
  const length = readPositive(input.length, 'length', INPUT_DECIMALS);
  if (!length.ok) return length;
  const width = readPositive(input.width, 'width', INPUT_DECIMALS);
  if (!width.ok) return width;
  const height = readPositive(input.height, 'height', INPUT_DECIMALS);
  if (!height.ok) return height;
  const quantity = readCount(input.quantity, 'quantity', MAX_QUANTITY);
  if (!quantity.ok) return quantity;
  const weight = readPositive(input.weight, 'weight', INPUT_DECIMALS);
  if (!weight.ok) return weight;
  const weightKg = mul(weight.value, KG_PER_WEIGHT_UNIT[input.weightUnit]);
  if (compare(weightKg, MAX_WEIGHT_KG) > 0) {
    return err('LOGISTICS_WEIGHT_TOO_LARGE', { path: 'weight', details: { max: '100,000' } });
  }
  const divisor = readWholeInRange(input.divisor, 'divisor', {
    min: DIVISOR_MIN,
    max: DIVISOR_MAX,
    rangeCode: 'LOGISTICS_DIVISOR_OUT_OF_RANGE',
  });
  if (!divisor.ok) return divisor;
  return ok({
    length: length.value,
    width: width.value,
    height: height.value,
    quantity: quantity.value,
    weight: weight.value,
    weightKg,
    divisor: divisor.value,
  });
}

const basis = (actual: string, volumetric: string): BilledOn => {
  const order = compare(volumetric, actual);
  return order > 0 ? 'volumetric' : order < 0 ? 'actual' : 'equal';
};

const step = (
  ref: string,
  formulaKey: string,
  variables: Record<string, string>,
  result: string,
): WorkingStep => ({ ref, formulaKey, variables, result });

/** Working steps with the full-precision values (templates come from the tool preset in PR 2). */
function workingSteps(
  input: ChargeableInput,
  c: Checked,
  v: { volume: string; volumetric: string; chargeable: string; billedOn: BilledOn },
): WorkingStep[] {
  const { length, width, height, quantity, divisor } = c;
  const actual = c.weightKg;
  const steps = [
    step('volumeCm3PerPackage', 'vw.volume', { length, width, height, unit: input.unit }, v.volume),
    step('volumetricPerPackage', 'vw.volumetric', { volume: v.volume, divisor }, v.volumetric),
    input.weightUnit === 'kg'
      ? step('actualPerPackage', 'vw.actual', { weight: c.weight }, actual)
      : step(
          'actualPerPackage',
          'vw.actual.convert',
          {
            weight: c.weight,
            weightUnit: input.weightUnit,
            factor: KG_PER_WEIGHT_UNIT[input.weightUnit],
          },
          actual,
        ),
    step(
      'chargeablePerPackage',
      `vw.chargeable.${v.billedOn}`,
      { actual, volumetric: v.volumetric },
      v.chargeable,
    ),
  ];
  const totals: [string, string, string][] = [
    ['volumetricTotal', 'vw.total.volumetric', v.volumetric],
    ['actualTotal', 'vw.total.actual', actual],
    ['chargeableTotal', 'vw.total.chargeable', v.chargeable],
  ];
  for (const [ref, key, perPackage] of totals) {
    steps.push(step(ref, key, { perPackage, quantity }, mul(perPackage, quantity)));
  }
  return steps;
}

export const weightChargeable = defineOperation({
  id: 'logistics.weight.chargeable',
  major: 1,
  title: 'Volumetric and chargeable weight',
  summary:
    'Volumetric, actual and chargeable weight per package and in total, and which one is billed.',
  input: chargeableInput,
  params: chargeableParams,
  output: chargeableOutput,
  errors: [
    'LOGISTICS_MISSING_INPUT',
    'LOGISTICS_INVALID_NUMBER',
    'LOGISTICS_TOO_MANY_DECIMALS',
    'LOGISTICS_NOT_POSITIVE',
    'LOGISTICS_QUANTITY_NOT_POSITIVE',
    'LOGISTICS_QUANTITY_NOT_WHOLE',
    'LOGISTICS_QUANTITY_TOO_LARGE',
    'LOGISTICS_WEIGHT_TOO_LARGE',
    'LOGISTICS_DIVISOR_OUT_OF_RANGE',
  ],
  runtimes: ['worker', 'node'],
  cost: { weight: 'light' },
  exposure: 'internal',
  dataClass: 'public',
  run(input, params) {
    const checked = check(input);
    if (!checked.ok) return checked;
    const c = checked.value;
    // Full precision until the final rounding: multiplication is exact, division keeps 20 dp.
    const volume = mul(mul(mul(c.length, c.width), c.height), CUBIC_CM_PER_CUBED_UNIT[input.unit]);
    const volumetric = div(volume, c.divisor);
    const billedOn = basis(c.weightKg, volumetric);
    const chargeable = billedOn === 'actual' ? c.weightKg : volumetric;
    const shown = (value: string) => toFixedString(value, params.decimals, params.rounding);
    return ok({
      volumetricPerPackage: shown(volumetric),
      volumetricTotal: shown(mul(volumetric, c.quantity)),
      actualPerPackage: shown(c.weightKg),
      actualTotal: shown(mul(c.weightKg, c.quantity)),
      chargeablePerPackage: shown(chargeable),
      chargeableTotal: shown(mul(chargeable, c.quantity)),
      billedOn,
      volumeCm3PerPackage: volume,
      divisor: c.divisor,
      quantity: c.quantity,
      working: workingSteps(input, c, { volume, volumetric, chargeable, billedOn }),
    });
  },
});
