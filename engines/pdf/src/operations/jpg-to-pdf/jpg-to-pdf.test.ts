import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createTestContext, executeOperation } from '@mangotools/core';
import { PDFDocument } from 'pdf-lib';
import { describe, expect, it, vi } from 'vitest';
import { messages } from '../../errors.ts';
import { DEFAULT_OUTPUT_FILE_NAME, sanitizeOutputFileName } from './file-name.ts';
import { MAX_FILE_BYTES, MAX_FILE_COUNT, MAX_TOTAL_BYTES } from './limits.ts';
import { pdfJpgToPdf } from './operation.ts';
import { hasJpegSignature } from './signature.ts';

const filesDir = join(dirname(fileURLToPath(import.meta.url)), 'fixtures', 'files');
const smallSquare = readFileSync(join(filesDir, 'small-square.jpg'));
const wide = readFileSync(join(filesDir, 'wide.jpg'));

const run = (input: Record<string, unknown>, params: Record<string, unknown> = {}) =>
  executeOperation(pdfJpgToPdf, input, params, createTestContext());

function withJpegSignature(bytes: Uint8Array): Uint8Array {
  bytes.set([0xff, 0xd8, 0xff], 0);
  return bytes;
}

describe('sanitizeOutputFileName', () => {
  it('uses the default name when nothing usable is given', () => {
    expect(sanitizeOutputFileName(undefined)).toBe(DEFAULT_OUTPUT_FILE_NAME);
    expect(sanitizeOutputFileName('')).toBe(DEFAULT_OUTPUT_FILE_NAME);
    expect(sanitizeOutputFileName('   ')).toBe(DEFAULT_OUTPUT_FILE_NAME);
  });

  it('trims spaces and adds the extension', () => {
    expect(sanitizeOutputFileName('  My Photos  ')).toBe('My Photos.pdf');
  });

  it('keeps an existing .pdf extension, normalized to lower case', () => {
    expect(sanitizeOutputFileName('My Photos.pdf')).toBe('My Photos.pdf');
    expect(sanitizeOutputFileName('My Photos.PDF')).toBe('My Photos.pdf');
  });

  it('removes unsafe characters', () => {
    expect(sanitizeOutputFileName('a/b\\c:d*e?f"g<h>i|j.pdf')).toBe('abcdefghij.pdf');
  });

  it('falls back to the default name for unsafe-only or placeholder input', () => {
    expect(sanitizeOutputFileName('////')).toBe(DEFAULT_OUTPUT_FILE_NAME);
    expect(sanitizeOutputFileName('.')).toBe(DEFAULT_OUTPUT_FILE_NAME);
    expect(sanitizeOutputFileName('..')).toBe(DEFAULT_OUTPUT_FILE_NAME);
    expect(sanitizeOutputFileName('.pdf')).toBe(DEFAULT_OUTPUT_FILE_NAME);
  });
});

describe('hasJpegSignature', () => {
  it('finds the signature at the very start of a real JPEG', () => {
    expect(hasJpegSignature(smallSquare)).toBe(true);
  });

  it('rejects plain text', () => {
    expect(hasJpegSignature(new TextEncoder().encode('not a jpeg'))).toBe(false);
  });

  it('rejects an empty file', () => {
    expect(hasJpegSignature(new Uint8Array(0))).toBe(false);
  });
});

