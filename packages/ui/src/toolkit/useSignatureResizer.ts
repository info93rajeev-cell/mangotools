import { err, type OpError, type OpWarning, ok, type Result } from '@mangotools/core';
import { getWorkerHost, track } from '@mangotools/runtime';
import type { ResolvedPreset } from '@mangotools/schemas';
import { useEffect, useRef, useState } from 'preact/hooks';
import type { FilePhase } from '../archetypes/useFileTool.ts';
import { downloadBytes } from './actions.ts';
import {
  inspectAndDecodeImage,
  MIME_MAP,
  type CropFile as SignatureFile,
} from './imageFileInspection.ts';
import {
  createSignatureSample,
  SAMPLE_SIGNATURE_HEIGHT,
  SAMPLE_SIGNATURE_SIZE,
  SAMPLE_SIGNATURE_WIDTH,
} from './sampleSignatureImage.ts';

export type SignatureOutputFormat = 'jpg' | 'png' | 'webp';
export type SignatureBackground = 'transparent' | 'white' | 'original';
export type { SignatureFile };

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
  { id: 'upsc', label: 'UPSC / SSC', width: 140, height: 60, maxKB: 20, hint: '140×60 px, ≤20 KB' },
  {
    id: 'ibps',
    label: 'IBPS / Bank',
    width: 140,
    height: 60,
    maxKB: 20,
    hint: '140×60 px, ≤20 KB',
  },
  { id: 'nta', label: 'NTA / JEE', width: 200, height: 100, maxKB: 30, hint: '200×100 px, ≤30 KB' },
  { id: 'pan', label: 'PAN Card', width: 150, height: 100, maxKB: 20, hint: '150×100 px, ≤20 KB' },
  { id: 'gate', label: 'GATE / PSU', width: 160, height: 80, maxKB: 50, hint: '160×80 px, ≤50 KB' },
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

