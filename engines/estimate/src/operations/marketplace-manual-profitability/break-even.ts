import type { WorkingStep } from '@mangotools/core';
import { add, compare, div, mul, type RoundingMode, sub } from '@mangotools/engine-numeric';
import type { FeeLine, Model, OrderValues } from './model.ts';
import { money } from './order.ts';
import type { FeeResult } from './schema.ts';

export type BreakEvenReason = 'scenario' | 'price-slabs' | 'no-positive-solution';

export type BreakEven =
  | { price: string; working: WorkingStep }
  | { price: null; reason: BreakEvenReason };

interface Inputs {
  model: Model;
  values: OrderValues;
  fees: readonly FeeResult[];
  sellerControlledCostsTotal: string;
  rounding: RoundingMode;
}

/**
 * Multiplier of R = realizedCustomerValue for each percentage base. In GST-inclusive mode the
 * whole equation is multiplied by u = 1 + g so that no 1/u term (an inexact division) appears.
 */
function baseMultiplier(line: FeeLine, inclusive: boolean, u: string): string {
  if (line.percentageBase === 'tax-exclusive-revenue') return '1';
  if (line.percentageBase === 'customer-invoice-value') return u;
  return inclusive ? u : '1';
}

/** Linear terms of economic profit in R: fixed costs F and the summed percentage factor. */
function linearTerms(inputs: Inputs, u: string): { fixed: string; percent: string } | null {
  const { model, values } = inputs;
  const inclusive = model.order.taxMode === 'gst-inclusive';
  const h = div(model.marketplaceFeeGstRatePercent ?? '0', '100');
  let fixed = add(values.productCostTotal, inputs.sellerControlledCostsTotal);
  let percent = '0';
  for (const [index, line] of model.feeLines.entries()) {
    if (!inputs.fees[index]?.applicable) continue;
    if (line.mode === 'price-slabs') return null;
    const m = line.gstTreatment === 'non-recoverable' ? add('1', h) : '1';
    if (line.mode === 'percent') {
      const k = mul(div(line.ratePercent ?? '0', '100'), m);
      percent = add(percent, mul(k, baseMultiplier(line, inclusive, u)));
    } else {
      fixed = add(fixed, mul(inputs.fees[index]?.amount ?? '0', m));
    }
  }
  return { fixed, percent };
}

/** TASK-008L step 7: closed-form selling price per unit at which economic profit is zero. */
export function breakEven(inputs: Inputs): BreakEven {
  const { model, values, rounding } = inputs;
  if (model.scenario !== 'successful-sale') return { price: null, reason: 'scenario' };
  const u = add('1', div(model.order.productGstRatePercent, '100'));
  const terms = linearTerms(inputs, u);
  if (terms === null) return { price: null, reason: 'price-slabs' };
  const d = sub('1', terms.percent);
  if (compare(d, '0') <= 0) return { price: null, reason: 'no-positive-solution' };
  const scaledFixed = model.order.taxMode === 'gst-inclusive' ? mul(terms.fixed, u) : terms.fixed;
  const realized = div(scaledFixed, d);
  const exact = div(add(realized, values.sellerFundedReduction), model.order.quantity);
  if (compare(exact, '0') <= 0) return { price: null, reason: 'no-positive-solution' };
  const price = money(exact, rounding);
  return {
    price,
    working: {
      ref: 'breakEvenSellingPrice',
      formulaKey: 'marketplaceManualProfitability.breakEvenSellingPrice',
      variables: {
        fixedCosts: terms.fixed,
        percentFactor: d,
        sellerFundedReduction: values.sellerFundedReduction,
        quantity: model.order.quantity,
      },
      result: price,
    },
  };
}
