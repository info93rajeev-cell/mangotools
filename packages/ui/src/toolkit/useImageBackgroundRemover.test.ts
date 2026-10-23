import { ok } from '@mangotools/core';
import type { ResolvedPreset } from '@mangotools/schemas';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as actions from './actions.ts';
import { type BgFile, useImageBackgroundRemover } from './useImageBackgroundRemover.ts';

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
}));

const mockDownloadBytes = vi.spyOn(actions, 'downloadBytes').mockImplementation(() => {});

const dummyPreset = {
  id: 'image/remove-background',
  operation: 'image.remove-background@1',
  params: {},
  fields: {},
  outputs: {},
  strings: {},
  messages: {},
  ui: { archetypes: ['D'] },
} as unknown as ResolvedPreset;

const sampleBytes = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
  0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
  0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
  0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae,
  0x42, 0x60, 0x82,
]);

describe('useImageBackgroundRemover Hook', () => {
  beforeEach(() => {
    hooks.values = [];
    hooks.refs = [];
    hooks.effects = [];
    hooks.stateIndex = 0;
    hooks.refIndex = 0;
    mockRun.mockReset();
    mockDownloadBytes.mockClear();
  });

  function renderHook() {
    hooks.stateIndex = 0;
    hooks.refIndex = 0;
    const notify = vi.fn();
    const onPhase = vi.fn();
    return useImageBackgroundRemover(dummyPreset, 'image-background-remover', notify, onPhase);
  }

  it('initializes with default settings', () => {
    const hook = renderHook();
    expect(hook.outputFormat).toBe('png');
    expect(hook.tolerance).toBe(20);
    expect(hook.feather).toBe(2);
    expect(hook.targetColor).toBe('auto');
    expect(hook.replacementBackground).toBe('transparent');
  });

  it('updates tolerance, feather and replacement background', () => {
    let hook = renderHook();
    hook.setTolerance(35);
    hook.setFeather(5);
    hook.setReplacementBackground('#ffffff');
    hook = renderHook();
    expect(hook.tolerance).toBe(35);
    expect(hook.feather).toBe(5);
    expect(hook.replacementBackground).toBe('#ffffff');
  });

  it('executes background removal with worker and downloads result', async () => {
    const testFile: BgFile = {
      name: 'product.png',
      size: sampleBytes.byteLength,
      bytes: sampleBytes,
    };

    mockRun.mockResolvedValueOnce(
      ok({
        fileName: 'product-no-bg.png',
        bytes: sampleBytes,
        originalWidth: 100,
        originalHeight: 100,
        outputWidth: 100,
        outputHeight: 100,
        tolerance: 20,
        feather: 2,
        originalFileSize: sampleBytes.byteLength,
        outputFileSize: sampleBytes.byteLength - 10,
        sizeDifferenceBytes: 10,
        sizeChangePercent: 10,
        originalFormat: 'png',
        outputFormat: 'png',
      }),
    );

    let hook = renderHook();
    hook.setFile(testFile);
    hook = renderHook();
    await hook.executeRemoveBackgroundAndDownload();

    expect(mockRun).toHaveBeenCalledWith(
      'image.remove-background@1',
      expect.objectContaining({
        outputFormat: 'png',
        tolerance: 20,
        feather: 2,
      }),
      {},
    );
    expect(mockDownloadBytes).toHaveBeenCalledWith(sampleBytes, 'product-no-bg.png', 'image/png');
  });

  it('converts cutout to PDF format and downloads .pdf', async () => {
    const testFile: BgFile = {
      name: 'subject.png',
      size: sampleBytes.byteLength,
      bytes: sampleBytes,
    };

    mockRun.mockResolvedValueOnce(
      ok({
        fileName: 'subject-no-bg.png',
        bytes: sampleBytes,
        originalWidth: 200,
        originalHeight: 200,
        outputWidth: 200,
        outputHeight: 200,
        tolerance: 20,
        feather: 2,
        originalFileSize: sampleBytes.byteLength,
        outputFileSize: sampleBytes.byteLength,
        sizeDifferenceBytes: 0,
        sizeChangePercent: 0,
        originalFormat: 'png',
        outputFormat: 'png',
      }),
    );

    let hook = renderHook();
    hook.setFile(testFile);
    hook.setOutputFormat('pdf');
    hook = renderHook();

    await hook.executeRemoveBackgroundAndDownload();

    expect(mockRun).toHaveBeenCalledWith(
      'image.remove-background@1',
      expect.objectContaining({ outputFormat: 'png' }),
      {},
    );
    expect(mockDownloadBytes).toHaveBeenCalled();
    const downloadArgs = mockDownloadBytes.mock.calls[0];
    expect(downloadArgs[1]).toBe('subject-no-bg.pdf');
    expect(downloadArgs[2]).toBe('application/pdf');
    expect(downloadArgs[0].byteLength).toBeGreaterThan(0);
  });
});
