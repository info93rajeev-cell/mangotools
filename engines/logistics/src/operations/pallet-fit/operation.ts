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

const CONVERTED_INPUT_DECIMALS = 12;

/** Removes sub-precision conversion residue before floor-based fit calculations. */
function toCentimetres(value: string, factor: string, converted: boolean): string {
  const centimetres = mul(value, factor);
  return converted ? toFixedString(centimetres, CONVERTED_INPUT_DECIMALS, 'half-up') : centimetres;
}

/** Reads the carton's three dimensions and quantity, stopping at the first invalid field. */
function readCarton(input: PalletFitInput): Result<Carton> {
  const inputDecimals = input.decimalPlaces ? CONVERTED_INPUT_DECIMALS : DIMENSION_DECIMALS;
  const length = readPositive(input.length, 'length', inputDecimals);
  if (!length.ok) return length;
  const width = readPositive(input.width, 'width', inputDecimals);
  if (!width.ok) return width;
  const height = readPositive(input.height, 'height', inputDecimals);
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
  const inputDecimals = input.decimalPlaces ? CONVERTED_INPUT_DECIMALS : DIMENSION_DECIMALS;
  const converted = input.decimalPlaces !== undefined;
  const factor = CM_PER_UNIT[input.palletUnit];
  let lengthCm: string;
  let widthCm: string;
  if (input.palletType === 'custom') {
    const length = readPositive(input.palletLength, 'palletLength', inputDecimals);
    if (!length.ok) return length;
    const width = readPositive(input.palletWidth, 'palletWidth', inputDecimals);
    if (!width.ok) return width;
    lengthCm = toCentimetres(length.value, factor, converted);
    widthCm = toCentimetres(width.value, factor, converted);
  } else {
    const preset = STANDARD_PALLETS[input.palletType];
    lengthCm = preset.length;
    widthCm = preset.width;
  }
  const maxStackHeight = readPositive(input.maxStackHeight, 'maxStackHeight', inputDecimals);
  if (!maxStackHeight.ok) return maxStackHeight;
  return ok([lengthCm, widthCm, toCentimetres(maxStackHeight.value, factor, converted)]);
}

/** Reads every input, stopping at the first invalid field. */
function measureAll(input: PalletFitInput): Result<Measured> {
  const carton = readCarton(input);
  if (!carton.ok) return carton;
  const palletAxes = readPalletAxes(input);
  if (!palletAxes.ok) return palletAxes;
  const factor = CM_PER_UNIT[input.unit];
  const converted = input.decimalPlaces !== undefined;
  const cartonCm: [string, string, string] = [
    toCentimetres(carton.value.length, factor, converted),
    toCentimetres(carton.value.width, factor, converted),
    toCentimetres(carton.value.height, factor, converted),
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
    const displayDecimals = input.decimalPlaces ? Number(input.decimalPlaces) : params.decimals;
    const shown = (value: string) => toFixedString(value, displayDecimals, params.rounding);
    const working = workingSteps(m, grid, stats, leftover);
    return ok(buildOutput(grid, stats, leftover, m.carton.quantity, shown, working), warnings);
  },
});
