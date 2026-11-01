import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export interface SampleDocMeta {
  name: string;
  pageCount: number;
  sizeBytes: number;
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

  const pagesToCreate = Math.min(pageCount, 5); // Create up to 5 real pages for speed, meta handles display
  for (let i = 1; i <= pagesToCreate; i++) {
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
    sizeBytes: 4.2 * 1024 * 1024,
    themeColor: '#ef4444',
    summary: 'Master service agreement with corporate terms',
  },
  {
    name: 'Annexure-A.pdf',
    pageCount: 16,
    sizeBytes: 2.8 * 1024 * 1024,
    themeColor: '#3b82f6',
    summary: 'Technical specifications & service level terms',
  },
  {
    name: 'Invoice-Batch.pdf',
    pageCount: 62,
    sizeBytes: 8.7 * 1024 * 1024,
    themeColor: '#10b981',
    summary: 'Itemized commercial invoice schedule and billings',
  },
  {
    name: 'Signed-Appendix.pdf',
    pageCount: 18,
    sizeBytes: 2.7 * 1024 * 1024,
    themeColor: '#a855f7',
    summary: 'Signatures, legal attestations and compliance proofs',
  },
];

export const SAMPLE_SPLIT_FILE: SampleDocMeta = {
  name: 'Audit-Report-2025.pdf',
  pageCount: 124,
  sizeBytes: 18.4 * 1024 * 1024,
  themeColor: '#ef4444',
  summary: 'Annual corporate audit, balance sheets and governance',
};

export const SAMPLE_HEAVY_BOOK_FILE: SampleDocMeta = {
  name: 'Medical_Physiology_Textbook_1600_Pages.pdf',
  pageCount: 1600,
  sizeBytes: 342 * 1024 * 1024,
  themeColor: '#0284c7',
  summary: '1,600-Page Clinical Medicine Textbook (16 Chapters, 100 Pages/Chapter)',
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

export const SAMPLE_PDF_TO_WORD_FILE: SampleDocMeta = {
  name: 'Vendor-Agreement.pdf',
  pageCount: 42,
  sizeBytes: 6.4 * 1024 * 1024,
  themeColor: '#ef4444',
  summary: 'Vendor contract with tabular pricing and deliverables',
};

export const SAMPLE_WORD_FILES: SampleDocMeta[] = [
  {
    name: 'Proposal-Final.docx',
    pageCount: 12,
    sizeBytes: 2.4 * 1024 * 1024,
    themeColor: '#2563eb',
    summary: 'Client proposal outline and executive executive summary',
  },
  {
    name: 'Annexure-Notes.docx',
    pageCount: 8,
    sizeBytes: 1.1 * 1024 * 1024,
    themeColor: '#2563eb',
    summary: 'Technical architecture diagrams and annexures',
  },
];
