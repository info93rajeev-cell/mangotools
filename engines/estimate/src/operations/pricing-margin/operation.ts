import { defineOperation, err, type OpWarning, ok, warning } from '@mangotools/core';
import { div, isZero, mul, sub, toFixedString } from '@mangotools/engine-numeric';
import { priceWithGst, profitTotal, withExtraCost } from './extras.ts';
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
    'ESTIMATE_INVALID_QUANTITY',
    'ESTIMATE_GST_RATE_OUT_OF_RANGE',
  ],
  runtimes: ['worker', 'node'],
  cost: { weight: 'light' },
  exposure: 'internal',
  dataClass: 'public',
  run(rawInput, params) {
    const extra = withExtraCost(rawInput, params.rounding);
    if (!extra.ok) return extra;
    const input = extra.value.input;
    const solved = solvePrices(input, params.rounding);
    if (!solved.ok) return solved;
    const { cost, price } = solved.value;
    const working = [...extra.value.working, ...solved.value.working];
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
    const total = profitTotal(input, profit, params.rounding);
    if (!total.ok) return total;
    const withGst = priceWithGst(input, price, params.rounding);
    if (!withGst.ok) return withGst;
    working.push(...total.value.working, ...withGst.value.working);
    return ok(
      {
        cost,
        price,
        profit,
        marginPercent,
        markupPercent,
        profitTotal: total.value.value,
        priceWithGst: withGst.value.value,
        working,
      },
      warnings,
    );
  },
});
