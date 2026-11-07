import { defineOperation, err, ok } from '@mangotools/core';
import { estimateCost } from './estimate.ts';
import { costEstimateInput, costEstimateOutput, costEstimateParams } from './schema.ts';
import { validateCostInput } from './validate.ts';

export const costEstimate = defineOperation({
  id: 'food.cost.estimate',
  major: 1,
  title: 'Estimate ingredient and event costs',
  summary:
    'Calculates ingredient costs, total event cost, cost per guest, and budget variance from consolidated shopping lines and prices.',
  input: costEstimateInput,
  params: costEstimateParams,
  output: costEstimateOutput,
  errors: [
    'FOOD_INVALID_QUANTITY',
    'FOOD_INVALID_PRICE',
    'FOOD_PRICE_DIMENSION_MISMATCH',
    'FOOD_DUPLICATE_PRICE',
  ],
  runtimes: ['worker', 'node'],
  cost: { weight: 'light' },
  exposure: 'internal',
  dataClass: 'public',
  run(input, params) {
    const validated = validateCostInput(input, params.quantityBasis);
    if (!validated.ok) {
      return err(validated.error.code, {
        path: validated.error.path,
        details: validated.error.details,
      });
    }

    const { output, warnings } = estimateCost(validated.value, params, input.guests);
    return ok(output, warnings);
  },
});
