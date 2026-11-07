import { PDFDocument, type PDFFont, rgb, StandardFonts } from 'pdf-lib';
import { chartPage, hexColour, samplePage, tablePage } from './sampleDocPages.ts';

export interface SampleDocMeta {
  name: string;
  pageCount: number;
  themeColor: string;
  summary: string;
}

/**
 * Creates a realistic sample PDF: a coloured cover, then text, table and chart pages, so the page
 * previews show what a real document looks like.
 */
export async function createSamplePdf(
  title: string,
  pageCount: number,
  subtitle = 'Business document (sample)',
  colour = '#1d4ed8',
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const fonts = {
    font: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
  };
  const meta = { title: title.replace(/[-_]/g, ' '), subtitle, colour: hexColour(colour) };
  for (let i = 1; i <= pageCount; i++) {
    samplePage(doc.addPage([595.28, 841.89]), fonts, meta, i, pageCount);
  }
  return doc.save();
}

export const SAMPLE_MERGE_FILES: SampleDocMeta[] = [
  {
    name: 'Contract.pdf',
    pageCount: 28,
    themeColor: '#dc2626',
    summary: 'Master service agreement with corporate terms',
  },
  {
    name: 'Annexure-A.pdf',
    pageCount: 16,
    themeColor: '#1d4ed8',
    summary: 'Technical specifications & service level terms',
  },
  {
    name: 'Invoice-Batch.pdf',
    pageCount: 62,
    themeColor: '#047857',
    summary: 'Itemized commercial invoice schedule and billings',
  },
  {
    name: 'Signed-Appendix.pdf',
    pageCount: 18,
    themeColor: '#6d28d9',
    summary: 'Signatures, legal attestations and compliance proofs',
  },
];

export const SAMPLE_SPLIT_FILE: SampleDocMeta = {
  name: 'Audit-Report-2025.pdf',
  pageCount: 124,
  themeColor: '#dc2626',
  summary: 'Annual corporate audit, balance sheets and governance',
};

export const SAMPLE_HEAVY_BOOK_FILE: SampleDocMeta = {
  name: 'Sample_Book_1600_Pages.pdf',
  pageCount: 1600,
  themeColor: '#0369a1',
  summary: '1,600-page sample book (16 chapters of 100 pages), generated in your browser',
};

export const SAMPLE_COMPRESS_NAME = 'Site-Photo-Report-Sample.pdf';

/** A site photo drawn in the browser (sky, buildings with windows, ground, fine grain), saved as a
 *  high-quality JPEG so compression has real image data to work on. */
async function samplePhotoJpeg(seed: number, width: number, height: number): Promise<Uint8Array> {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is not available');
  let r = 12345 + seed * 999;
  const next = () => {
    r = (r * 1103515245 + 12345) % 2147483648;
    return r / 2147483648;
  };
  const sky = ctx.createLinearGradient(0, 0, 0, height * 0.65);
  sky.addColorStop(0, `hsl(${205 + seed * 6}, 70%, 62%)`);
  sky.addColorStop(1, `hsl(${200 + seed * 6}, 60%, 88%)`);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);
  const ground = ctx.createLinearGradient(0, height * 0.65, 0, height);
  ground.addColorStop(0, '#9c8b6e');
  ground.addColorStop(1, '#6f6150');
  ctx.fillStyle = ground;
  ctx.fillRect(0, height * 0.65, width, height * 0.35);
  for (let b = 0; b < 7; b++) {
    const bw = width * (0.08 + next() * 0.07);
    const bh = height * (0.25 + next() * 0.35);
    const bx = (b / 7) * width + next() * 40;
    const by = height * 0.65 - bh;
    ctx.fillStyle = `hsl(${20 + next() * 30}, ${10 + next() * 20}%, ${55 + next() * 25}%)`;
    ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = 'rgba(40, 60, 90, 0.55)';
    for (let wy = by + 20; wy < height * 0.63; wy += 34) {
      for (let wx = bx + 12; wx < bx + bw - 18; wx += 26) ctx.fillRect(wx, wy, 14, 18);
    }
  }
  ctx.strokeStyle = '#f2b705';
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(width * 0.78, height * 0.65);
  ctx.lineTo(width * 0.78, height * 0.12);
  ctx.lineTo(width * 0.98, height * 0.12);
  ctx.stroke();
  const grain = ctx.getImageData(0, 0, width, height);
  for (let i = 0; i < grain.data.length; i += 4) {
    const n = (next() - 0.5) * 22;
    grain.data[i] = (grain.data[i] ?? 0) + n;
    grain.data[i + 1] = (grain.data[i + 1] ?? 0) + n;
    grain.data[i + 2] = (grain.data[i + 2] ?? 0) + n;
  }
  ctx.putImageData(grain, 0, 0);
  const blob = await new Promise<Blob | null>((ok) => canvas.toBlob(ok, 'image/jpeg', 0.95));
  if (!blob) throw new Error('JPEG encoding failed');
  return new Uint8Array(await blob.arrayBuffer());
}

