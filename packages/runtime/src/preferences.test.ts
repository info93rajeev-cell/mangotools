import { describe, expect, it } from 'vitest';
import { setAnalyticsSink, track, validateEvent } from './analytics.ts';
import {
  applyTheme,
  createPreferences,
  MAX_RECENT,
  RECENT_KEY,
  type StorageLike,
} from './preferences.ts';

const memoryStorage = (): StorageLike & { data: Map<string, string> } => {
  const data = new Map<string, string>();
  return { data, getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v) };
};

const throwingStorage: StorageLike = {
  getItem: () => {
    throw new Error('blocked');
  },
  setItem: () => {
    throw new Error('blocked');
  },
};

describe('preferences', () => {
  it('stores theme and defaults to system', () => {
    const prefs = createPreferences(memoryStorage());
    expect(prefs.getTheme()).toBe('system');
    prefs.setTheme('dark');
    expect(prefs.getTheme()).toBe('dark');
  });

  it('keeps the six most recent tools, newest first, without duplicates', () => {
    const prefs = createPreferences(memoryStorage());
    for (const id of ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'b']) prefs.addRecentTool(id);
    expect(prefs.getRecentTools()).toEqual(['b', 'g', 'f', 'e', 'd', 'c']);
    expect(prefs.getRecentTools().length).toBe(MAX_RECENT);
  });

  it('ignores corrupt stored data', () => {
    const storage = memoryStorage();
    storage.data.set(RECENT_KEY, '{not json');
    expect(createPreferences(storage).getRecentTools()).toEqual([]);
    storage.data.set(RECENT_KEY, JSON.stringify(['ok-id', '<script>', 42]));
    expect(createPreferences(storage).getRecentTools()).toEqual(['ok-id']);
  });

  it('falls back to memory when storage throws', () => {
    const prefs = createPreferences(throwingStorage);
    prefs.setTheme('light');
    expect(prefs.getTheme()).toBe('light');
    expect(prefs.addRecentTool('gst-calculator')).toEqual(['gst-calculator']);
  });

  it('applies the theme to the root element', () => {
    const root = { dataset: {} as DOMStringMap };
    applyTheme('dark', root);
    expect(root.dataset.theme).toBe('dark');
    applyTheme('system', root);
    expect(root.dataset.theme).toBeUndefined();
  });
});

describe('analytics catalogue', () => {
  it('accepts catalogue events and forwards them to the sink', () => {
    const seen: string[] = [];
    setAnalyticsSink((name) => seen.push(name));
    expect(track('tool_run', { toolId: 'gst-calculator' })).toBe(true);
    expect(track('tool_complete', { toolId: 'gst-calculator', method: 'copy' })).toBe(true);
    setAnalyticsSink(null);
    expect(seen).toEqual(['tool_run', 'tool_complete']);
  });

  it('rejects unknown events, extra properties and free text', () => {
    expect(validateEvent('page_scroll', {})).toContain('unknown event');
    expect(validateEvent('tool_run', { toolId: 'gst-calculator', input: '1000' })).toContain(
      'unexpected',
    );
    expect(validateEvent('tool_run', { toolId: 'Some user text' })).toContain('invalid');
    expect(validateEvent('search_query', { resultCount: -1 })).toContain('invalid');
  });
});
