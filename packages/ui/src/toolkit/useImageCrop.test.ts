import { ok } from '@mangotools/core';
import type { ResolvedPreset } from '@mangotools/schemas';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as actions from './actions.ts';
import { type CropFile, useImageCrop } from './useImageCrop.ts';

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
  id: 'image-crop',
  title: 'Image Crop',
  description: 'Crop images',
  archetype: 'D',
  operation: 'image.crop@1',
  category: 'image',
  tags: ['image', 'crop'],
  fields: {},
  userOptions: {},
  outputs: {},
  params: {},
  ui: { maxFiles: 1, fileAccept: 'image/jpeg,image/png,image/webp' },
};

describe('useImageCrop out-of-order & stale run rejection (Gate 2)', () => {
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

  const setupCropWithFile = () => {
    hooks.values = [];
    hooks.refs = [];
    hooks.effects = [];
    hooks.stateIndex = 0;
    hooks.refIndex = 0;
    const notify = vi.fn();
    const onPhase = vi.fn();

    let cropInstance!: ReturnType<typeof useImageCrop>;
    const render = () => {
      hooks.stateIndex = 0;
      hooks.refIndex = 0;
      cropInstance = useImageCrop(dummyPreset, 'image-crop', notify, onPhase);
    };
    hooks.onStateChange = render;
    render();

    // Populate loaded file state
    const dummyFile: CropFile = {
      name: 'photo.jpg',
      size: 1024,
      bytes: new Uint8Array([0xff, 0xd8, 0xff, 0xe0]),
    };
    cropInstance.setFile(dummyFile);
    cropInstance.setSourceDims({ width: 1000, height: 800 });
    cropInstance.setImageSrc('blob:http://localhost/test.jpg');
    cropInstance.setCropRectState({ x: 100, y: 100, width: 400, height: 300 });

    return {
      get crop() {
        return cropInstance;
      },
      notify,
      onPhase,
    };
  };

  it('drops slow run when user changes crop rect before completion', async () => {
    const harness = setupCropWithFile();

    let resolveRunA: (val: unknown) => void = () => {};
    const runAPromise = new Promise((resolve) => {
      resolveRunA = resolve;
    });
    mockRun.mockReturnValueOnce(runAPromise);

    // Trigger crop run A
    harness.crop.runCrop();

    // User modifies crop rect while run A is pending
    harness.crop.setCropRect({ x: 200, y: 200, width: 500, height: 400 });

    // Now slow run A finishes
    resolveRunA(
      ok({
        fileName: 'photo-cropped.jpg',
        bytes: new Uint8Array([1, 2, 3]),
        originalWidth: 1000,
        originalHeight: 800,
        cropX: 100,
        cropY: 100,
        cropWidth: 400,
        cropHeight: 300,
        outputWidth: 400,
        outputHeight: 300,
        originalFormat: 'jpg',
        outputFormat: 'jpg',
        outputFileSize: 3,
      }),
    );

    await runAPromise;
    await new Promise((r) => setTimeout(r, 10));

    expect(harness.crop.result).toBeNull();
    expect(mockDownloadBytes).not.toHaveBeenCalled();
    expect(harness.notify).not.toHaveBeenCalled();
  });

  it('drops slow run when user changes output format before completion', async () => {
    const harness = setupCropWithFile();

    let resolveRunA: (val: unknown) => void = () => {};
    const runAPromise = new Promise((resolve) => {
      resolveRunA = resolve;
    });
    mockRun.mockReturnValueOnce(runAPromise);

    harness.crop.runCrop();
    harness.crop.setOutputFormat('png');

    resolveRunA(
      ok({
        fileName: 'photo-cropped.jpg',
        bytes: new Uint8Array([1, 2, 3]),
        originalWidth: 1000,
        originalHeight: 800,
        cropX: 100,
        cropY: 100,
        cropWidth: 400,
        cropHeight: 300,
        outputWidth: 400,
        outputHeight: 300,
        originalFormat: 'jpg',
        outputFormat: 'jpg',
        outputFileSize: 3,
      }),
    );

    await runAPromise;
    await new Promise((r) => setTimeout(r, 10));

    expect(harness.crop.result).toBeNull();
    expect(mockDownloadBytes).not.toHaveBeenCalled();
    expect(harness.notify).not.toHaveBeenCalled();
  });

  it('keeps latest run when earlier run finishes out of order', async () => {
    const harness = setupCropWithFile();

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
    harness.crop.runCrop();

    // Run B starts later
    mockRun.mockReturnValueOnce(runBPromise);
    harness.crop.runCrop();

    // Run B finishes first
    resolveRunB(
      ok({
        fileName: 'photo-runB.jpg',
        bytes: new Uint8Array([2, 2, 2]),
        originalWidth: 1000,
        originalHeight: 800,
        cropX: 100,
        cropY: 100,
        cropWidth: 400,
        cropHeight: 300,
        outputWidth: 400,
        outputHeight: 300,
        originalFormat: 'jpg',
        outputFormat: 'jpg',
        outputFileSize: 3,
      }),
    );
    await runBPromise;
    await new Promise((r) => setTimeout(r, 10));

    expect(harness.crop.result?.fileName).toBe('photo-runB.jpg');
    expect(mockDownloadBytes).toHaveBeenCalledTimes(1);

    // Run A finishes afterwards (out-of-order)
    resolveRunA(
      ok({
        fileName: 'photo-runA.jpg',
        bytes: new Uint8Array([1, 1, 1]),
        originalWidth: 1000,
        originalHeight: 800,
        cropX: 100,
        cropY: 100,
        cropWidth: 400,
        cropHeight: 300,
        outputWidth: 400,
        outputHeight: 300,
        originalFormat: 'jpg',
        outputFormat: 'jpg',
        outputFileSize: 3,
      }),
    );
    await runAPromise;
    await new Promise((r) => setTimeout(r, 10));

    // Must NOT have overwritten Run B with Run A!
    expect(harness.crop.result?.fileName).toBe('photo-runB.jpg');
    expect(mockDownloadBytes).toHaveBeenCalledTimes(1);
  });
});
