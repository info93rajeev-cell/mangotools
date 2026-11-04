import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PDFDocument } from 'pdf-lib';
import { describe, expect, it } from 'vitest';
import { parseDocumentXml, readDocx, readZipText } from './docxReader.ts';
import { renderDocxToPdf, sanitise } from './docxToPdf.ts';
import { buildDocxFromBlocks } from './docxZipPacker.ts';
import { decodeWithCMap, parseCMap } from './pdfFontDecoder.ts';
import { extractPdfText, type PageText, toBlocks } from './pdfTextExtract.ts';
import { createTextSamplePdf } from './samplePdfDocuments.ts';
import { docxBlocks, pickPages, summarise } from './usePdfToWordStudio.ts';

const root = join(__dirname, '../../../..');
const file = (p: string) => new Uint8Array(readFileSync(join(root, p)));

describe('PDF text extraction', () => {
  it('reads a Chromium PDF (Type0 fonts with ToUnicode) into headings and paragraphs', async () => {
    const pages = await extractPdfText(
      file('tools/pdf-to-word/fixtures/files/chromium-report.pdf'),
    );
    expect(pages).toHaveLength(2);
    const blocks = toBlocks(pages);
    expect(blocks).toEqual([
      { kind: 'h1', text: 'Quarterly Report' },
      { kind: 'p', text: 'Revenue grew 12% to ₹4,50,000 in the quarter.' },
      { kind: 'p', text: 'Second paragraph — with “smart quotes” and café.' },
      { kind: 'h2', text: 'Next steps' },
      { kind: 'p', text: 'Ship the new studio.' },
      { kind: 'page' },
      { kind: 'p', text: 'Page two text.' },
    ]);
  });

  it('joins wrapped lines of a standard-font PDF into paragraphs', async () => {
    const ex = summarise(await extractPdfText(await createTextSamplePdf()));
    expect(ex.pages).toHaveLength(2);
    expect(ex.headings).toBe(4);
    const para = ex.blocks.find(
      (b) => b.kind === 'p' && b.text.startsWith('The supplier delivers'),
    );
    expect(para && 'text' in para ? para.text : '').toBe(
      'The supplier delivers each order within ten working days of a written purchase order.',
    );
  });

  it('finds no text in a PDF without text', async () => {
    const ex = summarise(
      await extractPdfText(file('tools/pdf-split/fixtures/files/five-page.pdf')),
    );
    expect(ex.words).toBe(0);
    expect(ex.pagesWithText).toBe(0);
  });

  it('decodes bfchar and bfrange CMaps, including two-byte codes', () => {
    const cmap = parseCMap(
      'begincodespacerange <0000> <FFFF> endcodespacerange beginbfchar <0003> <0020> endbfchar beginbfrange <0010> <0012> <0041> endbfrange',
    );
    expect(decodeWithCMap(Uint8Array.from([0, 0x10, 0, 3, 0, 0x12]), cmap)).toBe('A C');
  });

  it('builds the DOCX blocks from options', () => {
    const blocks = [
      { kind: 'h1', text: 'T' } as const,
      { kind: 'page' } as const,
      { kind: 'p', text: 'x' } as const,
    ];
    expect(docxBlocks(blocks, { keepHeadings: false, pageBreaks: false })).toEqual([
      { kind: 'p', text: 'T' },
      { kind: 'p', text: 'x' },
    ]);
  });
});

describe('DOCX reading and PDF output', () => {
  it('reads a deflated .docx: styles, runs, lists, tables, images and page breaks', async () => {
    const c = await readDocx(file('tools/word-to-pdf/fixtures/files/order-summary.docx'));
    expect(c.tables).toBe(1);
    expect(c.images).toBe(1);
    const lines = c.paragraphs.map((p) => [
      p.style,
      p.runs.map((r) => r.text).join(''),
      p.pageBreakBefore,
    ]);
    expect(lines).toContainEqual(['title', 'Order Summary', false]);
    expect(lines).toContainEqual(['h1', 'Delivery & Terms', false]);
    expect(lines).toContainEqual(['p', 'Goods ship in ten days. Price ₹500 – café', false]);
    expect(lines).toContainEqual(['li', 'First item', false]);
    expect(lines).toContainEqual(['p', 'SKU | Qty', false]);
    expect(lines).toContainEqual(['p', 'Second page.', true]);
    expect(c.paragraphs[2]?.runs[1]).toEqual({ text: 'ten', bold: true, italic: false });
  });

  it('renders a PDF with real pages and counts characters it cannot draw', async () => {
    const c = await readDocx(file('tools/word-to-pdf/fixtures/files/order-summary.docx'));
    const r = await renderDocxToPdf([c, c], { pageSize: 'A4', margins: 'Standard' });
    expect(r.pages).toBe(4);
    expect(r.replacedChars).toBe(2);
    const doc = await PDFDocument.load(r.bytes);
    expect(doc.getPageCount()).toBe(4);
    expect(doc.getPage(0).getSize().width).toBeCloseTo(595.28, 1);
  });

  it('round-trips a generated DOCX through the reader', async () => {
    const bytes = buildDocxFromBlocks([
      { kind: 'h1', text: 'A & B' },
      { kind: 'p', text: 'bad\u0001char' },
    ]);
    expect(await readZipText(bytes, 'word/styles.xml')).toContain('Heading1');
    const c = await readDocx(bytes);
    expect(c.paragraphs.map((p) => [p.style, p.runs[0]?.text])).toEqual([
      ['h1', 'A & B'],
      ['p', 'badchar'],
    ]);
  });

  it('sanitises text for the standard fonts', () => {
    expect(sanitise('€ café ₹ नमस्ते')).toEqual({ text: '€ café ? ??????', replaced: 7 });
    expect(parseDocumentXml('<w:body><w:p/></w:body>').paragraphs).toHaveLength(1);
  });
});

describe('PDF to Word page range', () => {
  const pages: PageText[] = [1, 2, 3, 4, 5].map((n) => ({
    lines: [{ text: `Page ${n}`, size: 12, y: 700 }],
  }));

  it('keeps every page in "all" mode, whatever the text says', () => {
    expect(pickPages(pages, 'all', '2').pages).toHaveLength(5);
  });

  it('keeps only the listed pages and reports items outside the file', () => {
    const r = pickPages(pages, 'custom', '1-2, 4, 9');
    expect(r.pages.map((p) => p.lines[0]?.text)).toEqual(['Page 1', 'Page 2', 'Page 4']);
    expect(r.invalid).toEqual(['9']);
  });

  it('keeps nothing until pages are entered', () => {
    expect(pickPages(pages, 'custom', '').pages).toHaveLength(0);
  });
});
