import { err, type OpWarning, ok, type Result } from '@mangotools/core';
import { getWorkerHost } from '@mangotools/runtime';
import type { ResolvedPreset } from '@mangotools/schemas';
import { inspectAndDecodeImage, type CropFile as PassportFile } from './imageFileInspection.ts';
import { wrapImageBytesInPdf } from './imagePdfExport.ts';
import type { PixelRect } from './imageWorkbenchGeometry.ts';
import { createPassportPortraitSample } from './samplePassportPortraitImage.ts';

export type PassportOutputFormat = 'jpg' | 'png' | 'webp' | 'pdf';
export type { PassportFile };

export interface PassportPresetItem {
  id: string;
  name: string;
  width: number;
  height: number;
  unit: string;
  desc: string;
}

export const PASSPORT_PRESETS: PassportPresetItem[] = [
  {
    id: 'in',
    name: 'India (35×45 mm)',
    width: 413,
    height: 531,
    unit: '35×45 mm',
    desc: 'Passport & OCI',
  },
  {
    id: 'us',
    name: 'US (2×2 inch)',
    width: 600,
    height: 600,
    unit: '2×2 inch',
    desc: 'Visa & Passport',
  },
  {
    id: 'schengen',
    name: 'Schengen / Europe',
    width: 413,
    height: 531,
    unit: '35×45 mm',
    desc: 'Schengen Visa',
  },
  {
    id: 'pan',
    name: 'India PAN Card',
    width: 213,
    height: 213,
    unit: '213×213 px',
    desc: 'NSDL / UTIITSL',
  },
  {
    id: 'ssc_upsc',
    name: 'UPSC / SSC Exam',
    width: 350,
    height: 450,
    unit: '350×450 px',
    desc: 'Govt Applications',
  },
];

export interface PassportPhotoResultData {
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

export interface PassportRunConfig {
  preset: ResolvedPreset;
  file: PassportFile;
  targetWidth: number;
  targetHeight: number;
  keepAspectRatio: boolean;
  outputFormat: PassportOutputFormat;
  quality: number;
  customFileName: string;
  cropRect?: PixelRect | null;
}

export async function convertPassportToPdf(
  cfg: PassportRunConfig,
  result: PassportPhotoResultData,
): Promise<Result<PassportPhotoResultData>> {
  const wrapped = await wrapImageBytesInPdf(result.bytes, 'IMAGE_RESIZE_FAILED');
  if (!wrapped.ok) return wrapped;

  const rawBase = cfg.customFileName.trim() || cfg.file.name.replace(/\.[^.]+$/, '');
  const cleanBase = rawBase.replace(/[^a-zA-Z0-9_\- ]/g, '').trim() || 'passport';
  const fileName = `${cleanBase.replace(/-passport$/, '')}-passport.pdf`;

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
      ((cfg.file.size - wrapped.value.pdfBytes.byteLength) / cfg.file.size) * 100,
    ),
    originalFormat: result.originalFormat,
    outputFormat: 'pdf',
    warnings: result.warnings,
  });
}

export async function executePassportWorker(
  cfg: PassportRunConfig,
): Promise<Result<PassportPhotoResultData>> {
  const isPdf = cfg.outputFormat === 'pdf';
  const workerFormat = isPdf ? 'png' : cfg.outputFormat;

  let activeFile = cfg.file;
  if (cfg.cropRect && cfg.cropRect.width > 0 && cfg.cropRect.height > 0) {
    const cropInput = {
      file: { name: cfg.file.name, bytes: cfg.file.bytes },
      cropX: Math.max(0, Math.round(cfg.cropRect.x)),
      cropY: Math.max(0, Math.round(cfg.cropRect.y)),
      cropWidth: Math.max(1, Math.round(cfg.cropRect.width)),
      cropHeight: Math.max(1, Math.round(cfg.cropRect.height)),
      outputFormat: 'png' as const,
    };
    const cropOutcome = await getWorkerHost().run('image.crop@1', cropInput, {});
    if (cropOutcome.ok) {
      const cropVal = cropOutcome.value as { bytes: Uint8Array; fileName: string };
      activeFile = {
        name: cropVal.fileName,
        bytes: cropVal.bytes,
        size: cropVal.bytes.byteLength,
      };
    }
  }

  const input = {
    file: { name: activeFile.name, bytes: activeFile.bytes },
    targetWidth: cfg.targetWidth,
    targetHeight: cfg.targetHeight,
    keepAspectRatio: cfg.keepAspectRatio,
    outputFormat: workerFormat,
    quality: workerFormat === 'jpg' || workerFormat === 'webp' ? cfg.quality : undefined,
    outputFileName: cfg.customFileName.trim() || undefined,
  };

  const outcome = await getWorkerHost().run(cfg.preset.operation, input, cfg.preset.params);
  if (!outcome.ok) return err(outcome.error.code, outcome.error);

  const val = outcome.value as Record<string, unknown>;
  const baseRes: PassportPhotoResultData = {
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
    warnings: (outcome.warnings ?? []) as OpWarning[],
  };

  if (isPdf) {
    return convertPassportToPdf(cfg, baseRes);
  }
  return ok(baseRes);
}

export interface PassportMountState {
  file: PassportFile | null;
  imageSrc: string | null;
  setFile: (f: PassportFile) => void;
  setImageSrc: (url: string) => void;
  setSourceDims: (dims: { width: number; height: number }) => void;
  setTargetWidth: (w: number) => void;
  setTargetHeight: (h: number) => void;
  setKeepAspectRatio: (keep: boolean) => void;
  setOutputFormat: (fmt: PassportOutputFormat) => void;
  setQuality: (q: number) => void;
  setActivePresetId: (id: string) => void;
  updatePhase: (phase: 'idle' | 'running' | 'result' | 'error') => void;
}

export async function initMountedPassportSample(
  s: PassportMountState,
  userInteractedRef: { current: boolean },
) {
  if (userInteractedRef.current || s.file) return;
  try {
    const sample = await createPassportPortraitSample();
    if (userInteractedRef.current || s.file) return;
    const fileObj = new File([sample.file.bytes as BlobPart], sample.file.name, {
      type: 'image/jpeg',
    });
    const res = await inspectAndDecodeImage(fileObj);
    if (!res.ok) return;
    if (userInteractedRef.current || s.file) return;
    if (s.imageSrc) URL.revokeObjectURL(s.imageSrc);
    s.setFile(res.value.file);
    s.setImageSrc(res.value.blobUrl);
    s.setSourceDims(res.value.dims);
    s.setTargetWidth(413);
    s.setTargetHeight(531);
    s.setKeepAspectRatio(true);
    s.setOutputFormat('jpg');
    s.setQuality(85);
    s.setActivePresetId('in');
    s.updatePhase('idle');
  } catch {
    // offline fallback
  }
}
