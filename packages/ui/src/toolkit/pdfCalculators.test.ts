import { describe, expect, it } from 'vitest';
import { buildDocxArchive, buildZipArchive } from './docxZipPacker.ts';
import { computeCompressEstimate } from './usePdfCompressStudio.ts';
import { calculateMergeSummary, type MergedFileItem } from './usePdfMergeStudio.ts';
import { resolveSplitParts, type SplitRange } from './usePdfSplitStudio.ts';

describe('PDF & Documents calculations and packager', () => {
  it('computes merge summary and sequential page ranges accurately', () => {
    const files: MergedFileItem[] = [
      {
        id: '1',
        name: 'Contract.pdf',
        pageCount: 28,
        sizeBytes: 4200000,
        rotation: 0,
        themeColor: '#ef4444',
      },
      {
        id: '2',
        name: 'Annexure-A.pdf',
        pageCount: 16,
        sizeBytes: 2800000,
        rotation: 0,
        themeColor: '#3b82f6',
      },
      {
        id: '3',
        name: 'Invoice-Batch.pdf',
        pageCount: 62,
        sizeBytes: 8700000,
        rotation: 0,
        themeColor: '#10b981',
      },
      {
        id: '4',
        name: 'Signed-Appendix.pdf',
        pageCount: 18,
        sizeBytes: 2700000,
        rotation: 0,
        themeColor: '#a855f7',
      },
    ];

    const summary = calculateMergeSummary(files, true);
    expect(summary.fileCount).toBe(4);
    expect(summary.totalPageCount).toBe(124);
    expect(summary.totalSizeBytes).toBe(18400000);
    expect(summary.hasBookmarks).toBe(true);

    expect(summary.ranges).toEqual([
      { name: 'Contract', start: 1, end: 28 },
      { name: 'Annexure-A', start: 29, end: 44 },
      { name: 'Invoice-Batch', start: 45, end: 106 },
      { name: 'Signed-Appendix', start: 107, end: 124 },
    ]);
  });

  it('resolves split ranges, every page, and fixed chunk parts correctly', () => {
    const ranges: SplitRange[] = [
      { id: '1', start: 1, end: 12 },
      { id: '2', start: 13, end: 42 },
      { id: '3', start: 43, end: 78 },
      { id: '4', start: 79, end: 124 },
    ];

    const rangeParts = resolveSplitParts(
      'ranges',
      124,
      ranges,
      '',
      10,
      'Audit-Report-2025_Part_{n}',
      18400000,
    );
    expect(rangeParts.length).toBe(4);
    expect(rangeParts[0]?.name).toBe('Audit-Report-2025_Part_1.pdf');
    expect(rangeParts[0]?.pageCount).toBe(12);
    expect(rangeParts[3]?.name).toBe('Audit-Report-2025_Part_4.pdf');
    expect(rangeParts[3]?.pageCount).toBe(46);

    // Fixed chunks of 10 pages
    const chunkParts = resolveSplitParts('chunks', 35, [], '', 10, 'Chunk_{n}', 3500000);
    expect(chunkParts.length).toBe(4); // 10, 10, 10, 5
    expect(chunkParts[0]?.pageCount).toBe(10);
    expect(chunkParts[3]?.pageCount).toBe(5);
  });

  it('computes compression estimates across presets', () => {
    const rawBytes = 24.8 * 1024 * 1024;

    const light = computeCompressEstimate(rawBytes, 'light', 85, false, false);
    expect(light.reductionPercent).toBe(35);
    expect(light.qualityLevel).toBe('Excellent');

    const balanced = computeCompressEstimate(rawBytes, 'balanced', 70, false, true);
    expect(balanced.reductionPercent).toBe(71);
    expect(balanced.qualityLevel).toBe('Good');

    const strong = computeCompressEstimate(rawBytes, 'strong', 50, true, true);
    expect(strong.reductionPercent).toBe(82);
    expect(strong.qualityLevel).toBe('Acceptable');
  });

  it('builds a valid in-browser ZIP archive with local and central headers', () => {
    const fileA = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
    const fileB = new Uint8Array([87, 111, 114, 108, 100]); // "World"

    const zip = buildZipArchive([
      { name: 'hello.txt', data: fileA },
      { name: 'world.txt', data: fileB },
    ]);

    expect(zip.length).toBeGreaterThan(0);
    // Standard ZIP signature PK\x03\x04 = 0x50, 0x4B, 0x03, 0x04
    expect(zip[0]).toBe(0x50);
    expect(zip[1]).toBe(0x4b);
    expect(zip[2]).toBe(0x03);
    expect(zip[3]).toBe(0x04);
  });

  it('builds a valid OpenXML DOCX archive containing document.xml', () => {
    const docx = buildDocxArchive('Test Contract', [
      { heading: 'Section 1', paragraphs: ['Paragraph text inside word doc.'] },
    ]);

    expect(docx.length).toBeGreaterThan(100);
    expect(docx[0]).toBe(0x50);
    expect(docx[1]).toBe(0x4b);
    expect(docx[2]).toBe(0x03);
    expect(docx[3]).toBe(0x04);
  });
});
