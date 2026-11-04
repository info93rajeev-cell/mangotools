import { type PDFFont, type PDFPage, rgb } from 'pdf-lib';

/**
 * Page designs for the sample PDFs: a cover, text pages, a table page and a chart page, so the page
 * previews look like real business documents. Everything is drawn with vector text and shapes.
 */

export interface PageFonts {
  font: PDFFont;
  bold: PDFFont;
}

type Colour = ReturnType<typeof rgb>;

const INK = rgb(0.1, 0.14, 0.22);
const MUTED = rgb(0.38, 0.43, 0.5);
const RULE = rgb(0.82, 0.86, 0.9);

const SENTENCES = [
  'This section records the agreed scope, the responsibilities of each party and the dates that apply.',
  'Figures are taken from the approved schedule; any change is confirmed in writing before work continues.',
  'Payments fall due thirty days after a correct invoice is received, against the milestones listed below.',
  'Quality checks are made at each stage, and the results are kept with the project file for audit.',
  'Both parties keep information shared under this document confidential, except where the law requires.',
  'Delays outside either party’s control are notified promptly, with a revised plan for the work affected.',
];

export function hexColour(hex: string): Colour {
  const n = Number.parseInt(hex.replace('#', ''), 16);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

function header(page: PDFPage, f: PageFonts, title: string, n: number, total: number, c: Colour) {
  const { width, height } = page.getSize();
  page.drawRectangle({ x: 0, y: height - 8, width, height: 8, color: c });
  page.drawText(title, { x: 50, y: height - 40, size: 10, font: f.bold, color: MUTED });
  page.drawText(`Page ${n} of ${total}`, {
    x: width - 120,
    y: height - 40,
    size: 10,
    font: f.font,
    color: MUTED,
  });
  page.drawLine({
    start: { x: 50, y: height - 50 },
    end: { x: width - 50, y: height - 50 },
    thickness: 0.6,
    color: RULE,
  });
}

function paragraph(page: PDFPage, f: PageFonts, y: number, seed: number): number {
  for (let i = 0; i < 3; i++) {
    const s = SENTENCES[(seed + i) % SENTENCES.length] ?? '';
    page.drawText(s, { x: 50, y, size: 9.5, font: f.font, color: INK });
    y -= 15;
  }
  return y - 10;
}

export function coverPage(page: PDFPage, f: PageFonts, title: string, subtitle: string, c: Colour) {
  const { width, height } = page.getSize();
  page.drawRectangle({ x: 0, y: height - 300, width, height: 300, color: c });
  page.drawText(title, { x: 50, y: height - 170, size: 34, font: f.bold, color: rgb(1, 1, 1) });
  page.drawText(subtitle, { x: 50, y: height - 205, size: 14, font: f.font, color: rgb(1, 1, 1) });
  page.drawText('Prepared for: Client Services Pvt. Ltd.', {
    x: 50,
    y: height - 360,
    size: 12,
    font: f.bold,
    color: INK,
  });
  page.drawText('Version 1.0  ·  Issued 4 November 2026', {
    x: 50,
    y: height - 380,
    size: 11,
    font: f.font,
    color: MUTED,
  });
  paragraph(page, f, height - 430, 0);
}

export function textPage(
  page: PDFPage,
  f: PageFonts,
  title: string,
  n: number,
  total: number,
  c: Colour,
) {
  header(page, f, title, n, total, c);
  let y = page.getSize().height - 90;
  for (let s = 0; s < 4; s++) {
    page.drawText(`${n}.${s + 1}  ${['Overview', 'Responsibilities', 'Schedule', 'Notes'][s]}`, {
      x: 50,
      y,
      size: 13,
      font: f.bold,
      color: c,
    });
    y = paragraph(page, f, y - 22, n + s);
  }
}

export function tablePage(
  page: PDFPage,
  f: PageFonts,
  title: string,
  n: number,
  total: number,
  c: Colour,
) {
  header(page, f, title, n, total, c);
  const { height } = page.getSize();
  page.drawText(`${n}. Schedule of items`, {
    x: 50,
    y: height - 90,
    size: 14,
    font: f.bold,
    color: c,
  });
  const xs = [50, 110, 330, 420];
  let y = height - 130;
  page.drawRectangle({ x: 45, y: y - 6, width: 505, height: 22, color: rgb(0.93, 0.95, 0.98) });
  ['No.', 'Description', 'Qty', 'Amount (Rs)'].forEach((h, i) => {
    page.drawText(h, { x: xs[i] ?? 50, y, size: 10, font: f.bold, color: INK });
  });
  for (let r = 1; r <= 16; r++) {
    y -= 24;
    const row = [
      String(r),
      `Item ${n}-${r} supplied as per order`,
      String(10 * r + n),
      (r * 1250 + n * 40).toLocaleString('en-IN'),
    ];
    row.forEach((cell, i) => {
      page.drawText(cell, { x: xs[i] ?? 50, y, size: 9.5, font: f.font, color: INK });
    });
    page.drawLine({
      start: { x: 45, y: y - 8 },
      end: { x: 550, y: y - 8 },
      thickness: 0.4,
      color: RULE,
    });
  }
  paragraph(page, f, y - 40, n);
}

export function chartPage(
  page: PDFPage,
  f: PageFonts,
  title: string,
  n: number,
  total: number,
  c: Colour,
) {
  header(page, f, title, n, total, c);
  const { height } = page.getSize();
  page.drawText(`${n}. Figures at a glance`, {
    x: 50,
    y: height - 90,
    size: 14,
    font: f.bold,
    color: c,
  });
  const base = height - 400;
  page.drawLine({
    start: { x: 60, y: base },
    end: { x: 540, y: base },
    thickness: 1,
    color: MUTED,
  });
  for (let b = 0; b < 8; b++) {
    const h = 60 + ((b * 37 + n * 13) % 200);
    page.drawRectangle({
      x: 80 + b * 56,
      y: base,
      width: 34,
      height: h,
      color: b % 2 ? c : rgb(0.55, 0.7, 0.95),
    });
    page.drawText(`Q${(b % 4) + 1}`, {
      x: 88 + b * 56,
      y: base - 16,
      size: 9,
      font: f.font,
      color: MUTED,
    });
  }
  paragraph(page, f, base - 50, n + 2);
}

/** Draws page n (1-based) of a sample document, varying the design across pages. */
export function samplePage(
  page: PDFPage,
  f: PageFonts,
  doc: { title: string; subtitle: string; colour: Colour },
  n: number,
  total: number,
) {
  if (n === 1) return coverPage(page, f, doc.title, doc.subtitle, doc.colour);
  const kind = n % 4;
  if (kind === 0) return tablePage(page, f, doc.title, n, total, doc.colour);
  if (kind === 2) return chartPage(page, f, doc.title, n, total, doc.colour);
  return textPage(page, f, doc.title, n, total, doc.colour);
}
