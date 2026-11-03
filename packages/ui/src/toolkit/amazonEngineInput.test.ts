import { describe, expect, it } from 'vitest';
import { AMAZON_DEFAULTS, amazonEngineInput } from './useAmazonFeeEstimator.ts';

type Line = { id: string; mode: string; gstTreatment: string; ratePercent?: string };
const lines = (input: Record<string, unknown>) => input.feeLines as Line[];

describe('Amazon studio → estimate.marketplace.manual-profitability@1 input', () => {
  it('the sample is engine fixture 023 (fees claimed as ITC, 0.5% TCS, 0.1% TDS)', () => {
    const input = amazonEngineInput(AMAZON_DEFAULTS);
    expect(input).toMatchObject({
      sellingPricePerUnit: '1500',
      productCostPerUnit: '600',
      productGstRatePercent: '18',
      packagingCost: { amount: '35' },
      advertisingCost: { amount: '60' },
      otherTransactionCost: { amount: '40' },
      tcs: { value: '0.5', percentageBase: 'tax-exclusive-revenue' },
      tds: { value: '0.1', percentageBase: 'tax-exclusive-revenue' },
    });
    expect(lines(input).map((l) => l.gstTreatment)).toEqual([
      'recoverable',
      'recoverable',
      'recoverable',
    ]);
  });

  it('fee GST is a cost when not claimed or when the seller is not registered', () => {
    const notClaimed = amazonEngineInput({ ...AMAZON_DEFAULTS, claimFeeGstCredit: false });
    expect(lines(notClaimed)[0]?.gstTreatment).toBe('non-recoverable');
    const unregistered = amazonEngineInput({ ...AMAZON_DEFAULTS, productGstRate: 0 });
    expect(lines(unregistered)[0]?.gstTreatment).toBe('non-recoverable');
    expect(unregistered).not.toHaveProperty('tcs');
  });

  it('a category makes the referral fee a percentage the engine computes', () => {
    const input = amazonEngineInput({ ...AMAZON_DEFAULTS, category: 'electronics' });
    expect(lines(input)[0]).toMatchObject({ mode: 'percent', ratePercent: '8.5' });
  });
});
