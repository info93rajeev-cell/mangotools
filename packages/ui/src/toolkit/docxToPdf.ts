/**
 * Lays out the paragraphs read from a .docx onto PDF pages with the standard PDF fonts (Helvetica
 * family): title and heading sizes, bold and italic runs, bullets for list items, word wrapping
 * and page breaks. The standard fonts cover Western European text (Windows-1252); any other
 * character is replaced with "?" and counted, so the page can say so.
 */
import { PDFDocument, type PDFFont, type PDFPage, StandardFonts } from 'pdf-lib';
import type { DocxContent, DocxParagraph, DocxRun, ParaStyle } from './docxReader.ts';

export type PageSize = 'A4' | 'Letter';
export type Margins = 'Standard' | 'Compact';

const SIZES: Readonly<Record<PageSize, [number, number]>> = {
  A4: [595.28, 841.89],
  Letter: [612, 792],
};
const MARGIN: Readonly<Record<Margins, number>> = { Standard: 72, Compact: 40 };
const FONT_SIZE: Readonly<Record<ParaStyle, number>> = {
  title: 22,
  h1: 18,
  h2: 15,
  h3: 13,
  p: 11,
  li: 11,
};

/** Characters the standard fonts can draw: Windows-1252, printable range. */
const CP1252_EXTRA = new Set([
  0x20ac, 0x201a, 0x0192, 0x201e, 0x2026, 0x2020, 0x2021, 0x02c6, 0x2030, 0x0160, 0x2039, 0x0152,
  0x017d, 0x2018, 0x2019, 0x201c, 0x201d, 0x2022, 0x2013, 0x2014, 0x02dc, 0x2122, 0x0161, 0x203a,
  0x0153, 0x017e, 0x0178,
]);

export function drawable(ch: string): boolean {
  const c = ch.codePointAt(0) ?? 0;
  return (c >= 0x20 && c <= 0x7e) || (c >= 0xa0 && c <= 0xff) || CP1252_EXTRA.has(c);
}

export function sanitise(text: string): { text: string; replaced: number } {
  let replaced = 0;
  let out = '';
  for (const ch of text) {
    if (drawable(ch)) out += ch;
    else {
      out += '?';
      replaced++;
    }
  }
  return { text: out, replaced };
}

interface Fonts {
  regular: PDFFont;
  bold: PDFFont;
  italic: PDFFont;
  boldItalic: PDFFont;
}

interface Word {
  text: string;
  font: PDFFont;
}

interface Cursor {
  doc: PDFDocument;
  page: PDFPage;
  y: number;
  size: [number, number];
  margin: number;
  pages: number;
}

function fontFor(f: Fonts, run: DocxRun, heading: boolean): PDFFont {
  const bold = run.bold || heading;
  if (bold && run.italic) return f.boldItalic;
  if (bold) return f.bold;
  return run.italic ? f.italic : f.regular;
}

function newPage(c: Cursor): void {
  c.page = c.doc.addPage(c.size);
  c.y = c.size[1] - c.margin;
  c.pages++;
}

/** Splits runs into words (keeping each word's font) and line breaks (null). */
function wordsOf(p: DocxParagraph, f: Fonts, counter: { replaced: number }): (Word | null)[] {
  const heading = p.style !== 'p' && p.style !== 'li';
  const out: (Word | null)[] = [];
  for (const run of p.runs) {
    const s = sanitise(run.text);
    counter.replaced += s.replaced;
    const font = fontFor(f, run, heading);
    s.text.split('\n').forEach((line, i) => {
      if (i > 0) out.push(null);
      for (const w of line.split(' ')) if (w) out.push({ text: w, font });
    });
  }
  return out;
}

function drawLine(c: Cursor, line: Word[], x: number, size: number): void {
  let cx = x;
  for (const w of line) {
    c.page.drawText(w.text, { x: cx, y: c.y, size, font: w.font });
    cx += w.font.widthOfTextAtSize(`${w.text} `, size);
  }
}

function layoutParagraph(
  c: Cursor,
  p: DocxParagraph,
  f: Fonts,
  counter: { replaced: number },
): void {
  const size = FONT_SIZE[p.style];
  const lead = size * 1.35;
  if (p.pageBreakBefore && c.y < c.size[1] - c.margin) newPage(c);
  if (p.style !== 'p' && p.style !== 'li') c.y -= size * 0.6;
  const indent = p.style === 'li' ? 14 : 0;
  const width = c.size[0] - c.margin * 2 - indent;
  const words = wordsOf(p, f, counter);
  if (p.style === 'li') words.unshift({ text: '•', font: f.regular });
  let line: Word[] = [];
  let lineWidth = 0;
  const emit = () => {
    if (c.y - lead < c.margin) newPage(c);
    c.y -= lead;
    drawLine(c, line, c.margin + indent, size);
    line = [];
    lineWidth = 0;
  };
  for (const w of words) {
    if (w === null) {
      emit();
      continue;
    }
    const ww = w.font.widthOfTextAtSize(`${w.text} `, size);
    if (lineWidth + ww > width && line.length > 0) emit();
    line.push(w);
    lineWidth += ww;
  }
  if (line.length > 0 || words.length === 0) emit();
  c.y -= size * 0.45;
}

export interface RenderOptions {
  pageSize: PageSize;
  margins: Margins;
}

export interface RenderResult {
  bytes: Uint8Array;
  pages: number;
  replacedChars: number;
}

/** Renders one or more documents into one PDF; each document starts on a new page. */
export async function renderDocxToPdf(
  docs: DocxContent[],
  opts: RenderOptions,
): Promise<RenderResult> {
  const doc = await PDFDocument.create();
  const fonts: Fonts = {
    regular: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
    italic: await doc.embedFont(StandardFonts.HelveticaOblique),
    boldItalic: await doc.embedFont(StandardFonts.HelveticaBoldOblique),
  };
  const size = SIZES[opts.pageSize];
  const c: Cursor = {
    doc,
    page: doc.addPage(size),
    y: size[1] - MARGIN[opts.margins],
    size,
    margin: MARGIN[opts.margins],
    pages: 1,
  };
  const counter = { replaced: 0 };
  docs.forEach((d, i) => {
    if (i > 0) newPage(c);
    for (const p of d.paragraphs) layoutParagraph(c, p, fonts, counter);
  });
  return { bytes: await doc.save(), pages: c.pages, replacedChars: counter.replaced };
}
