import { err, ok, type Result } from '@mangotools/core';
import {
  add,
  compare,
  div,
  isZero,
  mul,
  type RoundingMode,
  sub,
  toFixedString,
} from '@mangotools/engine-numeric';
import { readDecimal } from '../../lib/decimal-input.ts';
import type { PricePlanInput, PricePlanOutput } from './schema.ts';

export type PlanValues = Omit<PricePlanOutput, 'working'>;

interface PlanInputs {
  totalCost: string;
  quantity: string;
  gstRatePercent: string;
  targetMarginPercent: string | null;
}

const pct = (v: string) => div(v, '100');
const money = (raw: string, path: string) =>
  readDecimal(raw, path, { maxDecimals: 2, allowNegative: false });

function required(raw: string | undefined, path: string, read: (r: string) => Result<string>) {
  if (raw === undefined || raw.trim() === '') return err('ESTIMATE_MISSING_INPUT', { path });
  return read(raw);
}

function rate(raw: string, path: string): Result<string> {
  const value = readDecimal(raw, path, { maxDecimals: 4, allowNegative: false });
  if (!value.ok) return value;
  return compare(value.value, '100') > 0 ? err('ESTIMATE_GST_RATE_OUT_OF_RANGE', { path }) : value;
}

function margin(raw: string, path: string): Result<string> {
  const value = readDecimal(raw, path, { maxDecimals: 4, allowNegative: false });
  if (!value.ok) return value;
  return compare(value.value, '100') >= 0 ? err('ESTIMATE_MARGIN_OUT_OF_RANGE', { path }) : value;
}

function quantity(raw: string): Result<string> {
  const value = readDecimal(raw, 'quantity', { maxDecimals: 0, allowNegative: false });
  if (!value.ok || compare(value.value, '1') < 0 || compare(value.value, '10000') > 0) {
    return err('ESTIMATE_INVALID_QUANTITY', { path: 'quantity' });
  }
  return value;
}

/** Costs, quantity, GST rate and the optional target margin, checked in form order. */
export function readPlanInputs(input: PricePlanInput): Result<PlanInputs> {
  const product = required(input.productCost, 'productCost', (r) => money(r, 'productCost'));
  if (!product.ok) return product;
  const extra = money(input.additionalCost, 'additionalCost');
  if (!extra.ok) return extra;
  const qty = quantity(input.quantity);
  if (!qty.ok) return qty;
  const gst = rate(input.gstRatePercent, 'gstRatePercent');
  if (!gst.ok) return gst;
  const marginRaw = input.targetMarginPercent?.trim() ?? '';
  const target = marginRaw === '' ? null : margin(marginRaw, 'targetMarginPercent');
  if (target && !target.ok) return target;
  return ok({
    totalCost: add(product.value, extra.value),
    quantity: qty.value,
    gstRatePercent: gst.value,
    targetMarginPercent: target?.ok ? target.value : null,
  });
}

const priceForMargin = (cost: string, m: string) => div(cost, sub('1', pct(m)));

/** The selling price the chosen mode asks for (unrounded). */
export function solvePrice(input: PricePlanInput, v: PlanInputs): Result<string> {
  if (input.mode === 'from-price') {
    const price = required(input.sellingPrice, 'sellingPrice', (r) => money(r, 'sellingPrice'));
    if (!price.ok) return price;
    return isZero(price.value) ? err('ESTIMATE_PRICE_ZERO', { path: 'sellingPrice' }) : price;
  }
  if (input.mode === 'from-margin') {
    if (v.targetMarginPercent === null) {
      return err('ESTIMATE_MISSING_INPUT', { path: 'targetMarginPercent' });
    }
    return ok(priceForMargin(v.totalCost, v.targetMarginPercent));
  }
  const markup = required(input.markupPercent, 'markupPercent', (r) =>
    readDecimal(r, 'markupPercent', { maxDecimals: 4, allowNegative: true }),
  );
  if (!markup.ok) return markup;
  if (compare(markup.value, '-100') <= 0) {
    return err('ESTIMATE_MARKUP_OUT_OF_RANGE', { path: 'markupPercent' });
  }
  return ok(mul(v.totalCost, add('1', pct(markup.value))));
}

export function computePlan(v: PlanInputs, rawPrice: string, rounding: RoundingMode): PlanValues {
  const r = (x: string) => toFixedString(x, 2, rounding);
  const cost = r(v.totalCost);
  const price = r(rawPrice);
  const profit = sub(price, cost);
  const ratio = (a: string, b: string) => (isZero(b) ? null : r(mul(div(a, b), '100')));
  const gstAmount = r(mul(price, pct(v.gstRatePercent)));
  return {
    totalCost: cost,
    sellingPrice: price,
    profitPerUnit: r(profit),
    markupPercent: ratio(profit, cost),
    marginPercent: ratio(profit, price),
    profitOnQuantity: r(mul(profit, v.quantity)),
    gstAmount,
    priceWithGst: r(add(price, gstAmount)),
    priceForTargetMargin:
      v.targetMarginPercent === null ? null : r(priceForMargin(cost, v.targetMarginPercent)),
    costSharePercent: ratio(cost, price),
    profitSharePercent: ratio(profit, price),
  };
}
