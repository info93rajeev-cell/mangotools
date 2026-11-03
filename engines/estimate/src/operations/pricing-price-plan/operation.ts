import { defineOperation, type OpWarning, ok, type WorkingStep, warning } from '@mangotools/core';
import { computePlan, type PlanValues, readPlanInputs, solvePrice } from './compute.ts';
import { pricePlanInput, pricePlanOutput, pricePlanParams } from './schema.ts';

function working(out: PlanValues): WorkingStep[] {
  const steps: WorkingStep[] = [
    {
      ref: 'profitPerUnit',
      formulaKey: 'pricePlan.profit',
      variables: { sellingPrice: out.sellingPrice, totalCost: out.totalCost },
      result: out.profitPerUnit,
    },
  ];
  if (out.markupPercent !== null) {
    steps.push({
      ref: 'markupPercent',
      formulaKey: 'pricePlan.markup',
      variables: { profit: out.profitPerUnit, totalCost: out.totalCost },
      result: out.markupPercent,
    });
  }
  if (out.marginPercent !== null) {
    steps.push({
      ref: 'marginPercent',
      formulaKey: 'pricePlan.margin',
      variables: { profit: out.profitPerUnit, sellingPrice: out.sellingPrice },
      result: out.marginPercent,
    });
  }
  return steps;
}

function warningsFor(out: PlanValues): OpWarning[] {
  return out.markupPercent === null
    ? [warning('ESTIMATE_MARKUP_UNDEFINED', { path: 'productCost' })]
    : [];
}

export const pricingPricePlan = defineOperation({
  id: 'estimate.pricing.price-plan',
  major: 1,
  title: 'Selling-price plan',
  summary:
    'Selling price from a markup, a given price or a target margin, with profit, quantity totals and GST on top.',
  input: pricePlanInput,
  params: pricePlanParams,
  output: pricePlanOutput,
  errors: [
    'ESTIMATE_INVALID_NUMBER',
    'ESTIMATE_TOO_MANY_DECIMALS',
    'ESTIMATE_NEGATIVE_VALUE',
    'ESTIMATE_MISSING_INPUT',
    'ESTIMATE_PRICE_ZERO',
    'ESTIMATE_MARKUP_OUT_OF_RANGE',
    'ESTIMATE_MARGIN_OUT_OF_RANGE',
    'ESTIMATE_GST_RATE_OUT_OF_RANGE',
    'ESTIMATE_INVALID_QUANTITY',
  ],
  runtimes: ['worker', 'node'],
  cost: { weight: 'light' },
  exposure: 'internal',
  dataClass: 'public',
  run(input, params) {
    const read = readPlanInputs(input);
    if (!read.ok) return read;
    const price = solvePrice(input, read.value);
    if (!price.ok) return price;
    const out = computePlan(read.value, price.value, params.rounding);
    return ok({ ...out, working: working(out) }, warningsFor(out));
  },
});