const SITE_NOTES = [
  'North block: slab casting complete on levels 3 and 4; curing in progress.',
  'Scaffolding inspected and tagged; edge protection fitted on all open sides.',
  'Material stock checked: cement 420 bags, steel 18 t, blocks 6,500 nos.',
];

function sitePhotoPage(
  page: ReturnType<PDFDocument['addPage']>,
  fonts: { font: PDFFont; bold: PDFFont },
  photo: Awaited<ReturnType<PDFDocument['embedJpg']>>,
  n: number,
) {
  const blue = rgb(0.11, 0.3, 0.85);
  page.drawRectangle({ x: 0, y: 833, width: 595.28, height: 9, color: blue });
  page.drawText(`Site Progress Report - Week ${41 + n}`, {
    x: 50,
    y: 790,
    size: 18,
    font: fonts.bold,
  });
  page.drawText(`Tower B, Sector 21  ·  Page ${n} of 5`, {
    x: 50,
    y: 770,
    size: 10,
    font: fonts.font,
    color: rgb(0.35, 0.4, 0.45),
  });
  page.drawImage(photo, { x: 50, y: 400, width: 495, height: 346.5 });
  page.drawText(`Photo ${n}: view from the east gate, taken on site.`, {
    x: 50,
    y: 384,
    size: 9,
    font: fonts.font,
    color: rgb(0.35, 0.4, 0.45),
  });
  page.drawText('Observations', { x: 50, y: 350, size: 13, font: fonts.bold, color: blue });
  SITE_NOTES.forEach((note, i) => {
    page.drawText(`•  ${note}`, { x: 50, y: 326 - i * 18, size: 10, font: fonts.font });
  });
}

/** A real five-page site report: photo pages (high-quality JPEGs, so compression has something to
 *  save), a table page and a chart page. */
export async function createCompressSamplePdf(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const fonts = {
    font: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
  };
  const colour = rgb(0.11, 0.3, 0.85);
  for (let n = 1; n <= 5; n++) {
    const page = doc.addPage([595.28, 841.89]);
    if (n === 2) tablePage(page, fonts, 'Site Progress Report', n, 5, colour);
    else if (n === 4) chartPage(page, fonts, 'Site Progress Report', n, 5, colour);
    else sitePhotoPage(page, fonts, await doc.embedJpg(await samplePhotoJpeg(n, 2000, 1400)), n);
  }
  return doc.save();
}

export const SAMPLE_PDF_TO_WORD_NAME = 'Supply-Agreement-Sample.pdf';

const AGREEMENT: { heading: string; body: string[] }[] = [
  {
    heading: '1. Parties',
    body: [
      'This sample agreement is between a buyer and a supplier of packaging material.',
      'It was generated in your browser to show how text, headings and paragraphs convert.',
    ],
  },
  {
    heading: '2. Delivery',
    body: [
      'The supplier delivers each order within ten working days of a written purchase order.',
      'Late deliveries are reported to the buyer by email on the day the delay is known.',
    ],
  },
  {
    heading: '3. Payment',
    body: ['Invoices are paid within thirty days. Prices include packing but exclude freight.'],
  },
];

