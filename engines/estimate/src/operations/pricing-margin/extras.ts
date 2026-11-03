/**
 * Optional extras around the margin solve: an extra cost added to an entered cost, profit on a
 * quantity, and the price including GST. Each is off unless its input is given, so the base
 * operation's results (and fixtures) are unchanged.
 */
import { err, ok, type Result, type WorkingStep } from '@mangotools/core';
import {
  add,
  compare,
  div,
  mul,
  type RoundingMode,
  toFixedString,
} from '@mangotools/engine-numeric';
import { readDecimal } from '../../lib/decimal-input.ts';
import type { MarginInput } from './schema.ts';

const given = (v: string | number | undefined) => v !== undefined && v !== '';
const costIsInput = (input: MarginInput) => !input.solve.startsWith('cost-from-price');

/** The input with `extraCost` folded into `cost`, plus the working step that shows it. */
export function withExtraCost(
  input: MarginInput,
  rounding: RoundingMode,
): Result<{ input: MarginInput; working: WorkingStep[] }> {
  if (!given(input.extraCost) || !costIsInput(input) || !given(input.cost)) {
    return ok({ input, working: [] });
  }
  const extra = readDecimal(input.extraCost as string | number, 'extraCost', {
    maxDecimals: 2,
    allowNegative: false,
  });
  if (!extra.ok) return extra;
  const base = readDecimal(input.cost as string | number, 'cost', {
    maxDecimals: 2,
    allowNegative: false,
  });
  if (!base.ok) return base;
  const total = toFixedString(add(base.value, extra.value), 2, rounding);
  return ok({
    input: { ...input, cost: total },
    working: [
      {
        ref: 'cost',
        formulaKey: 'margin.extraCost',
        variables: { cost: base.value, extraCost: extra.value },
        result: total,
      },
    ],
  });
}

/** profit × quantity; null when no quantity is given. */
export function profitTotal(
  input: MarginInput,
  profit: string,
  rounding: RoundingMode,
): Result<{ value: string | null; working: WorkingStep[] }> {
  if (!given(input.quantity)) return ok({ value: null, working: [] });
  const qty = readDecimal(input.quantity as string | number, 'quantity', {
    maxDecimals: 0,
    allowNegative: false,
  });
  if (!qty.ok || compare(qty.value, '1') < 0 || compare(qty.value, '10000000') > 0) {
    return err('ESTIMATE_INVALID_QUANTITY', { path: 'quantity' });
  }
  const value = toFixedString(mul(profit, qty.value), 2, rounding);
  return ok({
    value,
    working: [
      {
        ref: 'profitTotal',
        formulaKey: 'margin.profitTotal',
        variables: { profit, quantity: qty.value },
        result: value,
      },
    ],
  });
}

/** price × (1 + GST%); null when no GST rate is given. */
export function priceWithGst(
  input: MarginInput,
  price: string,
  rounding: RoundingMode,
): Result<{ value: string | null; working: WorkingStep[] }> {
  if (!given(input.gstPercent)) return ok({ value: null, working: [] });
  const rate = readDecimal(input.gstPercent as string | number, 'gstPercent', {
    maxDecimals: 2,
    allowNegative: false,
  });
  if (!rate.ok) return rate;
  if (compare(rate.value, '100') > 0) {
    return err('ESTIMATE_GST_RATE_OUT_OF_RANGE', { path: 'gstPercent' });
  }
  const value = toFixedString(mul(price, add('1', div(rate.value, '100'))), 2, rounding);
  return ok({
    value,
    working: [
      {
        ref: 'priceWithGst',
        formulaKey: 'margin.priceWithGst',
        variables: { price, percent: rate.value },
        result: value,
      },
    ],
  });
}
