import { err, ok, type Result } from '@mangotools/core';
import type { PDFImage } from 'pdf-lib';

export async function wrapImageBytesInPdf(
  imageBytes: Uint8Array,
  fallbackErrorCode: string,
): Promise<Result<{ pdfBytes: Uint8Array; width: number; height: number }>> {
  try {
    const { PDFDocument } = await import('pdf-lib');
    const doc = await PDFDocument.create();
    doc.setCreationDate(new Date(0));
    doc.setModificationDate(new Date(0));

    let pdfImg: PDFImage;
    try {
      pdfImg = await doc.embedPng(imageBytes);
    } catch {
      try {
        const safeJpg =
          imageBytes.byteOffset === 0 && imageBytes.buffer.byteLength === imageBytes.byteLength
            ? imageBytes
            : new Uint8Array(imageBytes);
        pdfImg = await doc.embedJpg(safeJpg);
      } catch {
        return err(fallbackErrorCode);
      }
    }

    const page = doc.addPage([pdfImg.width, pdfImg.height]);
    page.drawImage(pdfImg, { x: 0, y: 0, width: pdfImg.width, height: pdfImg.height });
    const pdfBytes = await doc.save();
    return ok({ pdfBytes, width: pdfImg.width, height: pdfImg.height });
  } catch {
    return err(fallbackErrorCode);
  }
}
