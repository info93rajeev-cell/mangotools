import { err, type OpWarning, ok, type Result } from '@mangotools/core';
import { getWorkerHost } from '@mangotools/runtime';
import type { ResolvedPreset } from '@mangotools/schemas';
import { wrapImageBytesInPdf } from './imagePdfExport.ts';
import type { WatermarkFile } from './useImageWatermark.ts';

export type WatermarkPosition =
  | 'top-left'
  | 'top-right'
  | 'center'
  | 'bottom-left'
  | 'bottom-right';

export type WatermarkOutputFormat = 'same' | 'jpg' | 'png' | 'webp' | 'pdf';

export interface ImageWatermarkResultData {
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
  watermarkText: string;
  position: WatermarkPosition;
  opacity: number;
  fontSize: number;
  color: string;
  warnings: OpWarning[];
}

export interface WatermarkRunConfig {
  preset: ResolvedPreset;
  file: WatermarkFile;
  sourceDims: { width: number; height: number };
  text: string;
  position: WatermarkPosition;
  opacity: number;
  fontSize: number;
  color: string;
  outputFormat: WatermarkOutputFormat;
  quality: number;
  customFileName: string;
}

export async function convertWatermarkToPdf(
  cfg: WatermarkRunConfig,
  result: ImageWatermarkResultData,
): Promise<Result<ImageWatermarkResultData>> {
  const wrapped = await wrapImageBytesInPdf(result.bytes, 'IMAGE_WATERMARK_FAILED');
  if (!wrapped.ok) return wrapped;

  const rawBase = cfg.customFileName.trim() || cfg.file.name.replace(/\.[^.]+$/, '');
  const cleanBase = rawBase.replace(/[^a-zA-Z0-9_\- ]/g, '').trim() || 'watermarked';
  const fileName = `${cleanBase.replace(/-watermarked$/, '')}-watermarked.pdf`;

  return ok({
    fileName,
    bytes: wrapped.value.pdfBytes,
    originalWidth: result.originalWidth,
    originalHeight: result.originalHeight,
    outputWidth: result.outputWidth,
    outputHeight: result.outputHeight,
    originalFileSize: cfg.file.size,
    outputFileSize: wrapped.value.pdfBytes.byteLength,
    sizeDifferenceBytes: cfg.file.size - wrapped.value.pdfBytes.byteLength,
    sizeChangePercent: Math.round(
      ((wrapped.value.pdfBytes.byteLength - cfg.file.size) / cfg.file.size) * 100,
    ),
    originalFormat: result.originalFormat,
    outputFormat: 'pdf',
    watermarkText: result.watermarkText,
    position: result.position,
    opacity: result.opacity,
    fontSize: result.fontSize,
    color: result.color,
    warnings: result.warnings,
  });
}

export async function executeWatermarkWorker(
  cfg: WatermarkRunConfig,
): Promise<Result<ImageWatermarkResultData>> {
  const isPdf = cfg.outputFormat === 'pdf';
  const workerFormat = isPdf ? 'png' : cfg.outputFormat;

  const input = {
    file: { name: cfg.file.name, bytes: cfg.file.bytes },
    text: cfg.text,
    position: cfg.position,
    opacity: cfg.opacity,
    fontSize: cfg.fontSize,
    color: cfg.color,
    outputFormat: workerFormat,
    quality: workerFormat === 'jpg' || workerFormat === 'webp' ? cfg.quality : undefined,
    outputFileName: cfg.customFileName.trim() || undefined,
  };

  const outcome = await getWorkerHost().run(cfg.preset.operation, input, cfg.preset.params);
  if (!outcome.ok) return err(outcome.error.code, outcome.error);
  const val = outcome.value as Record<string, unknown>;
  const warnings = outcome.warnings ?? [];

  const baseResult: ImageWatermarkResultData = {
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
    watermarkText: String(val.watermarkText),
    position: val.position as WatermarkPosition,
    opacity: Number(val.opacity),
    fontSize: Number(val.fontSize),
    color: String(val.color),
    warnings,
  };

  if (isPdf) {
    return convertWatermarkToPdf(cfg, baseResult);
  }
  return ok(baseResult, warnings);
}