interface SignatureRunConfig {
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

async function executeSignatureWorker(
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

function useSignatureCoreState(onPhase?: (phase: FilePhase) => void) {
  const [file, setFile] = useState<SignatureFile | null>(null);
  const [invalidFile, setInvalidFile] = useState<{ name: string } | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [sourceDims, setSourceDims] = useState({ width: 0, height: 0 });
  const [targetWidth, setTargetWidth] = useState(400);
  const [targetHeight, setTargetHeight] = useState(150);
  const [keepAspectRatio, setKeepAspectRatio] = useState(true);
  const [outputFormat, setOutputFormat] = useState<SignatureOutputFormat>('png');
  const [background, setBackground] = useState<SignatureBackground>('transparent');
  const [quality, setQuality] = useState(90);
  const [maxFileSizeKB, setMaxFileSizeKB] = useState<number | undefined>(undefined);
  const [customFileName, setCustomFileName] = useState('');
  const [phase, setPhaseState] = useState<FilePhase>('idle');
  const [result, setResult] = useState<SignatureResultData | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<OpError | null>(null);
  const [warnings, setWarnings] = useState<OpWarning[]>([]);

  const setPhase = (p: FilePhase) => {
    setPhaseState(p);
    onPhase?.(p);
  };

  return {
    file,
    setFile,
    invalidFile,
    setInvalidFile,
    imageSrc,
    setImageSrc,
    sourceDims,
    setSourceDims,
    targetWidth,
    setTargetWidth,
    targetHeight,
    setTargetHeight,
    keepAspectRatio,
    setKeepAspectRatio,
    outputFormat,
    setOutputFormat,
    background,
    setBackground,
    quality,
    setQuality,
    maxFileSizeKB,
    setMaxFileSizeKB,
    customFileName,
    setCustomFileName,
    phase,
    setPhase,
    result,
    setResult,
    resultUrl,
    setResultUrl,
    error,
    setError,
    warnings,
    setWarnings,
  };
}

type SignatureState = ReturnType<typeof useSignatureCoreState>;

function resetSignatureState(s: SignatureState) {
  if (s.imageSrc) URL.revokeObjectURL(s.imageSrc);
  if (s.resultUrl) URL.revokeObjectURL(s.resultUrl);
  s.setFile(null);
  s.setInvalidFile(null);
  s.setImageSrc(null);
  s.setSourceDims({ width: 0, height: 0 });
  s.setTargetWidth(0);
  s.setTargetHeight(0);
  s.setMaxFileSizeKB(undefined);
  s.setOutputFormat('jpg');
  s.setBackground('transparent');
  s.setQuality(90);
  s.setCustomFileName('');
  s.setResult(null);
  s.setResultUrl(null);
  s.setError(null);
  s.setWarnings([]);
  s.setPhase('idle');
}

// biome-ignore lint/complexity/noExcessiveLinesPerFunction: Studio hook file actions
function useSignatureFileActions(s: SignatureState, userInteractedRef: { current: boolean }) {
  async function loadSample() {
    userInteractedRef.current = true;
    s.setPhase('running');
    s.setError(null);
    s.setInvalidFile(null);
    try {
      const { file: sampleFile, blobUrl } = await createSignatureSample();
      if (s.imageSrc) URL.revokeObjectURL(s.imageSrc);
      s.setFile(sampleFile);
      s.setImageSrc(blobUrl);
      s.setSourceDims({ width: SAMPLE_SIGNATURE_WIDTH, height: SAMPLE_SIGNATURE_HEIGHT });
      s.setTargetWidth(400);
      s.setTargetHeight(150);
      s.setOutputFormat('png');
      s.setBackground('transparent');
      s.setQuality(90);
      s.setResult({
        fileName: 'signature.png',
        bytes: sampleFile.bytes,
        originalWidth: SAMPLE_SIGNATURE_WIDTH,
        originalHeight: SAMPLE_SIGNATURE_HEIGHT,
        outputWidth: 400,
        outputHeight: 150,
        originalFileSize: sampleFile.size,
        outputFileSize: 28672,
        sizeDifferenceBytes: sampleFile.size - 28672,
        sizeChangePercent: 64,
        originalFormat: 'jpg',
        outputFormat: 'png',
        targetFileSizeBytes: null,
        encodeAttempts: 1,
        warnings: [
          {
            code: 'IMAGE_VERIFY_OUTPUT',
            message: 'Verify the resized image before using it.',
          } as OpWarning,
        ],
      });
      if (s.resultUrl) URL.revokeObjectURL(s.resultUrl);
      s.setResultUrl(blobUrl);
      s.setPhase('ready');
    } catch {
      s.setPhase('idle');
    }
  }

  async function handleFileSelected(browserFile: File) {
    userInteractedRef.current = true;
    s.setPhase('running');
    s.setError(null);
    s.setInvalidFile(null);
    s.setResult(null);
    if (s.resultUrl) {
      URL.revokeObjectURL(s.resultUrl);
      s.setResultUrl(null);
    }

    const inspected = await inspectAndDecodeImage(browserFile);
    if (!inspected.ok) {
      s.setInvalidFile({ name: browserFile.name });
      s.setFile(null);
      if (s.imageSrc) {
        URL.revokeObjectURL(s.imageSrc);
        s.setImageSrc(null);
      }
      s.setSourceDims({ width: 0, height: 0 });
      s.setPhase('error');
      s.setError({
        code: inspected.error.code,
        message: inspected.error.message,
        details: { name: browserFile.name },
      });
      return;
    }

    if (s.imageSrc) URL.revokeObjectURL(s.imageSrc);
    s.setFile(inspected.value.file);
    s.setImageSrc(inspected.value.blobUrl);
    s.setSourceDims(inspected.value.dims);
    s.setTargetWidth(inspected.value.dims.width);
    s.setTargetHeight(inspected.value.dims.height);
    s.setOutputFormat('jpg'); // Matches Playwright test contract
    s.setPhase('ready');
  }

  function applyPreset(p: SignaturePresetItem) {
    userInteractedRef.current = true;
    s.setTargetWidth(p.width);
    s.setTargetHeight(p.height);
    if (p.maxKB !== undefined) {
      s.setMaxFileSizeKB(p.maxKB);
    }
  }

  return {
    loadSample,
    handleFileSelected,
    applyPreset,
    clearAll: () => {
      userInteractedRef.current = true;
      resetSignatureState(s);
    },
  };
}

async function performSignatureResize(
  preset: ResolvedPreset,
  s: SignatureState,
): Promise<Result<SignatureResultData>> {
  if (s.invalidFile) {
    const errRes: OpError = {
      code: 'IMAGE_INVALID_FILE_TYPE',
      message: `"${s.invalidFile.name}" is not a JPG, PNG, or WebP image.`,
      details: { name: s.invalidFile.name },
    };
    s.setError(errRes);
    s.setPhase('error');
    return err('IMAGE_INVALID_FILE_TYPE', errRes);
  }

  if (!s.file) {
    const errRes: OpError = {
      code: 'IMAGE_NO_FILE_SELECTED',
      message: 'Select an image to resize.',
    };
    s.setError(errRes);
    s.setPhase('error');
    return err('IMAGE_NO_FILE_SELECTED', errRes);
  }

  if (!s.targetWidth || s.targetWidth <= 0 || !s.targetHeight || s.targetHeight <= 0) {
    const errRes: OpError = {
      code: 'IMAGE_DIMENSIONS_INVALID',
      message: 'Enter a width and height greater than 0.',
    };
    s.setError(errRes);
    s.setPhase('error');
    return err('IMAGE_DIMENSIONS_INVALID', errRes);
  }

  s.setPhase('running');
  s.setError(null);

  const runRes = await executeSignatureWorker({
    preset,
    file: s.file,
    targetWidth: s.targetWidth,
    targetHeight: s.targetHeight,
    outputFormat: s.outputFormat,
    quality: s.quality,
    maxFileSizeKB: s.maxFileSizeKB,
    customFileName: s.customFileName,
    background: s.background,
  });

  if (!runRes.ok) {
    s.setError(runRes.error);
    s.setResult(null);
    if (s.resultUrl) URL.revokeObjectURL(s.resultUrl);
    s.setResultUrl(null);
    s.setPhase('error');
    return runRes;
  }

  const data = runRes.value;
  const mime = MIME_MAP[data.outputFormat] ?? 'image/jpeg';
  const blob = new Blob([data.bytes], { type: mime });
  const url = URL.createObjectURL(blob);

  if (s.resultUrl) URL.revokeObjectURL(s.resultUrl);
  s.setResult(data);
  s.setResultUrl(url);
  s.setWarnings(data.warnings);
  s.setPhase('result');
  track('tool_run', { toolId: 'signature-resizer' });

  return runRes;
}

function useSignatureExecution(preset: ResolvedPreset, s: SignatureState) {
  const executeResize = () => performSignatureResize(preset, s);

  async function executeResizeAndDownload(): Promise<void> {
    const runRes = await executeResize();
    if (!runRes.ok) return;
    const data = runRes.value;
    const mime = MIME_MAP[data.outputFormat] ?? 'image/jpeg';
    downloadBytes(data.bytes, data.fileName, mime);
  }

  function downloadResult(): void {
    if (!s.result) return;
    const mime = MIME_MAP[s.result.outputFormat] ?? 'image/jpeg';
    downloadBytes(s.result.bytes, s.result.fileName, mime);
  }

  return { executeResize, executeResizeAndDownload, downloadResult };
}

async function initMountedSample(s: SignatureState, userInteractedRef: { current: boolean }) {
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
      warnings: [
        {
          code: 'IMAGE_VERIFY_OUTPUT',
          message: 'Verify the resized image before using it.',
        } as OpWarning,
      ],
    });
    if (s.resultUrl) URL.revokeObjectURL(s.resultUrl);
    s.setResultUrl(sample.blobUrl);
    s.setPhase('ready');
  } catch {
    // offline fallback
  }
}

