import { defineOperation, err, ok } from '@mangotools/core';
import { PDFDocument, type PDFImage } from 'pdf-lib';
import { sanitizeOutputFileName } from './file-name.ts';
import { pdfJpgToPdfInput, pdfJpgToPdfOutput, pdfJpgToPdfParams } from './schema.ts';
import { validateFiles } from './validate.ts';
import { STANDING_WARNINGS } from './warnings.ts';

/**
 * pdf-lib's `JpegEmbedder` reads the SOI marker via `new DataView(imageData.buffer)` — the raw
 * underlying `ArrayBuffer`, not a view scoped to `byteOffset`/`byteLength`. A `Uint8Array` that is
 * itself a slice of a larger buffer (for example one backed by Node's small-allocation buffer
 * pool) then has its header read from the wrong offset and is rejected as "SOI not found", even
 * though the image is valid. Copying into a fresh, zero-offset `Uint8Array` first works around it
 * without touching pdf-lib itself.
 */
function toEmbeddableJpegBytes(bytes: Uint8Array): Uint8Array {
  return bytes.byteOffset === 0 && bytes.buffer.byteLength === bytes.byteLength
    ? bytes
    : new Uint8Array(bytes);
}

export const pdfJpgToPdf = defineOperation({
  id: 'pdf.jpg-to-pdf',
  major: 1,
  title: 'Convert JPG images to PDF',
  summary: 'Combines one or more JPG images into a single PDF, one image per page, in order.',
  input: pdfJpgToPdfInput,
  params: pdfJpgToPdfParams,
  output: pdfJpgToPdfOutput,
  errors: [
    'PDF_JPG_NO_FILES_SELECTED',
    'PDF_JPG_TOO_MANY_FILES',
    'PDF_JPG_INVALID_FILE_TYPE',
    'PDF_JPG_FILE_TOO_LARGE',
    'PDF_JPG_TOTAL_SIZE_EXCEEDED',
    'PDF_JPG_UNREADABLE',
    'PDF_JPG_CONVERSION_FAILED',
  ],
  runtimes: ['worker', 'node'],
  cost: { weight: 'medium' },
  exposure: 'internal',
  dataClass: 'public',
  async run(input) {
    const { files } = input;
    const validation = validateFiles(files);
    if (!validation.ok) return validation;

    const doc = await PDFDocument.create();
    // Same non-suppressible pdf-lib date-stamping behavior documented for pdf.merge@1: a fixed
    // sentinel date keeps the conversion deterministic for identical input.
    const NO_DATE = new Date(0);
    doc.setCreationDate(NO_DATE);
    doc.setModificationDate(NO_DATE);

    for (const [index, file] of files.entries()) {
      let image: PDFImage;
      try {
        image = await doc.embedJpg(toEmbeddableJpegBytes(file.bytes));
      } catch {
        return err('PDF_JPG_UNREADABLE', { path: `files.${index}`, details: { name: file.name } });
      }
      try {
        // One page per image, sized to the image's own pixel dimensions (1 image px = 1 PDF pt):
        // the simplest deterministic layout, with no scaling, cropping, or fit-to-page decisions.
        const page = doc.addPage([image.width, image.height]);
        page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
      } catch {
        return err('PDF_JPG_CONVERSION_FAILED');
      }
    }

    let bytes: Uint8Array;
    try {
      bytes = await doc.save();
    } catch {
      return err('PDF_JPG_CONVERSION_FAILED');
    }

    return ok(
      {
        bytes,
        fileName: sanitizeOutputFileName(input.outputFileName),
        imageCount: files.length,
      },
      STANDING_WARNINGS,
    );
  },
});
