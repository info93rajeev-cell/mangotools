import { err, ok, type Result } from '@mangotools/core';
import type { PDFDocument, PDFFont, PDFImage, PDFPage } from 'pdf-lib';
import {
  DEFAULT_PAGE_EXTRAS,
  exifRotation,
  OFFWHITE_RGB,
  type PageExtras,
  pageNumberLabel,
  reencodeForQuality,
  rotatedPlacement,
} from './imagePdfPageOptions.ts';

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
  /** The user's clockwise turns in degrees (0/90/180/270). */
  rotation?: number;
}

export interface CompileImagesToPdfOptions {
  images: CompilePdfImageInput[];
  pageSize?: 'a4' | 'letter' | 'fit';
  orientation?: 'portrait' | 'landscape' | 'auto';
  margins?: 'normal' | 'small' | 'none';
  fitMode?: 'fit' | 'fill' | 'original';
  extras?: PageExtras;
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

type PdfLib = typeof import('pdf-lib');

interface PageLayout {
  sizeSetting: 'a4' | 'letter' | 'fit';
  orient: 'portrait' | 'landscape' | 'auto';
  margins: 'normal' | 'small' | 'none';
  fitMode: 'fit' | 'fill' | 'original';
}

/** The bytes to embed and the rotation still to apply (quality re-encoding bakes EXIF in). */
async function prepareImage(
  item: CompilePdfImageInput,
  extras: PageExtras,
): Promise<{ bytes: Uint8Array; rotation: number }> {
  const user = item.rotation ?? 0;
  if (extras.quality !== 'high') {
    const smaller = await reencodeForQuality(item.bytes, extras.quality);
    if (smaller) return { bytes: smaller, rotation: user };
  }
  return { bytes: item.bytes, rotation: user + exifRotation(item.bytes) };
}

function paintBackground(lib: PdfLib, page: PDFPage, extras: PageExtras): void {
  if (extras.background !== 'offwhite') return;
  const [r, g, b] = OFFWHITE_RGB;
  const { width, height } = page.getSize();
  page.drawRectangle({ x: 0, y: 0, width, height, color: lib.rgb(r, g, b) });
}

async function addSingleImagePage(
  lib: PdfLib,
  doc: PDFDocument,
  item: CompilePdfImageInput,
  layout: PageLayout,
  extras: PageExtras,
): Promise<PDFPage | null> {
  const prepared = await prepareImage(item, extras);
  const pdfImg = await embedImage(doc, prepared.bytes);
  if (!pdfImg) return null;
  const turned = ((prepared.rotation % 360) + 360) % 180 === 90;
  const shownW = turned ? pdfImg.height : pdfImg.width;
  const shownH = turned ? pdfImg.width : pdfImg.height;

  const { pageW, pageH } = computePageSize(shownW, shownH, layout.sizeSetting, layout.orient);
  const marginSetting = layout.margins;
  let marginPt =
    layout.sizeSetting === 'fit'
      ? 0
      : marginSetting === 'normal'
        ? 72
        : marginSetting === 'small'
          ? 36
          : 0;
  if (marginPt * 2 >= pageW || marginPt * 2 >= pageH) marginPt = 0;

  const box = computeImageDrawRect(shownW, shownH, pageW, pageH, marginPt, layout.fitMode);
  const page = doc.addPage([pageW, pageH]);
  paintBackground(lib, page, extras);
  const place = rotatedPlacement(box, prepared.rotation);
  page.drawImage(pdfImg, {
    x: place.x,
    y: place.y,
    width: place.width,
    height: place.height,
    rotate: lib.degrees(place.degrees),
  });
  return page;
}

function numberPages(pages: PDFPage[], font: PDFFont, numbering: PageExtras['numbering']): void {
  const size = 10;
  pages.forEach((page, index) => {
    const label = pageNumberLabel(index, pages.length, numbering, page.getWidth(), (text) =>
      font.widthOfTextAtSize(text, size),
    );
    if (label) page.drawText(label.text, { x: label.x, y: 18, size, font });
  });
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

    const lib = await import('pdf-lib');
    const layout: PageLayout = {
      sizeSetting: options.pageSize || 'a4',
      orient: options.orientation || 'portrait',
      margins: options.margins || 'normal',
      fitMode: options.fitMode || 'fit',
    };
    const extras = options.extras ?? DEFAULT_PAGE_EXTRAS;

    const pages: PDFPage[] = [];
    for (const item of options.images) {
      const page = await addSingleImagePage(lib, doc, item, layout, extras);
      if (!page) return err(fallbackErrorCode);
      pages.push(page);
    }
    if (extras.numbering !== 'none') {
      numberPages(pages, await doc.embedFont(lib.StandardFonts.Helvetica), extras.numbering);
    }

    const pdfBytes = await doc.save();
    return ok({ pdfBytes, pageCount: options.images.length });
  } catch {
    return err(fallbackErrorCode);
  }
}
