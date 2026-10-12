import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { setAnalyticsSink } from './analytics.ts';
import { RECENT_KEY, type StorageLike, THEME_KEY } from './preferences.ts';
import {
  createToolPresetStore,
  MAX_PRESET_NAME_LENGTH,
  MAX_PRESET_VALUES_SIZE,
  MAX_PRESETS_PER_TOOL,
  TOOL_PRESETS_KEY,
} from './tool-presets.ts';

const memoryStorage = (): StorageLike & { data: Map<string, string> } => {
  const data = new Map<string, string>();
  return { data, getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v) };
};

const counterIds = () => {
  let n = 0;
  return () => `p${++n}`;
};

const store = (storage: StorageLike | null = memoryStorage()) =>
  createToolPresetStore({ storage, ids: counterIds() });

const values = {
  sellingPrice: '1180.50',
  quantity: '2',
  showAdvanced: true,
  slabs: '[{"max":"500","value":"10.00"}]',
  rows: [{ min: '0.5', unit: 'kg', amount: '40.10' }],
};

afterEach(() => {
  vi.restoreAllMocks();
  setAnalyticsSink(null);
});

describe('tool presets', () => {
  it('starts empty and saves, lists and loads presets in order', () => {
    const s = store();
    expect(s.list('demo-tool')).toEqual([]);
    const a = s.save('demo-tool', { name: '  Standard  ', values });
    const b = s.save('demo-tool', { name: 'Heavy items', values: { quantity: '5' } });
    expect(a).toEqual({ ok: true, value: { id: 'p1', name: 'Standard', values } });
    expect(b.ok && b.value.id).toBe('p2');
    expect(s.list('demo-tool').map((p) => p.name)).toEqual(['Standard', 'Heavy items']);
    expect(s.get('demo-tool', 'p1')?.values).toEqual(values);
    expect(s.get('demo-tool', 'missing')).toBeNull();
  });

  it('keeps ids unique even when the id source repeats', () => {
    const ids = ['same', 'same', 'other'];
    const s = createToolPresetStore({ storage: memoryStorage(), ids: () => ids.shift() ?? 'x' });
    s.save('demo-tool', { name: 'A', values: {} });
    const second = s.save('demo-tool', { name: 'B', values: {} });
    expect(second.ok && second.value.id).toBe('other');
  });

  it('updates values in place, renames, deletes one and clears all', () => {
    const s = store();
    s.save('demo-tool', { name: 'A', values: { quantity: '1' } });
    s.save('demo-tool', { name: 'B', values: { quantity: '2' } });
    const updated = s.save('demo-tool', { name: 'A', values: { quantity: '9' }, presetId: 'p1' });
    expect(updated.ok && updated.value).toEqual({ id: 'p1', name: 'A', values: { quantity: '9' } });
    expect(s.rename('demo-tool', 'p2', ' Renamed ').ok).toBe(true);
    expect(s.list('demo-tool').map((p) => [p.id, p.name])).toEqual([
      ['p1', 'A'],
      ['p2', 'Renamed'],
    ]);
    expect(s.get('demo-tool', 'p2')?.values).toEqual({ quantity: '2' });
    expect(s.remove('demo-tool', 'p1')).toEqual({ ok: true, value: true });
    expect(s.list('demo-tool').map((p) => p.id)).toEqual(['p2']);
    expect(s.remove('demo-tool', 'p1')).toEqual({ ok: false, error: 'NOT_FOUND' });
    expect(s.rename('demo-tool', 'nope', 'X')).toEqual({ ok: false, error: 'NOT_FOUND' });
    expect(s.clear('demo-tool')).toEqual({ ok: true, value: true });
    expect(s.list('demo-tool')).toEqual([]);
  });

  it('isolates tools and leaves other preference keys untouched', () => {
    const storage = memoryStorage();
    storage.setItem(THEME_KEY, 'dark');
    storage.setItem(RECENT_KEY, '["a"]');
    const s = store(storage);
    s.save('tool-a', { name: 'A', values: { x: '1' } });
    s.save('tool-b', { name: 'B', values: { x: '2' } });
    s.clear('tool-a');
    expect(s.list('tool-a')).toEqual([]);
    expect(s.list('tool-b').map((p) => p.name)).toEqual(['B']);
    expect(storage.data.get(THEME_KEY)).toBe('dark');
    expect(storage.data.get(RECENT_KEY)).toBe('["a"]');
    expect(s.save('Not A Tool', { name: 'A', values: {} })).toEqual({
      ok: false,
      error: 'INVALID_TOOL_ID',
    });
  });

  it('validates names', () => {
    const s = store();
    expect(s.save('demo-tool', { name: '   ', values: {} })).toEqual({
      ok: false,
      error: 'NAME_REQUIRED',
    });
    const long = 'x'.repeat(MAX_PRESET_NAME_LENGTH + 1);
    expect(s.save('demo-tool', { name: long, values: {} })).toEqual({
      ok: false,
      error: 'NAME_TOO_LONG',
    });
    expect(s.save('demo-tool', { name: 'x'.repeat(MAX_PRESET_NAME_LENGTH), values: {} }).ok).toBe(
      true,
    );
    expect(s.rename('demo-tool', 'p1', '')).toEqual({ ok: false, error: 'NAME_REQUIRED' });
  });

  it('enforces count and size limits and JSON-only values without number coercion', () => {
    const s = store();
    for (let i = 0; i < MAX_PRESETS_PER_TOOL; i++)
      s.save('demo-tool', { name: `P${i}`, values: {} });
    expect(s.save('demo-tool', { name: 'One more', values: {} })).toEqual({
      ok: false,
      error: 'TOO_MANY_PRESETS',
    });
    const big = { blob: 'x'.repeat(MAX_PRESET_VALUES_SIZE) };
    expect(store().save('demo-tool', { name: 'Big', values: big })).toEqual({
      ok: false,
      error: 'TOO_LARGE',
    });
    const numeric = { price: 1180.5 } as unknown as Record<string, string>;
    expect(store().save('demo-tool', { name: 'N', values: numeric })).toEqual({
      ok: false,
      error: 'INVALID_VALUES',
    });
  });

  it('preserves decimal strings and nested rows exactly', () => {
    const storage = memoryStorage();
    store(storage).save('demo-tool', { name: 'Exact', values });
    const reread = store(storage).get('demo-tool', 'p1');
    expect(reread?.values).toEqual(values);
    expect(reread?.values.sellingPrice).toBe('1180.50');
    expect(storage.data.get(TOOL_PRESETS_KEY)).toContain('"amount":"40.10"');
  });

  it('reads corrupt or foreign-shaped storage as empty, then replaces it on save', () => {
    for (const raw of ['{not json', '[]', '{"version":1,"tools":[]}', '"text"']) {
      const storage = memoryStorage();
      storage.setItem(TOOL_PRESETS_KEY, raw);
      const s = store(storage);
      expect(s.list('demo-tool')).toEqual([]);
      expect(s.save('demo-tool', { name: 'A', values: {} }).ok).toBe(true);
      expect(s.list('demo-tool').map((p) => p.name)).toEqual(['A']);
    }
  });

  it('skips invalid entries but keeps other tools exactly as stored', () => {
    const storage = memoryStorage();
    const otherTool = [{ id: 'k', name: 'Kept', values: { a: '1' }, future: 'field' }];
    storage.setItem(
      TOOL_PRESETS_KEY,
      JSON.stringify({
        version: 1,
        tools: {
          'demo-tool': [{ id: 'ok', name: 'Good', values: {} }, { id: 'bad', values: 3 }, 'junk'],
          'other-tool': otherTool,
        },
      }),
    );
    const s = store(storage);
    expect(s.list('demo-tool').map((p) => p.id)).toEqual(['ok']);
    s.save('demo-tool', { name: 'New', values: {} });
    const stored = JSON.parse(storage.data.get(TOOL_PRESETS_KEY) ?? '{}');
    expect(stored.tools['other-tool']).toEqual(otherTool);
    expect(stored.tools['demo-tool'].map((p: { id: string }) => p.id)).toEqual(['ok', 'p1']);
  });

  it('never overwrites data written by a newer version', () => {
    const storage = memoryStorage();
    const newer = JSON.stringify({ version: 2, tools: { 'demo-tool': [{ id: 'z' }] } });
    storage.setItem(TOOL_PRESETS_KEY, newer);
    const s = store(storage);
    expect(s.list('demo-tool')).toEqual([]);
    expect(s.save('demo-tool', { name: 'A', values: {} })).toEqual({
      ok: false,
      error: 'UNSUPPORTED_VERSION',
    });
    expect(s.clear('demo-tool')).toEqual({ ok: false, error: 'UNSUPPORTED_VERSION' });
    expect(storage.data.get(TOOL_PRESETS_KEY)).toBe(newer);
  });

  it('reports unavailable storage and write failures without throwing', () => {
    const none = store(null);
    expect(none.list('demo-tool')).toEqual([]);
    expect(none.save('demo-tool', { name: 'A', values: {} })).toEqual({
      ok: false,
      error: 'STORAGE_UNAVAILABLE',
    });
    const blocked: StorageLike = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
    };
    expect(store(blocked).list('demo-tool')).toEqual([]);
    expect(store(blocked).save('demo-tool', { name: 'A', values: {} }).ok).toBe(false);
    const full: StorageLike = {
      getItem: () => null,
      setItem: () => {
        throw new DOMException('full', 'QuotaExceededError');
      },
    };
    expect(store(full).save('demo-tool', { name: 'A', values: {} })).toEqual({
      ok: false,
      error: 'WRITE_FAILED',
    });
  });

  it('stays local: no network request and no analytics event', () => {
    const fetchSpy = vi.fn();
    const beaconSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    vi.stubGlobal('XMLHttpRequest', vi.fn());
    vi.stubGlobal('navigator', { sendBeacon: beaconSpy });
    const sink = vi.fn();
    setAnalyticsSink(sink);
    const s = store();
    s.save('demo-tool', { name: 'Private', values });
    s.get('demo-tool', 'p1');
    s.rename('demo-tool', 'p1', 'Renamed');
    s.remove('demo-tool', 'p1');
    s.clear('demo-tool');
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(beaconSpy).not.toHaveBeenCalled();
    expect(XMLHttpRequest).not.toHaveBeenCalled();
    expect(sink).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
    const source = readFileSync(new URL('./tool-presets.ts', import.meta.url), 'utf8');
    expect(source).not.toMatch(/\bfetch\s*\(|XMLHttpRequest\(|sendBeacon\(|from '\.\/analytics/);
  });
});
