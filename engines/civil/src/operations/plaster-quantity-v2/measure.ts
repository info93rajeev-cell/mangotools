import { ok, type Result } from '@mangotools/core';
import { mul } from '@mangotools/engine-numeric';
import { type OpeningRow, readOpenings } from '../../lib/openings.ts';
import { readCount, readPercent, readPositive } from '../../lib/read-input.ts';
import {
  CUBIC_METRES_PER_CUBIC_FOOT,
  type LengthUnit,
  MAX_COUNT,
  MEASURE_DECIMALS,
  METRES_PER_UNIT,
  PERCENT_DECIMALS,
  SQUARE_METRES_PER_SQUARE_FOOT,
} from '../../lib/units-v2.ts';
import type { PlasterQuantityInputV2, ThicknessUnit } from './schema.ts';

export interface Measured {
  surfaceType: PlasterQuantityInputV2['surfaceType'];
  unit: LengthUnit;
  length: string;
  secondDimension: string;
  quantity: string;
  openings: OpeningRow[];
  thickness: string;
  thicknessUnit: ThicknessUnit;
  wastagePercent: string;
  materialMode: PlasterQuantityInputV2['materialMode'];
  /** Wet volume one bag yields, in m³ — only when the user supplied their product's figure. */
  bagVolumeM3: string | null;
}

const read = (raw: string | number | undefined, path: string) =>
  readPositive(raw, path, MEASURE_DECIMALS);

/** The product's stated yield or coverage, as wet volume per bag in m³. */
function readBagVolume(input: PlasterQuantityInputV2): Result<string | null> {
  if (input.materialMode === 'bag-yield') {
    const y = read(input.bagYield, 'bagYield');
    if (!y.ok) return y;
    const perUnit = input.bagYieldUnit === 'ft3' ? CUBIC_METRES_PER_CUBIC_FOOT : '0.001';
    return ok(mul(y.value, perUnit));
  }
  if (input.materialMode === 'bag-coverage') {
    const c = read(input.bagCoverage, 'bagCoverage');
    if (!c.ok) return c;
    const t = read(input.bagCoverageThickness, 'bagCoverageThickness');
    if (!t.ok) return t;
    const areaM2 =
      input.bagCoverageUnit === 'ft2' ? mul(c.value, SQUARE_METRES_PER_SQUARE_FOOT) : c.value;
    return ok(mul(areaM2, mul(t.value, METRES_PER_UNIT[input.thicknessUnit])));
  }
  return ok(null);
}

/** Reads every field in form order, stopping at the first invalid one. */
export function measure(input: PlasterQuantityInputV2): Result<Measured> {
  const length = read(input.length, 'length');
  if (!length.ok) return length;
  const second = read(input.secondDimension, 'secondDimension');
  if (!second.ok) return second;
  const quantity = readCount(input.quantity, 'quantity', MAX_COUNT);
  if (!quantity.ok) return quantity;
  const openings = readOpenings(input.openings);
  if (!openings.ok) return openings;
  const thickness = read(input.thickness, 'thickness');
  if (!thickness.ok) return thickness;
  const wastagePercent = readPercent(input.wastagePercent, 'wastagePercent', {
    min: '0',
    max: '50',
    maxDecimals: PERCENT_DECIMALS,
    rangeCode: 'CIVIL_WASTAGE_OUT_OF_RANGE',
  });
  if (!wastagePercent.ok) return wastagePercent;
  const bagVolume = readBagVolume(input);
  if (!bagVolume.ok) return bagVolume;
  return ok({
    surfaceType: input.surfaceType,
    unit: input.unit,
    length: length.value,
    secondDimension: second.value,
    quantity: quantity.value,
    openings: openings.value,
    thickness: thickness.value,
    thicknessUnit: input.thicknessUnit,
    wastagePercent: wastagePercent.value,
    materialMode: input.materialMode,
    bagVolumeM3: bagVolume.value,
  });
}
