import { readFileSync } from 'node:fs';
import { buildRequest, type FieldValues } from '@mangotools/runtime';
import { fixtureSchema, type ResolvedPreset } from '@mangotools/schemas';
import { isShown } from '@mangotools/schemas/conditions';
import { describe, expect, it } from 'vitest';
import { amazonManualProfitabilityInput } from './amazonManualProfitabilityInput.ts';

const ordinary: ResolvedPreset = JSON.parse(
  readFileSync(
    new URL('../../../../generated/presets/estimate/gst.india.json', import.meta.url),
    'utf8',
  ),
);
const advanced = fixtureSchema.parse(
  JSON.parse(
    readFileSync(
      new URL('./amazonManualProfitabilityScoped.fixture.json', import.meta.url),
      'utf8',
    ),
  ),
);
const core = {
  sellingPricePerUnit: '1000.00',
  productCostPerUnit: '400.00',
  quantity: '2',
  scenario: 'successful-sale',
};
const financial = {
  promotionalDiscount: '100.00',
  couponDiscount: '50.00',
  productGstRatePercent: '18',
  sellingPriceTaxMode: 'gst-exclusive',
  marketplaceFeeGstRatePercent: '12',
};
const sections = [
  'showProductDetails',
  'showTaxes',
  'showAmazonFees',
  'showShipping',
  'showAdjustments',
];
const open = Object.fromEntries(sections.map((key) => [key, true]));
const closed = Object.fromEntries(sections.map((key) => [key, false]));
const values: FieldValues = { ...core, ...(advanced.input as FieldValues), ...financial };
const fields = Object.fromEntries(
  Object.keys({ ...values, ...open }).map((key, order) => [
    key,
    {
      labelKey: key,
      kind: key.endsWith('Discount') ? 'money' : key.endsWith('Percent') ? 'percent' : 'text',
      order,
      required: key === 'sellingPricePerUnit',
      uiOnly: !(key in core || key in financial),
      ...(key in financial
        ? {
            visibleWhen: {
              [key.endsWith('Discount') ? 'showProductDetails' : 'showTaxes']: ['true'],
            },
          }
        : {}),
    },
  ]),
) as ResolvedPreset['fields'];
const preset: ResolvedPreset = {
  ...ordinary,
  id: 'estimate/amazon.manual-profitability',
  operation: 'estimate.marketplace.manual-profitability@1',
  fields,
  params: { rounding: 'half-up' },
  userOptions: {},
  locked: ['rounding'],
};
function prepared(state: FieldValues, configured = values, selected = preset) {
  const snapshot = Object.freeze({ ...configured, ...state });
  const before = { ...snapshot };
  const result = amazonManualProfitabilityInput(selected, snapshot);
  expect(snapshot).toEqual(before);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(result.error.code);
  expect(result.value.missing).toEqual([]);
  return result.value;
}

describe('Amazon disclosures are presentation only', () => {
  it.each(sections)('keeps the complete canonical request unchanged when %s closes', (section) => {
    const state = { ...open, [section]: false };
    const expanded = prepared(open);
    expect(expanded.input).toMatchObject(financial);
    expect(prepared(state)).toEqual(expanded);
    expect(prepared(open)).toEqual(expanded);
    for (const key of Object.keys(financial)) {
      const field = fields[key];
      if (field?.visibleWhen?.[section]) expect(isShown(field, state)).toBe(false);
    }
  });
  it.each(['gst-inclusive', 'gst-exclusive'])(
    'preserves %s and every financial key with all sections closed',
    (mode) => {
      const configured = Object.freeze({ ...values, sellingPriceTaxMode: mode });
      const expanded = prepared(open, configured);
      const collapsed = prepared(closed, configured);
      expect(collapsed).toEqual(expanded);
      expect(Object.keys(collapsed.input)).toEqual(Object.keys(expanded.input));
      expect(collapsed.input.sellingPriceTaxMode).toBe(mode);
      expect(collapsed.params).toEqual({ rounding: 'half-up' });
      for (const key of sections) expect(collapsed.input).not.toHaveProperty(key);
      expect(configured).toEqual({ ...values, sellingPriceTaxMode: mode });
    },
  );
  it('adds no financial defaults and leaves generic hidden-field handling unchanged', () => {
    const blank = {
      ...values,
      ...Object.fromEntries(Object.keys(financial).map((key) => [key, ''])),
    };
    const request = prepared(closed, blank);
    expect(request).toEqual(prepared(open, blank));
    for (const key of Object.keys(financial)) expect(request.input).not.toHaveProperty(key);
    expect(buildRequest(preset, { ...values, ...closed }).input).not.toHaveProperty(
      'productGstRatePercent',
    );
    expect(fields.promotionalDiscount?.visibleWhen).toEqual({ showProductDetails: ['true'] });
  });
  it('retains non-disclosure conditions rather than making all hidden fields unconditional', () => {
    const conditional: ResolvedPreset = {
      ...preset,
      fields: {
        ...fields,
        promotionalDiscount: {
          ...fields.promotionalDiscount,
          visibleWhen: { showProductDetails: ['true'], scenario: ['customer-return'] },
        },
      },
    };
    const request = prepared(closed, values, conditional);
    expect(request).toEqual(prepared(open, values, conditional));
    expect(request.input).not.toHaveProperty('promotionalDiscount');
    expect(request.input.productGstRatePercent).toBe('18');
  });
  it('does not suppress missing configuration when Taxes closes', () => {
    const configured = { ...values, tcsMode: 'fixed', tcsValue: '' };
    const expanded = amazonManualProfitabilityInput(preset, { ...configured, ...open });
    const collapsed = amazonManualProfitabilityInput(preset, { ...configured, ...closed });
    expect(collapsed).toEqual(expanded);
    expect(collapsed.ok && collapsed.value.missing).toContain('tcsValue');
  });
});
