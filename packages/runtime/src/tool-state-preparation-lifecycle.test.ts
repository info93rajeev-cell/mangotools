import { readFileSync } from 'node:fs';
import { err, ok } from '@mangotools/core';
import type { ResolvedPreset } from '@mangotools/schemas';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { RunOutcome } from './protocol.ts';
import { defaultValues, type ToolRequest } from './tool-input.ts';
import { createToolStore, type RunFn } from './tool-state.ts';

const preset: ResolvedPreset = JSON.parse(
  readFileSync(
    new URL('../../../generated/presets/estimate/gst.india.json', import.meta.url),
    'utf8',
  ),
);
function pendingRun() {
  const calls: { input: unknown; signal: AbortSignal; resolve: (outcome: RunOutcome) => void }[] =
    [];
  const run: RunFn = (_operation, input, _params, signal) =>
    new Promise((resolve) => calls.push({ input, signal, resolve }));
  return { run, calls };
}
const prepare = () =>
  vi.fn((_preset: ResolvedPreset, values: Readonly<Record<string, string | boolean>>) =>
    ok<ToolRequest>({ input: { value: values.amount }, params: {}, missing: [] }),
  );

afterEach(() => vi.useRealTimers());

describe('prepared request lifecycle', () => {
  it('rapid edits abort A and only B can publish, even when A resolves last', async () => {
    vi.useFakeTimers();
    const { run, calls } = pendingRun();
    const prepareRequest = prepare();
    const store = createToolStore({ preset, run, prepareRequest });
    store.set('amount', 'A');
    const first = store.runNow();
    store.set('amount', 'B');
    expect(calls[0]?.signal.aborted).toBe(true);
    await vi.advanceTimersByTimeAsync(150);
    expect(calls.map((c) => c.input)).toEqual([{ value: 'A' }, { value: 'B' }]);
    expect(prepareRequest).toHaveBeenCalledTimes(2);
    calls[1]?.resolve(ok({ value: 'B' }));
    await Promise.resolve();
    calls[0]?.resolve(ok({ value: 'A' }));
    await first;
    expect(store.get()).toMatchObject({
      phase: 'result',
      values: { amount: 'B' },
      result: { value: { value: 'B' } },
    });
    store.dispose();
  });

  it.each(['reset', 'dispose'] as const)(
    '%s cancels in-flight work and rejects late results',
    async (action) => {
      vi.useFakeTimers();
      const { run, calls } = pendingRun();
      const prepareRequest = prepare();
      const store = createToolStore({ preset, run, prepareRequest });
      store.set('amount', '100');
      const running = store.runNow();
      store[action]();
      const afterAction = store.get();
      expect(calls[0]?.signal.aborted).toBe(true);
      calls[0]?.resolve(ok({ stale: true }));
      await running;
      await vi.advanceTimersByTimeAsync(150);
      expect(store.get()).toBe(afterAction);
      expect(store.get().result).toBeNull();
      expect(prepareRequest).toHaveBeenCalledTimes(1);
      expect(calls).toHaveLength(1);
      if (action === 'reset')
        expect(store.get()).toEqual({
          phase: 'idle',
          values: defaultValues(preset),
          result: null,
          error: null,
          missing: [],
        });
      store.dispose();
    },
  );

  it.each(['reset', 'dispose'] as const)(
    '%s cancels pending debounce without preparation',
    async (action) => {
      vi.useFakeTimers();
      const { run, calls } = pendingRun();
      const prepareRequest = prepare();
      const store = createToolStore({ preset, run, prepareRequest });
      store.set('amount', '100');
      store[action]();
      await vi.advanceTimersByTimeAsync(150);
      expect(prepareRequest).not.toHaveBeenCalled();
      expect(calls).toHaveLength(0);
      store.dispose();
    },
  );

  it('typed preparation failure cancels the old controller and prevents late publication', async () => {
    const { run, calls } = pendingRun();
    const failure = err<ToolRequest>('INVALID_INPUT');
    const prepareRequest = prepare()
      .mockReturnValueOnce(ok({ input: {}, params: {}, missing: [] }))
      .mockReturnValue(failure);
    const store = createToolStore({ preset, run, prepareRequest });
    const running = store.runNow();
    await store.runNow();
    expect(calls[0]?.signal.aborted).toBe(true);
    calls[0]?.resolve(ok({ stale: true }));
    await running;
    expect(store.get()).toMatchObject({
      phase: 'error',
      error: { code: 'INVALID_INPUT' },
      result: null,
      missing: [],
    });
    expect(calls).toHaveLength(1);
    store.dispose();
  });

  it('does not prepare or run after disposal, even for later explicit/sample/live calls', async () => {
    vi.useFakeTimers();
    const runner = vi.fn(async () => ok({}));
    const prepareRequest = prepare();
    const store = createToolStore({ preset, run: runner, prepareRequest });
    store.dispose();
    await store.runNow();
    await store.loadSample('invoice-18');
    store.set('amount', '100');
    await vi.advanceTimersByTimeAsync(150);
    expect(prepareRequest).not.toHaveBeenCalled();
    expect(runner).not.toHaveBeenCalled();
  });
});
