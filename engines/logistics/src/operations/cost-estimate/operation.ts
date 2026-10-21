import { defineOperation, ok } from '@mangotools/core';
import { toFixedString } from '@mangotools/engine-numeric';
import {
  estimateFreight,
  freightNotices,
  freightWorkingSteps,
  shapeFreight,
} from '../../lib/freight-cost.ts';
import { readFreightTerms } from '../../lib/freight-terms.ts';
import { readRateQuantity } from '../../lib/rate-quantity.ts';
import { costEstimateInput, costEstimateOutput, costEstimateParams } from './schema.ts';

const PATHS = { rate: 'rate', minimumCharge: 'minimumCharge', otherCharges: 'otherCharges' };

export const costEstimate = defineOperation({
  id: 'logistics.cost.estimate',
  major: 1,
  title: 'Freight cost estimate',
  summary:
    'Estimated freight cost from your own rate per m³ or per container, with an optional minimum and other charges.',
  input: costEstimateInput,
  params: costEstimateParams,
  output: costEstimateOutput,
  errors: [
    'LOGISTICS_MISSING_INPUT',
    'LOGISTICS_INVALID_NUMBER',
    'LOGISTICS_TOO_MANY_DECIMALS',
    'LOGISTICS_NOT_POSITIVE',
    'LOGISTICS_AMOUNT_NEGATIVE',
    'LOGISTICS_AMOUNT_TOO_LARGE',
    'LOGISTICS_RATE_QUANTITY_NOT_POSITIVE',
    'LOGISTICS_CONTAINER_COUNT_NOT_WHOLE',
    'LOGISTICS_RATE_QUANTITY_TOO_LARGE',
  ],
  runtimes: ['worker', 'node'],
  cost: { weight: 'light' },
  exposure: 'internal',
  dataClass: 'public',
  run(input, params) {
    const quantity = readRateQuantity(input.quantity, input.rateBasis, 'quantity');
    if (!quantity.ok) return quantity;
    const terms = readFreightTerms(input, PATHS);
    if (!terms.ok) return terms;
    const estimate = estimateFreight(quantity.value, terms.value);
    const shown = (value: string) => toFixedString(value, params.decimals, params.rounding);
    const working = freightWorkingSteps(input.rateBasis, quantity.value, terms.value, estimate);
    return ok(
      {
        ...shapeFreight(
          input.rateBasis,
          input.currency,
          quantity.value,
          terms.value,
          estimate,
          shown,
        ),
        working,
      },
      freightNotices(estimate),
    );
  },
});
