import type { WorkingStep } from '@mangotools/core';
import type { Model, OrderValues } from './model.ts';
import type { Totals } from './totals.ts';

const KEY = 'marketplaceManualProfitability';

export type AdjustmentRef =
  | 'scenarioEconomicCosts'
  | 'scenarioEconomicCredits'
  | 'scenarioSettlementDeductions'
  | 'scenarioSettlementCredits';

function step(ref: string, variables: Record<string, string>, result: string): WorkingStep {
  return { ref, formulaKey: `${KEY}.${ref}`, variables, result };
}

/** Steps for TASK-008L steps 1–2 (order and scenario-recognised values). */
export function orderWorking(model: Model, v: OrderValues): WorkingStep[] {
  const { order } = model;
  const gstNote = order.taxMode === 'gst-inclusive' ? 'gstInclusive' : 'gstExclusive';
  return [
    step(
      'grossCustomerValue',
      { sellingPricePerUnit: order.sellingPricePerUnit, quantity: order.quantity },
      v.grossCustomerValue,
    ),
    step(
      'sellerFundedReduction',
      { promotionalDiscount: order.promotionalDiscount, couponDiscount: order.couponDiscount },
      v.sellerFundedReduction,
    ),
    step(
      'realizedCustomerValue',
      { grossCustomerValue: v.grossCustomerValue, sellerFundedReduction: v.sellerFundedReduction },
      v.realizedCustomerValue,
    ),
    {
      ...step(
        'taxExclusiveRevenue',
        {
          realizedCustomerValue: v.realizedCustomerValue,
          productGstRatePercent: order.productGstRatePercent,
        },
        v.taxExclusiveRevenue,
      ),
      noteKey: `${KEY}.note.${gstNote}`,
    },
    step(
      'orderProductGstAmount',
      {
        realizedCustomerValue: v.realizedCustomerValue,
        taxExclusiveRevenue: v.taxExclusiveRevenue,
      },
      v.orderProductGstAmount,
    ),
    step(
      'customerInvoiceValue',
      {
        realizedCustomerValue: v.realizedCustomerValue,
        orderProductGstAmount: v.orderProductGstAmount,
      },
      v.customerInvoiceValue,
    ),
    step(
      'productCostTotal',
      { productCostPerUnit: order.productCostPerUnit, quantity: order.quantity },
      v.productCostTotal,
    ),
    {
      ...step(
        'productGstLiabilityRecognised',
        { scenario: model.scenario, orderProductGstAmount: v.orderProductGstAmount },
        v.productGstLiabilityRecognised,
      ),
      noteKey: `${KEY}.note.scenario.${model.scenario}`,
    },
  ];
}

type Source = Record<string, string | null>;

const ADJUSTMENT_REFS: readonly AdjustmentRef[] = [
  'scenarioEconomicCosts',
  'scenarioEconomicCredits',
  'scenarioSettlementDeductions',
  'scenarioSettlementCredits',
];

/** Result steps: [ref, variable names] in calculation order (TASK-008L steps 3, 5 and 6). */
const RESULT_STEPS: readonly (readonly [string, readonly string[]])[] = [
  ['marketplaceFeeGstTotal', ['recoverableMarketplaceFeeGst', 'nonRecoverableMarketplaceFeeGst']],
  ['tcsAmount', ['taxExclusiveRevenue', 'customerInvoiceValue']],
  ['tdsAmount', ['taxExclusiveRevenue', 'customerInvoiceValue']],
  [
    'totalSettlementDeductions',
    [
      'marketplaceFeesTotal',
      'marketplaceFeeGstTotal',
      'tcsAmount',
      'tdsAmount',
      'otherSettlementDeductionsApplied',
      'scenarioSettlementDeductions',
    ],
  ],
  [
    'estimatedSettlement',
    [
      'invoiceValueSettled',
      'totalSettlementDeductions',
      'settlementCreditsApplied',
      'scenarioSettlementCredits',
    ],
  ],
  [
    'totalEconomicInvestment',
    [
      'productCostRecognised',
      'marketplaceFeesTotal',
      'nonRecoverableMarketplaceFeeGst',
      'sellerControlledCostsTotal',
      'scenarioEconomicCosts',
    ],
  ],
  ['economicProfit', ['revenueRecognised', 'totalEconomicInvestment', 'scenarioEconomicCredits']],
  ['profitMarginPercent', ['economicProfit', 'revenueRecognised']],
  ['roiPercent', ['economicProfit', 'totalEconomicInvestment']],
  [
    'effectiveMarketplaceFeePercent',
    ['marketplaceFeesTotal', 'nonRecoverableMarketplaceFeeGst', 'taxExclusiveRevenue'],
  ],
];

function pick(source: Source, keys: readonly string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'string') out[key] = value;
  }
  return out;
}

/** Steps for seller costs, adjustments, fee GST, settlement lines and the results. */
export function totalsWorking(
  values: OrderValues,
  totals: Totals,
  sellerCosts: Record<string, string>,
  adjustments: Record<AdjustmentRef, Record<string, string>>,
): WorkingStep[] {
  const source: Source = { ...values, ...totals };
  const steps = [
    step('sellerControlledCostsTotal', sellerCosts, totals.sellerControlledCostsTotal),
    ...ADJUSTMENT_REFS.map((ref) => step(ref, adjustments[ref], totals[ref])),
  ];
  for (const [ref, keys] of RESULT_STEPS) {
    const result = source[ref];
    if (typeof result === 'string') steps.push(step(ref, pick(source, keys), result));
  }
  return steps;
}
