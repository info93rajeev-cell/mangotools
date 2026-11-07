import { err, ok, type Result } from '@mangotools/core';
import { compare } from '@mangotools/engine-numeric';
import { readDecimal } from '../../lib/decimal-input.ts';
import type { SellerUnitEconomicsInput } from './schema.ts';

const MONEY_KEYS = [
  'packagingCost',
  'shippingCost',
  'warehousingCost',
  'labourCost',
  'overheadCost',
  'referralFee',
  'closingFee',
  'handlingFee',
  'advertisingCost',
  'otherCost',
  'reverseShippingCost',
  'expectedReturnCost',
] as const;

const PERCENT_KEYS = [
  'commissionPercent',
  'feeGstRatePercent',
  'returnRatePercent',
  'damagedLossPercent',
  'withholdingPercent',
] as const;

type MoneyKey = (typeof MONEY_KEYS)[number];
type PercentKey = (typeof PERCENT_KEYS)[number];

/** Validated decimal strings for every input. */
export interface UnitInputs extends Record<MoneyKey | PercentKey, string> {
  sellingPrice: string;
  productCost: string;
  priceIncludesGst: boolean;
  gstRatePercent: string;
  quantity: string;
  targetProfit: string | null;
  targetMarginPercent: string | null;
}

const money = (raw: string, path: string) =>
  readDecimal(raw, path, { maxDecimals: 2, allowNegative: false });

function percent(
  raw: string,
  path: string,
  code = 'ESTIMATE_PERCENT_OUT_OF_RANGE',
): Result<string> {
  const value = readDecimal(raw, path, { maxDecimals: 4, allowNegative: false });
  if (!value.ok) return value;
  return compare(value.value, '100') > 0 ? err(code, { path }) : value;
}

function required(raw: string | undefined, path: string): Result<string> {
  if (raw === undefined || raw.trim() === '') return err('ESTIMATE_MISSING_INPUT', { path });
  return money(raw, path);
}

function readQuantity(raw: string): Result<string> {
  const value = readDecimal(raw, 'quantity', { maxDecimals: 0, allowNegative: false });
  if (!value.ok || compare(value.value, '1') < 0 || compare(value.value, '10000') > 0) {
    return err('ESTIMATE_INVALID_QUANTITY', { path: 'quantity' });
  }
  return value;
}

function readTargets(
  input: SellerUnitEconomicsInput,
): Result<{ targetProfit: string | null; targetMarginPercent: string | null }> {
  const profitRaw = input.targetProfit?.trim() ?? '';
  const marginRaw = input.targetMarginPercent?.trim() ?? '';
  const profit = profitRaw === '' ? null : money(profitRaw, 'targetProfit');
  if (profit && !profit.ok) return profit;
  const margin = marginRaw === '' ? null : percent(marginRaw, 'targetMarginPercent');
  if (margin && !margin.ok) return margin;
  if (margin?.ok && compare(margin.value, '100') >= 0) {
    return err('ESTIMATE_MARGIN_OUT_OF_RANGE', { path: 'targetMarginPercent' });
  }
  return ok({
    targetProfit: profit?.ok ? profit.value : null,
    targetMarginPercent: margin?.ok ? margin.value : null,
  });
}

function readLists(input: SellerUnitEconomicsInput): Result<Record<MoneyKey | PercentKey, string>> {
  const out = {} as Record<MoneyKey | PercentKey, string>;
  for (const key of MONEY_KEYS) {
    const value = money(input[key], key);
    if (!value.ok) return value;
    out[key] = value.value;
  }
  for (const key of PERCENT_KEYS) {
    const value = percent(input[key], key);
    if (!value.ok) return value;
    out[key] = value.value;
  }
  return ok(out);
}

/** Every input checked, in form order, with the first problem as a typed error. */
export function readUnitInputs(input: SellerUnitEconomicsInput): Result<UnitInputs> {
  const sellingPrice = required(input.sellingPrice, 'sellingPrice');
  if (!sellingPrice.ok) return sellingPrice;
  if (compare(sellingPrice.value, '0') <= 0)
    return err('ESTIMATE_PRICE_ZERO', { path: 'sellingPrice' });
  const productCost = required(input.productCost, 'productCost');
  if (!productCost.ok) return productCost;
  const gst = percent(input.gstRatePercent, 'gstRatePercent', 'ESTIMATE_GST_RATE_OUT_OF_RANGE');
  if (!gst.ok) return gst;
  const lists = readLists(input);
  if (!lists.ok) return lists;
  const quantity = readQuantity(input.quantity);
  if (!quantity.ok) return quantity;
  const targets = readTargets(input);
  if (!targets.ok) return targets;
  return ok({
    ...lists.value,
    ...targets.value,
    sellingPrice: sellingPrice.value,
    productCost: productCost.value,
    priceIncludesGst: input.priceIncludesGst === 'yes',
    gstRatePercent: gst.value,
    quantity: quantity.value,
  });
}
