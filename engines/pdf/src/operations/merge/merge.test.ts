import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createTestContext, executeOperation } from '@mangotools/core';
import { PDFDocument } from 'pdf-lib';
import { describe, expect, it, vi } from 'vitest';
import { messages } from '../../errors.ts';
import { DEFAULT_OUTPUT_FILE_NAME, sanitizeOutputFileName } from './file-name.ts';
import { MAX_FILE_BYTES, MAX_FILE_COUNT, MAX_TOTAL_BYTES } from './limits.ts';
import { pdfMerge } from './operation.ts';
import { hasPdfSignature } from './signature.ts';

const filesDir = join(dirname(fileURLToPath(import.meta.url)), 'fixtures', 'files');
const onePage = readFileSync(join(filesDir, 'one-page.pdf'));
const twoPage = readFileSync(join(filesDir, 'two-page.pdf'));

const run = (input: Record<string, unknown>, params: Record<string, unknown> = {}) =>
  executeOperation(pdfMerge, input, params, createTestContext());

function withPdfSignature(bytes: Uint8Array): Uint8Array {
  bytes.set(new TextEncoder().encode('%PDF-'), 0);
  return bytes;
}

describe('sanitizeOutputFileName', () => {
  it('uses the default name when nothing usable is given', () => {
    expect(sanitizeOutputFileName(undefined)).toBe(DEFAULT_OUTPUT_FILE_NAME);
    expect(sanitizeOutputFileName('')).toBe(DEFAULT_OUTPUT_FILE_NAME);
    expect(sanitizeOutputFileName('   ')).toBe(DEFAULT_OUTPUT_FILE_NAME);
  });

  it('trims spaces and adds the extension', () => {
    expect(sanitizeOutputFileName('  My Report  ')).toBe('My Report.pdf');
  });

  it('keeps an existing .pdf extension, normalized to lower case', () => {
    expect(sanitizeOutputFileName('My Report.pdf')).toBe('My Report.pdf');
    expect(sanitizeOutputFileName('My Report.PDF')).toBe('My Report.pdf');
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

describe('hasPdfSignature', () => {
  it('finds the signature at the very start of a real PDF', () => {
    expect(hasPdfSignature(onePage)).toBe(true);
  });

  it('rejects plain text', () => {
    expect(hasPdfSignature(new TextEncoder().encode('not a pdf'))).toBe(false);
  });

  it('rejects an empty file', () => {
    expect(hasPdfSignature(new Uint8Array(0))).toBe(false);
  });
});

describe('pdf.merge', () => {
  it('merges two files, keeping their given order', async () => {
    const result = await run({
      files: [
        { name: 'one-page.pdf', bytes: onePage },
        { name: 'two-page.pdf', bytes: twoPage },
      ],
    });
    if (!result.ok) throw new Error('expected success');
    expect(result.value.fileCount).toBe(2);
    expect(result.value.totalPageCount).toBe(3);
    expect(result.value.fileName).toBe('merged.pdf');
    const merged = await PDFDocument.load(result.value.bytes);
    const pages = merged.getPages();
    expect(pages).toHaveLength(3);
    expect(pages[0]?.getSize()).toEqual({ width: 100, height: 100 });
    expect(pages[1]?.getSize()).toEqual({ width: 150, height: 150 });
    expect(pages[2]?.getSize()).toEqual({ width: 150, height: 150 });
  });

  it('reverses the merged page order when the input files are given in reverse', async () => {
    const result = await run({
      files: [
        { name: 'two-page.pdf', bytes: twoPage },
        { name: 'one-page.pdf', bytes: onePage },
      ],
    });
    if (!result.ok) throw new Error('expected success');
    const pages = (await PDFDocument.load(result.value.bytes)).getPages();
    expect(pages[0]?.getSize()).toEqual({ width: 150, height: 150 });
    expect(pages[2]?.getSize()).toEqual({ width: 100, height: 100 });
  });

  it('normalizes a custom output file name', async () => {
    const result = await run({
      files: [{ name: 'one-page.pdf', bytes: onePage }],
      outputFileName: '  My Report<>.PDF  ',
    });
    if (!result.ok) throw new Error('expected success');
    expect(result.value.fileName).toBe('My Report.pdf');
  });

  it('rejects an empty file queue', async () => {
    const result = await run({ files: [] });
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('expected error');
    expect(result.error.code).toBe('PDF_NO_FILES_SELECTED');
  });

  it('rejects more files than the maximum count, before looking at any content', async () => {
    const files = Array.from({ length: MAX_FILE_COUNT + 1 }, (_, i) => ({
      name: `f${i}.pdf`,
      bytes: new Uint8Array(0),
    }));
    const result = await run({ files });
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('expected error');
    expect(result.error.code).toBe('PDF_TOO_MANY_FILES');
    expect(result.error.details).toEqual({ max: MAX_FILE_COUNT });
  });

  it('rejects a single file over the size limit', async () => {
    const oversized = new Uint8Array(MAX_FILE_BYTES + 1);
    const result = await run({ files: [{ name: 'big.pdf', bytes: oversized }] });
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('expected error');
    expect(result.error.code).toBe('PDF_FILE_TOO_LARGE');
    expect(result.error.path).toBe('files.0');
  });

  it('rejects a combined total over the size limit, even when every file is within the per-file limit', async () => {
    const filesNeeded = Math.floor(MAX_TOTAL_BYTES / MAX_FILE_BYTES) + 1;
    const files = Array.from({ length: filesNeeded }, (_, i) => ({
      name: `f${i}.pdf`,
      bytes: withPdfSignature(new Uint8Array(MAX_FILE_BYTES)),
    }));
    const result = await run({ files });
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('expected error');
    expect(result.error.code).toBe('PDF_TOTAL_SIZE_EXCEEDED');
  });

  it('rejects a file with no PDF signature', async () => {
    const result = await run({
      files: [{ name: 'not-a-pdf.pdf', bytes: new TextEncoder().encode('hello') }],
    });
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('expected error');
    expect(result.error.code).toBe('PDF_INVALID_FILE_TYPE');
  });

  it('rejects an encrypted PDF', async () => {
    const encrypted = readFileSync(join(filesDir, 'encrypted.pdf'));
    const result = await run({ files: [{ name: 'encrypted.pdf', bytes: encrypted }] });
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('expected error');
    expect(result.error.code).toBe('PDF_ENCRYPTED_UNSUPPORTED');
  });

  it('rejects a corrupted PDF', async () => {
    const corrupted = readFileSync(join(filesDir, 'corrupted.pdf'));
    const result = await run({ files: [{ name: 'corrupted.pdf', bytes: corrupted }] });
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('expected error');
    expect(result.error.code).toBe('PDF_UNREADABLE');
  });

  it('returns a typed error, not a throw, when the final save step fails unexpectedly', async () => {
    const spy = vi.spyOn(PDFDocument.prototype, 'save').mockRejectedValueOnce(new Error('boom'));
    const result = await run({ files: [{ name: 'one-page.pdf', bytes: onePage }] });
    spy.mockRestore();
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('expected error');
    expect(result.error.code).toBe('PDF_MERGE_FAILED');
  });

  it('gives the same bytes for the same input, run twice', async () => {
    const input = { files: [{ name: 'one-page.pdf', bytes: onePage }] };
    const first = await run(input);
    await new Promise((resolve) => setTimeout(resolve, 1100));
    const second = await run(input);
    if (!first.ok || !second.ok) throw new Error('expected success');
    expect(Buffer.compare(first.value.bytes, second.value.bytes)).toBe(0);
  });

  it('sets a fixed creation and modification date, not the current wall-clock time', async () => {
    const result = await run({ files: [{ name: 'one-page.pdf', bytes: onePage }] });
    if (!result.ok) throw new Error('expected success');
    // `updateMetadata: false` here avoids pdf-lib re-stamping ModDate to "now" as a side effect of
    // this very read, which would otherwise mask whether the stored bytes are actually fixed.
    const merged = await PDFDocument.load(result.value.bytes, { updateMetadata: false });
    expect(merged.getCreationDate()?.getTime()).toBe(0);
    expect(merged.getModificationDate()?.getTime()).toBe(0);
  });

  it('always carries the four standing warnings on a successful merge', async () => {
    const result = await run({ files: [{ name: 'one-page.pdf', bytes: onePage }] });
    if (!result.ok) throw new Error('expected success');
    expect(result.warnings.map((w) => w.code).sort()).toEqual([
      'PDF_MERGE_AUTHORIZED_USE_ONLY',
      'PDF_MERGE_FEATURES_MAY_NOT_BE_PRESERVED',
      'PDF_MERGE_LARGE_OR_PROTECTED_MAY_FAIL',
      'PDF_MERGE_VERIFY_OUTPUT',
    ]);
  });

  it('has an English message for every error code it can return', () => {
    for (const code of pdfMerge.errors) expect(messages[code], code).toBeTruthy();
  });

  it('has an English message for every warning code it can raise', () => {
    const warningCodes = [
      'PDF_MERGE_VERIFY_OUTPUT',
      'PDF_MERGE_FEATURES_MAY_NOT_BE_PRESERVED',
      'PDF_MERGE_LARGE_OR_PROTECTED_MAY_FAIL',
      'PDF_MERGE_AUTHORIZED_USE_ONLY',
    ];
    for (const code of warningCodes) expect(messages[code], code).toBeTruthy();
  });
});
