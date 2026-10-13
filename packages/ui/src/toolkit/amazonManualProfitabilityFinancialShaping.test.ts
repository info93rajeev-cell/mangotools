import { readFileSync } from 'node:fs';
import type { FieldValues } from '@mangotools/runtime';
import { fixtureSchema, type ResolvedPreset } from '@mangotools/schemas';
import { describe, expect, it } from 'vitest';
import { amazonManualProfitabilityInput } from './amazonManualProfitabilityInput.ts';

const fixture = fixtureSchema.parse(
  JSON.parse(
    readFileSync(
      new URL('./amazonManualProfitabilityScoped.fixture.json', import.meta.url),
      'utf8',
    ),
  ),
);
const ordinary: ResolvedPreset = JSON.parse(
  readFileSync(
    new URL('../../../../generated/presets/estimate/gst.india.json', import.meta.url),
    'utf8',
  ),
);
const core = {
  sellingPricePerUnit: '1000.00',
  quantity: '2',
  productCostPerUnit: '400.00',
  promotionalDiscount: '10.00',
  couponDiscount: '5.00',
  productGstRatePercent: '0',
  sellingPriceTaxMode: 'gst-inclusive',
  scenario: 'successful-sale',
};
const initial: FieldValues = {
  ...core,
  ...Object.fromEntries(
    ['referral', 'closing', 'weightHandling', 'pickPack', 'otherService', 'tcs', 'tds'].map((p) => [
      `${p}Mode`,
      'off',
    ]),
  ),
};
function prepare(extra: FieldValues = {}) {
  const values = Object.freeze({ ...initial, ...extra });
  const preset: ResolvedPreset = {
    ...ordinary,
    id: 'estimate/amazon.manual-profitability',
    operation: 'estimate.marketplace.manual-profitability@1',
    params: { rounding: 'half-up' },
    userOptions: {},
    locked: ['rounding'],
    fields: Object.fromEntries(
      Object.keys(values).map((key, order) => [
        key,
        {
          kind: 'text',
          order,
          labelKey: key,
          required: key === 'sellingPricePerUnit',
          uiOnly: !(key in core || key === 'marketplaceFeeGstRatePercent'),
        },
      ]),
    ),
  };
  return amazonManualProfitabilityInput(preset, values);
}
function input(extra: FieldValues = {}) {
  const result = prepare(extra);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(result.error.code);
  expect(result.value.missing).toEqual([]);
  return result.value.input;
}

