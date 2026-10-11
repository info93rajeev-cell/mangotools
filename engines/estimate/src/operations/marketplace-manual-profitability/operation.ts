import {
  defineOperation,
  type OpWarning,
  ok,
  type Result,
  type WorkingStep,
  warning,
} from '@mangotools/core';
import type { RoundingMode } from '@mangotools/engine-numeric';
import { breakEven } from './break-even.ts';
import { computeFees } from './fees.ts';
import { type Model, sellerCostNames } from './model.ts';
import { money, orderValues } from './order.ts';
import { readModel } from './read-input.ts';
import {
  type ManualProfitabilityOutput,
  manualProfitabilityInput,
  manualProfitabilityOutput,
  manualProfitabilityParams,
} from './schema.ts';
import { computeTotals, type Totals } from './totals.ts';
import { type AdjustmentRef, orderWorking, totalsWorking } from './working.ts';

function sellerCostVariables(model: Model, rounding: RoundingMode): Record<string, string> {
  const variables: Record<string, string> = {};
  for (const name of sellerCostNames) {
    const cost = model.sellerCosts[name];
    const applies = cost?.scenarios.includes(model.scenario) ?? false;
    variables[name] = money(applies && cost ? cost.amount : '0', rounding);
  }
  return variables;
}

function adjustmentVariables(model: Model): Record<AdjustmentRef, Record<string, string>> {
  const groups: Record<AdjustmentRef, Record<string, string>> = {
    scenarioEconomicCosts: {},
    scenarioEconomicCredits: {},
    scenarioSettlementDeductions: {},
    scenarioSettlementCredits: {},
  };
  for (const a of model.adjustments) {
    if (!a.scenarios.includes(model.scenario)) continue;
    const charge = a.direction === 'charge';
    if (a.economic)
      groups[charge ? 'scenarioEconomicCosts' : 'scenarioEconomicCredits'][a.id] = a.amount;
    if (a.settlement) {
      groups[charge ? 'scenarioSettlementDeductions' : 'scenarioSettlementCredits'][a.id] =
        a.amount;
    }
  }
  return groups;
}

function ratioWarnings(totals: Totals): OpWarning[] {
  const warnings: OpWarning[] = [];
  if (totals.profitMarginPercent === null) {
    warnings.push(warning('ESTIMATE_MARGIN_UNDEFINED', { path: 'scenario' }));
  }
  if (totals.roiPercent === null) warnings.push(warning('ESTIMATE_ROI_UNDEFINED'));
  if (totals.effectiveMarketplaceFeePercent === null) {
    warnings.push(warning('ESTIMATE_EFFECTIVE_FEE_UNDEFINED'));
  }
  return warnings;
}

function calculate(model: Model, rounding: RoundingMode): Result<ManualProfitabilityOutput> {
  const values = orderValues(model.order, model.scenario, rounding);
  const fees = computeFees({ model, values, rounding });
  if (!fees.ok) return fees;
  const totals = computeTotals(model, values, fees.value.fees, rounding);
  const even = breakEven({
    model,
    values,
    fees: fees.value.fees,
    sellerControlledCostsTotal: totals.sellerControlledCostsTotal,
    rounding,
  });
  const working: WorkingStep[] = [
    ...orderWorking(model, values),
    ...fees.value.working,
    ...totalsWorking(
      values,
      totals,
      sellerCostVariables(model, rounding),
      adjustmentVariables(model),
    ),
  ];
  const warnings = ratioWarnings(totals);
  if (even.price === null) {
    warnings.push(
      warning('ESTIMATE_BREAK_EVEN_NOT_DETERMINABLE', { details: { reason: even.reason } }),
    );
  } else {
    working.push(even.working);
  }
  return ok(
    {
      scenario: model.scenario,
      ...values,
      marketplaceFees: fees.value.fees,
      ...totals,
      breakEvenSellingPrice: even.price,
      working,
    },
    warnings,
  );
}

export const marketplaceManualProfitability = defineOperation({
  id: 'estimate.marketplace.manual-profitability',
  major: 1,
  title: 'Manual marketplace profitability',
  summary:
    'Estimates order profit and settlement from manually entered marketplace fees, costs and taxes.',
  input: manualProfitabilityInput,
  params: manualProfitabilityParams,
  output: manualProfitabilityOutput,
  errors: [
    'ESTIMATE_MISSING_INPUT',
    'ESTIMATE_INVALID_NUMBER',
    'ESTIMATE_TOO_MANY_DECIMALS',
    'ESTIMATE_NEGATIVE_AMOUNT',
    'ESTIMATE_NEGATIVE_VALUE',
    'ESTIMATE_PRICE_ZERO',
    'ESTIMATE_GST_RATE_OUT_OF_RANGE',
    'ESTIMATE_INVALID_QUANTITY',
    'ESTIMATE_PERCENT_OUT_OF_RANGE',
    'ESTIMATE_DISCOUNT_EXCEEDS_VALUE',
    'ESTIMATE_DUPLICATE_ID',
    'ESTIMATE_TOO_MANY_ITEMS',
    'ESTIMATE_MISSING_FEE_VALUE',
    'ESTIMATE_MALFORMED_SLAB',
    'ESTIMATE_OVERLAPPING_SLABS',
    'ESTIMATE_NO_MATCHING_SLAB',
    'ESTIMATE_MISSING_WEIGHT',
    'ESTIMATE_UNIT_MISMATCH',
    'ESTIMATE_INVALID_SCENARIO_LIST',
  ],
  runtimes: ['worker', 'node'],
  cost: { weight: 'light' },
  exposure: 'internal',
  dataClass: 'public',
  run(input, params) {
    const model = readModel(input);
    if (!model.ok) return model;
    return calculate(model.value, params.rounding);
  },
});
