import { readFileSync } from 'node:fs';
import {
  buildRequest,
  defaultValues,
  type FieldValues,
  type RunFn,
  restoreValues,
  type ToolStore,
} from '@mangotools/runtime';
import type { ResolvedPreset } from '@mangotools/schemas';
import type { VNode } from 'preact';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as adapter from './amazonManualProfitabilityInput.ts';
import { ToolIsland } from './ToolIsland.tsx';

const { runner } = vi.hoisted(() => ({
  runner: vi.fn<RunFn>(async () => ({
    ok: true,
    value: { sentinel: 'runner-result' },
    warnings: [],
  })),
}));
vi.mock('@mangotools/runtime', async (original) => ({
  ...(await original<typeof import('@mangotools/runtime')>()),
  getWorkerHost: () => ({ run: runner }),
}));
// Initialize the real ToolIsland/store without DOM mounting or page-side effects.
// These wiring tests do not claim rendering, rerender/subscription or browser coverage.
vi.mock('preact/hooks', () => ({
  useState: (initial: unknown) => [typeof initial === 'function' ? initial() : initial, vi.fn()],
  useEffect: () => {},
  useRef: (current: unknown) => ({ current }),
  useCallback: (fn: unknown) => fn,
  useMemo: (fn: () => unknown) => fn(),
}));
const ordinary: ResolvedPreset = JSON.parse(
  readFileSync(
    new URL('../../../../generated/presets/estimate/gst.india.json', import.meta.url),
    'utf8',
  ),
);
const core = {
  sellingPricePerUnit: '1000.00',
  productCostPerUnit: '500.00',
  quantity: '2',
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
function synthetic(
  extra: FieldValues = {},
  id = 'estimate/amazon.manual-profitability',
): ResolvedPreset {
  return {
    ...ordinary,
    id,
    operation: 'estimate.marketplace.manual-profitability@1',
    params: { rounding: 'half-up' },
    userOptions: {},
    locked: ['rounding'],
    outputs: {},
    samples: { example: { titleKey: 'example', input: core, uiState: extra } },
    fields: Object.fromEntries(
      Object.entries({ ...initial, ...extra }).map(([key, value], order) => [
        key,
        {
          kind: 'text',
          order,
          labelKey: key,
          default: String(value),
          required: key === 'sellingPricePerUnit',
          uiOnly: !(key in core),
        },
      ]),
    ),
  };
}
const preparedInput = {
  ...core,
  feeLines: [
    {
      id: 'closing',
      enabled: true,
      mode: 'fixed',
      amount: '5.00',
      gstTreatment: 'none',
      quantityScope: 'per-order',
      scenarios: ['successful-sale'],
    },
  ],
  packagingCost: { amount: '12.00', scenarios: ['successful-sale'] },
  tcs: { mode: 'fixed', value: '3.00', scenarios: ['successful-sale'] },
  scenarioAdjustments: [
    {
      id: 'inventory-write-off',
      direction: 'charge',
      amount: '7.00',
      economic: true,
      settlement: false,
      scenarios: ['customer-return'],
    },
  ],
};
const stores: ToolStore[] = [];
function island(preset: ResolvedPreset) {
  const boundary = ToolIsland({
    toolId: 'synthetic-only',
    archetype: 'B',
    preset,
    sampleId: 'example',
    print: false,
  });
  // Resolve the shared preset boundary before inspecting the unchanged standard island.
  const node = (
    typeof boundary.type === 'function' ? boundary.type(boundary.props) : boundary
  ) as VNode<{
    store: ToolStore;
    calculatorActions: { onReset: () => void };
  }>;
  stores.push(node.props.store);
  return node.props;
}
afterEach(() => {
  for (const store of stores.splice(0)) store.dispose();
  vi.restoreAllMocks();
  runner.mockClear();
  vi.useRealTimers();
});

describe('ToolIsland Amazon exact-preset preparation', () => {
  it.each(['estimate/another-preset', 'estimate/amazon.manual-profitability-extra'])(
    'keeps %s generic despite identical operation id',
    async (id) => {
      const spy = vi.spyOn(adapter, 'amazonManualProfitabilityInput');
      const { store } = island(
        synthetic({ packagingAmount: '12.00', packagingApplySale: 'true' }, id),
      );
      await store.runNow();
      expect(spy).not.toHaveBeenCalled();
      expect(runner).toHaveBeenCalledExactlyOnceWith(
        'estimate.marketplace.manual-profitability@1',
        core,
        { rounding: 'half-up' },
        expect.any(AbortSignal),
      );
    },
  );
  it('keeps the existing GST preset on buildRequest and the normal result flow', async () => {
    const spy = vi.spyOn(adapter, 'amazonManualProfitabilityInput');
    const { store } = island(ordinary);
    await store.loadSample('invoice-18');
    const request = buildRequest(ordinary, store.get().values);
    expect(request.missing).toEqual([]);
    expect(spy).not.toHaveBeenCalled();
    expect(runner).toHaveBeenCalledExactlyOnceWith(
      ordinary.operation,
      request.input,
      request.params,
      expect.any(AbortSignal),
    );
    expect(store.get()).toMatchObject({
      phase: 'result',
      result: { value: { sentinel: 'runner-result' } },
    });
  });
  it('prepares restored values once and forwards fees/costs/withholding/adjustments without context', async () => {
    const spy = vi.spyOn(adapter, 'amazonManualProfitabilityInput');
    const values = {
      closingMode: 'fixed',
      closingAmount: '5.00',
      closingGstTreatment: 'none',
      closingApplySale: 'true',
      packagingAmount: '12.00',
      packagingApplySale: 'true',
      tcsMode: 'fixed',
      tcsValue: '3.00',
      tcsApplySale: 'true',
      inventoryWriteOffAmount: '7.00',
      inventoryWriteOffApplyReturn: 'true',
      fulfillmentMethod: 'FBA',
      showTaxes: 'true',
    };
    const preset = synthetic(values);
    const { store, calculatorActions } = island(preset);
    store.setMany(restoreValues(preset, { ...values, removedKey: 'ignored' }));
    await store.runNow();
    expect(spy).toHaveBeenCalledTimes(1);
    expect(store.get().values).not.toHaveProperty('removedKey');
    expect(runner).toHaveBeenCalledExactlyOnceWith(
      preset.operation,
      preparedInput,
      { rounding: 'half-up' },
      expect.any(AbortSignal),
    );
    calculatorActions.onReset();
    expect(store.get()).toMatchObject({
      phase: 'idle',
      result: null,
      error: null,
      missing: [],
      values: defaultValues(preset),
    });
    expect(spy).toHaveBeenCalledTimes(1);
    expect(runner).toHaveBeenCalledTimes(1);
  });
  it.each(['missing', 'error'])(
    'clears stale result and exposes adapter %s without fallback',
    async (kind) => {
      const spy = vi.spyOn(adapter, 'amazonManualProfitabilityInput');
      const { store } = island(
        synthetic({
          otherAdjustmentAmount: '1.00',
          otherAdjustmentEffects: 'both',
          otherAdjustmentApplyReturn: 'true',
          otherAdjustmentDirection: 'charge',
        }),
      );
      await store.runNow();
      expect(store.get().phase).toBe('result');
      runner.mockClear();
      spy.mockClear();
      store.set('otherAdjustmentDirection', kind === 'missing' ? '' : 'bad');
      await store.runNow();
      expect(spy).toHaveBeenCalledTimes(1);
      expect(runner).not.toHaveBeenCalled();
      expect(store.get().result).toBeNull();
      if (kind === 'missing')
        expect(store.get()).toMatchObject({
          phase: 'idle',
          error: null,
          missing: ['otherAdjustmentDirection'],
        });
      else
        expect(store.get()).toMatchObject({
          phase: 'error',
          missing: [],
          error: {
            code: 'INVALID_INPUT',
            messageKey: 'errors.INVALID_INPUT',
            path: 'otherAdjustmentDirection',
          },
        });
    },
  );
  it('uses the same adapter once per debounced edit and fully applied sample', async () => {
    vi.useFakeTimers();
    const spy = vi.spyOn(adapter, 'amazonManualProfitabilityInput');
    const { store } = island(
      synthetic({ tcsMode: 'fixed', tcsValue: '2.00', tcsApplySale: 'true' }),
    );
    store.set('tcsValue', '3.00');
    await vi.advanceTimersByTimeAsync(150);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(runner).toHaveBeenCalledTimes(1);
    expect(runner.mock.calls[0]?.[1]).toMatchObject({ tcs: { value: '3.00' } });
    await store.loadSample('example');
    expect(spy).toHaveBeenCalledTimes(2);
    expect(runner).toHaveBeenCalledTimes(2);
    expect(runner.mock.calls[1]?.[1]).toMatchObject({ tcs: { value: '2.00' } });
  });
});
