import { readFileSync } from 'node:fs';
import { buildRequest, type FieldValues } from '@mangotools/runtime';
import { fixtureSchema, type ResolvedPreset } from '@mangotools/schemas';
import { describe, expect, it } from 'vitest';
import { amazonManualProfitabilityInput } from './amazonManualProfitabilityInput.ts';

const prefixes = ['referral', 'closing', 'weightHandling', 'pickPack', 'otherService'];
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
const defaults = Object.fromEntries(prefixes.map((p) => [`${p}Mode`, 'off']));
const advanced = fixtureSchema.parse(
  JSON.parse(
    readFileSync(new URL('./amazonManualProfitabilityInput.fixture.json', import.meta.url), 'utf8'),
  ),
);
const ordinary = JSON.parse(
  readFileSync(
    new URL('../../../../generated/presets/estimate/gst.india.json', import.meta.url),
    'utf8',
  ),
);
const preset: ResolvedPreset = {
  ...ordinary,
  id: 'estimate/amazon.manual-profitability',
  operation: 'estimate.marketplace.manual-profitability@1',
  params: { rounding: 'half-up' },
  userOptions: {},
  locked: ['rounding'],
  fields: Object.fromEntries(
    [
      ...Object.keys(core),
      ...Object.keys(advanced.input),
      'referralRatePercent',
      'marketplaceFeeGstRatePercent',
      'fulfillmentMethod',
      'productCategoryLabel',
      'shippingZoneLabel',
      'showTaxes',
    ].map((key, order) => [
      key,
      {
        labelKey: key,
        kind: 'text',
        order,
        required: key === 'sellingPricePerUnit',
        uiOnly: !(key in core || key === 'marketplaceFeeGstRatePercent'),
      },
    ]),
  ),
};
const enabled = (p: string, mode: string): FieldValues => ({
  [`${p}Mode`]: mode,
  [`${p}GstTreatment`]: 'none',
  [`${p}QuantityScope`]: 'per-unit',
  [`${p}ApplySale`]: true,
});
function prepare(values: FieldValues = {}) {
  return amazonManualProfitabilityInput(preset, Object.freeze({ ...core, ...defaults, ...values }));
}
function input(values: FieldValues = {}) {
  const result = prepare(values);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(result.error.code);
  expect(result.value.missing).toEqual([]);
  return result.value.input;
}

