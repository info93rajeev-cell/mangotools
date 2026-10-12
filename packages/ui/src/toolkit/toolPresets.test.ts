import { readFileSync } from 'node:fs';
import {
  createToolPresetStore,
  defaultValues,
  type StorageLike,
  setAnalyticsSink,
  TOOL_PRESETS_KEY,
  type ToolPresetError,
} from '@mangotools/runtime';
import type { ResolvedPreset } from '@mangotools/schemas';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  clearPresetsAction,
  deletePresetAction,
  loadPresetAction,
  presetErrorMessage,
  renamePresetAction,
  savePresetAction,
} from './toolPresets.ts';

const memoryStorage = (): StorageLike & { data: Map<string, string> } => {
  const data = new Map<string, string>();
  return { data, getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v) };
};

const ids = () => {
  let n = 0;
  return () => `id${++n}`;
};

const preset = {
  operation: 'test.op.run@1',
  params: {},
  userOptions: {},
  locked: [],
  samples: {},
  strings: {},
  fields: {
    price: { labelKey: 'price', kind: 'money', order: 1 },
    slabs: {
      labelKey: 'slabs',
      kind: 'rows',
      order: 2,
      rows: { columns: { max: { labelKey: 'max', kind: 'money' } }, maxRows: 5 },
    },
  },
} as unknown as ResolvedPreset;

const values = { price: '1180.50', slabs: '[{"max":"500.00"}]' };

afterEach(() => {
  vi.unstubAllGlobals();
  setAnalyticsSink(null);
});

