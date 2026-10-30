import { err, type OpWarning, ok, type Result } from '@mangotools/core';
import { getWorkerHost } from '@mangotools/runtime';
import type { ResolvedPreset } from '@mangotools/schemas';
import type { CropFile as CompressFile } from './imageFileInspection.ts';
import { wrapImageBytesInPdf } from './imagePdfExport.ts';

export type CompressOutputFormat = 'same' | 'jpg' | 'png' | 'webp' | 'pdf';

export interface ImageCompressResultData {
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
  outputQuality: number;
  dimensions: string;
  status: string;
  encodeAttempts: number;
  warnings: OpWarning[];
}

export interface CompressRunConfig {
  preset: ResolvedPreset;
  file: CompressFile;
  outputFormat: CompressOutputFormat;
  quality: number;
  maxFileSizeKB?: number;
  customFileName: string;
}

async function convertCompressedToPdf(
  cfg: CompressRunConfig,
  compressed: ImageCompressResultData,
): Promise<Result<ImageCompressResultData>> {
  const wrapped = await wrapImageBytesInPdf(compressed.bytes, 'IMAGE_COMPRESSION_FAILED');
  if (!wrapped.ok) return wrapped;

  const rawBase = cfg.customFileName.trim() || cfg.file.name.replace(/\.[^.]+$/, '');
  const cleanBase = rawBase.replace(/[^a-zA-Z0-9_\- ]/g, '').trim() || 'image';
  const fileName = `${cleanBase.replace(/-compressed$/, '')}-compressed.pdf`;

  return ok({
    fileName,
    bytes: wrapped.value.pdfBytes,
    originalWidth: compressed.originalWidth,
    originalHeight: compressed.originalHeight,
    outputWidth: compressed.outputWidth,
    outputHeight: compressed.outputHeight,
    originalFileSize: cfg.file.size,
    outputFileSize: wrapped.value.pdfBytes.byteLength,
    sizeDifferenceBytes: cfg.file.size - wrapped.value.pdfBytes.byteLength,
    sizeChangePercent: Math.round(
      ((cfg.file.size - wrapped.value.pdfBytes.byteLength) / cfg.file.size) * 100,
    ),
    originalFormat: compressed.originalFormat,
    outputFormat: 'pdf',
    outputQuality: compressed.outputQuality,
    dimensions: compressed.dimensions,
    status: 'Compressed into PDF document',
    encodeAttempts: compressed.encodeAttempts,
    warnings: compressed.warnings,
  });
}

export async function executeCompressWorker(
  cfg: CompressRunConfig,
): Promise<Result<ImageCompressResultData>> {
  const isPdf = cfg.outputFormat === 'pdf';
  const workerFormat = isPdf ? 'jpg' : cfg.outputFormat;

  const input = {
    file: { name: cfg.file.name, bytes: cfg.file.bytes },
    outputFormat: workerFormat,
    quality: cfg.quality,
    maxFileSizeKB: cfg.maxFileSizeKB && cfg.maxFileSizeKB > 0 ? cfg.maxFileSizeKB : undefined,
    outputFileName: cfg.customFileName.trim() ? cfg.customFileName.trim() : undefined,
    allowDimensionReduction: false,
  };

  const outcome = await getWorkerHost().run(cfg.preset.operation, input, cfg.preset.params);
  if (!outcome.ok) return err(outcome.error.code, outcome.error);
  const val = outcome.value as Record<string, unknown>;
  const warnings = outcome.warnings ?? [];

  const rawResult: ImageCompressResultData = {
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
    outputQuality: Number(val.outputQuality),
    dimensions: String(val.dimensions),
    status: String(val.status),
    encodeAttempts: Number(val.encodeAttempts),
    warnings,
  };

  if (isPdf) {
    return convertCompressedToPdf(cfg, rawResult);
  }

  return ok(rawResult);
}