/** Writes words onto a page, wrapping at the given width; returns the y below the last line. */
function drawWrapped(
  page: ReturnType<PDFDocument['addPage']>,
  text: string,
  opts: {
    x: number;
    y: number;
    width: number;
    size: number;
    font: Awaited<ReturnType<PDFDocument['embedFont']>>;
  },
): number {
  let line = '';
  let y = opts.y;
  for (const word of text.split(' ')) {
    const next = line ? `${line} ${word}` : word;
    if (opts.font.widthOfTextAtSize(next, opts.size) > opts.width && line) {
      page.drawText(line, { x: opts.x, y, size: opts.size, font: opts.font });
      y -= opts.size * 1.35;
      line = word;
    } else line = next;
  }
  if (line) page.drawText(line, { x: opts.x, y, size: opts.size, font: opts.font });
  return y - opts.size * 1.35;
}

const PRICE_TABLE = [
  ['Item', 'Description', 'Qty', 'Amount (Rs)'],
  ['PB-01', 'Corrugated box, 5 ply', '2,000', '48,000'],
  ['PB-02', 'Bubble wrap roll, 50 m', '120', '21,600'],
  ['PB-03', 'Packing tape, 48 mm', '600', '9,000'],
];

/** A table drawn as text in columns with thin rules, as most PDF exports draw them. */
function drawTable(
  page: ReturnType<PDFDocument['addPage']>,
  y: number,
  fonts: {
    font: Awaited<ReturnType<PDFDocument['embedFont']>>;
    bold: Awaited<ReturnType<PDFDocument['embedFont']>>;
  },
): number {
  const xs = [60, 130, 300, 360];
  const right = 470;
  PRICE_TABLE.forEach((row, ri) => {
    page.drawLine({ start: { x: 54, y: y + 14 }, end: { x: right, y: y + 14 }, thickness: 0.6 });
    row.forEach((cell, ci) => {
      page.drawText(cell, {
        x: xs[ci] ?? 60,
        y,
        size: 10,
        font: ri === 0 ? fonts.bold : fonts.font,
      });
    });
    y -= 20;
  });
  page.drawLine({ start: { x: 54, y: y + 14 }, end: { x: right, y: y + 14 }, thickness: 0.6 });
  return y - 10;
}

/** A real two-page text PDF (title, headings, wrapped paragraphs, a price table) for PDF to Word. */
export async function createTextSamplePdf(extraPages = 0): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  let page = doc.addPage([595.28, 841.89]);
  page.drawText('Supply Agreement (Sample)', { x: 60, y: 770, size: 22, font: bold });
  let y = 730;
  AGREEMENT.forEach((section, i) => {
    if (i === 2) {
      page = doc.addPage([595.28, 841.89]);
      y = 770;
    }
    page.drawText(section.heading, { x: 60, y, size: 15, font: bold });
    y -= 26;
    for (const para of section.body) {
      y = drawWrapped(page, para, { x: 60, y, width: 300, size: 11, font }) - 8;
    }
    y -= 10;
    if (i === 1) {
      page.drawText('3. Price Schedule', { x: 60, y, size: 15, font: bold });
      y = drawTable(page, y - 30, { font, bold });
    }
  });
  // The studio's sample adds the rest of the agreement (schedules, tables, figures), so it has as
  // many pages as the reference sample.
  const total = 2 + extraPages;
  const colour = rgb(0.11, 0.3, 0.85);
  for (let n = 3; n <= total; n++) {
    samplePage(
      doc.addPage([595.28, 841.89]),
      { font, bold },
      { title: 'Supply Agreement', subtitle: '', colour },
      n,
      total,
    );
  }
  return doc.save();
}
