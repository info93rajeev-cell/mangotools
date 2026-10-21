import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ok } from '@mangotools/core';
import type { ResolvedPreset } from '@mangotools/schemas';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as actions from './actions.ts';
import { type CompressFile, useImageCompress } from './useImageCompress.ts';

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
  id: 'image/compress',
  operation: 'image.compress@1',
  params: {},
  fields: {},
  outputs: {},
  strings: {},
  messages: {},
  ui: {},
} as unknown as ResolvedPreset;

describe('useImageCompress Hook', () => {
  beforeEach(() => {
    hooks.values = [];
    hooks.refs = [];
    hooks.effects = [];
    hooks.stateIndex = 0;
    hooks.refIndex = 0;
    vi.clearAllMocks();
  });

  it('initializes with default values when no file is loaded', () => {
    const notify = vi.fn();
    const onPhase = vi.fn();
    const hook = useImageCompress(dummyPreset, 'image-compress', notify, onPhase);

    expect(hook.file).toBeNull();
    expect(hook.outputFormat).toBe('same');
    expect(hook.quality).toBe(80);
    expect(hook.maxFileSizeKB).toBeNull();
    expect(hook.phase).toBe('idle');
  });

  it('updates output format, quality and target size correctly', () => {
    const notify = vi.fn();
    const onPhase = vi.fn();
    const hook = useImageCompress(dummyPreset, 'image-compress', notify, onPhase);

    hook.setOutputFormat('webp');
    expect(hooks.values[3]).toBe('webp');

    hook.setQuality(65);
    expect(hooks.values[4]).toBe(65);

    hook.setMaxFileSizeKB(50);
    expect(hooks.values[5]).toBe(50);
  });

  it('executes compression via worker host and downloads result', async () => {
    const notify = vi.fn();
    const onPhase = vi.fn();

    const sampleJpg = readFileSync(
      join(process.cwd(), 'tools/image-format-converter/fixtures/files/sample.jpg'),
    );

    mockRun.mockResolvedValueOnce(
      ok({
        fileName: 'photo-compressed.jpg',
        bytes: new Uint8Array([1, 2, 3]),
        originalWidth: 1600,
        originalHeight: 1200,
        outputWidth: 1600,
        outputHeight: 1200,
        originalFileSize: 1000,
        outputFileSize: 600,
        sizeDifferenceBytes: 400,
        sizeChangePercent: 40,
        originalFormat: 'jpg',
        outputFormat: 'jpg',
        outputQuality: 80,
        dimensions: '1600 × 1200',
        status: 'Optimal',
        encodeAttempts: 1,
      }),
    );

    hooks.values[0] = {
      name: 'photo.jpg',
      bytes: new Uint8Array(sampleJpg),
      size: sampleJpg.byteLength,
    } as CompressFile;
    hooks.values[2] = { width: 1600, height: 1200 };
    hooks.values[3] = 'same';
    hooks.values[4] = 80;
    hooks.values[5] = 100;

    hooks.stateIndex = 0;
    hooks.refIndex = 0;
    const hook = useImageCompress(dummyPreset, 'image-compress', notify, onPhase);

    await hook.executeCompressAndDownload();

    expect(mockRun).toHaveBeenCalledWith(
      dummyPreset.operation,
      expect.objectContaining({
        outputFormat: 'same',
        quality: 80,
        maxFileSizeKB: 100,
      }),
      dummyPreset.params,
    );
    expect(mockDownloadBytes).toHaveBeenCalledWith(
      expect.any(Uint8Array),
      'photo-compressed.jpg',
      'image/jpeg',
    );
    expect(onPhase).toHaveBeenCalledWith('result');
  });

  it('compresses to PDF format and downloads .pdf', async () => {
    const notify = vi.fn();
    const onPhase = vi.fn();

    const sampleJpg = readFileSync(
      join(process.cwd(), 'tools/image-format-converter/fixtures/files/sample.jpg'),
    );

    mockRun.mockResolvedValueOnce(
      ok({
        fileName: 'photo-compressed.jpg',
        bytes: new Uint8Array(sampleJpg),
        originalWidth: 1600,
        originalHeight: 1200,
        outputWidth: 1600,
        outputHeight: 1200,
        originalFileSize: 1000,
        outputFileSize: 600,
        sizeDifferenceBytes: 400,
        sizeChangePercent: 40,
        originalFormat: 'jpg',
        outputFormat: 'jpg',
        outputQuality: 80,
        dimensions: '1600 × 1200',
        status: 'Optimal',
        encodeAttempts: 1,
      }),
    );

    hooks.values[0] = {
      name: 'photo.jpg',
      bytes: new Uint8Array(sampleJpg),
      size: sampleJpg.byteLength,
    } as CompressFile;
    hooks.values[2] = { width: 1600, height: 1200 };
    hooks.values[3] = 'pdf'; // outputFormat
    hooks.values[4] = 80;

    hooks.stateIndex = 0;
    hooks.refIndex = 0;
    const hook = useImageCompress(dummyPreset, 'image-compress', notify, onPhase);

    await hook.executeCompressAndDownload();

    expect(mockDownloadBytes).toHaveBeenCalledWith(
      expect.any(Uint8Array),
      'photo-compressed.pdf',
      'application/pdf',
    );
  });
});