describe('pdf.jpgToPdf', () => {
  it('converts two images, keeping their given order', async () => {
    const result = await run({
      files: [
        { name: 'small-square.jpg', bytes: smallSquare },
        { name: 'wide.jpg', bytes: wide },
      ],
    });
    if (!result.ok) throw new Error('expected success');
    expect(result.value.imageCount).toBe(2);
    expect(result.value.fileName).toBe('images.pdf');
    const doc = await PDFDocument.load(result.value.bytes);
    const pages = doc.getPages();
    expect(pages).toHaveLength(2);
    expect(pages[0]?.getSize()).toEqual({ width: 8, height: 8 });
    expect(pages[1]?.getSize()).toEqual({ width: 16, height: 8 });
  });

  it('reverses the page order when the input images are given in reverse', async () => {
    const result = await run({
      files: [
        { name: 'wide.jpg', bytes: wide },
        { name: 'small-square.jpg', bytes: smallSquare },
      ],
    });
    if (!result.ok) throw new Error('expected success');
    const pages = (await PDFDocument.load(result.value.bytes)).getPages();
    expect(pages[0]?.getSize()).toEqual({ width: 16, height: 8 });
    expect(pages[1]?.getSize()).toEqual({ width: 8, height: 8 });
  });

  it('normalizes a custom output file name', async () => {
    const result = await run({
      files: [{ name: 'small-square.jpg', bytes: smallSquare }],
      outputFileName: '  My Photos<>.PDF  ',
    });
    if (!result.ok) throw new Error('expected success');
    expect(result.value.fileName).toBe('My Photos.pdf');
  });

  it('rejects an empty image queue', async () => {
    const result = await run({ files: [] });
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('expected error');
    expect(result.error.code).toBe('PDF_JPG_NO_FILES_SELECTED');
  });

  it('rejects more images than the maximum count, before looking at any content', async () => {
    const files = Array.from({ length: MAX_FILE_COUNT + 1 }, (_, i) => ({
      name: `f${i}.jpg`,
      bytes: new Uint8Array(0),
    }));
    const result = await run({ files });
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('expected error');
    expect(result.error.code).toBe('PDF_JPG_TOO_MANY_FILES');
    expect(result.error.details).toEqual({ max: MAX_FILE_COUNT });
  });

  it('rejects a single image over the size limit', async () => {
    const oversized = new Uint8Array(MAX_FILE_BYTES + 1);
    const result = await run({ files: [{ name: 'big.jpg', bytes: oversized }] });
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('expected error');
    expect(result.error.code).toBe('PDF_JPG_FILE_TOO_LARGE');
    expect(result.error.path).toBe('files.0');
  });

  it('rejects a combined total over the size limit, even when every image is within the per-file limit', async () => {
    const filesNeeded = Math.floor(MAX_TOTAL_BYTES / MAX_FILE_BYTES) + 1;
    const files = Array.from({ length: filesNeeded }, (_, i) => ({
      name: `f${i}.jpg`,
      bytes: withJpegSignature(new Uint8Array(MAX_FILE_BYTES)),
    }));
    const result = await run({ files });
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('expected error');
    expect(result.error.code).toBe('PDF_JPG_TOTAL_SIZE_EXCEEDED');
  });

  it('rejects a file with no JPEG signature', async () => {
    const result = await run({
      files: [{ name: 'not-a-jpg.jpg', bytes: new TextEncoder().encode('hello') }],
    });
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('expected error');
    expect(result.error.code).toBe('PDF_JPG_INVALID_FILE_TYPE');
  });

  it('rejects a corrupted image', async () => {
    const corrupted = readFileSync(join(filesDir, 'corrupted.jpg'));
    const result = await run({ files: [{ name: 'corrupted.jpg', bytes: corrupted }] });
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('expected error');
    expect(result.error.code).toBe('PDF_JPG_UNREADABLE');
  });

  it('returns a typed error, not a throw, when the final save step fails unexpectedly', async () => {
    const spy = vi.spyOn(PDFDocument.prototype, 'save').mockRejectedValueOnce(new Error('boom'));
    const result = await run({ files: [{ name: 'small-square.jpg', bytes: smallSquare }] });
    spy.mockRestore();
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('expected error');
    expect(result.error.code).toBe('PDF_JPG_CONVERSION_FAILED');
  });

  it('gives the same bytes for the same input, run twice', async () => {
    const input = { files: [{ name: 'small-square.jpg', bytes: smallSquare }] };
    const first = await run(input);
    await new Promise((resolve) => setTimeout(resolve, 1100));
    const second = await run(input);
    if (!first.ok || !second.ok) throw new Error('expected success');
    expect(Buffer.compare(first.value.bytes, second.value.bytes)).toBe(0);
  });

  it('sets a fixed creation and modification date, not the current wall-clock time', async () => {
    const result = await run({ files: [{ name: 'small-square.jpg', bytes: smallSquare }] });
    if (!result.ok) throw new Error('expected success');
    // `updateMetadata: false` here avoids pdf-lib re-stamping ModDate to "now" as a side effect of
    // this very read, which would otherwise mask whether the stored bytes are actually fixed.
    const doc = await PDFDocument.load(result.value.bytes, { updateMetadata: false });
    expect(doc.getCreationDate()?.getTime()).toBe(0);
    expect(doc.getModificationDate()?.getTime()).toBe(0);
  });

  it('always carries the four standing warnings on a successful conversion', async () => {
    const result = await run({ files: [{ name: 'small-square.jpg', bytes: smallSquare }] });
    if (!result.ok) throw new Error('expected success');
    expect(result.warnings.map((w) => w.code).sort()).toEqual([
      'PDF_JPG_AUTHORIZED_USE_ONLY',
      'PDF_JPG_LARGE_OR_MANY_MAY_FAIL',
      'PDF_JPG_QUALITY_DEPENDS_ON_SOURCE',
      'PDF_JPG_VERIFY_OUTPUT',
    ]);
  });

  it('has an English message for every error code it can return', () => {
    for (const code of pdfJpgToPdf.errors) expect(messages[code], code).toBeTruthy();
  });

  it('has an English message for every warning code it can raise', () => {
    const warningCodes = [
      'PDF_JPG_VERIFY_OUTPUT',
      'PDF_JPG_LARGE_OR_MANY_MAY_FAIL',
      'PDF_JPG_QUALITY_DEPENDS_ON_SOURCE',
      'PDF_JPG_AUTHORIZED_USE_ONLY',
    ];
    for (const code of warningCodes) expect(messages[code], code).toBeTruthy();
  });
});
