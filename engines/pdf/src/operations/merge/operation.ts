import { defineOperation, err, ok } from '@mangotools/core';
import { PDFDocument } from 'pdf-lib';
import { sanitizeOutputFileName } from './file-name.ts';
import { pdfMergeInput, pdfMergeOutput, pdfMergeParams } from './schema.ts';
import { validateFiles } from './validate.ts';

export const pdfMerge = defineOperation({
  id: 'pdf.merge',
  major: 1,
  title: 'Merge PDF files',
  summary: 'Combines multiple PDF files into one, in the order given.',
  input: pdfMergeInput,
  params: pdfMergeParams,
  output: pdfMergeOutput,
  errors: [
    'PDF_NO_FILES_SELECTED',
    'PDF_TOO_MANY_FILES',
    'PDF_INVALID_FILE_TYPE',
    'PDF_FILE_TOO_LARGE',
    'PDF_TOTAL_SIZE_EXCEEDED',
    'PDF_ENCRYPTED_UNSUPPORTED',
    'PDF_UNREADABLE',
    'PDF_MERGE_FAILED',
  ],
  runtimes: ['worker', 'node'],
  cost: { weight: 'medium' },
  exposure: 'internal',
  dataClass: 'public',
  async run(input) {
    const { files } = input;
    const validation = validateFiles(files);
    if (!validation.ok) return validation;

    const merged = await PDFDocument.create();
    let totalPageCount = 0;
    for (const [index, file] of files.entries()) {
      let source: PDFDocument;
      try {
        // `pdf-lib`'s EncryptedPDFError does not survive `instanceof` across its build (a known
        // pdf-lib limitation), so encryption is detected via `isEncrypted` below instead of by
        // catching a specific error class.
        source = await PDFDocument.load(file.bytes, { ignoreEncryption: true });
      } catch {
        return err('PDF_UNREADABLE', { path: `files.${index}`, details: { name: file.name } });
      }
      if (source.isEncrypted) {
        return err('PDF_ENCRYPTED_UNSUPPORTED', {
          path: `files.${index}`,
          details: { name: file.name },
        });
      }
      try {
        const pages = await merged.copyPages(source, source.getPageIndices());
        for (const page of pages) merged.addPage(page);
        totalPageCount += pages.length;
      } catch {
        return err('PDF_MERGE_FAILED');
      }
    }

    let bytes: Uint8Array;
    try {
      bytes = await merged.save();
    } catch {
      return err('PDF_MERGE_FAILED');
    }

    return ok({
      bytes,
      fileName: sanitizeOutputFileName(input.outputFileName),
      fileCount: files.length,
      totalPageCount,
    });
  },
});
