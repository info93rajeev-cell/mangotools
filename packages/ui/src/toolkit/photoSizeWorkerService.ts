import { err, type OpWarning, ok, type Result } from '@mangotools/core';
import { getWorkerHost } from '@mangotools/runtime';
import type { ResolvedPreset } from '@mangotools/schemas';
import { type CropFile, MIME_MAP } from './imageFileInspection.ts';
import { wrapImageBytesInPdf } from './imagePdfExport.ts';

export type PhotoSizeOutputFormat = 'jpg' | 'png' | 'webp' | 'pdf';
export type PhotoFile = CropFile | File;

export const FORMAT_MIME_MAP: Record<string, string> = { ...MIME_MAP, pdf: 'application/pdf' };

export interface PhotoSizeResultData {
  fileName: string;
  bytes: Uint8Array;
  originalWidth: number;
  originalHeight: number;
  outputWidth: number;
  outputHeight: number;
  originalFileSize: number;
  outputFileSize: number;
  sizeDifferenceBytes: number;
  sizeChangePercent: number;
  originalFormat: string;
  outputFormat: string;
  targetFileSizeBytes: number | null;
  encodeAttempts: number;
  warnings: OpWarning[];
}

export interface PhotoSizeRunConfig {
  preset: ResolvedPreset;
  file: PhotoFile;
  maxFileSizeKB?: number;
  targetWidth?: number;
  targetHeight?: number;
  allowDimensionReduction: boolean;
  outputFormat: PhotoSizeOutputFormat;
  quality: number;
  customFileName: string;
}

export async function convertPhotoSizeToPdf(
  cfg: PhotoSizeRunConfig,
  reduced: PhotoSizeResultData,
): Promise<Result<PhotoSizeResultData>> {
  const wrapped = await wrapImageBytesInPdf(reduced.bytes, 'IMAGE_RESIZE_FAILED');
  if (!wrapped.ok) return wrapped;

  const rawBase = cfg.customFileName.trim() || cfg.file.name.replace(/\.[^.]+$/, '');
  const cleanBase = rawBase.replace(/[^a-zA-Z0-9_\- ]/g, '').trim() || 'photo';
  const fileName = `${cleanBase.replace(/-reduced$/, '')}-reduced.pdf`;

  const origSize = cfg.file.size ?? reduced.originalFileSize;

  return ok({
    fileName,
    bytes: wrapped.value.pdfBytes,
    originalWidth: reduced.originalWidth,
    originalHeight: reduced.originalHeight,
    outputWidth: reduced.outputWidth,
    outputHeight: reduced.outputHeight,
    originalFileSize: origSize,
    outputFileSize: wrapped.value.pdfBytes.byteLength,
    sizeDifferenceBytes: origSize - wrapped.value.pdfBytes.byteLength,
    sizeChangePercent: Math.round(
      ((origSize - wrapped.value.pdfBytes.byteLength) / origSize) * 100,
    ),
    originalFormat: reduced.originalFormat,
    outputFormat: 'pdf',
    targetFileSizeBytes: cfg.maxFileSizeKB ? cfg.maxFileSizeKB * 1000 : null,
    encodeAttempts: reduced.encodeAttempts,
    warnings: reduced.warnings,
  });
}

export function boundTargetDimensions(width?: number, height?: number) {
  const maxPixels = 80_000_000;
  let targetWidth = width ?? 1600;
  let targetHeight = height ?? 1200;
  const currentPixels = targetWidth * targetHeight;
  if (currentPixels > maxPixels && currentPixels > 0) {
    const scale = Math.sqrt(maxPixels / currentPixels);
    targetWidth = Math.max(1, Math.floor(targetWidth * scale));
    targetHeight = Math.max(1, Math.floor(targetHeight * scale));
  }
  return { targetWidth, targetHeight };
}

async function resolveFileBytes(file: PhotoFile): Promise<Uint8Array> {
  if ('bytes' in file && file.bytes instanceof Uint8Array && file.bytes.byteLength > 0) {
    return file.bytes;
  }
  if (typeof (file as Blob).arrayBuffer === 'function') {
    return new Uint8Array(await (file as Blob).arrayBuffer());
  }
  return new Uint8Array(0);
}

export async function executePhotoSizeWorker(
  cfg: PhotoSizeRunConfig,
): Promise<Result<PhotoSizeResultData>> {
  const isPdf = cfg.outputFormat === 'pdf';
  const workerFormat = isPdf ? 'jpg' : cfg.outputFormat === 'webp' ? 'jpg' : cfg.outputFormat;
  const { targetWidth, targetHeight } = boundTargetDimensions(cfg.targetWidth, cfg.targetHeight);
  const fileBytes = await resolveFileBytes(cfg.file);

  const input = {
    file: { name: cfg.file.name, bytes: fileBytes },
    targetWidth,
    targetHeight,
    keepAspectRatio: true,
    outputFormat: workerFormat,
    quality: cfg.quality,
    maxFileSizeKB: cfg.maxFileSizeKB && cfg.maxFileSizeKB > 0 ? cfg.maxFileSizeKB : undefined,
    allowDimensionReduction: cfg.allowDimensionReduction,
    outputFileName: cfg.customFileName.trim() ? cfg.customFileName.trim() : undefined,
  };

  const outcome = await getWorkerHost().run(cfg.preset.operation, input, cfg.preset.params);
  if (!outcome.ok) return err(outcome.error.code, outcome.error);
  const val = outcome.value as Record<string, unknown>;

  const reducedData: PhotoSizeResultData = {
    fileName: String(val.fileName),
    bytes: val.bytes as Uint8Array,
    originalWidth: Number(val.originalWidth),
    originalHeight: Number(val.originalHeight),
    outputWidth: Number(val.outputWidth),
    outputHeight: Number(val.outputHeight),
    originalFileSize: Number(val.originalFileSize),
    outputFileSize: Number(val.outputFileSize),
    sizeDifferenceBytes: Number(val.sizeDifferenceBytes),
    sizeChangePercent: Number(val.sizeChangePercent),
    originalFormat: String(val.originalFormat),
    outputFormat: isPdf ? 'pdf' : String(val.outputFormat),
    targetFileSizeBytes: val.targetFileSizeBytes != null ? Number(val.targetFileSizeBytes) : null,
    encodeAttempts: Number(val.encodeAttempts ?? 1),
    warnings: (outcome.warnings ?? []) as OpWarning[],
  };

  if (isPdf) {
    return convertPhotoSizeToPdf(cfg, reducedData);
  }

  return ok(reducedData);
}
