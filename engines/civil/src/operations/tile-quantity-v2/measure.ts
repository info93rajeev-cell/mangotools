import { ok, type Result } from '@mangotools/core';
import { mul } from '@mangotools/engine-numeric';
import { type OpeningRow, readOpenings } from '../../lib/openings.ts';
import { readCount, readPercent, readPositive } from '../../lib/read-input.ts';
import {
  type LengthUnit,
  MAX_COUNT,
  MEASURE_DECIMALS,
  PERCENT_DECIMALS,
  SQUARE_METRES_PER_SQUARE_FOOT,
} from '../../lib/units-v2.ts';
import { readOptionalTilesPerBox } from '../tile-quantity/measure.ts';
import type { TileQuantityInputV2 } from './schema.ts';

export type Surface =
  | { kind: 'dimensions'; length: string; width: string }
  | { kind: 'area'; area: string };

export type Packing =
  | { kind: 'none' }
  | { kind: 'pieces'; tilesPerBox: string }
  | { kind: 'coverage'; coverageM2: string };

export interface Measured {
  unit: LengthUnit;
  tileUnit: LengthUnit;
  surface: Surface;
  quantity: string;
  openings: OpeningRow[];
  tileLength: string;
  tileWidth: string;
  wastagePercent: string;
  packing: Packing;
}

const read = (raw: string | number | undefined, path: string) =>
  readPositive(raw, path, MEASURE_DECIMALS);

function readSurface(input: TileQuantityInputV2): Result<Surface> {
  if (input.mode === 'area') {
    const area = read(input.surfaceArea, 'surfaceArea');
    return area.ok ? ok({ kind: 'area', area: area.value }) : area;
  }
  const length = read(input.surfaceLength, 'surfaceLength');
  if (!length.ok) return length;
  const width = read(input.surfaceWidth, 'surfaceWidth');
  if (!width.ok) return width;
  return ok({ kind: 'dimensions', length: length.value, width: width.value });
}

/** Box packing: blank tiles-per-box or coverage simply means "no box count". */
function readPacking(input: TileQuantityInputV2): Result<Packing> {
  if (input.packMode === 'pieces') {
    const perBox = readOptionalTilesPerBox(input.tilesPerBox);
    if (!perBox.ok) return perBox;
    return ok(perBox.value ? { kind: 'pieces', tilesPerBox: perBox.value } : { kind: 'none' });
  }
  if (input.packMode === 'coverage') {
    const coverage = read(input.boxCoverage, 'boxCoverage');
    if (!coverage.ok) return coverage;
    const ft2 = input.boxCoverageUnit === 'ft2';
    const coverageM2 = ft2 ? mul(coverage.value, SQUARE_METRES_PER_SQUARE_FOOT) : coverage.value;
    return ok({ kind: 'coverage', coverageM2 });
  }
  return ok({ kind: 'none' });
}

/** Reads every field in form order, stopping at the first invalid one. */
export function measure(input: TileQuantityInputV2): Result<Measured> {
  const surface = readSurface(input);
  if (!surface.ok) return surface;
  const quantity = readCount(input.quantity, 'quantity', MAX_COUNT);
  if (!quantity.ok) return quantity;
  const openings = readOpenings(input.openings);
  if (!openings.ok) return openings;
  const tileLength = read(input.tileLength, 'tileLength');
  if (!tileLength.ok) return tileLength;
  const tileWidth = read(input.tileWidth, 'tileWidth');
  if (!tileWidth.ok) return tileWidth;
  const wastagePercent = readPercent(input.wastagePercent, 'wastagePercent', {
    min: '0',
    max: '50',
    maxDecimals: PERCENT_DECIMALS,
    rangeCode: 'CIVIL_WASTAGE_OUT_OF_RANGE',
  });
  if (!wastagePercent.ok) return wastagePercent;
  const packing = readPacking(input);
  if (!packing.ok) return packing;
  return ok({
    unit: input.unit,
    tileUnit: input.tileUnit,
    surface: surface.value,
    quantity: quantity.value,
    openings: openings.value,
    tileLength: tileLength.value,
    tileWidth: tileWidth.value,
    wastagePercent: wastagePercent.value,
    packing: packing.value,
  });
}
