import { err, ok, type Result } from '@mangotools/core';
import { add, compare, mul } from '@mangotools/engine-numeric';
import {
  type Adjustment,
  type FeeLine,
  MAX_ITEMS,
  type Model,
  type Order,
  type ScopedAmount,
  type SellerCostName,
  sellerCostNames,
  type Withholding,
} from './model.ts';
import { readFeeLines } from './read-fees.ts';
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
import type { ManualProfitabilityInput } from './schema.ts';

type Input = ManualProfitabilityInput;

function readQuantity(raw: string | undefined): Result<string> {
  if (raw === undefined || raw.trim() === '')
    return err('ESTIMATE_MISSING_INPUT', { path: 'quantity' });
  const text = raw.trim();
  const valid = /^\d+$/.test(text) && compare(text, '1') >= 0 && compare(text, '10000') <= 0;
  return valid
    ? ok(text.replace(/^0+(?=\d)/, ''))
    : err('ESTIMATE_INVALID_QUANTITY', { path: 'quantity' });
}

function readRequiredMoney(raw: string | undefined, path: string): Result<string> {
  if (raw === undefined || raw.trim() === '') return err('ESTIMATE_MISSING_INPUT', { path });
  return readMoney(raw, path);
}

function readOrder(input: Input): Result<Order> {
  const price = readRequiredMoney(input.sellingPricePerUnit, 'sellingPricePerUnit');
  if (!price.ok) return price;
  if (compare(price.value, '0') <= 0)
    return err('ESTIMATE_PRICE_ZERO', { path: 'sellingPricePerUnit' });
  const quantity = readQuantity(input.quantity);
  if (!quantity.ok) return quantity;
  const cost = readRequiredMoney(input.productCostPerUnit, 'productCostPerUnit');
  if (!cost.ok) return cost;
  const promo = readMoney(input.promotionalDiscount, 'promotionalDiscount');
  if (!promo.ok) return promo;
  const coupon = readMoney(input.couponDiscount, 'couponDiscount');
  if (!coupon.ok) return coupon;
  const gst = readPercent(
    input.productGstRatePercent,
    'productGstRatePercent',
    'ESTIMATE_GST_RATE_OUT_OF_RANGE',
  );
  if (!gst.ok) return gst;
  if (compare(add(promo.value, coupon.value), mul(price.value, quantity.value)) > 0) {
    return err('ESTIMATE_DISCOUNT_EXCEEDS_VALUE', { path: 'couponDiscount' });
  }
  return ok({
    sellingPricePerUnit: price.value,
    quantity: quantity.value,
    productCostPerUnit: cost.value,
    promotionalDiscount: promo.value,
    couponDiscount: coupon.value,
    productGstRatePercent: gst.value,
    taxMode: input.sellingPriceTaxMode,
  });
}

function readScoped(
  raw: { amount: string; scenarios: ScopedAmount['scenarios'] } | undefined,
  path: string,
): Result<ScopedAmount | undefined> {
  if (raw === undefined) return ok(undefined);
  const list = checkScenarioList(raw.scenarios, `${path}.scenarios`);
  if (!list.ok) return list;
  const amount = readMoney(raw.amount, `${path}.amount`);
  return amount.ok ? ok({ amount: amount.value, scenarios: raw.scenarios }) : amount;
}

function readSellerCosts(input: Input): Result<Model['sellerCosts']> {
  const costs: Model['sellerCosts'] = {};
  for (const name of sellerCostNames) {
    const cost = readScoped(input[name], name);
    if (!cost.ok) return cost;
    if (cost.value) costs[name as SellerCostName] = cost.value;
  }
  return ok(costs);
}

function readWithholding(raw: Input['tcs'], path: string): Result<Withholding | undefined> {
  if (raw === undefined) return ok(undefined);
  const list = checkScenarioList(raw.scenarios, `${path}.scenarios`);
  if (!list.ok) return list;
  if (raw.mode === 'percent' && raw.percentageBase === undefined)
    return missing(`${path}.percentageBase`);
  const value =
    raw.mode === 'percent'
      ? readPercent(raw.value, `${path}.value`)
      : readMoney(raw.value, `${path}.value`);
  if (!value.ok) return value;
  return ok({
    mode: raw.mode,
    value: value.value,
    percentageBase: raw.percentageBase,
    scenarios: raw.scenarios,
  });
}

