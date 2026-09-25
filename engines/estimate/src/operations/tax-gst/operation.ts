import { defineOperation, err, ok } from '@mangotools/core';
import { compare, parseDecimal } from '@mangotools/engine-numeric';
import { readDecimal } from '../../lib/decimal-input.ts';
import { computeGst } from './compute.ts';
import { gstInput, gstOutput, gstParams } from './schema.ts';

export const taxGst = defineOperation({
  id: 'estimate.tax.gst',
  major: 1,
  title: 'GST calculation (India)',
  summary:
    'Adds or removes GST and splits it into CGST + SGST (intra-state) or IGST (inter-state).',
  input: gstInput,
  params: gstParams,
  output: gstOutput,
  errors: [
    'ESTIMATE_INVALID_NUMBER',
    'ESTIMATE_TOO_MANY_DECIMALS',
    'ESTIMATE_NEGATIVE_AMOUNT',
    'ESTIMATE_GST_RATE_OUT_OF_RANGE',
  ],
  runtimes: ['worker', 'node'],
  cost: { weight: 'light' },
  exposure: 'internal',
  dataClass: 'public',
  run(input, params) {
    const amount = readDecimal(input.amount, 'amount', {
      maxDecimals: 2,
      allowNegative: false,
      negativeCode: 'ESTIMATE_NEGATIVE_AMOUNT',
    });
    if (!amount.ok) return amount;
    const rateText = typeof input.rate === 'number' ? String(input.rate) : input.rate;
    const rateParsed = parseDecimal(rateText, { maxDecimals: 4 });
    if (!rateParsed.ok) {
      return rateParsed.code === 'TOO_MANY_DECIMALS'
        ? err('ESTIMATE_TOO_MANY_DECIMALS', { path: 'rate', details: { max: 4 } })
        : err('ESTIMATE_INVALID_NUMBER', { path: 'rate' });
    }
    if (compare(rateParsed.value, '0') < 0 || compare(rateParsed.value, '100') > 0) {
      return err('ESTIMATE_GST_RATE_OUT_OF_RANGE', { path: 'rate' });
    }
    return ok(
      computeGst({
        amount: amount.value,
        rate: rateParsed.value,
        mode: input.mode,
        supply: input.supply,
        rounding: params.rounding.mode,
      }),
    );
  },
});
