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

export const SAMPLE_COMPRESS_FILE: SampleDocMeta = {
  name: 'Client-Submission-Pack.pdf',
  pageCount: 86,
  sizeBytes: 24.8 * 1024 * 1024,
  themeColor: '#8b5cf6',
  summary: 'High-resolution proposal dossier and technical records',
};

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
