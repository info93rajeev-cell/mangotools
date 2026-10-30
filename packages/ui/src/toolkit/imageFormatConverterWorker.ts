import { err, type OpWarning, ok, type Result } from '@mangotools/core';
import { getWorkerHost } from '@mangotools/runtime';
import type { ResolvedPreset } from '@mangotools/schemas';
import { wrapImageBytesInPdf } from './imagePdfExport.ts';
import type { ConvertFile, TargetImageFormat } from './useImageFormatConverter.ts';

export interface ImageFormatConverterResultData {
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
  warnings: OpWarning[];
}

export interface ConvertRunConfig {
  preset: ResolvedPreset;
  file: ConvertFile;
  sourceDims: { width: number; height: number };
  targetFormat: TargetImageFormat;
  quality: number;
  customFileName: string;
}

export async function convertImageToPdf(
  cfg: ConvertRunConfig,
): Promise<Result<ImageFormatConverterResultData>> {
  const wrapped = await wrapImageBytesInPdf(cfg.file.bytes, 'IMAGE_RESIZE_FAILED');
  if (!wrapped.ok) return wrapped;

  const rawBase = cfg.customFileName.trim() || cfg.file.name.replace(/\.[^.]+$/, '');
  const cleanBase = rawBase.replace(/[^a-zA-Z0-9_\- ]/g, '').trim() || 'image';
  const fileName = `${cleanBase.replace(/-converted$/, '')}-converted.pdf`;

  const isPng = cfg.file.name.toLowerCase().endsWith('.png');
  const isJpg =
    cfg.file.name.toLowerCase().endsWith('.jpg') || cfg.file.name.toLowerCase().endsWith('.jpeg');

  return ok({
    fileName,
    bytes: wrapped.value.pdfBytes,
    originalWidth: cfg.sourceDims.width,
    originalHeight: cfg.sourceDims.height,
    outputWidth: cfg.sourceDims.width,
    outputHeight: cfg.sourceDims.height,
    originalFileSize: cfg.file.size,
    outputFileSize: wrapped.value.pdfBytes.byteLength,
    sizeDifferenceBytes: cfg.file.size - wrapped.value.pdfBytes.byteLength,
    sizeChangePercent: Math.round(
      ((wrapped.value.pdfBytes.byteLength - cfg.file.size) / cfg.file.size) * 100,
    ),
    originalFormat: isPng ? 'png' : isJpg ? 'jpg' : 'webp',
    outputFormat: 'pdf',
    warnings: [],
  });
}

export async function executeConvertWorker(
  cfg: ConvertRunConfig,
): Promise<Result<ImageFormatConverterResultData>> {
  if (cfg.targetFormat === 'pdf') {
    return convertImageToPdf(cfg);
  }
  const maxPixels = 80_000_000;
  let targetWidth = cfg.sourceDims.width;
  let targetHeight = cfg.sourceDims.height;
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
    keepAspectRatio: true,
    outputFormat: cfg.targetFormat,
    quality: cfg.targetFormat === 'jpg' || cfg.targetFormat === 'webp' ? cfg.quality : undefined,
    outputFileName: cfg.customFileName.trim() ? cfg.customFileName.trim() : undefined,
  };
  const outcome = await getWorkerHost().run(cfg.preset.operation, input, cfg.preset.params);
  if (!outcome.ok) return err(outcome.error.code, outcome.error);
  const val = outcome.value as Record<string, unknown>;
  const warnings = outcome.warnings ?? [];
  return ok(
    {
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
      warnings,
    },
    warnings,
  );
}
