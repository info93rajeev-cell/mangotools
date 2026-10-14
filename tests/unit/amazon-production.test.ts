import { readFileSync } from 'node:fs';
import { createTestContext, executeOperation } from '@mangotools/core';
import { fixtureSchema, type Registry } from '@mangotools/schemas';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import { userPresetsEnabled } from '../../apps/web/src/lib/user-presets.ts';
import {
  defaultValues,
  type FieldValues,
  sampleValues,
} from '../../packages/runtime/src/tool-input.ts';
import { amazonManualProfitabilityInput } from '../../packages/ui/src/toolkit/amazonManualProfitabilityInput.ts';
import { findOperation, loadEngines } from '../../scripts/lib/engines.ts';

const id = 'estimate/amazon.manual-profitability';
const slug = 'amazon-india-seller-fee-profit-estimator';
const registry: Registry = JSON.parse(readFileSync('generated/registry.json', 'utf8'));
const preset = registry.presets[id];
const operation = findOperation(await loadEngines(), 'estimate.marketplace.manual-profitability@1');
if (!preset || !operation) throw new Error('Production preset/operation missing.');
const defaults = defaultValues(preset);
const sections = [
  'showProductDetails',
  'showAmazonFees',
  'showShipping',
  'showTaxes',
  'showAdjustments',
];
const configured: FieldValues = {
  ...defaults,
  sellingPricePerUnit: '1000.00',
  productCostPerUnit: '400.00',
  referralMode: 'percent',
  referralRatePercent: '7',
  referralGstTreatment: 'none',
  closingMode: 'fixed',
  closingAmount: '10',
  closingGstTreatment: 'none',
  packagingAmount: '5',
  tcsMode: 'fixed',
  tcsValue: '2',
};
function prepare(values: FieldValues) {
  const prepared = amazonManualProfitabilityInput(preset, Object.freeze({ ...values }));
  expect(prepared.ok).toBe(true);
  if (!prepared.ok) throw new Error(prepared.error.code);
  expect(prepared.value.missing).toEqual([]);
  return prepared.value;
}
describe('TASK-008L production tool', () => {
  it('publishes the exact identity through the normal registry and Business catalogue', () => {
    const tool = registry.tools.find((t) => t.id === slug);
    expect(tool).toMatchObject({
      slug,
      url: `/${slug}`,
      preset: id,
      category: 'business',
      tier: 'T2',
      archetype: 'B',
      version: '0.1.0',
      listed: true,
      processing: 'device',
      privacy: { dataClass: 'personal', network: 'none' },
    });
    expect(registry.categories.find((c) => c.id === 'business')?.toolIds).toContain(slug);
    expect(preset.operation).toBe('estimate.marketplace.manual-profitability@1');
    expect(userPresetsEnabled(preset)).toBe(true);
    expect(
      Object.values(registry.presets)
        .filter(userPresetsEnabled)
        .map((p) => p.id),
    ).toEqual([id]);
  });
  it('uses only approved structural defaults, never marketplace money/rates or slab data', () => {
    expect(defaults).toMatchObject({
      quantity: '1',
      sellingPriceTaxMode: 'gst-inclusive',
      chargeableWeightUnit: 'kg',
      scenario: 'successful-sale',
    });
    for (const [key, field] of Object.entries(preset.fields)) {
      if (['money', 'percent'].includes(field.kind)) expect(defaults[key], key).toBe('');
      if (key.endsWith('Mode') && key !== 'sellingPriceTaxMode')
        expect(defaults[key], key).toBe('off');
      if (field.kind === 'rows') expect(defaults[key], key).toBe('[]');
    }
    expect(defaults.tcsValue).toBe('');
    expect(defaults.tdsValue).toBe('');
    for (const key of sections) expect(defaults[key]).toBe('false');
    expect(preset.fields.productCategoryLabel.kind).toBe('text');
    expect(preset.fields.shippingZoneLabel.kind).toBe('text');
    expect(Object.values(preset.fields).some((field) => field.convert)).toBe(false);
  });
  it('declares all approved fee modes, primitive slab rows and explicit GST/applicability', () => {
    for (const [prefix, modes] of [
      ['referral', ['off', 'percent', 'price-slabs']],
      ['closing', ['off', 'fixed', 'price-slabs']],
      ['weightHandling', ['off', 'fixed', 'weight-slabs']],
      ['pickPack', ['off', 'fixed']],
      ['otherService', ['off', 'fixed']],
    ] as const) {
      expect(preset.fields[`${prefix}Mode`].options?.map((o) => o.value)).toEqual(modes);
      expect(defaults[`${prefix}GstTreatment`]).toBe('unselected');
      expect(defaults[`${prefix}ApplySale`]).toBe('true');
      expect(defaults[`${prefix}ApplyReturn`]).toBe('false');
    }
    for (const key of ['referralPriceSlabs', 'closingPriceSlabs', 'weightHandlingWeightSlabs']) {
      expect(preset.fields[key]).toMatchObject({
        kind: 'rows',
        uiOnly: true,
        rows: { minRows: 0, maxRows: 20 },
      });
    }
    expect(preset.fields.inventoryWriteOffEffects).toBeUndefined();
    expect(preset.fields.scenario.options?.map((o) => o.value)).toEqual([
      'successful-sale',
      'customer-return',
      'rto',
      'cancellation',
    ]);
    for (const p of [
      'returnCharge',
      'reverseLogistics',
      'reimbursement',
      'inventoryWriteOff',
      'otherAdjustment',
    ]) {
      expect(defaults[`${p}Amount`]).toBe('');
      expect(preset.fields[`${p}ApplySale`]).toBeUndefined();
      expect(defaults[`${p}ApplyReturn`]).toBe('false');
    }
  });
  it('runs the real production sample through the adapter and strict operation', async () => {
    const sample = sampleValues(preset, 'manual-example');
    if (!sample) throw new Error('Sample missing');
    const request = prepare(sample);
    expect(operation.input.safeParse(request.input).success).toBe(true);
    const result = await executeOperation(
      operation,
      request.input,
      request.params,
      createTestContext(),
    );
    expect(result).toMatchObject({
      ok: true,
      value: { economicProfit: '600.00', estimatedSettlement: '1000.00' },
    });
    expect(request.input).not.toHaveProperty('showTaxes');
  });
  it('executes configured real form values against hand-verified fixture truth without collapse changes', async () => {
    const before = { ...configured };
    const closed = prepare(configured);
    const opened = prepare({
      ...configured,
      ...Object.fromEntries(sections.map((key) => [key, true])),
    });
    expect(opened).toEqual(closed);
    expect(configured).toEqual(before);
    const result = await executeOperation(
      operation,
      closed.input,
      closed.params,
      createTestContext(),
    );
    const fixture = fixtureSchema.parse(
      parse(readFileSync(`tools/${slug}/fixtures/002-manual-fees.yaml`, 'utf8')),
    );
    expect(result).toMatchObject({ ok: true, value: fixture.expected });
    expect(closed.input).not.toHaveProperty('referralMode');
  });
  it('keeps engine input strict and preserves taxes/discounts when every section closes', () => {
    const typed = {
      ...configured,
      promotionalDiscount: '50.00',
      productGstRatePercent: '12',
      sellingPriceTaxMode: 'gst-exclusive',
      marketplaceFeeGstRatePercent: '5',
    };
    const request = prepare(typed);
    expect(request.input).toMatchObject({
      promotionalDiscount: '50.00',
      productGstRatePercent: '12',
      sellingPriceTaxMode: 'gst-exclusive',
      marketplaceFeeGstRatePercent: '5',
    });
    expect(operation.input.safeParse(request.input).success).toBe(true);
    expect(operation.input.safeParse({ ...request.input, showTaxes: true }).success).toBe(false);
  });
});
