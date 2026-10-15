import { readFileSync } from 'node:fs';
import type { FieldValues, ToolSnapshot, ToolStore } from '@mangotools/runtime';
import type { ResolvedPreset } from '@mangotools/schemas';
import type { VNode } from 'preact';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CalculatorFields } from '../archetypes/CalculatorFields.tsx';
import { CalculatorLayout } from '../archetypes/CalculatorLayout.tsx';
import { amazonManualProfitabilityInput } from './amazonManualProfitabilityInput.ts';

const effects: (() => void)[] = [];
vi.mock('preact/hooks', () => ({ useEffect: (fn: () => void) => effects.push(fn) }));
const ordinary: ResolvedPreset = JSON.parse(
  readFileSync(
    new URL('../../../../generated/presets/estimate/gst.india.json', import.meta.url),
    'utf8',
  ),
);
const advanced = JSON.parse(
  readFileSync(new URL('./amazonManualProfitabilityScoped.fixture.json', import.meta.url), 'utf8'),
).input;
const fixture = JSON.parse(
  readFileSync(new URL('./amazonProductionPrereqs.fixture.json', import.meta.url), 'utf8'),
);
const values: FieldValues = { ...advanced, ...fixture.values };
const preset: ResolvedPreset = {
  ...ordinary,
  id: 'estimate/amazon.manual-profitability',
  operation: 'estimate.marketplace.manual-profitability@1',
  params: { rounding: 'half-up' },
  userOptions: {},
  locked: ['rounding'],
  outputs: {},
  fields: fixture.fields,
};
type Element = VNode<Record<string, unknown>>;
const fieldsComponent: unknown = CalculatorFields;
function nodes(value: unknown): Element[] {
  if (Array.isArray(value)) return value.flatMap(nodes);
  if (!value || typeof value !== 'object' || !('type' in value)) return [];
  const node = value as Element;
  if (node.type === fieldsComponent) return [node];
  return typeof node.type === 'function'
    ? nodes((node.type as (props: Element['props']) => unknown)(node.props))
    : [node, ...nodes(node.props.children)];
}
function words(value: unknown): string {
  if (Array.isArray(value)) return value.map(words).join(' ');
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  return value && typeof value === 'object' && 'props' in value
    ? words((value as Element).props.children)
    : '';
}
function view(input = values, path?: string, selected = preset) {
  const state = { ...input };
  const store = {
    get: () => ({ values: state }),
    set: vi.fn((key, value) => {
      state[key] = value;
      snapshot.phase = 'editing'; // Match runtime: disclosure edits also schedule revalidation.
    }),
  };
  const snapshot: ToolSnapshot = {
    values: state,
    phase: path ? 'error' : 'result',
    missing: [],
    error: path ? { code: 'INVALID_INPUT', messageKey: 'errors.INVALID_INPUT', path } : null,
    result: path
      ? null
      : { value: { economicProfit: '500.00', marketplaceFees: [] }, warnings: [] },
  };
  const render = () =>
    nodes(
      CalculatorLayout({
        idPrefix: 'test',
        preset: selected,
        snapshot,
        store: store as unknown as ToolStore,
        actions: { hasResult: !path, onReset() {}, onCopy() {} },
      }),
    );
  const elements = render();
  return {
    elements,
    render,
    snapshot,
    state,
    store,
    text: elements.map((node) => words(node.props.children)).join(' '),
  };
}
afterEach(() => {
  effects.length = 0;
  vi.unstubAllGlobals();
});

