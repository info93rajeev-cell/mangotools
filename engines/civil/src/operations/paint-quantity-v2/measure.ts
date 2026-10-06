import { err, ok, type Result } from '@mangotools/core';
import { compare, parseDecimal } from '@mangotools/engine-numeric';
import { type OpeningRow, readOpenings } from '../../lib/openings.ts';
import {
  readCount,
  readOptionalPositive,
  readPercent,
  readPositive,
} from '../../lib/read-input.ts';
import {
  type LengthUnit,
  MAX_COUNT,
  MEASURE_DECIMALS,
  PERCENT_DECIMALS,
} from '../../lib/units-v2.ts';
import type { ContainerUnit, CoverageUnit, PaintQuantityInputV2 } from './schema.ts';

const MAX_COATS = '20';

export type Surface =
  | { kind: 'room'; length: string; width: string; height: string; ceiling: boolean }
  | { kind: 'surface'; length: string; secondDimension: string }
  | { kind: 'roof'; length: string; width: string; pitchDegrees: string };

export interface Measured {
  unit: LengthUnit;
  surface: Surface;
  quantity: string;
  openings: OpeningRow[];
  coats: string;
  coverage: string;
  coverageUnit: CoverageUnit;
  wastagePercent: string;
  container: { size: string; unit: ContainerUnit } | null;
  displayDecimals: number | null;
}

/** Number of coats: a required whole number from 1 to 20 (same codes as `@1`). */
function readCoats(raw: string | number | undefined): Result<string> {
  const text = raw === undefined ? '' : String(raw).trim();
  if (text === '') return err('CIVIL_MISSING_INPUT', { path: 'coats' });
  const parsed = parseDecimal(text);
  if (!parsed.ok) return err('CIVIL_INVALID_NUMBER', { path: 'coats' });
  if (compare(parsed.value, '0') <= 0) return err('CIVIL_COATS_NOT_POSITIVE', { path: 'coats' });
  if (parsed.value.includes('.')) return err('CIVIL_COATS_NOT_WHOLE', { path: 'coats' });
  if (compare(parsed.value, MAX_COATS) > 0) {
    return err('CIVIL_COATS_TOO_LARGE', { path: 'coats', details: { max: MAX_COATS } });
  }
  return ok(parsed.value);
}

const readDimension = (input: PaintQuantityInputV2, key: keyof PaintQuantityInputV2) =>
  readPositive(input[key] as string | number | undefined, key, MEASURE_DECIMALS);

function readRoof(input: PaintQuantityInputV2): Result<Surface> {
  const length = readDimension(input, 'roofLength');
  if (!length.ok) return length;
  const width = readDimension(input, 'roofWidth');
  if (!width.ok) return width;
  const pitch = readPercent(input.pitchAngle, 'pitchAngle', {
    min: '0',
    max: '89',
    maxDecimals: MEASURE_DECIMALS,
    rangeCode: 'CIVIL_PAINT_PITCH_OUT_OF_RANGE',
  });
  if (!pitch.ok) return pitch;
  return ok({ kind: 'roof', length: length.value, width: width.value, pitchDegrees: pitch.value });
}

function readRoom(input: PaintQuantityInputV2): Result<Surface> {
  const length = readDimension(input, 'roomLength');
  if (!length.ok) return length;
  const width = readDimension(input, 'roomWidth');
  if (!width.ok) return width;
  const height = readDimension(input, 'roomHeight');
  if (!height.ok) return height;
  const ceiling = input.includeCeiling === true || input.includeCeiling === 'true';
  return ok({
    kind: 'room',
    length: length.value,
    width: width.value,
    height: height.value,
    ceiling,
  });
}

function readSurface(input: PaintQuantityInputV2): Result<Surface> {
  if (input.mode === 'surface') {
    const length = readDimension(input, 'length');
    if (!length.ok) return length;
    const second = readDimension(input, 'secondDimension');
    if (!second.ok) return second;
    return ok({ kind: 'surface', length: length.value, secondDimension: second.value });
  }
  return input.mode === 'roof' ? readRoof(input) : readRoom(input);
}

/** Reads every field in form order, stopping at the first invalid one. */
export function measure(input: PaintQuantityInputV2): Result<Measured> {
  const displayDecimals = input.decimalPlaces === undefined ? null : Number(input.decimalPlaces);
  const surface = readSurface(input);
  if (!surface.ok) return surface;
  const quantity = readCount(input.quantity, 'quantity', MAX_COUNT);
  if (!quantity.ok) return quantity;
  const openings = readOpenings(input.openings);
  if (!openings.ok) return openings;
  const coats = readCoats(input.coats);
  if (!coats.ok) return coats;
  const coverage = readPositive(input.coverage, 'coverage', MEASURE_DECIMALS);
  if (!coverage.ok) return coverage;
  const wastagePercent = readPercent(input.wastagePercent, 'wastagePercent', {
    min: '0',
    max: '50',
    maxDecimals: displayDecimals ?? PERCENT_DECIMALS,
    rangeCode: 'CIVIL_WASTAGE_OUT_OF_RANGE',
  });
  if (!wastagePercent.ok) return wastagePercent;
  const size = readOptionalPositive(input.containerSize, 'containerSize', MEASURE_DECIMALS);
  if (!size.ok) return size;
  return ok({
    unit: input.unit,
    surface: surface.value,
    quantity: quantity.value,
    openings: openings.value,
    coats: coats.value,
    coverage: coverage.value,
    coverageUnit: input.coverageUnit,
    wastagePercent: wastagePercent.value,
    container: size.value ? { size: size.value, unit: input.containerUnit ?? 'l' } : null,
    displayDecimals,
  });
}
