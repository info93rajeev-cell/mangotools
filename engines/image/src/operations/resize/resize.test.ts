import { createTestContext, executeOperation } from '@mangotools/core';
import { describe, expect, it } from 'vitest';
import { messages } from '../../errors.ts';
import { computeOutputDimensions, isUpscale } from './dimensions.ts';
import { deriveOutputFileName, FALLBACK_OUTPUT_BASE_NAME } from './file-name.ts';
import { MAX_FILE_BYTES, MAX_SINGLE_AXIS_PIXELS } from './limits.ts';
import { imageResize } from './operation.ts';
import { detectImageType } from './signature.ts';
import { computeSizeChange } from './size-change.ts';

const JPEG_BYTES = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0]);
const PNG_BYTES = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0]);
const WEBP_BYTES = new Uint8Array([
  ...'RIFF'.split('').map((c) => c.charCodeAt(0)),
  0,
  0,
  0,
  0,
  ...'WEBP'.split('').map((c) => c.charCodeAt(0)),
]);

const run = (input: Record<string, unknown>) =>
  executeOperation(imageResize, input, {}, createTestContext());

const baseInput = {
  targetWidth: 100,
  targetHeight: 100,
  keepAspectRatio: true,
  outputFormat: 'same' as const,
};

describe('detectImageType', () => {
  it('recognizes a real JPEG signature', () => expect(detectImageType(JPEG_BYTES)).toBe('jpg'));
  it('recognizes the full 8-byte PNG signature', () =>
    expect(detectImageType(PNG_BYTES)).toBe('png'));
  it('recognizes a RIFF/WEBP container', () => expect(detectImageType(WEBP_BYTES)).toBe('webp'));
  it('rejects a truncated PNG signature (missing bytes)', () => {
    expect(detectImageType(PNG_BYTES.slice(0, 4))).toBeNull();
  });
  it('rejects plain text', () => {
    expect(detectImageType(new TextEncoder().encode('not an image'))).toBeNull();
  });
  it('rejects an empty file', () => expect(detectImageType(new Uint8Array(0))).toBeNull());
});

describe('computeOutputDimensions', () => {
  it('fits a bounding box while keeping aspect ratio, limited by the tighter axis', () => {
    expect(
      computeOutputDimensions({ width: 40, height: 30 }, { width: 100, height: 10 }, true),
    ).toEqual({ width: 13, height: 10 });
  });
  it('scales down evenly when the target matches the source aspect ratio', () => {
    expect(
      computeOutputDimensions({ width: 40, height: 30 }, { width: 20, height: 15 }, true),
    ).toEqual({ width: 20, height: 15 });
  });
  it('ignores aspect ratio and uses the exact target when keepAspectRatio is false', () => {
    expect(
      computeOutputDimensions({ width: 40, height: 30 }, { width: 100, height: 10 }, false),
    ).toEqual({ width: 100, height: 10 });
  });
  it('never rounds a dimension down to zero for a very small scale factor', () => {
    expect(
      computeOutputDimensions({ width: 4000, height: 3000 }, { width: 1, height: 1 }, true).width,
    ).toBeGreaterThanOrEqual(1);
  });
});

describe('isUpscale', () => {
  it('is true when the output is larger than the source in either axis', () => {
    expect(isUpscale({ width: 40, height: 30 }, { width: 80, height: 20 })).toBe(true);
    expect(isUpscale({ width: 40, height: 30 }, { width: 20, height: 60 })).toBe(true);
  });
  it('is false when the output is the same size or smaller in both axes', () => {
    expect(isUpscale({ width: 40, height: 30 }, { width: 40, height: 30 })).toBe(false);
    expect(isUpscale({ width: 40, height: 30 }, { width: 20, height: 15 })).toBe(false);
  });
});

