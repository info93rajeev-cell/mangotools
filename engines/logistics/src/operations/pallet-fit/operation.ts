import { defineOperation, err, ok, type Result } from '@mangotools/core';
import { isZero, mul, toFixedString } from '@mangotools/engine-numeric';
import { bestOrientation, leftovers } from '../../lib/orientation-grid.ts';
import { readCount, readPositive } from '../../lib/read-input.ts';
import { buildOutput, workingSteps } from './output.ts';
import { STANDARD_PALLETS } from './pallets.ts';
import { type PalletFitInput, palletFitInput, palletFitOutput, palletFitParams } from './schema.ts';
import { collectWarnings, computePalletStats } from './stats.ts';
import type { Carton, Measured } from './types.ts';
import { CM_PER_UNIT, DIMENSION_DECIMALS, MAX_QUANTITY } from './units.ts';

/** Reads the carton's three dimensions and quantity, stopping at the first invalid field. */
function readCarton(input: PalletFitInput): Result<Carton> {
  const length = readPositive(input.length, 'length', DIMENSION_DECIMALS);
  if (!length.ok) return length;
  const width = readPositive(input.width, 'width', DIMENSION_DECIMALS);
  if (!width.ok) return width;
  const height = readPositive(input.height, 'height', DIMENSION_DECIMALS);
  if (!height.ok) return height;
  const quantity = readCount(input.quantity, 'quantity', MAX_QUANTITY);
  if (!quantity.ok) return quantity;
  return ok({
    length: length.value,
    width: width.value,
    height: height.value,
    quantity: quantity.value,
  });
}

/** Pallet length, width and max stack height in centimetres: the standard table, or a custom pallet. */
function readPalletAxes(input: PalletFitInput): Result<readonly [string, string, string]> {
  const factor = CM_PER_UNIT[input.palletUnit];
  let lengthCm: string;
  let widthCm: string;
  if (input.palletType === 'custom') {
    const length = readPositive(input.palletLength, 'palletLength', DIMENSION_DECIMALS);
    if (!length.ok) return length;
    const width = readPositive(input.palletWidth, 'palletWidth', DIMENSION_DECIMALS);
    if (!width.ok) return width;
    lengthCm = mul(length.value, factor);
    widthCm = mul(width.value, factor);
  } else {
    const preset = STANDARD_PALLETS[input.palletType];
    lengthCm = preset.length;
    widthCm = preset.width;
  }
  const maxStackHeight = readPositive(input.maxStackHeight, 'maxStackHeight', DIMENSION_DECIMALS);
  if (!maxStackHeight.ok) return maxStackHeight;
  return ok([lengthCm, widthCm, mul(maxStackHeight.value, factor)]);
}

/** Reads every input, stopping at the first invalid field. */
function measureAll(input: PalletFitInput): Result<Measured> {
  const carton = readCarton(input);
  if (!carton.ok) return carton;
  const palletAxes = readPalletAxes(input);
  if (!palletAxes.ok) return palletAxes;
  const factor = CM_PER_UNIT[input.unit];
  const cartonCm: [string, string, string] = [
    mul(carton.value.length, factor),
    mul(carton.value.width, factor),
    mul(carton.value.height, factor),
  ];
  return ok({ carton: carton.value, unit: input.unit, cartonCm, palletAxes: palletAxes.value });
}

export const palletFit = defineOperation({
  id: 'logistics.pallet.fit',
  major: 1,
  title: 'Pallet loading estimate',
  summary:
    'Estimated cartons per layer, layers, cartons per pallet and pallets required, from a simple axis-aligned footprint fit.',
  input: palletFitInput,
  params: palletFitParams,
  output: palletFitOutput,
  errors: [
    'LOGISTICS_MISSING_INPUT',
    'LOGISTICS_INVALID_NUMBER',
    'LOGISTICS_TOO_MANY_DECIMALS',
    'LOGISTICS_NOT_POSITIVE',
    'LOGISTICS_QUANTITY_NOT_POSITIVE',
    'LOGISTICS_QUANTITY_NOT_WHOLE',
    'LOGISTICS_QUANTITY_TOO_LARGE',
    'LOGISTICS_CARTON_EXCEEDS_PALLET_BASE',
    'LOGISTICS_CARTON_TALLER_THAN_STACK_LIMIT',
  ],
  runtimes: ['worker', 'node'],
  cost: { weight: 'light' },
  exposure: 'internal',
  dataClass: 'public',
  run(input, params) {
    const measured = measureAll(input);
    if (!measured.ok) return measured;
    const m = measured.value;
    const cartonDims = { length: m.cartonCm[0], width: m.cartonCm[1], height: m.cartonCm[2] };
    const grid = bestOrientation(
      m.palletAxes,
      cartonDims,
      params.allowBaseRotation,
      params.keepUpright,
      params.stackable,
    );
    if (isZero(grid.counts[0]) || isZero(grid.counts[1])) {
      return err('LOGISTICS_CARTON_EXCEEDS_PALLET_BASE');
    }
    if (isZero(grid.counts[2])) {
      return err('LOGISTICS_CARTON_TALLER_THAN_STACK_LIMIT', { path: 'maxStackHeight' });
    }
    const leftover = leftovers(m.palletAxes, cartonDims, grid);
    const stats = computePalletStats(grid, cartonDims, m.palletAxes, leftover, m.carton.quantity);
    const warnings = collectWarnings(stats.palletsRequired);
    const shown = (value: string) => toFixedString(value, params.decimals, params.rounding);
    const working = workingSteps(m, grid, stats, leftover);
    return ok(buildOutput(grid, stats, leftover, m.carton.quantity, shown, working), warnings);
  },
});
