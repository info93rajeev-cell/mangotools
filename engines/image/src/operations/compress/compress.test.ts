import { createTestContext, executeOperation } from '@mangotools/core';
import { describe, expect, it, vi } from 'vitest';
import { messages } from '../../errors.ts';
import { MAX_FILE_BYTES } from '../../lib/limits.ts';
import { imageCompress } from './operation.ts';
import { imageCompressInput } from './schema.ts';
import { findCompressCandidate } from './search.ts';

const JPEG_BYTES = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0]);

const run = (input: Record<string, unknown>, params = {}) =>
  executeOperation(imageCompress, input, params, createTestContext());

const baseInput = {
  outputFormat: 'same' as const,
};

describe('bounded compress candidate search', () => {
  const searchOptions = {
    width: 1000,
    height: 800,
    startQuality: 80,
    minQuality: 50,
    format: 'jpg' as const,
    targetCeilingBytes: 5000,
    allowDimensionReduction: false,
  };

  it('selects the highest-quality candidate that meets the target ceiling', async () => {
    // Encodes at qualities [80, 76, 71, 67, 63, 59, 54, 50]
    // Suppose 80 is 6000 bytes (too big), 76 is 4800 bytes (meets ceiling <= 5000)
    const encode = vi.fn(async (_w: number, _h: number, quality: number) => {
      if (quality === 80) return new Uint8Array(6000);
      return new Uint8Array(4800);
    });

    const result = await findCompressCandidate(searchOptions, encode);
    expect(result.met).toBe(true);
    expect(result.candidate.bytes.byteLength).toBe(4800);
    expect(result.candidate.quality).toBe(76);
    expect(result.attempts).toBe(2);
  });

  it('reports failure (met: false) when even minQuality (50%) cannot get smaller than ceiling', async () => {
    // Input is 5000 bytes, all tested qualities produce >= 5500 bytes
    const encode = vi.fn(
      async (_w: number, _h: number, quality: number) => new Uint8Array(5500 + quality),
    );

    const result = await findCompressCandidate(searchOptions, encode);
    expect(result.met).toBe(false);
    expect(result.attempts).toBe(8);
    expect(result.candidate.bytes.byteLength).toBe(5550); // Smallest tested at q=50
  });

  it('PNG encodes exactly once and does not perform lossy quality search', async () => {
    const pngOptions = {
      ...searchOptions,
      format: 'png' as const,
      targetCeilingBytes: 2000,
    };
    const encode = vi.fn(async () => new Uint8Array(1800));

    const result = await findCompressCandidate(pngOptions, encode);
    expect(result.met).toBe(true);
    expect(result.attempts).toBe(1);
    expect(result.candidate.quality).toBe(100);
    expect(encode).toHaveBeenCalledTimes(1);
  });

  it('PNG reports failure if re-encoded bytes exceed ceiling', async () => {
    const pngOptions = {
      ...searchOptions,
      format: 'png' as const,
      targetCeilingBytes: 2000,
    };
    const encode = vi.fn(async () => new Uint8Array(2500));

    const result = await findCompressCandidate(pngOptions, encode);
    expect(result.met).toBe(false);
    expect(result.attempts).toBe(1);
    expect(result.candidate.bytes.byteLength).toBe(2500);
  });

  it('downscales dimensions when allowDimensionReduction is explicitly true', async () => {
    const downscaleOptions = {
      ...searchOptions,
      allowDimensionReduction: true,
      targetCeilingBytes: 1000,
    };
    // Full resolution (1000x800) produces 4000 bytes. Downscaled produces 900 bytes.
    const encode = vi.fn(async (w: number) => {
      if (w === 1000) return new Uint8Array(4000);
      return new Uint8Array(900);
    });

    const result = await findCompressCandidate(downscaleOptions, encode);
    expect(result.met).toBe(true);
    expect(result.candidate.bytes.byteLength).toBe(900);
    expect(result.candidate.width).toBeLessThan(1000);
  });
});

describe('image.compress validation & contract', () => {
  it('validates schema defaults', () => {
    const parsed = imageCompressInput.parse({});
    expect(parsed).toEqual({
      outputFormat: 'same',
      allowDimensionReduction: false,
    });
  });

  it('rejects quality below 50 in input schema', () => {
    expect(imageCompressInput.safeParse({ quality: 49 }).success).toBe(false);
    expect(imageCompressInput.safeParse({ quality: 50 }).success).toBe(true);
    expect(imageCompressInput.safeParse({ quality: 100 }).success).toBe(true);
    expect(imageCompressInput.safeParse({ quality: 101 }).success).toBe(false);
  });

  it('rejects a missing file', async () => {
    const result = await run({ ...baseInput });
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('expected error');
    expect(result.error.code).toBe('IMAGE_NO_FILE_SELECTED');
  });

  it('rejects a file with no recognized image signature', async () => {
    const result = await run({
      ...baseInput,
      file: { name: 'text.txt', bytes: new TextEncoder().encode('not an image') },
    });
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('expected error');
    expect(result.error.code).toBe('IMAGE_INVALID_FILE_TYPE');
  });

  it('rejects an oversized file', async () => {
    const oversized = new Uint8Array(MAX_FILE_BYTES + 1);
    oversized.set(JPEG_BYTES, 0);
    const result = await run({
      ...baseInput,
      file: { name: 'huge.jpg', bytes: oversized },
    });
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('expected error');
    expect(result.error.code).toBe('IMAGE_FILE_TOO_LARGE');
  });

  it('declares worker runtime only', () => {
    expect(imageCompress.runtimes).toEqual(['worker']);
  });

  it('has an English message for every error code', () => {
    for (const code of imageCompress.errors.filter((c) => c !== 'ABORTED')) {
      expect(messages[code], `Missing error message for ${code}`).toBeTruthy();
    }
  });

  it('has messages for standing warnings', () => {
    const warnings = [
      'IMAGE_VERIFY_OUTPUT',
      'IMAGE_METADATA_NOT_PRESERVED',
      'IMAGE_TRANSPARENT_FLATTENED_TO_WHITE',
      'IMAGE_DIMENSIONS_REDUCED',
      'IMAGE_WEBP_NOT_SUPPORTED_FALLBACK_PNG',
    ];
    for (const code of warnings) {
      expect(messages[code], `Missing warning message for ${code}`).toBeTruthy();
    }
  });
});
