import { err, ok, type Result, type WorkingStep } from '@mangotools/core';
import {
  add,
  compare,
  div,
  mul,
  type RoundingMode,
  sub,
  toFixedString,
} from '@mangotools/engine-numeric';
import { readDecimal } from '../../lib/decimal-input.ts';
import type { MarginInput } from './schema.ts';

export interface Solved {
  cost: string;
  price: string;
  working: WorkingStep[];
}

type Field = 'cost' | 'price' | 'marginPercent' | 'markupPercent';

function need(
  input: MarginInput,
  field: Field,
  maxDecimals: number,
  allowNegative: boolean,
): Result<string> {
  const raw = input[field];
  if (raw === undefined || raw === '') return err('ESTIMATE_MISSING_INPUT', { path: field });
  return readDecimal(raw, field, { maxDecimals, allowNegative });
}

const step = (
  ref: string,
  formulaKey: string,
  variables: Record<string, string>,
  result: string,
): WorkingStep => ({
  ref,
  formulaKey,
  variables,
  result,
});

/** Finds cost and price (money rounded to 2 dp) from the inputs required by `solve`. */
export function solvePrices(input: MarginInput, rounding: RoundingMode): Result<Solved> {
  const money = (v: string) => toFixedString(v, 2, rounding);
  const first: Field = input.solve.startsWith('cost-from-price') ? 'price' : 'cost';
  const a = need(input, first, 2, false);
  if (!a.ok) return a;
  if (input.solve === 'from-cost-and-price') {
    const price = need(input, 'price', 2, false);
    if (!price.ok) return price;
    if (compare(price.value, '0') === 0) return err('ESTIMATE_PRICE_ZERO', { path: 'price' });
    return ok({ cost: money(a.value), price: money(price.value), working: [] });
  }
  const pctField: Field = input.solve.endsWith('margin') ? 'marginPercent' : 'markupPercent';
  const pct = need(input, pctField, 4, true);
  if (!pct.ok) return pct;
  const factorText =
    pctField === 'marginPercent'
      ? sub('1', div(pct.value, '100'))
      : add('1', div(pct.value, '100'));
  if (pctField === 'marginPercent' && compare(pct.value, '100') >= 0) {
    return err('ESTIMATE_MARGIN_OUT_OF_RANGE', { path: 'marginPercent' });
  }
  if (pctField === 'markupPercent' && compare(pct.value, '-100') <= 0) {
    return err('ESTIMATE_MARKUP_OUT_OF_RANGE', { path: 'markupPercent' });
  }
  const vars = { value: money(a.value), percent: pct.value };
  switch (input.solve) {
    case 'price-from-cost-and-margin': {
      const price = money(div(a.value, factorText));
      return ok({
        cost: money(a.value),
        price,
        working: [step('price', 'margin.solve.priceFromMargin', vars, price)],
      });
    }
    case 'cost-from-price-and-margin': {
      const cost = money(mul(a.value, factorText));
      return ok({
        cost,
        price: money(a.value),
        working: [step('cost', 'margin.solve.costFromMargin', vars, cost)],
      });
    }
    case 'price-from-cost-and-markup': {
      const price = money(mul(a.value, factorText));
      return ok({
        cost: money(a.value),
        price,
        working: [step('price', 'margin.solve.priceFromMarkup', vars, price)],
      });
    }
    default: {
      const cost = money(div(a.value, factorText));
      return ok({
        cost,
        price: money(a.value),
        working: [step('cost', 'margin.solve.costFromMarkup', vars, cost)],
      });
    }
  }
}
