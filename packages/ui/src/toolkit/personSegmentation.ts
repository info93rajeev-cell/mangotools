import { err, ok, type Result } from '@mangotools/core';
import { FilesetResolver, ImageSegmenter } from '@mediapipe/tasks-vision';
import { wrapImageBytesInPdf } from './imagePdfExport.ts';

export interface PersonCutoutInput {
  file: { name: string; size: number; bytes: Uint8Array };
  imageSrc: string | null;
  outputFormat: 'png' | 'webp' | 'jpg' | 'pdf';
  quality: number;
  replacementBackground: string;
  customFileName: string;
}

export interface CutoutResultData {
  fileName: string;
  bytes: Uint8Array;
  originalWidth: number;
  originalHeight: number;
  outputWidth: number;
  outputHeight: number;
  tolerance: number;
  feather: number;
  originalFileSize: number;
  outputFileSize: number;
  sizeDifferenceBytes: number;
  sizeChangePercent: number;
  originalFormat: string;
  outputFormat: string;
  warnings: [];
  mode?: 'portrait' | 'solid';
}

interface MaskData {
  floats: Float32Array;
  width: number;
  height: number;
}

let segmenterInstance: ImageSegmenter | null = null;
let segmenterPromise: Promise<ImageSegmenter> | null = null;

async function getSegmenter(): Promise<ImageSegmenter> {
  if (segmenterInstance) return segmenterInstance;
  if (segmenterPromise) return segmenterPromise;

  segmenterPromise = (async () => {
    const fileset = await FilesetResolver.forVisionTasks('/wasm');
    const instance = await ImageSegmenter.createFromOptions(fileset, {
      baseOptions: {
        modelAssetPath: '/models/selfie_segmenter.tflite',
        delegate: 'GPU',
      },
      runningMode: 'IMAGE',
      outputCategoryMask: false,
      outputConfidenceMasks: true,
    });
    segmenterInstance = instance;
    return instance;
  })();

  return segmenterPromise;
}

function parseHex(hex: string): { r: number; g: number; b: number } | null {
  const clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    return Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b) ? null : { r, g, b };
  }
  if (clean.length === 6) {
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    return Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b) ? null : { r, g, b };
  }
  return null;
}