describe('Amazon production UI prerequisites', () => {
  it('shows truthful configuration notices near results, not synthetic engine warnings', () => {
    const input = {
      ...values,
      productGstRatePercent: '  ',
      ...Object.fromEntries(
        ['referral', 'closing', 'weightHandling', 'pickPack', 'otherService'].map((p) => [
          `${p}Mode`,
          'off',
        ]),
      ),
    };
    const rendered = view(input);
    expect(rendered.text).toContain('No Amazon fees are configured.');
    expect(rendered.text).toContain('Product GST is not modelled.');
    expect(rendered.snapshot.result?.warnings).toEqual([]);
  });
  it.each(['0', '18'])('does not call configured GST %s unmodelled', (rate) => {
    const rendered = view({
      productGstRatePercent: rate,
      closingMode: 'fixed',
      closingAmount: '5',
    });
    expect(rendered.text).not.toContain('Product GST is not modelled.');
    expect(rendered.text).not.toContain('No Amazon fees are configured.');
  });
  it.each(['estimate/gst.india', 'estimate/amazon.manual-profitability-extra'])(
    'leaves %s notices and generic errors unchanged',
    (id) => {
      const rendered = view(values, 'feeLines.0.priceSlabs.0.value', { ...preset, id });
      const result = view({}, undefined, { ...preset, id });
      expect(result.text).not.toContain('Product GST is not modelled.');
      expect(result.text).not.toContain('No Amazon fees are configured.');
      expect(rendered.store.set).not.toHaveBeenCalled();
      const fields = rendered.elements.find((node) => node.type === fieldsComponent);
      expect(fields?.props.errorPath).toBe('feeLines.0.priceSlabs.0.value');
    },
  );
  it.each([
    ['feeLines.0.priceSlabs.0.value', 'referralPriceSlabs.0.value', 'showAmazonFees'],
    ['feeLines.1.priceSlabs.0.value', 'closingPriceSlabs.0.value', 'showAmazonFees'],
    ['feeLines.2.weightSlabs.0.amount', 'weightHandlingWeightSlabs.0.amount', 'showAmazonFees'],
    ['productGstRatePercent', 'productGstRatePercent', 'showTaxes'],
    ['marketplaceFeeGstRatePercent', 'marketplaceFeeGstRatePercent', 'showTaxes'],
    ['sellingPriceTaxMode', 'sellingPriceTaxMode', 'showTaxes'],
    ['promotionalDiscount', 'promotionalDiscount', 'showProductDetails'],
    ['chargeableWeight.value', 'chargeableWeightValue', 'showShipping'],
    ['chargeableWeight.unit', 'chargeableWeightUnit', 'showShipping'],
    ['scenarioAdjustments.2.amount', 'reimbursementAmount', 'showAdjustments'],
    ['packagingCost.amount', 'packagingAmount', 'showShipping'],
    ['tcs.value', 'tcsValue', 'showTaxes'],
  ])('maps %s to %s and reveals only %s', (path, mapped, section) => {
    const rendered = view(values, path);
    let fields = rendered.elements.find((node) => node.type === fieldsComponent);
    expect(fields?.props.errorPath).toBe(mapped);
    for (const effect of effects.splice(0)) effect();
    expect(rendered.store.set).toHaveBeenCalledExactlyOnceWith(section, 'true');
    expect(rendered.state).toEqual({ ...values, [section]: 'true' });
    expect(rendered.snapshot.phase).toBe('editing');
    rendered.snapshot.phase = 'error'; // The unchanged invalid request fails live revalidation.
    fields = rendered.render().find((node) => node.type === fieldsComponent);
    expect(((fields?.props.fields ?? []) as [string, unknown][]).map(([key]) => key)).toContain(
      mapped.split('.')[0],
    );
    const errorFor = fields?.props.errorFor as (key: string) => string | null;
    expect(errorFor(mapped.split('.')[0] ?? '')).toBeTruthy();
    expect(amazonManualProfitabilityInput(preset, rendered.state)).toEqual(
      amazonManualProfitabilityInput(preset, values),
    );
  });
  it.each([
    ['feeLines[0].priceSlabs[0].value', 'test-closingPriceSlabs-0-value'],
    ['sellingPriceTaxMode', 'test-sellingPriceTaxMode-gst-exclusive'],
  ])(
    'focuses the existing row or segmented control for %s after reveal/revalidation',
    (path, id) => {
      const input = {
        ...values,
        referralMode: 'off',
        returnChargeAmount: '',
        reverseLogisticsAmount: '',
      };
      const rendered = view(input, path);
      for (const effect of effects.splice(0)) effect();
      const focus = vi.fn();
      const getElementById = vi.fn((key) => (key === id ? { focus } : null));
      vi.stubGlobal('document', { getElementById });
      rendered.snapshot.phase = 'error';
      rendered.render();
      for (const effect of effects.splice(0)) effect();
      expect(focus).toHaveBeenCalledOnce();
      expect(
        view(input, 'scenarioAdjustments.0.amount').elements.find(
          (node) => node.type === fieldsComponent,
        )?.props.errorPath,
      ).toBe('reimbursementAmount');
    },
  );
});
