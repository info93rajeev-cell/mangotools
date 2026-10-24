import { err, ok, type Result } from '@mangotools/core';
import { getWorkerHost } from '@mangotools/runtime';
import type { ResolvedPreset } from '@mangotools/schemas';
import { convertCutoutToPdf } from './personSegmentation.ts';
import type {
  BgFile,
  BgOutputFormat,
  ImageBackgroundRemoverResultData,
  RemovalMode,
} from './useImageBackgroundRemover.ts';

export interface BgRunConfig {
  preset: ResolvedPreset;
  file: BgFile;
  removalMode: RemovalMode;
  outputFormat: BgOutputFormat;
  quality: number;
  tolerance: number;
  feather: number;
  targetColor: string;
  replacementBackground: string;
  customFileName: string;
}

export async function executeBgWorker(
  cfg: BgRunConfig,
): Promise<Result<ImageBackgroundRemoverResultData>> {
  const isPdf = cfg.outputFormat === 'pdf';
  const workerFormat = isPdf ? 'png' : cfg.outputFormat;

  const input = {
    file: { name: cfg.file.name, bytes: cfg.file.bytes },
    outputFormat: workerFormat,
    quality: cfg.quality,
    tolerance: cfg.tolerance,
    feather: cfg.feather,
    targetColor: cfg.targetColor === 'auto' ? undefined : cfg.targetColor,
    replacementBackground: cfg.replacementBackground,
    outputFileName: cfg.customFileName.trim() || undefined,
  };

  const outcome = await getWorkerHost().run(cfg.preset.operation, input, cfg.preset.params);
  if (!outcome.ok) return err(outcome.error.code, outcome.error);
  const val = outcome.value as Record<string, unknown>;
  const warnings = outcome.warnings ?? [];

  const rawResult: ImageBackgroundRemoverResultData = {
    fileName: String(val.fileName),
    bytes: val.bytes as Uint8Array,
    originalWidth: Number(val.originalWidth),
    originalHeight: Number(val.originalHeight),
    outputWidth: Number(val.outputWidth),
    outputHeight: Number(val.outputHeight),
    tolerance: Number(val.tolerance ?? cfg.tolerance),
    feather: Number(val.feather ?? cfg.feather),
    originalFileSize: Number(val.originalFileSize),
    outputFileSize: Number(val.outputFileSize),
    sizeDifferenceBytes: Number(val.sizeDifferenceBytes),
    sizeChangePercent: Number(val.sizeChangePercent),
    originalFormat: String(val.originalFormat),
    outputFormat: String(val.outputFormat),
    warnings,
    mode: 'solid',
  };

  if (isPdf) {
    const rawBase = cfg.customFileName.trim() || cfg.file.name.replace(/\.[^.]+$/, '');
    return convertCutoutToPdf(cfg.file.size, rawBase, rawResult);
  }

  return ok(rawResult, warnings);
}
