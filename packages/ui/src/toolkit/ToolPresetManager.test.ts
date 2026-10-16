import { readFileSync } from 'node:fs';
import { createToolPresetStore, type StorageLike } from '@mangotools/runtime';
import type { ResolvedPreset } from '@mangotools/schemas';
import type { VNode } from 'preact';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Button } from '../primitives/Button.tsx';
import { Select } from '../primitives/inputs.tsx';
import { ToolPresetManager } from './ToolPresetManager.tsx';

// Lifecycle-only tests using the existing hook-mock convention; the browser test proves hydration.
const hooks = vi.hoisted(() => ({
  values: [] as unknown[],
  effects: [] as (() => void)[],
  index: 0,
}));
vi.mock('preact/hooks', () => ({
  useMemo: (fn: () => unknown) => fn(),
  useState: (initial: unknown) => {
    const index = hooks.index++;
    if (!(index in hooks.values))
      hooks.values[index] = typeof initial === 'function' ? initial() : initial;
    return [
      hooks.values[index],
      (next: unknown) => {
        hooks.values[index] = typeof next === 'function' ? next(hooks.values[index]) : next;
      },
    ];
  },
  useEffect: (effect: () => void) => hooks.effects.push(effect),
}));
type Element = VNode<Record<string, unknown>>;
function nodes(value: unknown): Element[] {
  if (Array.isArray(value)) return value.flatMap(nodes);
  if (!value || typeof value !== 'object' || !('type' in value)) return [];
  const node = value as Element;
  return typeof node.type === 'function' && node.type !== Select && node.type !== Button
    ? nodes((node.type as (p: Element['props']) => unknown)(node.props))
    : [node, ...nodes(node.props.children)];
}
const preset: ResolvedPreset = JSON.parse(
  readFileSync('generated/presets/estimate/gst.india.json', 'utf8'),
);
const values = { amount: '1234.50', rate: '18', mode: 'add', supply: 'intra' };
function setup(saved: boolean) {
  const data = new Map<string, string>();
  const storage: StorageLike = {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value);
    },
  };
  const store = createToolPresetStore({ storage, ids: () => 'kept' });
  if (saved) store.save('demo-tool', { name: 'Saved', values });
  const list = vi.spyOn(store, 'list');
  const onApply = vi.fn();
  const render = () => {
    hooks.index = 0;
    return nodes(
      ToolPresetManager({
        idPrefix: 'test',
        toolId: 'demo-tool',
        preset,
        values: {},
        store,
        onApply,
      }),
    );
  };
  return { data, store, list, onApply, render };
}
const select = (elements: Element[]) => elements.find((n) => n.type === Select)?.props;
afterEach(() => {
  hooks.values = [];
  hooks.effects = [];
  hooks.index = 0;
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('saved-preset mount lifecycle', () => {
  it('keeps initial rendering deterministic without reading browser storage or the saved list', () => {
    const read = vi.fn(() => {
      throw new Error('No browser storage during SSR');
    });
    vi.stubGlobal('localStorage', { getItem: read, setItem: read });
    expect(() =>
      ToolPresetManager({ idPrefix: 'ssr', toolId: 'demo-tool', preset, values: {}, onApply() {} }),
    ).not.toThrow();
    expect(read).not.toHaveBeenCalled();
  });
  it('starts with an empty SSR-compatible list, then enables persisted options after mount', () => {
    const view = setup(true);
    const before = [...view.data];
    expect(select(view.render())?.disabled).toBe(true);
    expect(view.list).not.toHaveBeenCalled();
    for (const effect of hooks.effects.splice(0)) effect();
    const mounted = select(view.render());
    if (!mounted) throw new Error('Missing preset selector');
    expect(mounted?.disabled).toBe(false);
    expect(mounted?.options).toContainEqual({ value: 'kept', label: 'Saved' });
    (mounted.onValue as (id: string) => void)('kept');
    const load = view.render().find((n) => n.type === Button && n.props.children === 'Load');
    if (!load) throw new Error('Missing Load action');
    expect(load?.props.disabled).toBe(false);
    (load.props.onClick as () => void)();
    expect(view.onApply).toHaveBeenCalledWith(expect.objectContaining(values));
    expect([...view.data]).toEqual(before);
    expect(view.store.list('demo-tool')).toHaveLength(1);
  });
  it('leaves the native selector disabled when the mounted store is empty', () => {
    const view = setup(false);
    expect(select(view.render())?.disabled).toBe(true);
    for (const effect of hooks.effects.splice(0)) effect();
    expect(select(view.render())?.disabled).toBe(true);
    expect(view.data.size).toBe(0);
  });
});
