import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ok } from '@mangotools/core';
import type { ResolvedPreset } from '@mangotools/schemas';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as actions from './actions.ts';
import { type ResizeFile, useImageResize } from './useImageResize.ts';

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

const dummyPreset: ResolvedPreset = {
  id: 'image-resize',
  title: 'Image Resize',
  description: 'Resize images',
  archetype: 'D',
  operation: 'image.resize@1',
  category: 'image',
  tags: ['image', 'resize'],
  fields: {},
  userOptions: {},
  outputs: {},
  presets: {},
  params: {},
  ui: {
    fileAccept: 'image/jpeg,image/png,image/webp',
    maxFiles: 1,
  },
  capabilities: { print: false, share: false },
};

describe('useImageResize Hook', () => {
  beforeEach(() => {
    hooks.values = [];
    hooks.refs = [];
    hooks.effects = [];
    hooks.stateIndex = 0;
    hooks.refIndex = 0;
    hooks.onStateChange = null;
    vi.clearAllMocks();
  });

  it('initializes with default values when no file is loaded', () => {
    const notify = vi.fn();
    const onPhase = vi.fn();
    const hook = useImageResize(dummyPreset, 'image-resize', notify, onPhase);

    expect(hook.file).toBeNull();
    expect(hook.targetWidth).toBe(800);
    expect(hook.targetHeight).toBe(600);
    expect(hook.lockAspectRatio).toBe(true);
    expect(hook.scalePercent).toBe(100);
    expect(hook.outputFormat).toBe('same');
    expect(hook.phase).toBe('idle');
    expect(hook.result).toBeNull();
  });

  it('updates target dimensions proportionally when aspect ratio is locked', () => {
    const notify = vi.fn();
    const onPhase = vi.fn();

    // Simulate loaded file state
    hooks.values[0] = {
      name: 'test.jpg',
      bytes: new Uint8Array([1, 2, 3]),
      type: 'image/jpeg',
    } as ResizeFile;
    hooks.values[2] = { width: 1600, height: 1200 }; // sourceDims (4:3)

    // Set width to 800 -> height should become 600
    hooks.stateIndex = 0;
    hooks.refIndex = 0;
    const activeHook = useImageResize(dummyPreset, 'image-resize', notify, onPhase);
    activeHook.setWidth(800);

    expect(hooks.values[3]).toBe(800); // targetWidth
    expect(hooks.values[4]).toBe(600); // targetHeight (proportional 4:3)
    expect(hooks.values[6]).toBe(50); // scalePercent
  });

  it('applies scale presets correctly', () => {
    const notify = vi.fn();
    const onPhase = vi.fn();

    hooks.values[2] = { width: 2000, height: 1000 }; // 2:1 ratio

    hooks.stateIndex = 0;
    hooks.refIndex = 0;
    const activeHook = useImageResize(dummyPreset, 'image-resize', notify, onPhase);
    activeHook.setScalePercent(50);

    expect(hooks.values[3]).toBe(1000); // 50% width
    expect(hooks.values[4]).toBe(500); // 50% height
    expect(hooks.values[6]).toBe(50);
  });

  it('executes resize operation via worker host and exposes download', async () => {
    mockRun.mockResolvedValueOnce(
      ok({
        fileName: 'test-resized.jpg',
        bytes: new Uint8Array([10, 20]),
        originalWidth: 1600,
        originalHeight: 1200,
        outputWidth: 800,
        outputHeight: 600,
        originalFileSize: 500000,
        outputFileSize: 150000,
        sizeDifferenceBytes: 350000,
        sizeChangePercent: -70,
        originalFormat: 'jpg',
        outputFormat: 'jpg',
      }),
    );

    const notify = vi.fn();
    const onPhase = vi.fn();

    hooks.values[0] = {
      name: 'test.jpg',
      bytes: new Uint8Array([1, 2, 3]),
      type: 'image/jpeg',
    } as ResizeFile;
    hooks.values[2] = { width: 1600, height: 1200 };
    hooks.values[3] = 800;
    hooks.values[4] = 600;

    hooks.stateIndex = 0;
    hooks.refIndex = 0;
    const hook = useImageResize(dummyPreset, 'image-resize', notify, onPhase);

    await hook.executeResize();

    expect(mockRun).toHaveBeenCalledWith(
      dummyPreset.operation,
      expect.objectContaining({
        targetWidth: 800,
        targetHeight: 600,
        outputFormat: 'same',
      }),
      dummyPreset.params,
    );
    expect(onPhase).toHaveBeenCalledWith('result');
    expect(notify).toHaveBeenCalledWith('Resized to 800 × 600 px');

    // Test download
    hooks.stateIndex = 0;
    hooks.refIndex = 0;
    const completedHook = useImageResize(dummyPreset, 'image-resize', notify, onPhase);
    completedHook.downloadResult();
    expect(mockDownloadBytes).toHaveBeenCalled();
  });

  it('resizes to PDF format and downloads .pdf', async () => {
    const notify = vi.fn();
    const onPhase = vi.fn();

    const sampleJpg = readFileSync(
      join(process.cwd(), 'tools/image-format-converter/fixtures/files/sample.jpg'),
    );

    mockRun.mockResolvedValueOnce(
      ok({
        fileName: 'test-resized.png',
        bytes: new Uint8Array(sampleJpg),
        originalWidth: 1600,
        originalHeight: 1200,
        outputWidth: 800,
        outputHeight: 600,
        originalFileSize: 1000,
        outputFileSize: 800,
        sizeDifferenceBytes: 200,
        sizeChangePercent: -20,
        originalFormat: 'jpg',
        outputFormat: 'png',
      }),
    );

    hooks.values[0] = {
      name: 'test.jpg',
      bytes: new Uint8Array(sampleJpg),
      size: sampleJpg.byteLength,
    } as ResizeFile;
    hooks.values[2] = { width: 1600, height: 1200 };
    hooks.values[3] = 800;
    hooks.values[4] = 600;
    hooks.values[7] = 'pdf'; // outputFormat

    hooks.stateIndex = 0;
    hooks.refIndex = 0;
    const hook = useImageResize(dummyPreset, 'image-resize', notify, onPhase);

    await hook.executeResizeAndDownload();

    expect(mockDownloadBytes).toHaveBeenCalledWith(
      expect.any(Uint8Array),
      'test-resized.pdf',
      'application/pdf',
    );
  });
});