describe('preset manager actions', () => {
  it('starts empty, saves, and keeps duplicate names as separate presets', () => {
    const store = createToolPresetStore({ storage: memoryStorage(), ids: ids() });
    expect(store.list('demo-tool')).toEqual([]);
    const first = savePresetAction(store, 'demo-tool', 'Standard', values, null);
    const second = savePresetAction(store, 'demo-tool', 'Standard', values, first.selectedId);
    expect(first).toMatchObject({ ok: true, selectedId: 'id1', message: 'Saved “Standard”.' });
    expect(second.presets.map((p) => p.id)).toEqual(['id1', 'id2']);
  });

  it('loads through restoreValues: decimal strings kept, unknown keys dropped', () => {
    const storage = memoryStorage();
    const store = createToolPresetStore({ storage, ids: ids() });
    store.save('demo-tool', { name: 'Old', values: { ...values, removedField: 'x', price: '99' } });
    const loaded = loadPresetAction(store, 'demo-tool', 'id1', preset);
    expect(loaded.ok).toBe(true);
    expect(loaded.values).toEqual({ ...defaultValues(preset), price: '99', slabs: values.slabs });
    expect(loaded.values).not.toHaveProperty('removedField');
    expect(loadPresetAction(store, 'demo-tool', 'missing', preset)).toMatchObject({
      ok: false,
      message: 'That preset no longer exists.',
    });
  });

  it('renames without touching values, deletes one, clears only this tool', () => {
    const store = createToolPresetStore({ storage: memoryStorage(), ids: ids() });
    savePresetAction(store, 'demo-tool', 'A', values, null);
    savePresetAction(store, 'demo-tool', 'B', { price: '1' }, null);
    savePresetAction(store, 'other-tool', 'Other', { price: '2' }, null);
    expect(renamePresetAction(store, 'demo-tool', 'id1', 'Renamed').ok).toBe(true);
    expect(store.get('demo-tool', 'id1')).toEqual({ id: 'id1', name: 'Renamed', values });
    expect(deletePresetAction(store, 'demo-tool', 'id2').presets.map((p) => p.id)).toEqual(['id1']);
    expect(clearPresetsAction(store, 'demo-tool').presets).toEqual([]);
    expect(store.list('other-tool').map((p) => p.name)).toEqual(['Other']);
  });

  it('never deletes presets on form reset: reset only replaces form values', () => {
    const store = createToolPresetStore({ storage: memoryStorage(), ids: ids() });
    savePresetAction(store, 'demo-tool', 'Keep', values, null);
    const reset = defaultValues(preset);
    expect(reset.price).toBe('');
    expect(store.list('demo-tool').map((p) => p.name)).toEqual(['Keep']);
  });

  it('turns every runtime error into a readable message', () => {
    const codes: ToolPresetError[] = [
      'STORAGE_UNAVAILABLE',
      'WRITE_FAILED',
      'UNSUPPORTED_VERSION',
      'INVALID_TOOL_ID',
      'NAME_REQUIRED',
      'NAME_TOO_LONG',
      'INVALID_VALUES',
      'TOO_LARGE',
      'TOO_MANY_PRESETS',
      'NOT_FOUND',
    ];
    for (const code of codes) {
      const message = presetErrorMessage(code);
      expect(message.length).toBeGreaterThan(10);
      expect(message).not.toContain(code);
    }
  });

  it('reports storage failures through the action result without throwing', () => {
    const unavailable = createToolPresetStore({ storage: null });
    expect(savePresetAction(unavailable, 'demo-tool', 'A', values, null)).toMatchObject({
      ok: false,
      message: presetErrorMessage('STORAGE_UNAVAILABLE'),
    });
    const full: StorageLike = {
      getItem: () => null,
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
    };
    expect(
      savePresetAction(createToolPresetStore({ storage: full }), 'demo-tool', 'A', values, null),
    ).toMatchObject({ ok: false, message: presetErrorMessage('WRITE_FAILED') });
    const newer = memoryStorage();
    newer.setItem(TOOL_PRESETS_KEY, JSON.stringify({ version: 9, tools: {} }));
    expect(
      savePresetAction(createToolPresetStore({ storage: newer }), 'demo-tool', 'A', values, null),
    ).toMatchObject({ ok: false, message: presetErrorMessage('UNSUPPORTED_VERSION') });
  });

  it('validates names and size limits', () => {
    const store = createToolPresetStore({ storage: memoryStorage(), ids: ids() });
    expect(savePresetAction(store, 'demo-tool', '  ', values, null).message).toBe(
      presetErrorMessage('NAME_REQUIRED'),
    );
    expect(savePresetAction(store, 'demo-tool', 'x'.repeat(61), values, null).message).toBe(
      presetErrorMessage('NAME_TOO_LONG'),
    );
    const big = { price: 'x'.repeat(20_000) };
    expect(savePresetAction(store, 'demo-tool', 'Big', big, null).message).toBe(
      presetErrorMessage('TOO_LARGE'),
    );
    for (let i = 0; i < 20; i++) savePresetAction(store, 'demo-tool', `P${i}`, {}, null);
    expect(savePresetAction(store, 'demo-tool', 'One more', {}, null).message).toBe(
      presetErrorMessage('TOO_MANY_PRESETS'),
    );
  });

  it('stays local: no network, analytics, URL change or autosave', () => {
    const fetchSpy = vi.fn();
    const beacon = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    vi.stubGlobal('XMLHttpRequest', vi.fn());
    vi.stubGlobal('navigator', { sendBeacon: beacon });
    const sink = vi.fn();
    setAnalyticsSink(sink);
    const storage = memoryStorage();
    const store = createToolPresetStore({ storage, ids: ids() });
    expect(storage.data.size).toBe(0);
    savePresetAction(store, 'demo-tool', 'A', values, null);
    loadPresetAction(store, 'demo-tool', 'id1', preset);
    renamePresetAction(store, 'demo-tool', 'id1', 'B');
    deletePresetAction(store, 'demo-tool', 'id1');
    clearPresetsAction(store, 'demo-tool');
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(beacon).not.toHaveBeenCalled();
    expect(sink).not.toHaveBeenCalled();
    for (const file of ['./toolPresets.ts', './ToolPresetManager.tsx']) {
      const source = readFileSync(new URL(file, import.meta.url), 'utf8');
      expect(source).not.toMatch(
        /\bfetch\s*\(|XMLHttpRequest|sendBeacon|\btrack\(|location\.|history\.|console\./,
      );
    }
  });
});
