import { err, type OpWarning, ok, type Result } from '@mangotools/core';
import { getWorkerHost } from '@mangotools/runtime';
import type { ResolvedPreset } from '@mangotools/schemas';
import type { CropFile as SignatureFile } from './imageFileInspection.ts';
import {
  createSignatureSample,
  SAMPLE_SIGNATURE_HEIGHT,
  SAMPLE_SIGNATURE_SIZE,
  SAMPLE_SIGNATURE_WIDTH,
} from './sampleSignatureImage.ts';

export type SignatureOutputFormat = 'jpg' | 'png' | 'webp';
export type SignatureBackground = 'transparent' | 'white' | 'original';

export interface SignaturePresetItem {
  id: string;
  label: string;
  width: number;
  height: number;
  maxKB?: number;
  hint: string;
}

export const SIGNATURE_PRESETS: SignaturePresetItem[] = [
  { id: 'custom-400', label: 'Default', width: 400, height: 150, hint: '400×150 px' },
  {
    id: 'upsc',
    label: 'UPSC / SSC',
    width: 140,
    height: 60,
    maxKB: 20,
    hint: '140×60 px, ≤ 20 KB',
  },
  {
    id: 'ibps',
    label: 'IBPS / Bank',
    width: 140,
    height: 60,
    maxKB: 20,
    hint: '140×60 px, ≤ 20 KB',
  },
  {
    id: 'nta',
    label: 'NTA / JEE',
    width: 200,
    height: 100,
    maxKB: 30,
    hint: '200×100 px, ≤ 30 KB',
  },
  { id: 'pan', label: 'PAN Card', width: 150, height: 100, maxKB: 20, hint: '150×100 px, ≤ 20 KB' },
  {
    id: 'gate',
    label: 'GATE / PSU',
    width: 160,
    height: 80,
    maxKB: 50,
    hint: '160×80 px, ≤ 50 KB',
  },
];

export interface SignatureResultData {
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

export interface SignatureRunConfig {
  preset: ResolvedPreset;
  file: SignatureFile;
  targetWidth: number;
  targetHeight: number;
  outputFormat: SignatureOutputFormat;
  quality: number;
  maxFileSizeKB?: number;
  customFileName: string;
  background: SignatureBackground;
}

export async function executeSignatureWorker(
  cfg: SignatureRunConfig,
): Promise<Result<SignatureResultData>> {
  const workerFormat = cfg.outputFormat === 'webp' ? 'png' : cfg.outputFormat;
  const input = {
    file: { name: cfg.file.name, bytes: cfg.file.bytes },
    targetWidth: cfg.targetWidth,
    targetHeight: cfg.targetHeight,
    keepAspectRatio: true,
    padToTarget: true,
    outputFormat: workerFormat,
    quality: cfg.quality,
    maxFileSizeKB: cfg.maxFileSizeKB && cfg.maxFileSizeKB > 0 ? cfg.maxFileSizeKB : undefined,
    allowDimensionReduction: false,
    outputFileName: cfg.customFileName.trim() ? cfg.customFileName.trim() : undefined,
  };

  const outcome = await getWorkerHost().run(cfg.preset.operation, input, cfg.preset.params);
  if (!outcome.ok) return err(outcome.error.code, outcome.error);
  const val = outcome.value as Record<string, unknown>;

  const warnings = (outcome.warnings ?? []) as OpWarning[];

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
    targetFileSizeBytes: val.targetFileSizeBytes != null ? Number(val.targetFileSizeBytes) : null,
    encodeAttempts: Number(val.encodeAttempts ?? 1),
    warnings,
  });
}

export interface SignatureMountState {
  file: SignatureFile | null;
  imageSrc: string | null;
  resultUrl: string | null;
  setFile: (f: SignatureFile) => void;
  setImageSrc: (url: string) => void;
  setSourceDims: (dims: { width: number; height: number }) => void;
  setTargetWidth: (w: number) => void;
  setTargetHeight: (h: number) => void;
  setOutputFormat: (fmt: SignatureOutputFormat) => void;
  setBackground: (bg: SignatureBackground) => void;
  setQuality: (q: number) => void;
  setResult: (res: SignatureResultData) => void;
  setResultUrl: (url: string) => void;
  setPhase: (phase: 'idle' | 'running' | 'result' | 'error') => void;
}

export async function initMountedSignatureSample(
  s: SignatureMountState,
  userInteractedRef: { current: boolean },
) {
  if (userInteractedRef.current || s.file) return;
  try {
    const sample = await createSignatureSample();
    if (userInteractedRef.current || s.file) return;
    if (s.imageSrc) URL.revokeObjectURL(s.imageSrc);
    s.setFile(sample.file);
    s.setImageSrc(sample.blobUrl);
    s.setSourceDims({ width: SAMPLE_SIGNATURE_WIDTH, height: SAMPLE_SIGNATURE_HEIGHT });
    s.setTargetWidth(400);
    s.setTargetHeight(150);
    s.setOutputFormat('png');
    s.setBackground('transparent');
    s.setQuality(90);
    s.setResult({
      fileName: 'signature.png',
      bytes: sample.file.bytes,
      originalWidth: SAMPLE_SIGNATURE_WIDTH,
      originalHeight: SAMPLE_SIGNATURE_HEIGHT,
      outputWidth: 400,
      outputHeight: 150,
      originalFileSize: SAMPLE_SIGNATURE_SIZE,
      outputFileSize: 28672,
      sizeDifferenceBytes: SAMPLE_SIGNATURE_SIZE - 28672,
      sizeChangePercent: 64,
      originalFormat: 'jpg',
      outputFormat: 'png',
      targetFileSizeBytes: null,
      encodeAttempts: 1,
      warnings: [{ code: 'IMAGE_VERIFY_OUTPUT', messageKey: 'IMAGE_VERIFY_OUTPUT' }],
    });
    if (s.resultUrl) URL.revokeObjectURL(s.resultUrl);
    s.setResultUrl(sample.blobUrl);
    s.setPhase('result');
  } catch {
    // offline fallback
  }
}
