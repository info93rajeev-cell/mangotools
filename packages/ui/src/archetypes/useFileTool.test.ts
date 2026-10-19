import { ok } from '@mangotools/core';
import type { ResolvedPreset } from '@mangotools/schemas';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as actions from '../toolkit/actions.ts';
import { useFileTool } from './useFileTool.ts';

const hooks = vi.hoisted(() => ({
  values: [] as unknown[],
  refs: [] as { current: unknown }[],
  effects: [] as (() => void)[],
  stateIndex: 0,
  refIndex: 0,
  onStateChange: null as null | (() => void),
}));

vi.mock('preact/hooks', () => ({
  useRef: (initial: unknown) => {
    const idx = hooks.refIndex++;
    if (!(idx in hooks.refs)) {
      hooks.refs[idx] = { current: initial };
    }
    return hooks.refs[idx];
  },
  useState: (initial: unknown) => {
    const idx = hooks.stateIndex++;
    if (!(idx in hooks.values)) {
      hooks.values[idx] = typeof initial === 'function' ? (initial as () => unknown)() : initial;
    }
    return [
      hooks.values[idx],
      (next: unknown) => {
        hooks.values[idx] =
          typeof next === 'function'
            ? (next as (prev: unknown) => unknown)(hooks.values[idx])
            : next;
        hooks.onStateChange?.();
      },
    ];
  },
  useEffect: (effect: () => void) => hooks.effects.push(effect),
}));

const mockRun = vi.fn();
vi.mock('@mangotools/runtime', () => ({
  getWorkerHost: () => ({ run: mockRun }),
  track: vi.fn(),
  buildRequest: () => ({ missing: [] }),
  defaultValues: () => ({}),
}));

const mockDownloadBytes = vi.spyOn(actions, 'downloadBytes').mockImplementation(() => {});

const dummyPreset: ResolvedPreset = {
  id: 'image-resize',
  title: 'Image Resize',
  description: 'Resize image',
  archetype: 'D',
  operation: 'image.resize@1',
  category: 'image',
  tags: ['image', 'resize'],
  fields: {},
  userOptions: {},
  outputs: {},
  params: {},
  ui: { maxFiles: 1, fileAccept: 'image/jpeg' },
};

describe('useFileTool out-of-order & stale run rejection (Gate 2)', () => {
  beforeEach(() => {
    hooks.values = [];
    hooks.refs = [];
    hooks.effects = [];
    hooks.stateIndex = 0;
    hooks.refIndex = 0;
    hooks.onStateChange = null;
    mockRun.mockReset();
    mockDownloadBytes.mockClear();
  });

  const setupTool = () => {
    hooks.values = [];
    hooks.refs = [];
    hooks.effects = [];
    hooks.stateIndex = 0;
    hooks.refIndex = 0;
    const notify = vi.fn();
    const onPhase = vi.fn();

    let toolInstance!: ReturnType<typeof useFileTool>;
    const render = () => {
      hooks.stateIndex = 0;
      hooks.refIndex = 0;
      toolInstance = useFileTool(dummyPreset, 'image-resize', notify, onPhase);
    };
    hooks.onStateChange = render;
    render();

    return {
      get tool() {
        return toolInstance;
      },
      notify,
      onPhase,
    };
  };

  it('drops slow run when user changes inputs while running', async () => {
    const harness = setupTool();

    let resolveRunA: (val: unknown) => void = () => {};
    const runAPromise = new Promise((resolve) => {
      resolveRunA = resolve;
    });
    mockRun.mockReturnValueOnce(runAPromise);

    harness.tool.primaryAction();

    // User changes output file name or field value
    harness.tool.setOutputFileName('new-name.jpg');

    resolveRunA(
      ok({
        fileName: 'old-name.jpg',
        bytes: new Uint8Array([1, 2, 3]),
        warnings: [],
      }),
    );
    await runAPromise;
    await new Promise((r) => setTimeout(r, 10));

    expect(harness.tool.result).toBeNull();
    expect(mockDownloadBytes).not.toHaveBeenCalled();
    expect(harness.notify).not.toHaveBeenCalled();
  });

  it('drops earlier run when finished out of order', async () => {
    const harness = setupTool();

    let resolveRunA: (val: unknown) => void = () => {};
    const runAPromise = new Promise((resolve) => {
      resolveRunA = resolve;
    });

    let resolveRunB: (val: unknown) => void = () => {};
    const runBPromise = new Promise((resolve) => {
      resolveRunB = resolve;
    });

    // Run A starts
    mockRun.mockReturnValueOnce(runAPromise);
    harness.tool.primaryAction();

    // Run B starts
    mockRun.mockReturnValueOnce(runBPromise);
    harness.tool.primaryAction();

    // Run B finishes first
    resolveRunB(
      ok({
        fileName: 'result-B.jpg',
        bytes: new Uint8Array([2, 2]),
        warnings: [],
      }),
    );
    await runBPromise;
    await new Promise((r) => setTimeout(r, 10));

    expect(harness.tool.result?.fileName).toBe('result-B.jpg');
    expect(mockDownloadBytes).toHaveBeenCalledTimes(1);

    // Run A finishes later
    resolveRunA(
      ok({
        fileName: 'result-A.jpg',
        bytes: new Uint8Array([1, 1]),
        warnings: [],
      }),
    );
    await runAPromise;
    await new Promise((r) => setTimeout(r, 10));

    // Result B must not be overwritten
    expect(harness.tool.result?.fileName).toBe('result-B.jpg');
    expect(mockDownloadBytes).toHaveBeenCalledTimes(1);
  });
});
