import { defineOperation, err, ok, type Result } from '@mangotools/core';
import { isZero, mul, toFixedString } from '@mangotools/engine-numeric';
import { readCount, readPositive, readWholeInRange } from '../../lib/read-input.ts';
import { STANDARD_CONTAINERS } from './containers.ts';
import { bestOrientation, leftovers } from './grid.ts';
import { buildOutput, workingSteps } from './output.ts';
import {
  type ContainerFitInput,
  containerFitInput,
  containerFitOutput,
  containerFitParams,
} from './schema.ts';
import type { Carton, Measured } from './types.ts';
import {
  CM_PER_UNIT,
  DIMENSION_DECIMALS,
  MAX_QUANTITY,
  USABLE_PERCENT_MAX,
  USABLE_PERCENT_MIN,
} from './units.ts';
import { collectWarnings, computeVolumeMetrics, gridUtilization } from './volume.ts';

/** Reads the carton's three dimensions and quantity, stopping at the first invalid field. */
function readCarton(input: ContainerFitInput): Result<Carton> {
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

/** Container axes in centimetres: the standard table, or a validated custom container. */
function readContainerCm(input: ContainerFitInput): Result<readonly [string, string, string]> {
  if (input.containerType !== 'custom') {
    const preset = STANDARD_CONTAINERS[input.containerType];
    return ok([preset.length, preset.width, preset.height]);
  }
  if (input.containerUnit === undefined) {
    return err('LOGISTICS_MISSING_INPUT', { path: 'containerUnit' });
  }
  const length = readPositive(input.containerLength, 'containerLength', DIMENSION_DECIMALS);
  if (!length.ok) return length;
  const width = readPositive(input.containerWidth, 'containerWidth', DIMENSION_DECIMALS);
  if (!width.ok) return width;
  const height = readPositive(input.containerHeight, 'containerHeight', DIMENSION_DECIMALS);
  if (!height.ok) return height;
  const factor = CM_PER_UNIT[input.containerUnit];
  return ok([mul(length.value, factor), mul(width.value, factor), mul(height.value, factor)]);
}

/** Reads and defaults every input, stopping at the first invalid field. */
function measureAll(input: ContainerFitInput): Result<Measured> {
  const carton = readCarton(input);
  if (!carton.ok) return carton;
  const containerAxes = readContainerCm(input);
  if (!containerAxes.ok) return containerAxes;
  const usable = readWholeInRange(input.usablePercent, 'usablePercent', {
    min: USABLE_PERCENT_MIN,
    max: USABLE_PERCENT_MAX,
    rangeCode: 'LOGISTICS_USABLE_PERCENT_OUT_OF_RANGE',
  });
  if (!usable.ok) return usable;
  const factor = CM_PER_UNIT[input.unit];
  const cartonCm: [string, string, string] = [
    mul(carton.value.length, factor),
    mul(carton.value.width, factor),
    mul(carton.value.height, factor),
  ];
  return ok({
    carton: carton.value,
    unit: input.unit,
    containerType: input.containerType,
    cartonCm,
    containerAxes: containerAxes.value,
    usablePercent: usable.value,
  });
}

export const containerFit = defineOperation({
  id: 'logistics.container.fit',
  major: 1,
  title: 'Container loading estimate',
  summary:
    'Estimated cartons by volume, plus a simple axis-aligned loading grid, for a shipping container.',
  input: containerFitInput,
  params: containerFitParams,
  output: containerFitOutput,
  errors: [
    'LOGISTICS_MISSING_INPUT',
    'LOGISTICS_INVALID_NUMBER',
    'LOGISTICS_TOO_MANY_DECIMALS',
    'LOGISTICS_NOT_POSITIVE',
    'LOGISTICS_QUANTITY_NOT_POSITIVE',
    'LOGISTICS_QUANTITY_NOT_WHOLE',
    'LOGISTICS_QUANTITY_TOO_LARGE',
    'LOGISTICS_USABLE_PERCENT_OUT_OF_RANGE',
    'LOGISTICS_CARTON_EXCEEDS_CONTAINER',
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
    const volume = computeVolumeMetrics(
      m.cartonCm,
      m.containerAxes,
      m.carton.quantity,
      m.usablePercent,
    );
    const grid = bestOrientation(
      m.containerAxes,
      cartonDims,
      params.allowRotation,
      params.keepUpright,
      params.stackable,
    );
    if (isZero(grid.total)) return err('LOGISTICS_CARTON_EXCEEDS_CONTAINER');
    const leftover = leftovers(m.containerAxes, cartonDims, grid);
    const utilizationPercent = gridUtilization(grid.total, volume.cartonCbm, volume.usableCbm);
    const warnings = collectWarnings(volume, m.carton.quantity, grid.total);
    const shown = (value: string) => toFixedString(value, params.decimals, params.rounding);
    const working = workingSteps(m, volume, grid, leftover);
    return ok(
      buildOutput(volume, grid, leftover, utilizationPercent, m.carton.quantity, shown, working),
      warnings,
    );
  },
});
