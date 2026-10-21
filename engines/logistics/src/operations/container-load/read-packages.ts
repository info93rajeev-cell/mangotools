import { err, ok, type Result } from '@mangotools/core';
import { compare, mul, parseDecimal } from '@mangotools/engine-numeric';
import { readPositive } from '../../lib/read-input.ts';
import { itemWeightNg, toSub } from './measure.ts';
import type { PackageInput } from './schema.ts';
import {
  INPUT_DECIMALS,
  KG_PER_WEIGHT_UNIT,
  type LoadLengthUnit,
  M_PER_UNIT,
  MAX_DESCRIPTION_LENGTH,
  MAX_ITEM_WEIGHT_KG,
  MAX_PACKAGE_ROWS,
  MAX_PIECES_PER_PACKAGE,
  MAX_TOTAL_PIECES,
} from './units.ts';

/** One validated package type, in exact decimals (as entered) and exact integer geometry. */
export interface ReadPackage {
  index: number;
  description: string;
  length: string;
  width: string;
  height: string;
  unit: LoadLengthUnit;
  quantity: number;
  /** Length, width and height in 0.1 µm sub-units. */
  dims: readonly [bigint, bigint, bigint];
  unitVolumeM3: string;
  unitWeightKg: string | null;
  unitWeightNg: bigint | null;
}

/** A required whole number of pieces from 1 to 100,000. */
function readPieces(raw: string | number | undefined, path: string): Result<number> {
  const text = raw === undefined ? '' : String(raw);
  if (text.trim() === '') return err('LOGISTICS_MISSING_INPUT', { path });
  const parsed = parseDecimal(text);
  if (!parsed.ok) return err('LOGISTICS_INVALID_NUMBER', { path });
  if (compare(parsed.value, '0') <= 0) return err('LOGISTICS_PIECES_NOT_POSITIVE', { path });
  if (parsed.value.includes('.')) return err('LOGISTICS_PIECES_NOT_WHOLE', { path });
  if (compare(parsed.value, MAX_PIECES_PER_PACKAGE) > 0) {
    return err('LOGISTICS_PIECES_TOO_LARGE', { path, details: { max: '100,000' } });
  }
  return ok(Number(parsed.value));
}

/** The optional weight of one piece, converted to exact kilograms. */
function readItemWeight(raw: PackageInput, path: string): Result<string | null> {
  if (raw.weight === undefined || String(raw.weight).trim() === '') return ok(null);
  const weight = readPositive(raw.weight, `${path}.weight`, INPUT_DECIMALS);
  if (!weight.ok) return weight;
  const kg = mul(weight.value, KG_PER_WEIGHT_UNIT[raw.weightUnit ?? 'kg']);
  if (compare(kg, MAX_ITEM_WEIGHT_KG) > 0) {
    return err('LOGISTICS_WEIGHT_TOO_LARGE', {
      path: `${path}.weight`,
      details: { max: '100,000' },
    });
  }
  return ok(kg);
}

function readDescription(raw: PackageInput, path: string): Result<string> {
  const description = (raw.description ?? '').trim();
  if (description.length > MAX_DESCRIPTION_LENGTH) {
    return err('LOGISTICS_DESCRIPTION_TOO_LONG', {
      path: `${path}.description`,
      details: { max: MAX_DESCRIPTION_LENGTH },
    });
  }
  return ok(description);
}

type Dims = readonly [string, string, string];

function readDims(raw: PackageInput, path: string): Result<Dims> {
  const length = readPositive(raw.length, `${path}.length`, INPUT_DECIMALS);
  if (!length.ok) return length;
  const width = readPositive(raw.width, `${path}.width`, INPUT_DECIMALS);
  if (!width.ok) return width;
  const height = readPositive(raw.height, `${path}.height`, INPUT_DECIMALS);
  if (!height.ok) return height;
  return ok([length.value, width.value, height.value]);
}

/** Validates one package row; error paths look like `packages.2.width`. */
function readPackage(raw: PackageInput, index: number): Result<ReadPackage> {
  const path = `packages.${index}`;
  const description = readDescription(raw, path);
  if (!description.ok) return description;
  const dims = readDims(raw, path);
  if (!dims.ok) return dims;
  if (raw.unit === undefined) return err('LOGISTICS_MISSING_INPUT', { path: `${path}.unit` });
  const quantity = readPieces(raw.quantity, `${path}.quantity`);
  if (!quantity.ok) return quantity;
  const weightKg = readItemWeight(raw, path);
  if (!weightKg.ok) return weightKg;
  const [length, width, height] = dims.value;
  const metres = M_PER_UNIT[raw.unit];
  const unitVolumeM3 = mul(mul(mul(length, metres), mul(width, metres)), mul(height, metres));
  return ok({
    index,
    description: description.value,
    length,
    width,
    height,
    unit: raw.unit,
    quantity: quantity.value,
    dims: [toSub(length, raw.unit), toSub(width, raw.unit), toSub(height, raw.unit)],
    unitVolumeM3,
    unitWeightKg: weightKg.value,
    unitWeightNg: weightKg.value === null ? null : itemWeightNg(weightKg.value),
  });
}

/** Validates every package row in order, stopping at the first invalid cell. */
export function readPackages(raw: readonly PackageInput[] | undefined): Result<ReadPackage[]> {
  if (raw === undefined || raw.length === 0)
    return err('LOGISTICS_NO_PACKAGES', { path: 'packages' });
  if (raw.length > MAX_PACKAGE_ROWS) {
    return err('LOGISTICS_TOO_MANY_PACKAGES', {
      path: 'packages',
      details: { max: MAX_PACKAGE_ROWS },
    });
  }
  const packages: ReadPackage[] = [];
  let total = 0;
  for (const [index, row] of raw.entries()) {
    const read = readPackage(row, index);
    if (!read.ok) return read;
    total += read.value.quantity;
    packages.push(read.value);
  }
  if (total > MAX_TOTAL_PIECES) {
    return err('LOGISTICS_TOTAL_PIECES_TOO_LARGE', {
      path: 'packages',
      details: { max: '250,000' },
    });
  }
  return ok(packages);
}
