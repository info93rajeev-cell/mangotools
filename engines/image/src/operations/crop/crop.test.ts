import { createTestContext, executeOperation } from '@mangotools/core';
import { describe, expect, it } from 'vitest';
import { messages } from '../../errors.ts';
import { MAX_FILE_BYTES } from '../../lib/limits.ts';
import { imageCrop } from './operation.ts';

const JPEG_BYTES = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0]);

const run = (input: Record<string, unknown>) =>
  executeOperation(imageCrop, input, {}, createTestContext());

const baseInput = {
  cropX: 0,
  cropY: 0,
  cropWidth: 4,
  cropHeight: 4,
  outputFormat: 'same' as const,
};

describe('image.crop validation (Node-testable, pre-decode paths only)', () => {
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

  it('rejects a negative or non-integer crop position', async () => {
    const file = { name: 'photo.jpg', bytes: JPEG_BYTES };
    const negative = await run({ ...baseInput, cropX: -1, file });
    expect(!negative.ok && negative.error.code).toBe('IMAGE_CROP_POSITION_INVALID');
    const fractional = await run({ ...baseInput, cropY: 0.5, file });
    expect(!fractional.ok && fractional.error.code).toBe('IMAGE_CROP_POSITION_INVALID');
  });

  it('accepts a crop position of exactly 0', async () => {
    // Still fails, but on file type (checked after position/size) — proves 0 itself is not rejected.
    const result = await run({
      ...baseInput,
      cropX: 0,
      cropY: 0,
      file: { name: 'photo.jpg', bytes: new TextEncoder().encode('hello') },
    });
    expect(!result.ok && result.error.code).toBe('IMAGE_INVALID_FILE_TYPE');
  });

  it('rejects a zero, negative, or non-integer crop width or height', async () => {
    const file = { name: 'photo.jpg', bytes: JPEG_BYTES };
    const zero = await run({ ...baseInput, cropWidth: 0, file });
    expect(!zero.ok && zero.error.code).toBe('IMAGE_CROP_SIZE_INVALID');
    const negative = await run({ ...baseInput, cropHeight: -4, file });
    expect(!negative.ok && negative.error.code).toBe('IMAGE_CROP_SIZE_INVALID');
    const fractional = await run({ ...baseInput, cropWidth: 4.5, file });
    expect(!fractional.ok && fractional.error.code).toBe('IMAGE_CROP_SIZE_INVALID');
  });

  it('has an English message for every error code it can return', () => {
    for (const code of imageCrop.errors) expect(messages[code], code).toBeTruthy();
  });

  it('has an English message for every warning code it can raise', () => {
    const warningCodes = [
      'IMAGE_VERIFY_OUTPUT',
      'IMAGE_METADATA_NOT_PRESERVED',
      'IMAGE_LARGE_IMAGES_MAY_FAIL',
      'IMAGE_TRANSPARENT_FLATTENED_TO_WHITE',
      'IMAGE_SAME_FORMAT_REENCODED',
      'IMAGE_WEBP_NOT_SUPPORTED_FALLBACK_PNG',
      'IMAGE_OUTPUT_LARGER_THAN_INPUT',
    ];
    for (const code of warningCodes) expect(messages[code], code).toBeTruthy();
  });

  it('declares itself worker-only, never node — the disclosed runtime exception', () => {
    expect(imageCrop.runtimes).toEqual(['worker']);
  });
});