function applyConfidenceMask(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  maskFloats: Float32Array,
  maskW: number,
  maskH: number,
  replacementBg?: string,
): void {
  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;
  const solidColor =
    replacementBg && replacementBg !== 'transparent' ? parseHex(replacementBg) : null;

  for (let y = 0; y < h; y++) {
    const my = Math.min(maskH - 1, Math.floor((y / h) * maskH));
    const rowOffset = my * maskW;
    const canvasRow = y * w;

    for (let x = 0; x < w; x++) {
      const mx = Math.min(maskW - 1, Math.floor((x / w) * maskW));
      const conf = maskFloats[rowOffset + mx];
      const idx = (canvasRow + x) * 4;

      let factor = 0;
      if (conf >= 0.65) {
        factor = 1;
      } else if (conf <= 0.35) {
        factor = 0;
      } else {
        factor = (conf - 0.35) / 0.3;
      }

      if (solidColor) {
        const inv = 1 - factor;
        data[idx] = Math.round(data[idx] * factor + solidColor.r * inv);
        data[idx + 1] = Math.round(data[idx + 1] * factor + solidColor.g * inv);
        data[idx + 2] = Math.round(data[idx + 2] * factor + solidColor.b * inv);
        data[idx + 3] = 255;
      } else {
        data[idx + 3] = Math.round(data[idx + 3] * factor);
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
}

async function obtainConfidenceMask(img: HTMLImageElement): Promise<Result<MaskData>> {
  try {
    const segmenter = await getSegmenter();
    const segOutcome = segmenter.segment(img);
    const masks = segOutcome.confidenceMasks;
    if (!masks || masks.length === 0) return err('IMAGE_BACKGROUND_REMOVAL_FAILED');
    return ok({
      floats: masks[0].getAsFloat32Array(),
      width: masks[0].width,
      height: masks[0].height,
    });
  } catch {
    return err('IMAGE_BACKGROUND_REMOVAL_FAILED');
  }
}

async function encodeCanvasBlob(
  canvas: HTMLCanvasElement,
  targetFormat: string,
  quality: number,
): Promise<Uint8Array | null> {
  const mime =
    targetFormat === 'jpg' ? 'image/jpeg' : targetFormat === 'webp' ? 'image/webp' : 'image/png';
  const q = quality ? quality / 100 : 0.92;

  const blob = await new Promise<Blob | null>((res) => {
    canvas.toBlob((b) => res(b), mime, q);
  });
  if (!blob) return null;
  return new Uint8Array(await blob.arrayBuffer());
}

export async function convertCutoutToPdf<T extends { bytes: Uint8Array; fileName: string }>(
  fileSize: number,
  fileName: string,
  result: T,
): Promise<
  Result<
    T & {
      outputFileSize: number;
      sizeDifferenceBytes: number;
      sizeChangePercent: number;
      outputFormat: string;
    }
  >
> {
  const wrapped = await wrapImageBytesInPdf(result.bytes, 'IMAGE_BACKGROUND_REMOVAL_FAILED');
  if (!wrapped.ok) return wrapped;

  const pdfName = `${fileName.replace(/\.[^.]+$/, '').replace(/-no-bg$/, '')}-no-bg.pdf`;
  const pdfBytes = wrapped.value.pdfBytes;

  return ok({
    ...result,
    fileName: pdfName,
    bytes: pdfBytes,
    outputFileSize: pdfBytes.byteLength,
    sizeDifferenceBytes: fileSize - pdfBytes.byteLength,
    sizeChangePercent: Math.round(((fileSize - pdfBytes.byteLength) / fileSize) * 100),
    outputFormat: 'pdf',
  });
}

export async function executePersonCutout(
  input: PersonCutoutInput,
): Promise<Result<CutoutResultData>> {
  if (!input.imageSrc) return err('IMAGE_BACKGROUND_REMOVAL_FAILED');
  const isPdf = input.outputFormat === 'pdf';
  const targetFormat = isPdf ? 'png' : input.outputFormat;

  const img = new Image();
  img.src = input.imageSrc;
  try {
    await img.decode();
  } catch {
    return err('IMAGE_UNREADABLE');
  }

  const maskOutcome = await obtainConfidenceMask(img);
  if (!maskOutcome.ok) return maskOutcome;
  const mask = maskOutcome.value;

  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return err('IMAGE_BACKGROUND_REMOVAL_FAILED');

  ctx.drawImage(img, 0, 0);
  applyConfidenceMask(
    ctx,
    canvas.width,
    canvas.height,
    mask.floats,
    mask.width,
    mask.height,
    input.replacementBackground,
  );

  const bytes = await encodeCanvasBlob(canvas, targetFormat, input.quality);
  if (!bytes) return err('IMAGE_BACKGROUND_REMOVAL_FAILED');

  const rawBase = input.customFileName.trim() || input.file.name.replace(/\.[^.]+$/, '');
  const cleanBase = rawBase.replace(/[^a-zA-Z0-9_\- ]/g, '').trim() || 'cutout';
  const outFileName = `${cleanBase.replace(/-no-bg$/, '')}-no-bg.${targetFormat}`;

  const diff = input.file.size - bytes.byteLength;
  const pct = Math.round((diff / input.file.size) * 100);

  const rawResult: CutoutResultData = {
    fileName: outFileName,
    bytes,
    originalWidth: canvas.width,
    originalHeight: canvas.height,
    outputWidth: canvas.width,
    outputHeight: canvas.height,
    tolerance: 0,
    feather: 0,
    originalFileSize: input.file.size,
    outputFileSize: bytes.byteLength,
    sizeDifferenceBytes: diff,
    sizeChangePercent: pct,
    originalFormat: input.file.name.split('.').pop()?.toLowerCase() ?? 'jpg',
    outputFormat: targetFormat,
    warnings: [],
    mode: 'portrait',
  };

  if (isPdf) {
    return convertCutoutToPdf(input.file.size, cleanBase, rawResult);
  }
  return ok(rawResult);
}
