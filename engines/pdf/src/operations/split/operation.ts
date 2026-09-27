import { defineOperation, err, ok } from '@mangotools/core';
import { PDFDocument } from 'pdf-lib';
import { sanitizeOutputFileName } from '../../lib/file-name.ts';
import { defaultSplitFileName } from './file-name.ts';
import { type PdfFile, pdfSplitInput, pdfSplitOutput, pdfSplitParams } from './schema.ts';
import { validateRequest } from './validate.ts';
import { STANDING_WARNINGS } from './warnings.ts';

export const pdfSplit = defineOperation({
  id: 'pdf.split',
  major: 1,
  title: 'Split a PDF by page range',
  summary: 'Extracts a page range from a PDF into a new PDF, entirely in the browser.',
  input: pdfSplitInput,
  params: pdfSplitParams,
  output: pdfSplitOutput,
  errors: [
    'PDF_SPLIT_NO_FILE_SELECTED',
    'PDF_SPLIT_INVALID_FILE_TYPE',
    'PDF_SPLIT_FILE_TOO_LARGE',
    'PDF_SPLIT_START_PAGE_INVALID',
    'PDF_SPLIT_END_PAGE_INVALID',
    'PDF_SPLIT_RANGE_INVALID',
    'PDF_SPLIT_ENCRYPTED_UNSUPPORTED',
    'PDF_SPLIT_UNREADABLE',
    'PDF_SPLIT_RANGE_EXCEEDS_PAGE_COUNT',
    'PDF_SPLIT_FAILED',
  ],
  runtimes: ['worker', 'node'],
  cost: { weight: 'medium' },
  exposure: 'internal',
  dataClass: 'public',
  async run(input) {
    const validation = validateRequest(input);
    if (!validation.ok) return validation;
    const file = input.file as PdfFile; // validateRequest already rejected a missing file
    const { startPage, endPage } = input;

    let source: PDFDocument;
    try {
      // `pdf-lib`'s EncryptedPDFError does not survive `instanceof` across its build (the same known
      // limitation documented for `pdf.merge@1`), so encryption is detected via `isEncrypted` below
      // instead of by catching a specific error class.
      source = await PDFDocument.load(file.bytes, { ignoreEncryption: true });
    } catch {
      return err('PDF_SPLIT_UNREADABLE', { details: { name: file.name } });
    }
    if (source.isEncrypted) {
      return err('PDF_SPLIT_ENCRYPTED_UNSUPPORTED', { details: { name: file.name } });
    }

    const originalPageCount = source.getPageCount();
    // `endPage >= startPage` is already guaranteed by `validateRequest`, so a single check here also
    // covers a start page beyond the page count (it can never be smaller than the end page).
    if (endPage > originalPageCount) {
      return err('PDF_SPLIT_RANGE_EXCEEDS_PAGE_COUNT', {
        details: { totalPages: originalPageCount },
      });
    }

    const output = await PDFDocument.create();
    // Same non-suppressible pdf-lib date-stamping behavior documented for `pdf.merge@1`: a fixed
    // sentinel date keeps the split deterministic for identical input.
    const NO_DATE = new Date(0);
    output.setCreationDate(NO_DATE);
    output.setModificationDate(NO_DATE);

    // UI page numbers are 1-based; pdf-lib page indices are 0-based.
    const pageIndices = Array.from(
      { length: endPage - startPage + 1 },
      (_, i) => startPage - 1 + i,
    );

    try {
      const pages = await output.copyPages(source, pageIndices);
      for (const page of pages) output.addPage(page);
    } catch {
      return err('PDF_SPLIT_FAILED');
    }

    let bytes: Uint8Array;
    try {
      bytes = await output.save();
    } catch {
      return err('PDF_SPLIT_FAILED');
    }

    return ok(
      {
        bytes,
        fileName: sanitizeOutputFileName(
          input.outputFileName,
          defaultSplitFileName(file.name, startPage, endPage),
        ),
        originalFileName: file.name,
        originalPageCount,
        startPage,
        endPage,
        extractedPageCount: pageIndices.length,
        outputFileSize: bytes.byteLength,
      },
      STANDING_WARNINGS,
    );
  },
});
