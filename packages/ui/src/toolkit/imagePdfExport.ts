import { err, ok, type Result } from '@mangotools/core';
import type { PDFDocument, PDFImage } from 'pdf-lib';

async function rasterizeToPng(bytes: Uint8Array): Promise<Uint8Array | null> {
  if (typeof document === 'undefined') return null;
  try {
    const bmp = await createImageBitmap(new Blob([bytes as BlobPart]));
    const canvas = document.createElement('canvas');
    canvas.width = bmp.width;
    canvas.height = bmp.height;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(bmp, 0, 0);
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob((b) => res(b), 'image/png'));
    return blob ? new Uint8Array(await blob.arrayBuffer()) : null;
  } catch {
    return null;
  }
}

export async function wrapImageBytesInPdf(
  imageBytes: Uint8Array,
  fallbackErrorCode: string,
): Promise<Result<{ pdfBytes: Uint8Array; width: number; height: number }>> {
  try {
    const { PDFDocument } = await import('pdf-lib');
    const doc = await PDFDocument.create();
    doc.setCreationDate(new Date(0));
    doc.setModificationDate(new Date(0));

    const pdfImg = await embedImage(doc, imageBytes);
    if (!pdfImg) return err(fallbackErrorCode);

    const page = doc.addPage([pdfImg.width, pdfImg.height]);
    page.drawImage(pdfImg, { x: 0, y: 0, width: pdfImg.width, height: pdfImg.height });
    const pdfBytes = await doc.save();
    return ok({ pdfBytes, width: pdfImg.width, height: pdfImg.height });
  } catch {
    return err(fallbackErrorCode);
  }
}

export interface CompilePdfImageInput {
  name: string;
  bytes: Uint8Array;
  width?: number;
  height?: number;
}

export interface CompileImagesToPdfOptions {
  images: CompilePdfImageInput[];
  pageSize?: 'a4' | 'letter' | 'fit';
  orientation?: 'portrait' | 'landscape' | 'auto';
  margins?: 'normal' | 'small' | 'none';
  fitMode?: 'fit' | 'fill' | 'original';
}

async function embedImage(doc: PDFDocument, bytes: Uint8Array): Promise<PDFImage | null> {
  try {
    return await doc.embedPng(bytes);
  } catch {
    try {
      const safeJpg =
        bytes.byteOffset === 0 && bytes.buffer.byteLength === bytes.byteLength
          ? bytes
          : new Uint8Array(bytes);
      return await doc.embedJpg(safeJpg);
    } catch {
      const pngFallback = await rasterizeToPng(bytes);
      if (!pngFallback) return null;
      try {
        return await doc.embedPng(pngFallback);
      } catch {
        return null;
      }
    }
  }
}

function computePageSize(
  imgW: number,
  imgH: number,
  sizeSetting: 'a4' | 'letter' | 'fit',
  orient: 'portrait' | 'landscape' | 'auto',
): { pageW: number; pageH: number } {
  if (sizeSetting === 'fit') return { pageW: imgW, pageH: imgH };
  const baseW = sizeSetting === 'letter' ? 612.0 : 595.28;
  const baseH = sizeSetting === 'letter' ? 792.0 : 841.89;

  if (orient === 'portrait') {
    return { pageW: Math.min(baseW, baseH), pageH: Math.max(baseW, baseH) };
  }
  if (orient === 'landscape') {
    return { pageW: Math.max(baseW, baseH), pageH: Math.min(baseW, baseH) };
  }
  return imgW >= imgH
    ? { pageW: Math.max(baseW, baseH), pageH: Math.min(baseW, baseH) }
    : { pageW: Math.min(baseW, baseH), pageH: Math.max(baseW, baseH) };
}

function computeImageDrawRect(
  imgW: number,
  imgH: number,
  pageW: number,
  pageH: number,
  marginPt: number,
  fitMode: 'fit' | 'fill' | 'original',
): { x: number; y: number; width: number; height: number } {
  const boxW = pageW - marginPt * 2;
  const boxH = pageH - marginPt * 2;
  let scale = 1;

  if (fitMode === 'fit') {
    scale = Math.min(boxW / imgW, boxH / imgH);
  } else if (fitMode === 'fill') {
    scale = Math.max(boxW / imgW, boxH / imgH);
  } else if (imgW > boxW || imgH > boxH) {
    scale = Math.min(boxW / imgW, boxH / imgH);
  }

  const width = imgW * scale;
  const height = imgH * scale;
  const x = marginPt + (boxW - width) / 2;
  const y = marginPt + (boxH - height) / 2;
  return { x, y, width, height };
}

async function addSingleImagePage(
  doc: PDFDocument,
  item: CompilePdfImageInput,
  sizeSetting: 'a4' | 'letter' | 'fit',
  orient: 'portrait' | 'landscape' | 'auto',
  margins: 'normal' | 'small' | 'none',
  fitMode: 'fit' | 'fill' | 'original',
): Promise<boolean> {
  const pdfImg = await embedImage(doc, item.bytes);
  if (!pdfImg) return false;

  const { pageW, pageH } = computePageSize(pdfImg.width, pdfImg.height, sizeSetting, orient);
  let marginPt =
    sizeSetting === 'fit' ? 0 : margins === 'normal' ? 72 : margins === 'small' ? 36 : 0;
  if (marginPt * 2 >= pageW || marginPt * 2 >= pageH) marginPt = 0;

  const rect = computeImageDrawRect(pdfImg.width, pdfImg.height, pageW, pageH, marginPt, fitMode);
  const page = doc.addPage([pageW, pageH]);
  page.drawImage(pdfImg, rect);
  return true;
}

export async function compileImagesToPdf(
  options: CompileImagesToPdfOptions,
  fallbackErrorCode = 'PDF_GENERATION_FAILED',
): Promise<Result<{ pdfBytes: Uint8Array; pageCount: number }>> {
  if (!options.images || options.images.length === 0) {
    return err('NO_IMAGES_PROVIDED');
  }

  try {
    const { PDFDocument } = await import('pdf-lib');
    const doc = await PDFDocument.create();
    doc.setCreationDate(new Date(0));
    doc.setModificationDate(new Date(0));

    const sizeSetting = options.pageSize || 'a4';
    const orient = options.orientation || 'portrait';
    const margins = options.margins || 'normal';
    const fitMode = options.fitMode || 'fit';

    for (const item of options.images) {
      const okAdded = await addSingleImagePage(doc, item, sizeSetting, orient, margins, fitMode);
      if (!okAdded) return err(fallbackErrorCode);
    }

    const pdfBytes = await doc.save();
    return ok({ pdfBytes, pageCount: options.images.length });
  } catch {
    return err(fallbackErrorCode);
  }
}