describe('scoped Amazon request mappings', () => {
  it.each([
    ['packaging', 'packagingCost'],
    ['sellerShipping', 'sellerShippingCost'],
    ['advertising', 'advertisingCost'],
    ['otherTransaction', 'otherTransactionCost'],
    ['otherSettlement', 'otherSettlementDeductions'],
    ['settlementCredit', 'settlementCredits'],
  ])('maps %s, preserves zero, omits blanks and requires explicit applicability', (p, key) => {
    expect(input()).not.toHaveProperty(key);
    expect(
      input({
        [`${p}Amount`]: '0',
        [`${p}ApplyCancellation`]: 'true',
        [`${p}ApplyRto`]: 'true',
        [`${p}ApplyReturn`]: 'true',
        [`${p}ApplySale`]: 'true',
      })[key],
    ).toEqual({
      amount: '0',
      scenarios: ['successful-sale', 'customer-return', 'rto', 'cancellation'],
    });
    const missing = prepare({ [`${p}Amount`]: '12.50' });
    expect(missing.ok && missing.value.missing).toContain(`${p}ApplySale`);
  });
  it.each(['tcs', 'tds'])(
    'maps fixed/percent %s without legal/numeric defaults or stale bases',
    (p) => {
      expect(input({ [`${p}Value`]: 'stale' })).not.toHaveProperty(p);
      const values = {
        [`${p}Mode`]: 'fixed',
        [`${p}Value`]: '0.00',
        [`${p}ApplySale`]: 'true',
        [`${p}PercentageBase`]: 'stale',
      };
      expect(input(values)[p]).toEqual({
        mode: 'fixed',
        value: '0.00',
        scenarios: ['successful-sale'],
      });
      for (const base of ['tax-exclusive-revenue', 'customer-invoice-value'])
        expect(
          input({ ...values, [`${p}Mode`]: 'percent', [`${p}PercentageBase`]: base })[p],
        ).toEqual({
          mode: 'percent',
          value: '0.00',
          percentageBase: base,
          scenarios: ['successful-sale'],
        });
      for (const [key, value] of [
        [`${p}Value`, ''],
        [`${p}PercentageBase`, 'unselected'],
      ]) {
        const result = prepare({
          ...values,
          [`${p}Mode`]: 'percent',
          [`${p}PercentageBase`]: 'tax-exclusive-revenue',
          [key]: value,
        });
        expect(result.ok && result.value.missing).toContain(key);
      }
    },
  );
  it('maps all adjustments in order with explicit effects/directions, excluding successful-sale', () => {
    expect(input(fixture.input as FieldValues)).toEqual(fixture.expected);
    for (const effects of ['economic', 'settlement', 'both']) {
      const result = input({
        otherAdjustmentAmount: '4.00',
        otherAdjustmentDirection: 'credit',
        otherAdjustmentEffects: effects,
        otherAdjustmentApplyReturn: 'true',
      });
      expect(result.scenarioAdjustments).toEqual([
        {
          id: 'other-adjustment',
          amount: '4.00',
          direction: 'credit',
          economic: effects !== 'settlement',
          settlement: effects !== 'economic',
          scenarios: ['customer-return'],
        },
      ]);
    }
  });
  it('reports missing adjustment controls and typed unsupported direction without financial error details', () => {
    expect(input()).not.toHaveProperty('scenarioAdjustments');
    const values = {
      otherAdjustmentAmount: '1.00',
      otherAdjustmentDirection: 'charge',
      otherAdjustmentEffects: 'both',
      otherAdjustmentApplyReturn: 'true',
    };
    for (const [key, value] of [
      ['otherAdjustmentEffects', 'unselected'],
      ['otherAdjustmentApplyReturn', 'false'],
    ]) {
      const result = prepare({ ...values, [key]: value });
      expect(result.ok && result.value.missing).toContain(key);
    }
    expect(prepare({ ...values, otherAdjustmentDirection: 'invalid' })).toEqual({
      ok: false,
      error: {
        code: 'INVALID_INPUT',
        messageKey: 'errors.INVALID_INPUT',
        path: 'otherAdjustmentDirection',
      },
    });
  });
  it.each(['tcs', 'tds'])(
    'rejects unsupported %s controls and requires explicit scenarios',
    (p) => {
      const values = { [`${p}Mode`]: 'percent', [`${p}Value`]: '0', [`${p}ApplySale`]: true };
      for (const key of [`${p}Mode`, `${p}PercentageBase`]) {
        expect(prepare({ ...values, [key]: 'invalid' })).toEqual({
          ok: false,
          error: { code: 'INVALID_INPUT', messageKey: 'errors.INVALID_INPUT', path: key },
        });
      }
      const result = prepare({
        ...values,
        [`${p}PercentageBase`]: 'customer-invoice-value',
        [`${p}ApplySale`]: false,
      });
      expect(result.ok && result.value.missing).toEqual([`${p}ApplySale`]);
    },
  );
  it('omits blank amounts and preserves engine-owned numeric validation', () => {
    expect(
      input({ packagingAmount: '   ', returnChargeAmount: '', returnChargeEffects: 'bad' }),
    ).toEqual(input());
    expect(input({ packagingAmount: '-1.234', packagingApplySale: true }).packagingCost).toEqual({
      amount: '-1.234',
      scenarios: ['successful-sale'],
    });
    const values = { otherAdjustmentAmount: '1.00', otherAdjustmentApplyReturn: true };
    const missing = prepare({
      ...values,
      otherAdjustmentDirection: '',
      otherAdjustmentEffects: '',
    });
    expect(missing.ok && missing.value.missing).toEqual([
      'otherAdjustmentEffects',
      'otherAdjustmentDirection',
    ]);
    expect(
      prepare({ ...values, otherAdjustmentDirection: 'charge', otherAdjustmentEffects: 'bad' }),
    ).toEqual({
      ok: false,
      error: {
        code: 'INVALID_INPUT',
        messageKey: 'errors.INVALID_INPUT',
        path: 'otherAdjustmentEffects',
      },
    });
  });
});
