import { createTestContext, executeOperation } from '@mangotools/core';
import { describe, expect, it } from 'vitest';
import { messages } from '../../errors.ts';
import { MAX_FILE_BYTES } from '../../lib/limits.ts';
import { MAX_WATERMARK_TEXT_LENGTH } from './limits.ts';
import { imageWatermark } from './operation.ts';

const JPEG_BYTES = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0]);

const run = (input: Record<string, unknown>) =>
  executeOperation(imageWatermark, input, {}, createTestContext());

const baseInput = {
  text: 'Sample',
  position: 'bottom-right' as const,
  opacity: 50,
  fontSize: 32,
  color: '#ffffff',
  outputFormat: 'same' as const,
};

describe('image.watermark validation (Node-testable, pre-decode paths only)', () => {
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

  it('rejects empty, whitespace-only, and entirely missing watermark text alike', async () => {
    const empty = await run({
      ...baseInput,
      text: '',
      file: { name: 'photo.jpg', bytes: JPEG_BYTES },
    });
    expect(!empty.ok && empty.error.code).toBe('IMAGE_WATERMARK_TEXT_REQUIRED');
    const whitespace = await run({
      ...baseInput,
      text: '   ',
      file: { name: 'photo.jpg', bytes: JPEG_BYTES },
    });
    expect(!whitespace.ok && whitespace.error.code).toBe('IMAGE_WATERMARK_TEXT_REQUIRED');
    // The real UI (useFileTool's extraInputValues) omits the field entirely rather than sending an
    // empty string when the user never typed anything — `text` must stay optional at the schema level
    // so this still reaches this operation's own message, not the generic INVALID_INPUT one.
    const { text: _omitted, ...withoutText } = baseInput;
    const missing = await run({ ...withoutText, file: { name: 'photo.jpg', bytes: JPEG_BYTES } });
    expect(!missing.ok && missing.error.code).toBe('IMAGE_WATERMARK_TEXT_REQUIRED');
  });

  it('rejects watermark text over the length limit', async () => {
    const result = await run({
      ...baseInput,
      text: 'x'.repeat(MAX_WATERMARK_TEXT_LENGTH + 1),
      file: { name: 'photo.jpg', bytes: JPEG_BYTES },
    });
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('expected error');
    expect(result.error.code).toBe('IMAGE_WATERMARK_TEXT_TOO_LONG');
  });

  it('accepts watermark text exactly at the length limit', async () => {
    const result = await run({
      ...baseInput,
      text: 'x'.repeat(MAX_WATERMARK_TEXT_LENGTH),
      file: { name: 'photo.jpg', bytes: new TextEncoder().encode('hello') },
    });
    // Still fails, but on file type (decoded after text passes) — proves the length check itself is not
    // what rejected it.
    expect(!result.ok && result.error.code).toBe('IMAGE_INVALID_FILE_TYPE');
  });

  it('rejects an unknown position, out-of-range opacity/font size, or an invalid color through the input schema', async () => {
    const file = { name: 'photo.jpg', bytes: JPEG_BYTES };
    expect((await run({ ...baseInput, position: 'middle', file })).ok).toBe(false);
    expect((await run({ ...baseInput, opacity: 5, file })).ok).toBe(false);
    expect((await run({ ...baseInput, opacity: 101, file })).ok).toBe(false);
    expect((await run({ ...baseInput, fontSize: 1, file })).ok).toBe(false);
    expect((await run({ ...baseInput, color: 'white', file })).ok).toBe(false);
  });

  it('has an English message for every error code it can return', () => {
    for (const code of imageWatermark.errors) expect(messages[code], code).toBeTruthy();
  });

  it('has an English message for every warning code it can raise', () => {
    const warningCodes = [
      'IMAGE_VERIFY_OUTPUT',
      'IMAGE_METADATA_NOT_PRESERVED',
      'IMAGE_LARGE_IMAGES_MAY_FAIL',
      'IMAGE_WATERMARK_NOT_LEGAL_PROTECTION',
      'IMAGE_TRANSPARENT_FLATTENED_TO_WHITE',
      'IMAGE_SAME_FORMAT_REENCODED',
      'IMAGE_WEBP_NOT_SUPPORTED_FALLBACK_PNG',
      'IMAGE_OUTPUT_LARGER_THAN_INPUT',
    ];
    for (const code of warningCodes) expect(messages[code], code).toBeTruthy();
  });

  it('declares itself worker-only, never node — the disclosed runtime exception', () => {
    expect(imageWatermark.runtimes).toEqual(['worker']);
  });
});
