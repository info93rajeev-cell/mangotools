import { err, ok, type Result, type WorkingStep } from '@mangotools/core';
import { div, mul, type RoundingMode } from '@mangotools/engine-numeric';
import type { FeeLine, Model, OrderValues } from './model.ts';
import { money, percentOf } from './order.ts';
import { isApplicable } from './read-input.ts';
import type { FeeResult, PercentageBase } from './schema.ts';
import { matchSlab } from './slabs.ts';

interface Context {
  model: Model;
  values: OrderValues;
  rounding: RoundingMode;
}

interface Charge {
  amount: string;
  base: string | null;
  slabMatchValue: string | null;
  matchedSlabIndex: number | null;
  variables: Record<string, string>;
}

export interface FeeOutcome {
  fees: FeeResult[];
  working: WorkingStep[];
}

const KEY = 'marketplaceManualProfitability';

export function percentageBaseValue(base: PercentageBase, values: OrderValues): string {
  if (base === 'tax-exclusive-revenue') return values.taxExclusiveRevenue;
  if (base === 'customer-invoice-value') return values.customerInvoiceValue;
  return values.realizedCustomerValue;
}

function multiplier(line: FeeLine, ctx: Context): string {
  return line.quantityScope === 'per-unit' ? ctx.model.order.quantity : '1';
}

function fixedCharge(line: FeeLine, value: string, ctx: Context): Charge {
  const count = multiplier(line, ctx);
  return {
    amount: money(mul(value, count), ctx.rounding),
    base: null,
    slabMatchValue: null,
    matchedSlabIndex: null,
    variables: { amount: value, multiplier: count },
  };
}

function percentCharge(line: FeeLine, rate: string, ctx: Context): Charge {
  const base = percentageBaseValue(line.percentageBase ?? 'realized-customer-value', ctx.values);
  return {
    amount: percentOf(base, rate, ctx.rounding),
    base,
    slabMatchValue: null,
    matchedSlabIndex: null,
    variables: { base, ratePercent: rate },
  };
}

function priceSlabCharge(line: FeeLine, index: number, ctx: Context): Result<Charge> {
  const { order } = ctx.model;
  const matchValue =
    line.slabPriceBase === 'realized-unit-selling-price'
      ? div(ctx.values.realizedCustomerValue, order.quantity)
      : order.sellingPricePerUnit;
  const slabIndex = matchSlab(line.priceSlabs, matchValue);
  const slab = line.priceSlabs[slabIndex];
  if (!slab) return err('ESTIMATE_NO_MATCHING_SLAB', { path: `feeLines.${index}.priceSlabs` });
  const charge =
    slab.chargeMode === 'percent'
      ? percentCharge(line, slab.value, ctx)
      : fixedCharge(line, slab.value, ctx);
  const slabMatchValue = money(matchValue, ctx.rounding);
  return ok({
    ...charge,
    slabMatchValue,
    matchedSlabIndex: slabIndex,
    variables: { ...charge.variables, slabMatchValue, matchedSlabIndex: String(slabIndex) },
  });
}

function weightSlabCharge(line: FeeLine, index: number, ctx: Context): Result<Charge> {
  const weight = ctx.model.chargeableWeight?.value ?? '0';
  const slabIndex = matchSlab(line.weightSlabs, weight);
  const slab = line.weightSlabs[slabIndex];
  if (!slab) return err('ESTIMATE_NO_MATCHING_SLAB', { path: `feeLines.${index}.weightSlabs` });
  const charge = fixedCharge(line, slab.amount, ctx);
  return ok({
    ...charge,
    matchedSlabIndex: slabIndex,
    variables: {
      ...charge.variables,
      chargeableWeight: weight,
      matchedSlabIndex: String(slabIndex),
    },
  });
}

function charge(line: FeeLine, index: number, ctx: Context): Result<Charge> {
  if (line.mode === 'fixed') return ok(fixedCharge(line, line.amount ?? '0', ctx));
  if (line.mode === 'percent') return ok(percentCharge(line, line.ratePercent ?? '0', ctx));
  if (line.mode === 'price-slabs') return priceSlabCharge(line, index, ctx);
  return weightSlabCharge(line, index, ctx);
}

function inactive(line: FeeLine): FeeResult {
  return {
    id: line.id,
    mode: line.mode,
    applicable: false,
    percentageBase: null,
    base: null,
    slabPriceBase: null,
    slabMatchValue: null,
    matchedSlabIndex: null,
    amount: '0.00',
    gstAmount: '0.00',
    gstTreatment: line.gstTreatment,
  };
}

function active(line: FeeLine, result: Charge, ctx: Context): FeeResult {
  const gstAmount =
    line.gstTreatment === 'none'
      ? '0.00'
      : percentOf(result.amount, ctx.model.marketplaceFeeGstRatePercent ?? '0', ctx.rounding);
  return {
    id: line.id,
    mode: line.mode,
    applicable: true,
    percentageBase: result.base === null ? null : (line.percentageBase ?? null),
    base: result.base,
    slabPriceBase: line.mode === 'price-slabs' ? (line.slabPriceBase ?? null) : null,
    slabMatchValue: result.slabMatchValue,
    matchedSlabIndex: result.matchedSlabIndex,
    amount: result.amount,
    gstAmount,
    gstTreatment: line.gstTreatment,
  };
}

/** TASK-008L step 3: one result per fee line, in input order. */
export function computeFees(ctx: Context): Result<FeeOutcome> {
  const fees: FeeResult[] = [];
  const working: WorkingStep[] = [];
  for (const [index, line] of ctx.model.feeLines.entries()) {
    if (!isApplicable(line, ctx.model)) {
      fees.push(inactive(line));
      continue;
    }
    const result = charge(line, index, ctx);
    if (!result.ok) return result;
    const fee = active(line, result.value, ctx);
    fees.push(fee);
    working.push({
      ref: `marketplaceFees.${line.id}`,
      formulaKey: `${KEY}.fee.${line.mode}`,
      variables: { ...result.value.variables, gstAmount: fee.gstAmount },
      result: fee.amount,
    });
  }
  return ok({ fees, working });
}
