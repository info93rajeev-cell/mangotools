import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export interface SampleDocMeta {
  name: string;
  pageCount: number;
  themeColor: string;
  summary: string;
}

/**
 * Creates a lightweight realistic PDF with a given page count and title banner.
 */
export async function createSamplePdf(
  title: string,
  pageCount: number,
  subtitle = 'Official Business Document',
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);

  for (let i = 1; i <= pageCount; i++) {
    const page = doc.addPage([595.28, 841.89]); // A4
    const { width, height } = page.getSize();

    // Top Header Banner
    page.drawRectangle({
      x: 40,
      y: height - 80,
      width: width - 80,
      height: 40,
      color: rgb(0.94, 0.96, 0.98),
    });

    page.drawText(title, {
      x: 55,
      y: height - 65,
      size: 16,
      font: boldFont,
      color: rgb(0.1, 0.2, 0.4),
    });

    page.drawText(`${subtitle} — Page ${i} of ${pageCount}`, {
      x: 55,
      y: height - 120,
      size: 11,
      font,
      color: rgb(0.3, 0.35, 0.4),
    });

    // Content lines simulation
    for (let line = 0; line < 12; line++) {
      const lineWidth = (line % 3 === 0 ? 0.7 : 0.88) * (width - 110);
      page.drawRectangle({
        x: 55,
        y: height - 160 - line * 28,
        width: lineWidth,
        height: 6,
        color: rgb(0.88, 0.9, 0.92),
      });
    }

    // Footer
    page.drawText('Confidential • BeyondTheAI Secure In-Browser Processing', {
      x: 55,
      y: 40,
      size: 9,
      font,
      color: rgb(0.55, 0.6, 0.65),
    });
  }

  return doc.save();
}

export const SAMPLE_MERGE_FILES: SampleDocMeta[] = [
  {
    name: 'Contract.pdf',
    pageCount: 28,
    themeColor: '#ef4444',
    summary: 'Master service agreement with corporate terms',
  },
  {
    name: 'Annexure-A.pdf',
    pageCount: 16,
    themeColor: '#3b82f6',
    summary: 'Technical specifications & service level terms',
  },
  {
    name: 'Invoice-Batch.pdf',
    pageCount: 62,
    themeColor: '#10b981',
    summary: 'Itemized commercial invoice schedule and billings',
  },
  {
    name: 'Signed-Appendix.pdf',
    pageCount: 18,
    themeColor: '#a855f7',
    summary: 'Signatures, legal attestations and compliance proofs',
  },
];

export const SAMPLE_SPLIT_FILE: SampleDocMeta = {
  name: 'Audit-Report-2025.pdf',
  pageCount: 124,
  themeColor: '#ef4444',
  summary: 'Annual corporate audit, balance sheets and governance',
};

export const SAMPLE_HEAVY_BOOK_FILE: SampleDocMeta = {
  name: 'Sample_Book_1600_Pages.pdf',
  pageCount: 1600,
  themeColor: '#0284c7',
  summary: '1,600-page sample book (16 chapters of 100 pages), generated in your browser',
};

export const SAMPLE_COMPRESS_NAME = 'Site-Photo-Report-Sample.pdf';

/** A photo-like JPEG drawn in the browser: gradients, shapes and fine grain, saved at high quality. */
async function samplePhotoJpeg(seed: number, width: number, height: number): Promise<Uint8Array> {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is not available');
  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, `hsl(${200 + seed * 25}, 60%, 70%)`);
  sky.addColorStop(1, `hsl(${30 + seed * 20}, 45%, 45%)`);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);
  let r = 12345 + seed * 999;
  const next = () => {
    r = (r * 1103515245 + 12345) % 2147483648;
    return r / 2147483648;
  };
  for (let i = 0; i < 140; i++) {
    ctx.fillStyle = `hsla(${Math.floor(next() * 360)}, 50%, ${30 + Math.floor(next() * 40)}%, 0.35)`;
    ctx.beginPath();
    ctx.arc(next() * width, next() * height, 20 + next() * 160, 0, Math.PI * 2);
    ctx.fill();
  }
  const grain = ctx.getImageData(0, 0, width, height);
  for (let i = 0; i < grain.data.length; i += 4) {
    const n = (next() - 0.5) * 36;
    grain.data[i] = (grain.data[i] ?? 0) + n;
    grain.data[i + 1] = (grain.data[i + 1] ?? 0) + n;
    grain.data[i + 2] = (grain.data[i + 2] ?? 0) + n;
  }
  ctx.putImageData(grain, 0, 0);
  const blob = await new Promise<Blob | null>((ok) => canvas.toBlob(ok, 'image/jpeg', 0.95));
  if (!blob) throw new Error('JPEG encoding failed');
  return new Uint8Array(await blob.arrayBuffer());
}

/** A real three-page PDF with high-quality photos, so compression has something to save. */
export async function createCompressSamplePdf(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  for (let i = 0; i < 3; i++) {
    const page = doc.addPage([595.28, 841.89]);
    const photo = await doc.embedJpg(await samplePhotoJpeg(i, 2000, 1400));
    page.drawText(`Site photo report - page ${i + 1} of 3`, {
      x: 50,
      y: 790,
      size: 16,
      font: bold,
    });
    page.drawText('Sample document generated in your browser for trying compression.', {
      x: 50,
      y: 768,
      size: 10,
      font,
      color: rgb(0.35, 0.4, 0.45),
    });
    page.drawImage(photo, { x: 50, y: 330, width: 495, height: 346.5 });
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
export async function createTextSamplePdf(): Promise<Uint8Array> {
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
  return doc.save();
}
