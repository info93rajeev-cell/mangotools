import { readFileSync } from 'node:fs';
import type { ResolvedPreset } from '@mangotools/schemas';
import { describe, expect, it } from 'vitest';
import type { RunOutcome } from './protocol.ts';
import { buildRequest, defaultValues, normalizeNumberText, sampleValues } from './tool-input.ts';
import { createToolStore, type RunFn, type Timer } from './tool-state.ts';

const preset = (id: string): ResolvedPreset =>
  JSON.parse(
    readFileSync(new URL(`../../../generated/presets/${id}.json`, import.meta.url), 'utf8'),
  );

const gst = preset('estimate/gst.india');
const margin = preset('estimate/pricing.margin');
const json = preset('data/json.format');

function manualTimer() {
  const queue: (() => void)[] = [];
  const timer: Timer = {
    set: (fn) => queue.push(fn),
    clear: (handle) => {
      if (typeof handle === 'number') queue[handle - 1] = () => {};
    },
  };
  return {
    timer,
    flush: () => {
      for (const fn of queue.splice(0)) fn();
    },
  };
}

const tick = () => new Promise((r) => setTimeout(r, 0));

describe('tool input', () => {
  it('uses preset params, defaults and option values', () => {
    expect(defaultValues(gst)).toEqual({ mode: 'add', supply: 'intra', amount: '', rate: '18' });
    expect(defaultValues(json)).toEqual({
      action: 'format',
      indent: '2',
      sortKeys: false,
      text: '',
    });
  });

  it('strips grouping and symbols from numbers', () => {
    expect(normalizeNumberText('₹1,00,000.50')).toBe('100000.50');
    expect(normalizeNumberText(' 18 % ')).toBe('18');
  });

  it('reports missing required fields and leaves hidden fields out', () => {
    const values = {
      ...defaultValues(margin),
      solve: 'price-from-cost-and-margin',
      cost: '80',
      price: '999',
    };
    const request = buildRequest(margin, values);
    expect(request.missing).toEqual(['marginPercent']);
    expect(request.input).toEqual({ solve: 'price-from-cost-and-margin', cost: '80' });
  });

  it('passes user options as params', () => {
    const request = buildRequest(json, {
      ...defaultValues(json),
      text: '{}',
      indent: '4',
      sortKeys: true,
    });
    expect(request.params).toEqual({ action: 'format', indent: '4', sortKeys: true });
  });

  it('builds sample values from the preset sample', () => {
    expect(sampleValues(gst, 'invoice-18')).toEqual({
      mode: 'add',
      supply: 'intra',
      amount: '1000.00',
      rate: '18',
    });
    expect(sampleValues(gst, 'nope')).toBeNull();
  });
});

describe('tool store', () => {
  const okRun: RunFn = async (_op, input) => ({ ok: true, value: { echo: input }, warnings: [] });

  it('debounces live compute and moves idle → editing → running → result', async () => {
    const { timer, flush } = manualTimer();
    const store = createToolStore({ preset: gst, run: okRun, timer });
    const phases: string[] = [];
    store.subscribe((s) => phases.push(s.phase));
    store.set('amount', '1,000');
    expect(store.get().phase).toBe('editing');
    flush();
    await tick();
    expect(store.get().phase).toBe('result');
    expect(store.get().result?.value).toEqual({
      echo: { mode: 'add', supply: 'intra', amount: '1000', rate: '18' },
    });
    expect(phases).toContain('running');
  });

  it('stays idle and clears the result while a required field is empty', async () => {
    const { timer, flush } = manualTimer();
    const store = createToolStore({ preset: gst, run: okRun, timer });
    await store.loadSample('invoice-18');
    expect(store.get().phase).toBe('result');
    store.set('amount', '');
    flush();
    await tick();
    expect(store.get()).toMatchObject({ phase: 'idle', result: null, missing: ['amount'] });
  });

  it('aborts the in-flight run when new input arrives', async () => {
    const signals: AbortSignal[] = [];
    let release: (o: RunOutcome) => void = () => {};
    const slowRun: RunFn = (_op, _input, _params, signal) => {
      signals.push(signal);
      return new Promise((resolve) => {
        release = resolve;
      });
    };
    const { timer, flush } = manualTimer();
    const store = createToolStore({ preset: gst, run: slowRun, timer });
    store.set('amount', '100');
    flush();
    expect(store.get().phase).toBe('running');
    store.set('amount', '200');
    expect(signals[0]?.aborted).toBe(true);
    release({ ok: true, value: { stale: true }, warnings: [] });
    await tick();
    expect(store.get().result).toBeNull();
  });

  it('shows engine errors', async () => {
    const failing: RunFn = async () => ({
      ok: false,
      error: {
        code: 'ESTIMATE_INVALID_NUMBER',
        messageKey: 'errors.ESTIMATE_INVALID_NUMBER',
        path: 'amount',
      },
    });
    const store = createToolStore({ preset: gst, run: failing, timer: manualTimer().timer });
    store.setMany({ amount: 'abc' });
    await store.runNow();
    expect(store.get()).toMatchObject({
      phase: 'error',
      error: { code: 'ESTIMATE_INVALID_NUMBER' },
    });
  });

  it('resets to defaults', async () => {
    const store = createToolStore({ preset: gst, run: okRun, timer: manualTimer().timer });
    await store.loadSample('invoice-18');
    store.reset();
    expect(store.get()).toMatchObject({ phase: 'idle', result: null, values: defaultValues(gst) });
  });
});
