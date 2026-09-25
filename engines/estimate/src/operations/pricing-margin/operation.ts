import { defineOperation, err, type OpWarning, ok, warning } from '@mangotools/core';
import { div, isZero, mul, sub, toFixedString } from '@mangotools/engine-numeric';
import { marginInput, marginOutput, marginParams } from './schema.ts';
import { solvePrices } from './solve.ts';

export const pricingMargin = defineOperation({
  id: 'estimate.pricing.margin',
  major: 1,
  title: 'Profit margin and markup',
  summary: 'Solves cost, selling price, profit, margin % and markup % from any two known values.',
  input: marginInput,
  params: marginParams,
  output: marginOutput,
  errors: [
    'ESTIMATE_INVALID_NUMBER',
    'ESTIMATE_TOO_MANY_DECIMALS',
    'ESTIMATE_NEGATIVE_VALUE',
    'ESTIMATE_MISSING_INPUT',
    'ESTIMATE_PRICE_ZERO',
    'ESTIMATE_MARGIN_OUT_OF_RANGE',
    'ESTIMATE_MARKUP_OUT_OF_RANGE',
  ],
  runtimes: ['worker', 'node'],
  cost: { weight: 'light' },
  exposure: 'internal',
  dataClass: 'public',
  run(input, params) {
    const solved = solvePrices(input, params.rounding);
    if (!solved.ok) return solved;
    const { cost, price, working } = solved.value;
    if (isZero(price)) return err('ESTIMATE_PRICE_ZERO', { path: 'price' });
    const pct = (v: string) => toFixedString(v, 2, params.rounding);
    const profit = toFixedString(sub(price, cost), 2, params.rounding);
    const marginPercent = pct(mul(div(profit, price), '100'));
    const warnings: OpWarning[] = [];
    let markupPercent: string | null = null;
    if (isZero(cost)) warnings.push(warning('ESTIMATE_MARKUP_UNDEFINED', { path: 'cost' }));
    else markupPercent = pct(mul(div(profit, cost), '100'));
    working.push({
      ref: 'profit',
      formulaKey: 'margin.profit',
      variables: { price, cost },
      result: profit,
    });
    working.push({
      ref: 'marginPercent',
      formulaKey: 'margin.margin',
      variables: { profit, price },
      result: marginPercent,
    });
    if (markupPercent !== null) {
      working.push({
        ref: 'markupPercent',
        formulaKey: 'margin.markup',
        variables: { profit, cost },
        result: markupPercent,
      });
    }
    return ok({ cost, price, profit, marginPercent, markupPercent, working }, warnings);
  },
});
