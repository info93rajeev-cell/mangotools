import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createTestContext, executeOperation } from '@mangotools/core';
import { PDFDocument } from 'pdf-lib';
import { describe, expect, it, vi } from 'vitest';
import { messages } from '../../errors.ts';
import { MAX_FILE_BYTES } from './limits.ts';
import { pdfSplit } from './operation.ts';

const filesDir = join(dirname(fileURLToPath(import.meta.url)), 'fixtures', 'files');
const fivePage = readFileSync(join(filesDir, 'five-page.pdf'));

const run = (input: Record<string, unknown>) =>
  executeOperation(pdfSplit, input, {}, createTestContext());

describe('pdf.split', () => {
  it('extracts the first page only', async () => {
    const result = await run({
      file: { name: 'five-page.pdf', bytes: fivePage },
      startPage: 1,
      endPage: 1,
    });
    if (!result.ok) throw new Error('expected success');
    expect(result.value.originalPageCount).toBe(5);
    expect(result.value.extractedPageCount).toBe(1);
    expect(result.value.fileName).toBe('five-page-pages-1-1.pdf');
    const output = await PDFDocument.load(result.value.bytes);
    expect(output.getPageCount()).toBe(1);
  });

  it('extracts a middle page range, keeping page order', async () => {
    const result = await run({
      file: { name: 'five-page.pdf', bytes: fivePage },
      startPage: 2,
      endPage: 4,
    });
    if (!result.ok) throw new Error('expected success');
    expect(result.value.extractedPageCount).toBe(3);
    expect(result.value.fileName).toBe('five-page-pages-2-4.pdf');
    const output = await PDFDocument.load(result.value.bytes);
    expect(output.getPageCount()).toBe(3);
  });

  it('extracts the last page only', async () => {
    const result = await run({
      file: { name: 'five-page.pdf', bytes: fivePage },
      startPage: 5,
      endPage: 5,
    });
    if (!result.ok) throw new Error('expected success');
    expect(result.value.extractedPageCount).toBe(1);
    expect(result.value.fileName).toBe('five-page-pages-5-5.pdf');
  });

  it('allows a full-range extraction covering every page', async () => {
    const result = await run({
      file: { name: 'five-page.pdf', bytes: fivePage },
      startPage: 1,
      endPage: 5,
    });
    if (!result.ok) throw new Error('expected success');
    expect(result.value.extractedPageCount).toBe(5);
    const output = await PDFDocument.load(result.value.bytes);
    expect(output.getPageCount()).toBe(5);
  });

  it('derives the default output name from the original file name and the page range', async () => {
    const result = await run({
      file: { name: 'Annual Report.pdf', bytes: fivePage },
      startPage: 2,
      endPage: 3,
    });
    if (!result.ok) throw new Error('expected success');
    expect(result.value.fileName).toBe('Annual Report-pages-2-3.pdf');
  });

  it('normalizes a custom output file name', async () => {
    const result = await run({
      file: { name: 'five-page.pdf', bytes: fivePage },
      startPage: 2,
      endPage: 4,
      outputFileName: '  My Pages<>.PDF  ',
    });
    if (!result.ok) throw new Error('expected success');
    expect(result.value.fileName).toBe('My Pages.pdf');
  });

  it('rejects a missing file', async () => {
    const result = await run({ startPage: 1, endPage: 1 });
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('expected error');
    expect(result.error.code).toBe('PDF_SPLIT_NO_FILE_SELECTED');
  });

  it('rejects a file over the size limit', async () => {
    const oversized = new Uint8Array(MAX_FILE_BYTES + 1);
    oversized.set(new TextEncoder().encode('%PDF-'), 0);
    const result = await run({
      file: { name: 'big.pdf', bytes: oversized },
      startPage: 1,
      endPage: 1,
    });
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('expected error');
    expect(result.error.code).toBe('PDF_SPLIT_FILE_TOO_LARGE');
  });

  it('rejects a file with no PDF signature', async () => {
    const result = await run({
      file: { name: 'not-a-pdf.pdf', bytes: new TextEncoder().encode('hello') },
      startPage: 1,
      endPage: 1,
    });
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('expected error');
    expect(result.error.code).toBe('PDF_SPLIT_INVALID_FILE_TYPE');
  });

  it('rejects a start page that is zero, negative, or not an integer', async () => {
    const file = { name: 'five-page.pdf', bytes: fivePage };
    const zero = await run({ file, startPage: 0, endPage: 1 });
    expect(!zero.ok && zero.error.code).toBe('PDF_SPLIT_START_PAGE_INVALID');
    const negative = await run({ file, startPage: -1, endPage: 1 });
    expect(!negative.ok && negative.error.code).toBe('PDF_SPLIT_START_PAGE_INVALID');
    const fractional = await run({ file, startPage: 1.5, endPage: 2 });
    expect(!fractional.ok && fractional.error.code).toBe('PDF_SPLIT_START_PAGE_INVALID');
  });

  it('rejects an end page that is zero, negative, or not an integer', async () => {
    const file = { name: 'five-page.pdf', bytes: fivePage };
    const zero = await run({ file, startPage: 1, endPage: 0 });
    expect(!zero.ok && zero.error.code).toBe('PDF_SPLIT_END_PAGE_INVALID');
    const fractional = await run({ file, startPage: 1, endPage: 2.5 });
    expect(!fractional.ok && fractional.error.code).toBe('PDF_SPLIT_END_PAGE_INVALID');
  });

  it('rejects an end page before the start page', async () => {
    const result = await run({
      file: { name: 'five-page.pdf', bytes: fivePage },
      startPage: 4,
      endPage: 2,
    });
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('expected error');
    expect(result.error.code).toBe('PDF_SPLIT_RANGE_INVALID');
  });

  it('accepts a single-page range where start equals end', async () => {
    // Still fails, but on file type (checked after the range shape) — proves start === end is not
    // itself rejected as an invalid range.
    const result = await run({
      file: { name: 'not-a-pdf.pdf', bytes: new TextEncoder().encode('hello') },
      startPage: 3,
      endPage: 3,
    });
    expect(!result.ok && result.error.code).toBe('PDF_SPLIT_INVALID_FILE_TYPE');
  });

  it('rejects a page range that extends beyond the real page count', async () => {
    const result = await run({
      file: { name: 'five-page.pdf', bytes: fivePage },
      startPage: 3,
      endPage: 10,
    });
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('expected error');
    expect(result.error.code).toBe('PDF_SPLIT_RANGE_EXCEEDS_PAGE_COUNT');
    expect(result.error.details).toEqual({ totalPages: 5 });
  });

  it('rejects an encrypted PDF', async () => {
    const encrypted = readFileSync(join(filesDir, 'encrypted.pdf'));
    const result = await run({
      file: { name: 'encrypted.pdf', bytes: encrypted },
      startPage: 1,
      endPage: 1,
    });
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('expected error');
    expect(result.error.code).toBe('PDF_SPLIT_ENCRYPTED_UNSUPPORTED');
  });

  it('rejects a corrupted PDF', async () => {
    const corrupted = readFileSync(join(filesDir, 'corrupted.pdf'));
    const result = await run({
      file: { name: 'corrupted.pdf', bytes: corrupted },
      startPage: 1,
      endPage: 1,
    });
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('expected error');
    expect(result.error.code).toBe('PDF_SPLIT_UNREADABLE');
  });

  it('returns a typed error, not a throw, when the final save step fails unexpectedly', async () => {
    const spy = vi.spyOn(PDFDocument.prototype, 'save').mockRejectedValueOnce(new Error('boom'));
    const result = await run({
      file: { name: 'five-page.pdf', bytes: fivePage },
      startPage: 1,
      endPage: 1,
    });
    spy.mockRestore();
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('expected error');
    expect(result.error.code).toBe('PDF_SPLIT_FAILED');
  });

  it('gives the same bytes for the same input, run twice', async () => {
    const input = { file: { name: 'five-page.pdf', bytes: fivePage }, startPage: 2, endPage: 4 };
    const first = await run(input);
    await new Promise((resolve) => setTimeout(resolve, 1100));
    const second = await run(input);
    if (!first.ok || !second.ok) throw new Error('expected success');
    expect(Buffer.compare(first.value.bytes, second.value.bytes)).toBe(0);
  });

  it('sets a fixed creation and modification date, not the current wall-clock time', async () => {
    const result = await run({
      file: { name: 'five-page.pdf', bytes: fivePage },
      startPage: 1,
      endPage: 1,
    });
    if (!result.ok) throw new Error('expected success');
    const output = await PDFDocument.load(result.value.bytes, { updateMetadata: false });
    expect(output.getCreationDate()?.getTime()).toBe(0);
    expect(output.getModificationDate()?.getTime()).toBe(0);
  });

  it('always carries the four standing warnings on a successful split', async () => {
    const result = await run({
      file: { name: 'five-page.pdf', bytes: fivePage },
      startPage: 1,
      endPage: 1,
    });
    if (!result.ok) throw new Error('expected success');
    expect(result.warnings.map((w) => w.code).sort()).toEqual([
      'PDF_SPLIT_AUTHORIZED_USE_ONLY',
      'PDF_SPLIT_FEATURES_MAY_NOT_BE_PRESERVED',
      'PDF_SPLIT_LARGE_OR_PROTECTED_MAY_FAIL',
      'PDF_SPLIT_VERIFY_OUTPUT',
    ]);
  });

  it('has an English message for every error code it can return', () => {
    for (const code of pdfSplit.errors) expect(messages[code], code).toBeTruthy();
  });

  it('has an English message for every warning code it can raise', () => {
    const warningCodes = [
      'PDF_SPLIT_VERIFY_OUTPUT',
      'PDF_SPLIT_FEATURES_MAY_NOT_BE_PRESERVED',
      'PDF_SPLIT_LARGE_OR_PROTECTED_MAY_FAIL',
      'PDF_SPLIT_AUTHORIZED_USE_ONLY',
    ];
    for (const code of warningCodes) expect(messages[code], code).toBeTruthy();
  });
});
