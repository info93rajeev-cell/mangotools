import { createTestContext, executeOperation } from '@mangotools/core';
import { describe, expect, it } from 'vitest';
import { messages } from '../../errors.ts';
import { MAX_FILE_BYTES } from '../../lib/limits.ts';
import { imageFavicon } from './operation.ts';

const JPEG_BYTES = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0]);

const run = (input: Record<string, unknown>) =>
  executeOperation(imageFavicon, input, {}, createTestContext());

const baseInput = { size: '32' as const };

describe('image.favicon validation (Node-testable, pre-decode paths only)', () => {
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

  it('rejects a size outside the fixed favicon size list as a generic invalid input', async () => {
    const result = await run({
      size: '33',
      file: { name: 'photo.jpg', bytes: JPEG_BYTES },
    });
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('expected error');
    // Fully constrained by the UI's <select>, so this is the schema's own generic rejection, not a
    // hand-written validation message — matching image.crop@1's own outputFormat precedent.
    expect(result.error.code).toBe('INVALID_INPUT');
  });

  it('has an English message for every error code it can return', () => {
    for (const code of imageFavicon.errors) expect(messages[code], code).toBeTruthy();
  });

  it('has an English message for every warning code it can raise', () => {
    const warningCodes = [
      'IMAGE_VERIFY_OUTPUT',
      'IMAGE_METADATA_NOT_PRESERVED',
      'IMAGE_LARGE_IMAGES_MAY_FAIL',
      'IMAGE_FAVICON_ENCODER_SIZE_VARIES',
      'IMAGE_FAVICON_NOT_LOGO_TOOL',
      'IMAGE_FAVICON_CROPPED_TO_SQUARE',
      'IMAGE_FAVICON_SOURCE_TOO_SMALL',
      'IMAGE_FAVICON_SMALL_SIZE_DETAIL_LOSS',
      'IMAGE_OUTPUT_LARGER_THAN_INPUT',
    ];
    for (const code of warningCodes) expect(messages[code], code).toBeTruthy();
  });

  it('declares itself worker-only, never node — the disclosed runtime exception', () => {
    expect(imageFavicon.runtimes).toEqual(['worker']);
  });
});
