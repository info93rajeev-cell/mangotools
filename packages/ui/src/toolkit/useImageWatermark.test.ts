import { ok } from '@mangotools/core';
import type { ResolvedPreset } from '@mangotools/schemas';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as actions from './actions.ts';
import { useImageWatermark, type WatermarkFile } from './useImageWatermark.ts';

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
  id: 'image/watermark',
  operation: 'image.watermark@1',
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

describe('useImageWatermark Hook', () => {
  beforeEach(() => {
    hooks.values = [];
    hooks.refs = [];
    hooks.effects = [];
    hooks.stateIndex = 0;
    hooks.refIndex = 0;
    mockRun.mockReset();
    mockDownloadBytes.mockClear();
  });

  it('initializes with default watermark settings', () => {
    const onPhase = vi.fn();
    const notify = vi.fn();
    const hook = useImageWatermark(dummyPreset, onPhase, notify);

    expect(hook.text).toBe('MangoTools');
    expect(hook.position).toBe('bottom-right');
    expect(hook.opacity).toBe(50);
    expect(hook.fontSize).toBe(32);
    expect(hook.color).toBe('#ffffff');
    expect(hook.outputFormat).toBe('same');
    expect(hook.quality).toBe(85);
  });

  it('updates watermark options and clears previous result', () => {
    const onPhase = vi.fn();
    const notify = vi.fn();
    let hook = useImageWatermark(dummyPreset, onPhase, notify);

    hooks.stateIndex = 0;
    hooks.refIndex = 0;
    hook.setText('Confidential');
    hook.setPosition('center');
    hook.setOpacity(80);
    hook.setFontSize(48);
    hook.setColor('#ff0000');

    hooks.stateIndex = 0;
    hooks.refIndex = 0;
    hook = useImageWatermark(dummyPreset, onPhase, notify);

    expect(hook.text).toBe('Confidential');
    expect(hook.position).toBe('center');
    expect(hook.opacity).toBe(80);
    expect(hook.fontSize).toBe(48);
    expect(hook.color).toBe('#ff0000');
  });

  it('applies watermark via worker and downloads result', async () => {
    const onPhase = vi.fn();
    const notify = vi.fn();
    let hook = useImageWatermark(dummyPreset, onPhase, notify);

    const dummyFile: WatermarkFile = {
      name: 'photo.png',
      bytes: sampleBytes,
      size: sampleBytes.byteLength,
      lastModified: Date.now(),
      type: 'image/png',
    };

    // Inject state
    hooks.values[0] = dummyFile; // file
    hooks.values[1] = 'blob:photo'; // imageSrc
    hooks.values[2] = { width: 400, height: 300 }; // sourceDims

    mockRun.mockResolvedValueOnce(
      ok({
        fileName: 'photo-watermarked.png',
        bytes: sampleBytes,
        originalWidth: 400,
        originalHeight: 300,
        outputWidth: 400,
        outputHeight: 300,
        originalFileSize: sampleBytes.byteLength,
        outputFileSize: sampleBytes.byteLength + 10,
        sizeDifferenceBytes: -10,
        sizeChangePercent: 5,
        originalFormat: 'png',
        outputFormat: 'png',
        watermarkText: 'MangoTools',
        position: 'bottom-right',
        opacity: 50,
        fontSize: 32,
        color: '#ffffff',
      }),
    );

    hooks.stateIndex = 0;
    hooks.refIndex = 0;
    hook = useImageWatermark(dummyPreset, onPhase, notify);

    await hook.applyWatermark();

    expect(mockRun).toHaveBeenCalledWith(
      'image.watermark@1',
      expect.objectContaining({
        text: 'MangoTools',
        position: 'bottom-right',
        opacity: 50,
        fontSize: 32,
        color: '#ffffff',
      }),
      dummyPreset.params,
    );

    hooks.stateIndex = 0;
    hooks.refIndex = 0;
    hook = useImageWatermark(dummyPreset, onPhase, notify);

    expect(hook.result).not.toBeNull();
    expect(hook.result?.fileName).toBe('photo-watermarked.png');

    hook.downloadResult();
    expect(mockDownloadBytes).toHaveBeenCalledWith(
      sampleBytes,
      'photo-watermarked.png',
      'image/png',
    );
  });

  it('exports watermarked image as PDF', async () => {
    const onPhase = vi.fn();
    const notify = vi.fn();
    let hook = useImageWatermark(dummyPreset, onPhase, notify);

    const dummyFile: WatermarkFile = {
      name: 'invoice.png',
      bytes: sampleBytes,
      size: sampleBytes.byteLength,
      lastModified: Date.now(),
      type: 'image/png',
    };

    hooks.values[0] = dummyFile;
    hooks.values[1] = 'blob:invoice';
    hooks.values[2] = { width: 400, height: 300 };
    hooks.values[8] = 'pdf'; // outputFormat

    mockRun.mockResolvedValueOnce(
      ok({
        fileName: 'invoice-watermarked.png',
        bytes: sampleBytes,
        originalWidth: 400,
        originalHeight: 300,
        outputWidth: 400,
        outputHeight: 300,
        originalFileSize: sampleBytes.byteLength,
        outputFileSize: sampleBytes.byteLength,
        sizeDifferenceBytes: 0,
        sizeChangePercent: 0,
        originalFormat: 'png',
        outputFormat: 'png',
        watermarkText: 'Paid',
        position: 'center',
        opacity: 70,
        fontSize: 40,
        color: '#00aa00',
      }),
    );

    hooks.stateIndex = 0;
    hooks.refIndex = 0;
    hook = useImageWatermark(dummyPreset, onPhase, notify);

    await hook.applyWatermark();

    hooks.stateIndex = 0;
    hooks.refIndex = 0;
    hook = useImageWatermark(dummyPreset, onPhase, notify);

    expect(hook.result?.outputFormat).toBe('pdf');
    expect(hook.result?.fileName).toBe('invoice-watermarked.pdf');
  });

  it('executes and downloads in a single step', async () => {
    const onPhase = vi.fn();
    const notify = vi.fn();
    let hook = useImageWatermark(dummyPreset, onPhase, notify);

    const dummyFile: WatermarkFile = {
      name: 'stamp.png',
      bytes: sampleBytes,
      size: sampleBytes.byteLength,
      lastModified: Date.now(),
      type: 'image/png',
    };

    hooks.values[0] = dummyFile;
    hooks.values[1] = 'blob:stamp';
    hooks.values[2] = { width: 400, height: 300 };

    mockRun.mockResolvedValueOnce(
      ok({
        fileName: 'stamp-watermarked.png',
        bytes: sampleBytes,
        originalWidth: 400,
        originalHeight: 300,
        outputWidth: 400,
        outputHeight: 300,
        originalFileSize: sampleBytes.byteLength,
        outputFileSize: sampleBytes.byteLength + 10,
        sizeDifferenceBytes: -10,
        sizeChangePercent: 5,
        originalFormat: 'png',
        outputFormat: 'png',
        watermarkText: 'MangoTools',
        position: 'bottom-right',
        opacity: 50,
        fontSize: 32,
        color: '#ffffff',
      }),
    );

    hooks.stateIndex = 0;
    hooks.refIndex = 0;
    hook = useImageWatermark(dummyPreset, onPhase, notify);

    await hook.executeAndDownload();

    expect(mockDownloadBytes).toHaveBeenCalledWith(
      sampleBytes,
      'stamp-watermarked.png',
      'image/png',
    );
  });
});
