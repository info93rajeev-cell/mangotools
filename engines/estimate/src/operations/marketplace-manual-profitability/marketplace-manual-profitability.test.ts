import { createTestContext, executeOperation } from '@mangotools/core';
import { add, compare, sub } from '@mangotools/engine-numeric';
import { describe, expect, it } from 'vitest';
import { messages } from '../../errors.ts';
import { marketplaceManualProfitability } from './operation.ts';
import type { ManualProfitabilityOutput } from './schema.ts';

const run = (input: Record<string, unknown>, params: Record<string, unknown> = {}) =>
  executeOperation(marketplaceManualProfitability, input, params, createTestContext());

const value = async (input: Record<string, unknown>) => {
  const result = await run(input);
  if (!result.ok) throw new Error(result.error.code);
  return result.value as ManualProfitabilityOutput;
};

const order = {
  sellingPricePerUnit: '1180',
  quantity: '2',
  productCostPerUnit: '400',
  productGstRatePercent: '18',
  marketplaceFeeGstRatePercent: '18',
  feeLines: [
    {
      id: 'referral',
      enabled: true,
      mode: 'percent',
      ratePercent: '10',
      percentageBase: 'realized-customer-value',
      gstTreatment: 'non-recoverable',
    },
    {
      id: 'closing',
      enabled: true,
      mode: 'fixed',
      amount: '20',
      quantityScope: 'per-unit',
      gstTreatment: 'recoverable',
    },
  ],
  packagingCost: { amount: '30' },
  tcs: { mode: 'percent', value: '1', percentageBase: 'tax-exclusive-revenue' },
};

describe('estimate.marketplace.manual-profitability@1', () => {
  it('keeps settlement and economic profit separate', async () => {
    const v = await value(order);
    expect(v.estimatedSettlement).toBe('2014.32');
    expect(v.economicProfit).toBe('851.52');
    // TCS and recoverable fee GST reduce settlement only.
    expect(v.totalEconomicInvestment).toBe('1148.48');
    expect(v.breakEvenSellingPrice).toBe('596.33');
  });

  it('is linear at the break-even price up to line rounding', async () => {
    const v = await value(order);
    const atBreakEven = await value({ ...order, sellingPricePerUnit: v.breakEvenSellingPrice });
    const residual = atBreakEven.economicProfit;
    expect(compare(sub(residual, '-0.05'), '0')).toBeGreaterThanOrEqual(0);
    expect(compare(residual, '0.05')).toBeLessThanOrEqual(0);
  });

  it('returns a working step for every formula and every applicable fee line', async () => {
    const v = await value(order);
    const refs = v.working.map((step) => step.ref);
    for (const ref of [
      'grossCustomerValue',
      'sellerFundedReduction',
      'realizedCustomerValue',
      'taxExclusiveRevenue',
      'orderProductGstAmount',
      'productCostTotal',
      'productGstLiabilityRecognised',
      'marketplaceFees.referral',
      'marketplaceFees.closing',
      'marketplaceFeeGstTotal',
      'sellerControlledCostsTotal',
      'scenarioEconomicCosts',
      'tcsAmount',
      'tdsAmount',
      'totalSettlementDeductions',
      'estimatedSettlement',
      'totalEconomicInvestment',
      'economicProfit',
      'profitMarginPercent',
      'roiPercent',
      'effectiveMarketplaceFeePercent',
      'breakEvenSellingPrice',
    ]) {
      expect(refs).toContain(ref);
    }
    for (const step of v.working) {
      expect(step.formulaKey.startsWith('marketplaceManualProfitability.')).toBe(true);
    }
  });

  it('preserves fee-line order and reports inactive lines as zero', async () => {
    const v = await value({
      ...order,
      feeLines: [{ ...order.feeLines[1], enabled: false }, order.feeLines[0]],
    });
    expect(v.marketplaceFees.map((f) => [f.id, f.applicable, f.amount])).toEqual([
      ['closing', false, '0.00'],
      ['referral', true, '236.00'],
    ]);
  });

  it('reports the break-even reason for non-determinable configurations', async () => {
    const result = await run({ ...order, scenario: 'rto' });
    expect(
      result.ok && result.warnings.find((w) => w.code.includes('BREAK_EVEN'))?.details,
    ).toEqual({ reason: 'scenario' });
  });

  it('never counts product GST as economic cost', async () => {
    const v = await value(order);
    expect(
      compare(add(v.taxExclusiveRevenue, v.orderProductGstAmount), v.realizedCustomerValue),
    ).toBe(0);
    const costs = [
      v.productCostRecognised,
      v.marketplaceFeesTotal,
      v.nonRecoverableMarketplaceFeeGst,
    ];
    const parts = [...costs, v.sellerControlledCostsTotal, v.scenarioEconomicCosts];
    const total = parts.reduce((sum, part) => add(sum, part), '0');
    expect(compare(total, v.totalEconomicInvestment)).toBe(0);
  });

  it('has an English message for every declared code and warning', () => {
    const codes = [
      ...marketplaceManualProfitability.errors,
      'ESTIMATE_BREAK_EVEN_NOT_DETERMINABLE',
      'ESTIMATE_MARGIN_UNDEFINED',
      'ESTIMATE_ROI_UNDEFINED',
      'ESTIMATE_EFFECTIVE_FEE_UNDEFINED',
    ];
    for (const code of codes) expect(messages[code]).toBeTruthy();
  });
});