function readAdjustment(
  raw: Input['scenarioAdjustments'][number],
  path: string,
): Result<Adjustment> {
  const scenarios = raw.scenarios ?? [];
  const invalid =
    scenarios.length === 0 ||
    scenarios.includes('successful-sale') ||
    (!raw.economic && !raw.settlement);
  if (invalid) return err('ESTIMATE_INVALID_SCENARIO_LIST', { path: `${path}.scenarios` });
  const amount = readMoney(raw.amount, `${path}.amount`);
  if (!amount.ok) return amount;
  return ok({
    id: raw.id,
    direction: raw.direction,
    amount: amount.value,
    economic: raw.economic,
    settlement: raw.settlement,
    scenarios,
  });
}

function readAdjustments(input: Input): Result<Adjustment[]> {
  const list = input.scenarioAdjustments;
  if (list.length > MAX_ITEMS)
    return err('ESTIMATE_TOO_MANY_ITEMS', { path: 'scenarioAdjustments' });
  const dup = duplicateIndex(list.map((a) => a.id));
  if (dup >= 0) return err('ESTIMATE_DUPLICATE_ID', { path: `scenarioAdjustments.${dup}.id` });
  return readAll(list, (a, i) => readAdjustment(a, `scenarioAdjustments.${i}`));
}

function readWeightInput(input: Input): Result<Model['chargeableWeight']> {
  if (input.chargeableWeight === undefined) return ok(undefined);
  const value = readWeight(input.chargeableWeight.value, 'chargeableWeight.value');
  return value.ok ? ok({ value: value.value, unit: input.chargeableWeight.unit }) : value;
}

/** Cross-field rules that depend on which fee lines apply in the selected scenario. */
function checkApplicable(model: Model): Result<true> {
  for (const [i, line] of model.feeLines.entries()) {
    if (!isApplicable(line, model)) continue;
    if (line.gstTreatment !== 'none' && model.marketplaceFeeGstRatePercent === undefined) {
      return missing('marketplaceFeeGstRatePercent');
    }
    if (line.mode !== 'weight-slabs') continue;
    if (!model.chargeableWeight)
      return err('ESTIMATE_MISSING_WEIGHT', { path: 'chargeableWeight' });
    if (line.weightSlabs[0]?.unit !== model.chargeableWeight.unit) {
      return err('ESTIMATE_UNIT_MISMATCH', { path: `feeLines.${i}.weightSlabs` });
    }
  }
  return ok(true);
}

export function isApplicable(line: FeeLine, model: Pick<Model, 'scenario'>): boolean {
  return line.enabled && line.scenarios.includes(model.scenario);
}

function readSettlement(
  input: Input,
): Result<Pick<Model, 'tcs' | 'tds' | 'otherSettlementDeductions' | 'settlementCredits'>> {
  const tcs = readWithholding(input.tcs, 'tcs');
  if (!tcs.ok) return tcs;
  const tds = readWithholding(input.tds, 'tds');
  if (!tds.ok) return tds;
  const other = readScoped(input.otherSettlementDeductions, 'otherSettlementDeductions');
  if (!other.ok) return other;
  const credits = readScoped(input.settlementCredits, 'settlementCredits');
  if (!credits.ok) return credits;
  return ok({
    tcs: tcs.value,
    tds: tds.value,
    otherSettlementDeductions: other.value,
    settlementCredits: credits.value,
  });
}

/** Validates the whole input before any calculation and returns the normalised model. */
export function readModel(input: Input): Result<Model> {
  const order = readOrder(input);
  if (!order.ok) return order;
  const weight = readWeightInput(input);
  if (!weight.ok) return weight;
  const feeLines = readFeeLines(input.feeLines);
  if (!feeLines.ok) return feeLines;
  const feeGst = readOptional(
    input.marketplaceFeeGstRatePercent,
    'marketplaceFeeGstRatePercent',
    (raw, path) => readPercent(raw, path, 'ESTIMATE_GST_RATE_OUT_OF_RANGE'),
  );
  if (!feeGst.ok) return feeGst;
  const sellerCosts = readSellerCosts(input);
  if (!sellerCosts.ok) return sellerCosts;
  const settlement = readSettlement(input);
  if (!settlement.ok) return settlement;
  const adjustments = readAdjustments(input);
  if (!adjustments.ok) return adjustments;
  const model: Model = {
    order: order.value,
    chargeableWeight: weight.value,
    feeLines: feeLines.value,
    marketplaceFeeGstRatePercent: feeGst.value,
    sellerCosts: sellerCosts.value,
    ...settlement.value,
    scenario: input.scenario,
    adjustments: adjustments.value,
  };
  const applicable = checkApplicable(model);
  return applicable.ok ? ok(model) : applicable;
}