describe('deriveOutputFileName', () => {
  it('derives from the original name and appends "-resized"', () => {
    expect(deriveOutputFileName('jpg', 'product-photo.jpg')).toBe('product-photo-resized.jpg');
  });
  it('uses the extension for the resolved output format, not the original', () => {
    expect(deriveOutputFileName('png', 'photo.jpg')).toBe('photo-resized.png');
  });
  it('prefers a usable requested name over the derived one', () => {
    expect(deriveOutputFileName('jpg', 'photo.png', '  My Resized Photo  ')).toBe(
      'My Resized Photo.jpg',
    );
  });
  it('strips an existing extension from a requested name before adding the correct one', () => {
    expect(deriveOutputFileName('webp', 'photo.png', 'custom-name.png')).toBe('custom-name.webp');
  });
  it('removes unsafe characters from a requested name', () => {
    expect(deriveOutputFileName('jpg', 'photo.png', 'a/b\\c:d*e?f"g<h>i|j')).toBe('abcdefghij.jpg');
  });
  it('falls back to the default base name when nothing usable remains', () => {
    expect(deriveOutputFileName('jpg', '.png', '////')).toBe(`${FALLBACK_OUTPUT_BASE_NAME}.jpg`);
    expect(deriveOutputFileName('png', '.jpg')).toBe(`${FALLBACK_OUTPUT_BASE_NAME}.png`);
  });
  it('uses a custom suffix and fallback base when given a style (Image Compress)', () => {
    expect(
      deriveOutputFileName('jpg', 'product-photo.jpg', undefined, { suffix: '-compressed' }),
    ).toBe('product-photo-compressed.jpg');
    expect(
      deriveOutputFileName('jpg', '.png', '////', {
        suffix: '-compressed',
        fallbackBase: 'compressed-image',
      }),
    ).toBe('compressed-image.jpg');
  });
});

describe('computeSizeChange', () => {
  it('reports a positive difference and percent when the output is smaller', () => {
    expect(computeSizeChange(1000, 600)).toEqual({
      sizeDifferenceBytes: 400,
      sizeChangePercent: 40,
    });
  });
  it('reports a negative difference and percent when the output is larger', () => {
    expect(computeSizeChange(1000, 1250)).toEqual({
      sizeDifferenceBytes: -250,
      sizeChangePercent: -25,
    });
  });
  it('is zero when the size is unchanged', () => {
    expect(computeSizeChange(1000, 1000)).toEqual({ sizeDifferenceBytes: 0, sizeChangePercent: 0 });
  });
  it('rounds the percentage to one decimal place', () => {
    expect(computeSizeChange(3, 1).sizeChangePercent).toBe(66.7);
  });
  it('never divides by zero for an empty original', () => {
    expect(computeSizeChange(0, 0)).toEqual({ sizeDifferenceBytes: 0, sizeChangePercent: 0 });
  });
});

describe('image.resize validation (Node-testable, pre-decode paths only)', () => {
  it('rejects a missing file', async () => {
    const result = await run({ ...baseInput });
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('expected error');
    expect(result.error.code).toBe('IMAGE_NO_FILE_SELECTED');
  });

  it('rejects a file with no recognized image signature', async () => {
    const result = await run({
      ...baseInput,
      file: { name: 'not-an-image.jpg', bytes: new TextEncoder().encode('hello') },
    });
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('expected error');
    expect(result.error.code).toBe('IMAGE_INVALID_FILE_TYPE');
  });

  it('rejects a file over the size limit', async () => {
    const oversized = new Uint8Array(MAX_FILE_BYTES + 1);
    oversized.set(JPEG_BYTES, 0);
    const result = await run({ ...baseInput, file: { name: 'big.jpg', bytes: oversized } });
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('expected error');
    expect(result.error.code).toBe('IMAGE_FILE_TOO_LARGE');
  });

  it('rejects a zero or negative target dimension', async () => {
    const result = await run({
      ...baseInput,
      targetWidth: 0,
      file: { name: 'photo.jpg', bytes: JPEG_BYTES },
    });
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('expected error');
    expect(result.error.code).toBe('IMAGE_DIMENSIONS_INVALID');
  });

  it('rejects a target dimension over the single-axis sanity cap', async () => {
    const result = await run({
      ...baseInput,
      targetWidth: MAX_SINGLE_AXIS_PIXELS + 1,
      file: { name: 'photo.jpg', bytes: JPEG_BYTES },
    });
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('expected error');
    expect(result.error.code).toBe('IMAGE_DIMENSIONS_INVALID');
  });

  it('has an English message for every error code it can return', () => {
    for (const code of imageResize.errors) expect(messages[code], code).toBeTruthy();
  });

  it('has an English message for every warning code it can raise', () => {
    const warningCodes = [
      'IMAGE_VERIFY_OUTPUT',
      'IMAGE_METADATA_NOT_PRESERVED',
      'IMAGE_LARGE_IMAGES_MAY_FAIL',
      'IMAGE_TRANSPARENT_FLATTENED_TO_WHITE',
      'IMAGE_UPSCALED_QUALITY_LOSS',
      'IMAGE_WEBP_NOT_SUPPORTED_FALLBACK_PNG',
      'IMAGE_OUTPUT_LARGER_THAN_INPUT',
    ];
    for (const code of warningCodes) expect(messages[code], code).toBeTruthy();
  });

  it('declares itself worker-only, never node — the disclosed runtime exception', () => {
    expect(imageResize.runtimes).toEqual(['worker']);
  });
});
