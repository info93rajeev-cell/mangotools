import { readFileSync } from 'node:fs';
import { err, ok, type Result } from '@mangotools/core';
import type { ResolvedPreset } from '@mangotools/schemas';
import { afterEach, describe, expect, expectTypeOf, it, vi } from 'vitest';
import type { FieldValues, RunFn, ToolStoreOptions } from './index.ts';
import { buildRequest, defaultValues, sampleValues, type ToolRequest } from './tool-input.ts';
import { createToolStore } from './tool-state.ts';

const preset: ResolvedPreset = JSON.parse(
  readFileSync(
    new URL('../../../generated/presets/estimate/gst.india.json', import.meta.url),
    'utf8',
  ),
);
const prepared: ToolRequest = {
  input: { nested: { value: '12' } },
  params: { mode: 'custom' },
  missing: [],
};
const run = () => vi.fn<RunFn>(async () => ok({ answer: 'current' }));

afterEach(() => vi.useRealTimers());

describe('atomic request preparation', () => {
  it('keeps the existing request, sample and reset defaults when absent', async () => {
    const runner = run();
    const store = createToolStore({ preset, run: runner });
    await store.runNow();
    expect(runner).not.toHaveBeenCalled();
    expect(store.get()).toMatchObject({ phase: 'idle', missing: ['amount'] });
    await store.loadSample('invoice-18');
    const values = sampleValues(preset, 'invoice-18');
    expect(store.get().values).toEqual(values);
    const request = buildRequest(preset, store.get().values);
    expect(runner).toHaveBeenCalledExactlyOnceWith(
      preset.operation,
      request.input,
      request.params,
      expect.any(AbortSignal),
    );
    store.reset();
    expect(store.get()).toEqual({
      phase: 'idle',
      values: defaultValues(preset),
      result: null,
      error: null,
      missing: [],
    });
    store.dispose();
  });

  it('prepares once for runNow and forwards the complete input and params unchanged', async () => {
    const runner = run();
    const prepareRequest = vi.fn(() => ok(prepared));
    const store = createToolStore({ preset, run: runner, prepareRequest });
    await store.runNow();
    expect(prepareRequest).toHaveBeenCalledExactlyOnceWith(preset, defaultValues(preset));
    expect(runner).toHaveBeenCalledExactlyOnceWith(
      preset.operation,
      prepared.input,
      prepared.params,
      expect.any(AbortSignal),
    );
    expect(runner.mock.calls[0]?.[1]).toBe(prepared.input);
    expect(runner.mock.calls[0]?.[2]).toBe(prepared.params);
    expect(store.get().phase).toBe('result');
    store.dispose();
  });

  it('debounces edits and prepares once from the latest live values', async () => {
    vi.useFakeTimers();
    const runner = run();
    const prepareRequest = vi.fn(() => ok(prepared));
    const store = createToolStore({ preset, run: runner, prepareRequest });
    store.set('amount', '100');
    store.setMany({ amount: '200', rate: '5' });
    expect(prepareRequest).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(150);
    expect(prepareRequest).toHaveBeenCalledExactlyOnceWith(preset, {
      ...defaultValues(preset),
      amount: '200',
      rate: '5',
    });
    expect(runner).toHaveBeenCalledTimes(1);
    store.dispose();
  });

  it('prepares exactly once after sample input and UI state replace previous values', async () => {
    vi.useFakeTimers();
    const withUiState: ResolvedPreset = {
      ...preset,
      fields: {
        ...preset.fields,
        expanded: {
          kind: 'boolean',
          labelKey: 'expanded',
          order: 99,
          default: 'false',
          uiOnly: true,
        },
      },
      samples: {
        advanced: {
          titleKey: 'advanced',
          input: { amount: '1000.00', rate: '18' },
          uiState: { expanded: true },
        },
      },
    };
    const prepareRequest = vi.fn(() => ok(prepared));
    const runner = run();
    const store = createToolStore({ preset: withUiState, run: runner, prepareRequest });
    store.setMany({ amount: 'old', expanded: false });
    await store.loadSample('advanced');
    expect(prepareRequest).toHaveBeenCalledExactlyOnceWith(
      withUiState,
      sampleValues(withUiState, 'advanced'),
    );
    await vi.advanceTimersByTimeAsync(150);
    expect(prepareRequest).toHaveBeenCalledTimes(1);
    expect(runner).toHaveBeenCalledTimes(1);
    await store.loadSample('unknown');
    expect(prepareRequest).toHaveBeenCalledTimes(1);
    store.dispose();
  });

  it('freezes an independent values object without freezing or mutating the store', async () => {
    const snapshots: Readonly<Record<string, string | boolean>>[] = [];
    const prepareRequest: NonNullable<ToolStoreOptions['prepareRequest']> = (_preset, values) => {
      expect(Object.isFrozen(values)).toBe(true);
      expect(() => Object.assign(values, { amount: 'mutated' })).toThrow(TypeError);
      snapshots.push(values);
      return ok(prepared);
    };
    const store = createToolStore({ preset, run: run(), prepareRequest });
    const original = store.get().values;
    await store.runNow();
    await store.runNow();
    expect(snapshots[0]).not.toBe(original);
    expect(snapshots[1]).not.toBe(snapshots[0]);
    expect(snapshots).toEqual([defaultValues(preset), defaultValues(preset)]);
    expect(store.get().values).toBe(original);
    expect(Object.isFrozen(original)).toBe(false);
    store.dispose();
  });

  it('surfaces ordered missing identifiers and clears the previous success without running', async () => {
    const runner = run();
    const missing = ['second', 'first'];
    const prepareRequest = vi
      .fn()
      .mockReturnValueOnce(ok(prepared))
      .mockReturnValue(ok({ ...prepared, missing }));
    const store = createToolStore({ preset, run: runner, prepareRequest });
    await store.runNow();
    expect(store.get().result).not.toBeNull();
    await store.runNow();
    expect(store.get()).toMatchObject({ phase: 'idle', result: null, error: null, missing });
    expect(store.get().missing).toBe(missing);
    expect(runner).toHaveBeenCalledTimes(1);
    expect(prepareRequest).toHaveBeenCalledTimes(2);
    store.dispose();
  });

  it('surfaces typed failure, clears stale success/missing, and never falls back', async () => {
    vi.useFakeTimers();
    const failure = err<ToolRequest>('INVALID_INPUT', { path: 'amount' });
    const runner = run();
    const prepareRequest = vi
      .fn()
      .mockReturnValueOnce(ok(prepared))
      .mockReturnValueOnce(failure)
      .mockReturnValueOnce(ok({ ...prepared, missing: ['amount'] }))
      .mockReturnValue(failure);
    const store = createToolStore({ preset, run: runner, prepareRequest });
    store.set('amount', '100'); // Generic request is valid: fallback would call the runner.
    await store.runNow();
    expect(store.get().result).not.toBeNull();
    await store.runNow();
    expect(store.get()).toMatchObject({ phase: 'error', result: null, missing: [] });
    expect(store.get().error).toBe(failure.ok ? undefined : failure.error);
    await store.runNow();
    expect(store.get()).toMatchObject({
      phase: 'idle',
      error: null,
      result: null,
      missing: ['amount'],
    });
    await store.runNow();
    expect(store.get()).toMatchObject({ phase: 'error', result: null, missing: [] });
    expect(runner).toHaveBeenCalledTimes(1);
    expect(prepareRequest).toHaveBeenCalledTimes(4);
    store.dispose();
  });

  it('does not swallow programmer exceptions or execute the runner', async () => {
    const runner = run();
    const bug = new Error('programmer error');
    const store = createToolStore({
      preset,
      run: runner,
      prepareRequest: () => {
        throw bug;
      },
    });
    await expect(store.runNow()).rejects.toBe(bug);
    expect(runner).not.toHaveBeenCalled();
    store.dispose();
  });

  it('exports a synchronous Result<ToolRequest> callback, not a Promise contract', () => {
    type Prepare = NonNullable<ToolStoreOptions['prepareRequest']>;
    expectTypeOf<ReturnType<Prepare>>().toEqualTypeOf<Result<ToolRequest>>();
    expectTypeOf<Parameters<Prepare>>().toEqualTypeOf<[ResolvedPreset, Readonly<FieldValues>]>();
  });
});
