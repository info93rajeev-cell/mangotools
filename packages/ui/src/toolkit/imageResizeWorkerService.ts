import { err, ok, type Result } from '@mangotools/core';
import { getWorkerHost } from '@mangotools/runtime';
import type { ResolvedPreset } from '@mangotools/schemas';
import { MIME_MAP, type CropFile as ResizeFile } from './imageFileInspection.ts';
import { wrapImageBytesInPdf } from './imagePdfExport.ts';

export type ResizeOutputFormat = 'same' | 'jpg' | 'png' | 'webp' | 'pdf';
export type { ResizeFile };

export const FORMAT_MIME_MAP: Record<string, string> = { ...MIME_MAP, pdf: 'application/pdf' };

export interface ImageResizeResultData {
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
}

export interface ResizeRunConfig {
  preset: ResolvedPreset;
  file: ResizeFile;
  targetWidth: number;
  targetHeight: number;
  keepAspectRatio: boolean;
  outputFormat: ResizeOutputFormat;
  quality: number;
  customFileName: string;
}

export async function convertResizedToPdf(
  cfg: ResizeRunConfig,
  resized: ImageResizeResultData,
): Promise<Result<ImageResizeResultData>> {
  const wrapped = await wrapImageBytesInPdf(resized.bytes, 'IMAGE_RESIZE_FAILED');
  if (!wrapped.ok) return wrapped;
  const rawBase = cfg.customFileName.trim() || cfg.file.name.replace(/\.[^.]+$/, '');
  const cleanBase = rawBase.replace(/[^a-zA-Z0-9_\- ]/g, '').trim() || 'image';
  const fileName = `${cleanBase.replace(/-resized$/, '')}-resized.pdf`;
  return ok({
    fileName,
    bytes: wrapped.value.pdfBytes,
    originalWidth: resized.originalWidth,
    originalHeight: resized.originalHeight,
    outputWidth: resized.outputWidth,
    outputHeight: resized.outputHeight,
    originalFileSize: cfg.file.size,
    outputFileSize: wrapped.value.pdfBytes.byteLength,
    sizeDifferenceBytes: cfg.file.size - wrapped.value.pdfBytes.byteLength,
    sizeChangePercent: Math.round(
      ((wrapped.value.pdfBytes.byteLength - cfg.file.size) / cfg.file.size) * 100,
    ),
    originalFormat: resized.originalFormat,
    outputFormat: 'pdf',
  });
}

export async function executeResizeWorker(
  cfg: ResizeRunConfig,
): Promise<Result<ImageResizeResultData>> {
  if (cfg.outputFormat === 'pdf') {
    const pngConfig: ResizeRunConfig = { ...cfg, outputFormat: 'png' };
    const outcome = await executeResizeWorker(pngConfig);
    if (!outcome.ok) return outcome;
    return convertResizedToPdf(cfg, outcome.value);
  }
  const maxPixels = 80_000_000;
  let targetWidth = Math.round(cfg.targetWidth);
  let targetHeight = Math.round(cfg.targetHeight);
  const currentPixels = targetWidth * targetHeight;
  if (currentPixels > maxPixels && currentPixels > 0) {
    const scale = Math.sqrt(maxPixels / currentPixels);
    targetWidth = Math.max(1, Math.floor(targetWidth * scale));
    targetHeight = Math.max(1, Math.floor(targetHeight * scale));
  }
  const input = {
    file: { name: cfg.file.name, bytes: cfg.file.bytes },
    targetWidth,
    targetHeight,
    keepAspectRatio: cfg.keepAspectRatio,
    outputFormat: cfg.outputFormat,
    quality:
      cfg.outputFormat === 'jpg' || cfg.outputFormat === 'webp' || cfg.outputFormat === 'same'
        ? cfg.quality
        : undefined,
    outputFileName: cfg.customFileName.trim() || undefined,
  };
  const outcome = await getWorkerHost().run(cfg.preset.operation, input, cfg.preset.params);
  if (!outcome.ok) return err(outcome.error.code, outcome.error);
  const val = outcome.value as Record<string, unknown>;
  return ok({
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
    outputFormat: String(val.outputFormat),
  });
}