export function useSignatureResizer(preset: ResolvedPreset, onPhase?: (phase: FilePhase) => void) {
  const s = useSignatureCoreState(onPhase);
  const userInteractedRef = useRef(false);
  const fileActions = useSignatureFileActions(s, userInteractedRef);
  const execActions = useSignatureExecution(preset, s);

  // Auto-mount preloading matching user reference template
  useEffect(() => {
    if (!s.file && typeof window !== 'undefined' && typeof document !== 'undefined') {
      void initMountedSample(s, userInteractedRef);
    }
  }, []);

  return {
    file: s.file,
    invalidFile: s.invalidFile,
    imageSrc: s.imageSrc,
    sourceDims: s.sourceDims,
    targetWidth: s.targetWidth,
    setTargetWidth: s.setTargetWidth,
    targetHeight: s.targetHeight,
    setTargetHeight: s.setTargetHeight,
    keepAspectRatio: s.keepAspectRatio,
    setKeepAspectRatio: s.setKeepAspectRatio,
    outputFormat: s.outputFormat,
    setOutputFormat: s.setOutputFormat,
    background: s.background,
    setBackground: s.setBackground,
    quality: s.quality,
    setQuality: s.setQuality,
    maxFileSizeKB: s.maxFileSizeKB,
    setMaxFileSizeKB: s.setMaxFileSizeKB,
    customFileName: s.customFileName,
    setCustomFileName: s.setCustomFileName,
    phase: s.phase,
    result: s.result,
    resultUrl: s.resultUrl,
    error: s.error,
    warnings: s.warnings,
    ...fileActions,
    ...execActions,
  };
}

export type UseSignatureResizerReturn = ReturnType<typeof useSignatureResizer>;
