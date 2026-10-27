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
import { createSignatureSample } from './sampleSignatureImage.ts';

export type SignatureOutputFormat = 'jpg' | 'png';
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
  contrastBoost?: boolean;
}

async function executeSignatureWorker(
  cfg: SignatureRunConfig,
): Promise<Result<SignatureResultData>> {
  const input = {
    file: { name: cfg.file.name, bytes: cfg.file.bytes },
    targetWidth: cfg.targetWidth,
    targetHeight: cfg.targetHeight,
    keepAspectRatio: true,
    padToTarget: true,
    outputFormat: cfg.outputFormat,
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

export function useSignatureResizer(preset: ResolvedPreset, onPhase?: (phase: FilePhase) => void) {
  const [file, setFile] = useState<SignatureFile | null>(null);
  const [invalidFile, setInvalidFile] = useState<{ name: string } | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [sourceDims, setSourceDims] = useState({ width: 0, height: 0 });
  const [targetWidth, setTargetWidth] = useState(140);
  const [targetHeight, setTargetHeight] = useState(60);
  const [outputFormat, setOutputFormat] = useState<SignatureOutputFormat>('jpg');
  const [quality, setQuality] = useState(90);
  const [maxFileSizeKB, setMaxFileSizeKB] = useState<number | undefined>(undefined);
  const [customFileName, setCustomFileName] = useState('');
  const [contrastBoost, setContrastBoost] = useState(false);
  const [phase, setPhaseState] = useState<FilePhase>('idle');
  const [result, setResult] = useState<SignatureResultData | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<OpError | null>(null);
  const [warnings, setWarnings] = useState<OpWarning[]>([]);

  const sampleLoadedRef = useRef(false);

  const setPhase = (p: FilePhase) => {
    setPhaseState(p);
    onPhase?.(p);
  };

  // Auto-load signature sample on mount if no file is present
  useEffect(() => {
    if (sampleLoadedRef.current || file) return;
    sampleLoadedRef.current = true;
    void loadSample();
  }, []);

  async function loadSample() {
    setPhase('running');
    setError(null);
    setInvalidFile(null);
    try {
      const { file: sampleFile, blobUrl } = await createSignatureSample();
      const dims = { width: 480, height: 180 };
      if (imageSrc) URL.revokeObjectURL(imageSrc);
      setFile(sampleFile);
      setImageSrc(blobUrl);
      setSourceDims(dims);
      setTargetWidth(dims.width);
      setTargetHeight(dims.height);
      setResult(null);
      if (resultUrl) URL.revokeObjectURL(resultUrl);
      setResultUrl(null);
      setPhase('ready');
    } catch {
      setPhase('idle');
    }
  }

  async function handleFileSelected(browserFile: File) {
    setPhase('running');
    setError(null);
    setInvalidFile(null);
    setResult(null);
    if (resultUrl) {
      URL.revokeObjectURL(resultUrl);
      setResultUrl(null);
    }

    const inspected = await inspectAndDecodeImage(browserFile);
    if (!inspected.ok) {
      setInvalidFile({ name: browserFile.name });
      setFile(null);
      if (imageSrc) {
        URL.revokeObjectURL(imageSrc);
        setImageSrc(null);
      }
      setSourceDims({ width: 0, height: 0 });
      setPhase('error');
      setError({
        code: inspected.error.code,
        message: inspected.error.message,
        details: { name: browserFile.name },
      });
      return;
    }

    if (imageSrc) URL.revokeObjectURL(imageSrc);
    setFile(inspected.value.file);
    setImageSrc(inspected.value.blobUrl);
    setSourceDims(inspected.value.dims);
    setTargetWidth(inspected.value.dims.width);
    setTargetHeight(inspected.value.dims.height);
    setPhase('ready');
  }

  function applyPreset(p: SignaturePresetItem) {
    setTargetWidth(p.width);
    setTargetHeight(p.height);
    if (p.maxKB !== undefined) {
      setMaxFileSizeKB(p.maxKB);
    }
  }

  function clearAll() {
    if (imageSrc) URL.revokeObjectURL(imageSrc);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setFile(null);
    setInvalidFile(null);
    setImageSrc(null);
    setSourceDims({ width: 0, height: 0 });
    setTargetWidth(0);
    setTargetHeight(0);
    setMaxFileSizeKB(undefined);
    setOutputFormat('jpg');
    setQuality(90);
    setCustomFileName('');
    setContrastBoost(false);
    setResult(null);
    setResultUrl(null);
    setError(null);
    setWarnings([]);
    setPhase('idle');
  }

  async function executeResize(): Promise<Result<SignatureResultData>> {
    if (invalidFile) {
      const errRes: OpError = {
        code: 'IMAGE_INVALID_FILE_TYPE',
        message: `"${invalidFile.name}" is not a JPG, PNG, or WebP image.`,
        details: { name: invalidFile.name },
      };
      setError(errRes);
      setPhase('error');
      return err('IMAGE_INVALID_FILE_TYPE', errRes);
    }

    if (!file) {
      const errRes: OpError = {
        code: 'IMAGE_NO_FILE_SELECTED',
        message: 'Select an image to resize.',
      };
      setError(errRes);
      setPhase('error');
      return err('IMAGE_NO_FILE_SELECTED', errRes);
    }

    if (!targetWidth || targetWidth <= 0 || !targetHeight || targetHeight <= 0) {
      const errRes: OpError = {
        code: 'IMAGE_DIMENSIONS_INVALID',
        message: 'Enter a width and height greater than 0.',
      };
      setError(errRes);
      setPhase('error');
      return err('IMAGE_DIMENSIONS_INVALID', errRes);
    }

    setPhase('running');
    setError(null);

    const runRes = await executeSignatureWorker({
      preset,
      file,
      targetWidth,
      targetHeight,
      outputFormat,
      quality,
      maxFileSizeKB,
      customFileName,
      contrastBoost,
    });

    if (!runRes.ok) {
      setError(runRes.error);
      setResult(null);
      if (resultUrl) URL.revokeObjectURL(resultUrl);
      setResultUrl(null);
      setPhase('error');
      return runRes;
    }

    const data = runRes.value;
    const blob = new Blob([data.bytes], {
      type: MIME_MAP[data.outputFormat] ?? 'image/jpeg',
    });
    const url = URL.createObjectURL(blob);

    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setResult(data);
    setResultUrl(url);
    setWarnings(data.warnings);
    setPhase('result');
    track('tool_run', { toolId: 'signature-resizer' });

    return runRes;
  }

  async function executeResizeAndDownload(): Promise<void> {
    const runRes = await executeResize();
    if (!runRes.ok) return;
    const data = runRes.value;
    const mime = MIME_MAP[data.outputFormat] ?? 'image/jpeg';
    downloadBytes(data.bytes, data.fileName, mime);
  }

  function downloadResult(): void {
    if (!result) return;
    const mime = MIME_MAP[result.outputFormat] ?? 'image/jpeg';
    downloadBytes(result.bytes, result.fileName, mime);
  }

  return {
    file,
    invalidFile,
    imageSrc,
    sourceDims,
    targetWidth,
    setTargetWidth,
    targetHeight,
    setTargetHeight,
    outputFormat,
    setOutputFormat,
    quality,
    setQuality,
    maxFileSizeKB,
    setMaxFileSizeKB,
    customFileName,
    setCustomFileName,
    contrastBoost,
    setContrastBoost,
    phase,
    result,
    resultUrl,
    error,
    warnings,
    loadSample,
    handleFileSelected,
    applyPreset,
    clearAll,
    executeResize,
    executeResizeAndDownload,
    downloadResult,
  };
}

export type UseSignatureResizerReturn = ReturnType<typeof useSignatureResizer>;