describe('Amazon adapter core', () => {
  it('preserves generic scalars/params and strips inert context without inventing numeric fees', () => {
    const values = {
      ...core,
      ...defaults,
      fulfillmentMethod: 'FBA',
      productCategoryLabel: 'label',
      shippingZoneLabel: 'zone',
      showTaxes: true,
    };
    const base = buildRequest(preset, values);
    expect(prepare(values)).toEqual({
      ok: true,
      warnings: [],
      value: { ...base, input: { ...core, feeLines: [] } },
    });
    expect(input()).toEqual(input(values));
  });
  it('preserves generic required-field missing state', () => {
    const result = prepare({ sellingPricePerUnit: '' });
    expect(result.ok && result.value.missing).toEqual(['sellingPricePerUnit']);
  });
  it.each(['g', 'kg'])('composes weight without converting its value (%s)', (unit) => {
    expect(
      input({ chargeableWeightValue: '0.500', chargeableWeightUnit: unit }).chargeableWeight,
    ).toEqual({ value: '0.500', unit });
    expect(input()).not.toHaveProperty('chargeableWeight');
  });
  it.each(['none', 'recoverable', 'non-recoverable'])(
    'maps referral percent and explicit GST %s',
    (gst) => {
      const request = input({
        ...enabled('referral', 'percent'),
        referralRatePercent: '0',
        referralGstTreatment: gst,
        referralPriceSlabs: 'malformed stale JSON',
        marketplaceFeeGstRatePercent: '7.5000',
        referralApplyCancellation: 'true',
        referralApplyRto: true,
        referralApplyReturn: 'true',
      });
      expect(request.feeLines).toEqual([
        {
          id: 'referral',
          enabled: true,
          mode: 'percent',
          ratePercent: '0',
          percentageBase: 'realized-customer-value',
          gstTreatment: gst,
          scenarios: ['successful-sale', 'customer-return', 'rto', 'cancellation'],
        },
      ]);
      expect(request.marketplaceFeeGstRatePercent).toBe('7.5000');
    },
  );
  it.each([
    ['closing', 'closing'],
    ['weightHandling', 'weight-handling'],
    ['pickPack', 'pick-pack'],
    ['otherService', 'other-service'],
  ])('maps fixed %s and ignores inactive slabs', (p, id) => {
    expect(
      input({
        ...enabled(p, 'fixed'),
        [`${p}Amount`]: '0',
        [`${p}PriceSlabs`]: 'bad',
        [`${p}WeightSlabs`]: 'bad',
      }).feeLines,
    ).toEqual([
      {
        id,
        enabled: true,
        mode: 'fixed',
        amount: '0',
        quantityScope: p === 'closing' ? 'per-order' : 'per-unit',
        gstTreatment: 'none',
        scenarios: ['successful-sale'],
      },
    ]);
  });
  it('composes an exact advanced request in stable fee/slab order without arithmetic', () => {
    expect(input(advanced.input as FieldValues)).toEqual(advanced.expected);
  });
  it.each([
    [{ ...enabled('referral', 'percent') }, 'referralRatePercent'],
    [{ ...enabled('closing', 'fixed') }, 'closingAmount'],
    [
      { ...enabled('closing', 'fixed'), closingAmount: '1', closingGstTreatment: 'unselected' },
      'closingGstTreatment',
    ],
    [
      { ...enabled('closing', 'fixed'), closingAmount: '1', closingApplySale: false },
      'closingApplySale',
    ],
    [
      {
        ...enabled('weightHandling', 'weight-slabs'),
        weightHandlingWeightSlabs: '[{"max":"1","amount":"1"}]',
        chargeableWeightUnit: 'kg',
      },
      'chargeableWeightValue',
    ],
  ] as const)('reports empty required configuration as missing: %s', (values, key) => {
    const result = prepare(values);
    expect(result.ok && result.value.missing).toContain(key);
  });
  it.each([
    ['broken', 'referralPriceSlabs'],
    ['{}', 'referralPriceSlabs'],
    ['[null]', 'referralPriceSlabs.0'],
    ['[{"max":"1","chargeMode":"percent"}]', 'referralPriceSlabs.0.value'],
    ['[{"max":1,"chargeMode":"percent","value":"1"}]', 'referralPriceSlabs.0.max'],
    ['[{"max":"1","chargeMode":"fixed","value":"1"}]', 'referralPriceSlabs.0.chargeMode'],
  ])('rejects malformed/partial rows without dropping them: %s', (raw, path) => {
    expect(prepare({ ...enabled('referral', 'price-slabs'), referralPriceSlabs: raw })).toEqual({
      ok: false,
      error: { code: 'INVALID_INPUT', messageKey: 'errors.INVALID_INPUT', path },
    });
  });
  it('rejects unsupported controls and closing percent slabs; preserves engine-owned numeric validation', () => {
    for (const values of [
      { ...enabled('referral', 'fixed') },
      { ...enabled('pickPack', 'percent') },
      {
        ...enabled('closing', 'price-slabs'),
        closingPriceSlabs: '[{"max":"1","chargeMode":"percent","value":"1"}]',
      },
      { chargeableWeightValue: '1', chargeableWeightUnit: 'lb' },
    ] as FieldValues[])
      expect(prepare(values).ok).toBe(false);
    const rows = [{ min: '9', max: '1', chargeMode: 'percent', value: '-200.12345' }];
    expect(
      input({ ...enabled('referral', 'price-slabs'), referralPriceSlabs: JSON.stringify(rows) })
        .feeLines,
    ).toMatchObject([{ priceSlabs: rows }]);
  });
});
