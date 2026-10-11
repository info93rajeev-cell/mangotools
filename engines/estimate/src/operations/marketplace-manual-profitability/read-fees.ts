import { err, ok, type Result } from '@mangotools/core';
import { type FeeLine, MAX_ITEMS, type PriceSlab, type WeightSlab } from './model.ts';
import {
  checkScenarioList,
  duplicateIndex,
  missing,
  readAll,
  readMoney,
  readOptional,
  readPercent,
  readWeight,
} from './read-values.ts';
import type { FeeLineInput } from './schema.ts';
import { checkSlabBounds } from './slabs.ts';

type PriceSlabInput = NonNullable<FeeLineInput['priceSlabs']>[number];
type WeightSlabInput = NonNullable<FeeLineInput['weightSlabs']>[number];

function readPriceSlab(slab: PriceSlabInput, path: string): Result<PriceSlab> {
  const min = readOptional(slab.min, `${path}.min`, readMoney);
  if (!min.ok) return min;
  const max = readOptional(slab.max, `${path}.max`, readMoney);
  if (!max.ok) return max;
  if (slab.value === undefined) return missing(`${path}.value`);
  const value =
    slab.chargeMode === 'percent'
      ? readPercent(slab.value, `${path}.value`)
      : readMoney(slab.value, `${path}.value`);
  if (!value.ok) return value;
  return ok({ min: min.value, max: max.value, chargeMode: slab.chargeMode, value: value.value });
}

function readWeightSlab(slab: WeightSlabInput, path: string): Result<WeightSlab> {
  const min = readOptional(slab.min, `${path}.min`, readWeight);
  if (!min.ok) return min;
  const max = readOptional(slab.max, `${path}.max`, readWeight);
  if (!max.ok) return max;
  if (slab.amount === undefined) return missing(`${path}.amount`);
  const amount = readMoney(slab.amount, `${path}.amount`);
  if (!amount.ok) return amount;
  return ok({ min: min.value, max: max.value, unit: slab.unit, amount: amount.value });
}

function checkSlabCount(slabs: readonly unknown[] | undefined, path: string): Result<true> {
  if (slabs === undefined || slabs.length === 0) return missing(path);
  if (slabs.length > MAX_ITEMS) return err('ESTIMATE_TOO_MANY_ITEMS', { path });
  return ok(true);
}

function readPriceSlabLine(line: FeeLineInput, base: FeeLine, path: string): Result<FeeLine> {
  if (line.slabPriceBase === undefined) return missing(`${path}.slabPriceBase`);
  const count = checkSlabCount(line.priceSlabs, `${path}.priceSlabs`);
  if (!count.ok) return count;
  const slabs = readAll(line.priceSlabs ?? [], (slab, i) =>
    readPriceSlab(slab, `${path}.priceSlabs.${i}`),
  );
  if (!slabs.ok) return slabs;
  if (slabs.value.some((s) => s.chargeMode === 'fixed') && line.quantityScope === undefined) {
    return missing(`${path}.quantityScope`);
  }
  if (slabs.value.some((s) => s.chargeMode === 'percent') && line.percentageBase === undefined) {
    return missing(`${path}.percentageBase`);
  }
  const bounds = checkSlabBounds(slabs.value, `${path}.priceSlabs`);
  if (!bounds.ok) return bounds;
  return ok({ ...base, priceSlabs: slabs.value });
}

function readWeightSlabLine(line: FeeLineInput, base: FeeLine, path: string): Result<FeeLine> {
  if (line.quantityScope === undefined) return missing(`${path}.quantityScope`);
  const count = checkSlabCount(line.weightSlabs, `${path}.weightSlabs`);
  if (!count.ok) return count;
  const slabs = readAll(line.weightSlabs ?? [], (slab, i) =>
    readWeightSlab(slab, `${path}.weightSlabs.${i}`),
  );
  if (!slabs.ok) return slabs;
  const firstUnit = slabs.value[0]?.unit;
  const mixed = slabs.value.findIndex((s) => s.unit !== firstUnit);
  if (mixed >= 0) {
    return err('ESTIMATE_UNIT_MISMATCH', { path: `${path}.weightSlabs.${mixed}.unit` });
  }
  const bounds = checkSlabBounds(slabs.value, `${path}.weightSlabs`);
  if (!bounds.ok) return bounds;
  return ok({ ...base, weightSlabs: slabs.value });
}

function readFixedLine(line: FeeLineInput, base: FeeLine, path: string): Result<FeeLine> {
  if (line.amount === undefined) return missing(`${path}.amount`);
  if (line.quantityScope === undefined) return missing(`${path}.quantityScope`);
  const amount = readMoney(line.amount, `${path}.amount`);
  return amount.ok ? ok({ ...base, amount: amount.value }) : amount;
}

function readPercentLine(line: FeeLineInput, base: FeeLine, path: string): Result<FeeLine> {
  if (line.ratePercent === undefined) return missing(`${path}.ratePercent`);
  if (line.percentageBase === undefined) return missing(`${path}.percentageBase`);
  const rate = readPercent(line.ratePercent, `${path}.ratePercent`);
  return rate.ok ? ok({ ...base, ratePercent: rate.value }) : rate;
}

const readers = {
  fixed: readFixedLine,
  percent: readPercentLine,
  'price-slabs': readPriceSlabLine,
  'weight-slabs': readWeightSlabLine,
} as const;

function readFeeLine(line: FeeLineInput, path: string): Result<FeeLine> {
  if (line.gstTreatment === undefined) return missing(`${path}.gstTreatment`);
  const scenarios = checkScenarioList(line.scenarios, `${path}.scenarios`);
  if (!scenarios.ok) return scenarios;
  const base: FeeLine = {
    id: line.id,
    enabled: line.enabled,
    mode: line.mode,
    quantityScope: line.quantityScope,
    percentageBase: line.percentageBase,
    slabPriceBase: line.slabPriceBase,
    priceSlabs: [],
    weightSlabs: [],
    gstTreatment: line.gstTreatment,
    scenarios: line.scenarios,
  };
  return readers[line.mode](line, base, path);
}

/** Validates every fee line, enabled or not, before any calculation (TASK-008L validation). */
export function readFeeLines(lines: readonly FeeLineInput[]): Result<FeeLine[]> {
  if (lines.length > MAX_ITEMS) return err('ESTIMATE_TOO_MANY_ITEMS', { path: 'feeLines' });
  const dup = duplicateIndex(lines.map((line) => line.id));
  if (dup >= 0) return err('ESTIMATE_DUPLICATE_ID', { path: `feeLines.${dup}.id` });
  return readAll(lines, (line, i) => readFeeLine(line, `feeLines.${i}`));
}
