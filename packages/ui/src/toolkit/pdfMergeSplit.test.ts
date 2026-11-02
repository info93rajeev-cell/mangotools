import { PDFDict, PDFDocument, PDFHexString, PDFName } from 'pdf-lib';
import { describe, expect, it } from 'vitest';
import { addOutline } from './pdfOutline.ts';
import {
  defaultRanges,
  pagesLabel,
  parsePageList,
  parseRangeList,
  resolveSplitParts,
} from './pdfSplitPlan.ts';
import { createSamplePdf } from './samplePdfDocuments.ts';
import { type MergedFileItem, performPdfMerge, startPages } from './usePdfMergeStudio.ts';
import { buildSplitFiles } from './usePdfSplitStudio.ts';

const req = {
  ranges: [],
  extractInput: '',
  chunkSize: 10,
  pattern: 'Part_{n}',
  baseFileSize: 1000,
  baseName: 'doc',
};

describe('PDF split plan', () => {
  it('parses page lists within the document, keeping order and dropping repeats', () => {
    expect(parsePageList('3, 1, 5-7, 3, 12, 9-8, x', 10)).toEqual({
      pages: [3, 1, 5, 6, 7],
      invalid: ['12', '9-8', 'x'],
    });
  });

  it('extract mode uses the typed pages, not a fixed set', () => {
    const parts = resolveSplitParts({
      ...req,
      mode: 'extract',
      totalPages: 10,
      extractInput: '2, 4-5',
    });
    expect(parts).toHaveLength(1);
    expect(parts[0]?.pages).toEqual([2, 4, 5]);
    expect(parts[0]?.name).toBe('doc-extracted.pdf');
  });

  it('ignores ranges outside the file instead of failing', () => {
    const { ranges, invalid } = parseRangeList('1-3, 4-12, 7-5, 6', 6);
    expect(ranges.map((r) => [r.start, r.end])).toEqual([
      [1, 3],
      [6, 6],
    ]);
    expect(invalid).toEqual(['4-12', '7-5']);
    expect(resolveSplitParts({ ...req, mode: 'ranges', totalPages: 6, ranges })).toHaveLength(2);
  });

  it('splits every page with no cap', () => {
    expect(resolveSplitParts({ ...req, mode: 'every', totalPages: 120 })).toHaveLength(120);
  });

  it('starts a new file with two halves and labels pages compactly', () => {
    expect(defaultRanges(9).map((r) => [r.start, r.end])).toEqual([
      [1, 5],
      [6, 9],
    ]);
    expect(defaultRanges(1).map((r) => [r.start, r.end])).toEqual([[1, 1]]);
    expect(pagesLabel([1, 3, 5, 6, 7])).toBe('1, 3, 5–7');
  });

  it('builds real split files with the right pages', async () => {
    const source = await createSamplePdf('Report', 12);
    const parts = resolveSplitParts({
      ...req,
      mode: 'extract',
      totalPages: 12,
      extractInput: '12, 1',
    });
    const [out] = await buildSplitFiles(source, parts);
    const doc = await PDFDocument.load(out?.data ?? new Uint8Array());
    expect(doc.getPageCount()).toBe(2);
  });
});

describe('PDF merge', () => {
  it('generates samples with every page they claim', async () => {
    const doc = await PDFDocument.load(await createSamplePdf('Contract', 28));
    expect(doc.getPageCount()).toBe(28);
  });

  it('finds where each file starts in both merge orders', () => {
    expect(startPages([3, 2, 4], 'concatenate')).toEqual([0, 3, 5]);
    expect(startPages([3, 0, 4], 'interleave')).toEqual([0, -1, 1]);
  });

  it('writes one bookmark per file pointing at its first page', async () => {
    const files: MergedFileItem[] = [];
    for (const [i, n] of [2, 3].entries()) {
      const bytes = await createSamplePdf(`F${i}`, n);
      files.push({
        id: String(i),
        name: `F${i}.pdf`,
        sizeBytes: bytes.length,
        pageCount: n,
        bytes,
        rotation: 0,
        themeColor: '#000',
      });
    }
    const merged = await PDFDocument.load(await performPdfMerge(files, 'concatenate', true));
    expect(merged.getPageCount()).toBe(5);
    const outlines = merged.catalog.lookup(PDFName.of('Outlines'), PDFDict);
    const first = outlines.lookup(PDFName.of('First'), PDFDict);
    expect(first.lookup(PDFName.of('Title'), PDFHexString).decodeText()).toBe('F0');
    expect(outlines.lookup(PDFName.of('Count'))?.toString()).toBe('2');
  });

  it('adds no outline for an empty list', async () => {
    const doc = await PDFDocument.create();
    doc.addPage();
    addOutline(doc, []);
    expect(doc.catalog.get(PDFName.of('Outlines'))).toBeUndefined();
  });
});

describe('opening user PDFs', () => {
  it('refuses password-protected and oversized files with a clear message', async () => {
    const { readFileSync } = await import('node:fs');
    const { join } = await import('node:path');
    const { openUserPdf, mergeCapacity } = await import('./pdfInput.ts');
    const enc = new Uint8Array(
      readFileSync(join(__dirname, '../../../../tools/pdf-split/fixtures/files/encrypted.pdf')),
    );
    const r = await openUserPdf('enc.pdf', enc);
    expect(r.ok).toBe(false);
    expect(!r.ok && r.message).toContain('password-protected');
    const big = await openUserPdf('big.pdf', new Uint8Array(26 * 1024 * 1024));
    expect(!big.ok && big.message).toContain('larger than 25 MB');
    const room = mergeCapacity({ count: 19, bytes: 0 }, [
      { name: 'a', size: 1 },
      { name: 'b', size: 1 },
    ]);
    expect(room).toEqual({ accepted: 1, message: 'Up to 20 files can be merged at once.' });
  });
});
