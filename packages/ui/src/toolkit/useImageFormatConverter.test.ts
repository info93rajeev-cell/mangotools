import { ok } from '@mangotools/core';
import type { ResolvedPreset } from '@mangotools/schemas';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as actions from './actions.ts';
import { type ConvertFile, useImageFormatConverter } from './useImageFormatConverter.ts';

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
  id: 'image/convert',
  title: 'Image Format Converter',
  description: 'Convert images to JPG, PNG, or WebP',
  archetype: 'D',
  operation: 'image.resize@1',
  category: 'media',
  tags: ['images', 'convert'],
  fields: {},
  userOptions: {},
  outputs: {},
  presets: {},
  params: {
    outputFileNameSuffix: '-converted',
    outputFileNameFallback: 'converted-image',
  },
  ui: {
    fileAccept: 'image/jpeg,image/png,image/webp',
    maxFiles: 1,
  },
  capabilities: { print: false, share: false },
};

describe('useImageFormatConverter Hook', () => {
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
    const hook = useImageFormatConverter(dummyPreset, 'image-format-converter', notify, onPhase);

    expect(hook.file).toBeNull();
    expect(hook.targetFormat).toBe('png');
    expect(hook.quality).toBe(85);
    expect(hook.customFileName).toBe('');
    expect(hook.phase).toBe('idle');
    expect(hook.result).toBeNull();
  });

  it('updates target format and quality correctly', () => {
    const notify = vi.fn();
    const onPhase = vi.fn();
    const hook = useImageFormatConverter(dummyPreset, 'image-format-converter', notify, onPhase);

    hook.setTargetFormat('webp');
    expect(hooks.values[4]).toBe('webp');

    hook.setQuality(90);
    expect(hooks.values[5]).toBe(90);

    hook.setCustomFileName('converted-photo');
    expect(hooks.values[6]).toBe('converted-photo');
  });

  it('executes conversion and downloads result', async () => {
    const notify = vi.fn();
    const onPhase = vi.fn();

    const mockFile: ConvertFile = {
      name: 'test.jpg',
      size: 1000,
      bytes: new Uint8Array([1, 2, 3]),
    };

    mockRun.mockResolvedValueOnce(
      ok(
        {
          fileName: 'test-converted.png',
          bytes: new Uint8Array([4, 5, 6]),
          originalWidth: 800,
          originalHeight: 600,
          outputWidth: 800,
          outputHeight: 600,
          originalFileSize: 1000,
          outputFileSize: 850,
          sizeDifferenceBytes: 150,
          sizeChangePercent: 15,
          originalFormat: 'jpg',
          outputFormat: 'png',
        },
        [],
      ),
    );

    // Set mock values before hook invocation
    hooks.values[0] = mockFile;
    hooks.values[3] = { width: 800, height: 600 };
    hooks.values[4] = 'png';
    hooks.stateIndex = 0;
    hooks.refIndex = 0;

    const hook = useImageFormatConverter(dummyPreset, 'image-format-converter', notify, onPhase);

    await hook.executeConvertAndDownload();

    expect(mockRun).toHaveBeenCalledWith(
      'image.resize@1',
      expect.objectContaining({
        targetWidth: 800,
        targetHeight: 600,
        keepAspectRatio: true,
        outputFormat: 'png',
      }),
      dummyPreset.params,
    );

    expect(mockDownloadBytes).toHaveBeenCalledWith(
      expect.any(Uint8Array),
      'test-converted.png',
      'image/png',
    );
  });
});
