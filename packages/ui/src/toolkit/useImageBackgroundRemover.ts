import { err, type OpError, type OpWarning, ok, type Result } from '@mangotools/core';
import { getWorkerHost, track } from '@mangotools/runtime';
import type { ResolvedPreset } from '@mangotools/schemas';
import { useEffect, useRef, useState } from 'preact/hooks';
import type { FilePhase } from '../archetypes/useFileTool.ts';
import { downloadBytes } from './actions.ts';
import { type CropFile as BgFile, inspectAndDecodeImage, MIME_MAP } from './imageFileInspection.ts';
import { wrapImageBytesInPdf } from './imagePdfExport.ts';
import { createPalaceSample } from './samplePalaceImage.ts';

export type BgOutputFormat = 'png' | 'webp' | 'jpg' | 'pdf';
export type { BgFile };

const FORMAT_MIME_MAP: Record<string, string> = {
  ...MIME_MAP,
  pdf: 'application/pdf',
};

export interface ImageBackgroundRemoverResultData {
  fileName: string;
  bytes: Uint8Array;
  originalWidth: number;
  originalHeight: number;
  outputWidth: number;
  outputHeight: number;
  tolerance: number;
  feather: number;
  originalFileSize: number;
  outputFileSize: number;
  sizeDifferenceBytes: number;
  sizeChangePercent: number;
  originalFormat: string;
  outputFormat: string;
  warnings: OpWarning[];
}

interface BgRunConfig {
  preset: ResolvedPreset;
  file: BgFile;
  outputFormat: BgOutputFormat;
  quality: number;
  tolerance: number;
  feather: number;
  targetColor: string;
  replacementBackground: string;
  customFileName: string;
}

async function convertCutoutToPdf(
  cfg: BgRunConfig,
  result: ImageBackgroundRemoverResultData,
): Promise<Result<ImageBackgroundRemoverResultData>> {
  const wrapped = await wrapImageBytesInPdf(result.bytes, 'IMAGE_BACKGROUND_REMOVAL_FAILED');
  if (!wrapped.ok) return wrapped;

  const rawBase = cfg.customFileName.trim() || cfg.file.name.replace(/\.[^.]+$/, '');
  const cleanBase = rawBase.replace(/[^a-zA-Z0-9_\- ]/g, '').trim() || 'cutout';
  const fileName = `${cleanBase.replace(/-no-bg$/, '')}-no-bg.pdf`;

  return ok({
    fileName,
    bytes: wrapped.value.pdfBytes,
    originalWidth: result.originalWidth,
    originalHeight: result.originalHeight,
    outputWidth: result.outputWidth,
    outputHeight: result.outputHeight,
    tolerance: result.tolerance,
    feather: result.feather,
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

async function executeBgWorker(
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
  };

  if (isPdf) {
    return convertCutoutToPdf(cfg, rawResult);
  }

  return ok(rawResult, warnings);
}

function useBgState() {
  const [file, setFile] = useState<BgFile | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [sourceDims, setSourceDims] = useState({ width: 0, height: 0 });
  const [outputFormat, setOutputFormat] = useState<BgOutputFormat>('png');
  const [quality, setQuality] = useState<number>(90);
  const [tolerance, setTolerance] = useState<number>(20);
  const [feather, setFeather] = useState<number>(2);
  const [targetColor, setTargetColor] = useState<string>('auto');
  const [replacementBackground, setReplacementBackground] = useState<string>('transparent');
  const [customFileName, setCustomFileName] = useState<string>('');
  const [phase, setPhase] = useState<FilePhase>('idle');
  const [result, setResult] = useState<ImageBackgroundRemoverResultData | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<OpError | null>(null);

  return {
    file,
    setFile,
    imageSrc,
    setImageSrc,
    sourceDims,
    setSourceDims,
    outputFormat,
    setOutputFormat,
    quality,
    setQuality,
    tolerance,
    setTolerance,
    feather,
    setFeather,
    targetColor,
    setTargetColor,
    replacementBackground,
    setReplacementBackground,
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
  };
}

type BgState = ReturnType<typeof useBgState>;

async function handleLoad(
  rawFile: File,
  s: BgState,
  invalidate: () => void,
  notify: (msg: string) => void,
  onPhase?: (phase: FilePhase) => void,
  userInteractedRef?: { current: boolean },
) {
  if (userInteractedRef) userInteractedRef.current = true;
  invalidate();
  try {
    const res = await inspectAndDecodeImage(rawFile);
    if (!res.ok) {
      s.setFile({ name: rawFile.name, size: rawFile.size, bytes: new Uint8Array(0) });
      s.setError(res.error);
      s.setPhase('error');
      onPhase?.('error');
      notify(`Cannot open image: ${res.error.code}`);
      return;
    }
    if (s.imageSrc) URL.revokeObjectURL(s.imageSrc);
    s.setFile(res.value.file);
    s.setImageSrc(res.value.blobUrl);
    s.setSourceDims(res.value.dims);
    s.setCustomFileName('');
  } catch {
    notify('Failed to read image file');
  }
}

async function handleSample(
  s: BgState,
  invalidate: () => void,
  userInteractedRef?: { current: boolean },
  isAutoMount = false,
) {
  if (isAutoMount && (userInteractedRef?.current || s.file || s.error)) return;
  const sample = await createPalaceSample();
  if (isAutoMount && (userInteractedRef?.current || s.file || s.error)) return;
  const fileObj = new File([sample.file.bytes as BlobPart], sample.file.name, {
    type: 'image/jpeg',
  });
  const res = await inspectAndDecodeImage(fileObj);
  if (!res.ok) return;
  if (isAutoMount && (userInteractedRef?.current || s.file || s.error)) return;
  invalidate();
  if (s.imageSrc) URL.revokeObjectURL(s.imageSrc);
  s.setFile(res.value.file);
  s.setImageSrc(res.value.blobUrl);
  s.setSourceDims(res.value.dims);
  s.setCustomFileName('');
}

async function handleRun(
  s: BgState,
  preset: ResolvedPreset,
  _toolId: string,
  onPhase: (phase: FilePhase) => void,
  notify: (msg: string) => void,
): Promise<ImageBackgroundRemoverResultData | null> {
  if (!s.file) {
    if (s.error) return null;
    notify('Please select an image first');
    return null;
  }
  s.setPhase('running');
  onPhase('running');
  s.setError(null);

  const outcome = await executeBgWorker({
    preset,
    file: s.file,
    outputFormat: s.outputFormat,
    quality: s.quality,
    tolerance: s.tolerance,
    feather: s.feather,
    targetColor: s.targetColor,
    replacementBackground: s.replacementBackground,
    customFileName: s.customFileName,
  });

  if (!outcome.ok) {
    s.setError(outcome.error);
    s.setPhase('error');
    onPhase('error');
    notify(`Background removal failed: ${outcome.error.code}`);
    return null;
  }

  if (s.resultUrl) URL.revokeObjectURL(s.resultUrl);
  const safeBuffer = outcome.value.bytes.buffer.slice(
    outcome.value.bytes.byteOffset,
    outcome.value.bytes.byteOffset + outcome.value.bytes.byteLength,
  ) as ArrayBuffer;
  const mime = FORMAT_MIME_MAP[outcome.value.outputFormat] ?? 'image/png';
  s.setResultUrl(URL.createObjectURL(new Blob([safeBuffer], { type: mime })));
  s.setResult(outcome.value);
  s.setPhase('result');
  onPhase('result');
  notify('Background removed successfully');
  return outcome.value;
}

async function handleRunAndDownload(
  s: BgState,
  preset: ResolvedPreset,
  toolId: string,
  onPhase: (phase: FilePhase) => void,
  notify: (msg: string) => void,
) {
  if (s.error) return;
  if (s.result && s.phase === 'result') {
    downloadBytes(
      s.result.bytes,
      s.result.fileName,
      FORMAT_MIME_MAP[s.result.outputFormat] ?? 'image/png',
    );
    track('tool_complete', { toolId, method: 'download' });
    return;
  }
  const res = await handleRun(s, preset, toolId, onPhase, notify);
  if (!res) return;
  downloadBytes(res.bytes, res.fileName, FORMAT_MIME_MAP[res.outputFormat] ?? 'image/png');
  track('tool_complete', { toolId, method: 'download' });
}

function useBgActions(
  s: BgState,
  invalidate: () => void,
  preset: ResolvedPreset,
  toolId: string,
  onPhase: (phase: FilePhase) => void,
  notify: (msg: string) => void,
  userInteractedRef: { current: boolean },
) {
  const setWithInvalidate =
    <T>(setter: (v: T) => void) =>
    (val: T) => {
      invalidate();
      setter(val);
    };

  return {
    setOutputFormat: setWithInvalidate(s.setOutputFormat),
    setQuality: setWithInvalidate(s.setQuality),
    setTolerance: setWithInvalidate(s.setTolerance),
    setFeather: setWithInvalidate(s.setFeather),
    setTargetColor: setWithInvalidate(s.setTargetColor),
    setReplacementBackground: setWithInvalidate(s.setReplacementBackground),
    setCustomFileName: setWithInvalidate(s.setCustomFileName),
    loadFile: (f: File) => handleLoad(f, s, invalidate, notify, onPhase, userInteractedRef),
    loadSample: () => handleSample(s, invalidate, userInteractedRef, false),
    executeRemoveBackground: () => handleRun(s, preset, toolId, onPhase, notify),
    executeRemoveBackgroundAndDownload: () =>
      handleRunAndDownload(s, preset, toolId, onPhase, notify),
    downloadResult: () => {
      if (!s.result) return;
      downloadBytes(
        s.result.bytes,
        s.result.fileName,
        FORMAT_MIME_MAP[s.result.outputFormat] ?? 'image/png',
      );
      track('tool_complete', { toolId, method: 'download' });
    },
    reset: () => {
      invalidate();
      s.setOutputFormat('png');
      s.setTolerance(20);
      s.setFeather(2);
      s.setTargetColor('auto');
      s.setReplacementBackground('transparent');
      s.setCustomFileName('');
    },
  };
}

export function useImageBackgroundRemover(
  preset: ResolvedPreset,
  toolId: string,
  notify: (msg: string) => void,
  onPhase: (phase: FilePhase) => void,
) {
  const s = useBgState();
  const userInteractedRef = useRef(false);

  const invalidate = () => {
    if (s.result || s.phase !== 'idle') {
      s.setResult(null);
      s.setError(null);
      s.setPhase('idle');
      onPhase('idle');
      if (s.resultUrl) {
        URL.revokeObjectURL(s.resultUrl);
        s.setResultUrl(null);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (s.imageSrc) URL.revokeObjectURL(s.imageSrc);
      if (s.resultUrl) URL.revokeObjectURL(s.resultUrl);
    };
  }, []);

  useEffect(() => {
    if (!s.file && typeof window !== 'undefined' && typeof document !== 'undefined') {
      void handleSample(s, invalidate, userInteractedRef, true);
    }
  }, []);

  const actions = useBgActions(s, invalidate, preset, toolId, onPhase, notify, userInteractedRef);

  return {
    ...s,
    ...actions,
  };
}

export type UseImageBackgroundRemoverReturn = ReturnType<typeof useImageBackgroundRemover>;
