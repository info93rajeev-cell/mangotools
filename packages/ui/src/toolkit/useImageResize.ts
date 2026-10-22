import { err, type OpError, ok, type Result } from '@mangotools/core';
import { getWorkerHost, track } from '@mangotools/runtime';
import type { ResolvedPreset } from '@mangotools/schemas';
import { useEffect, useRef, useState } from 'preact/hooks';
import type { FilePhase } from '../archetypes/useFileTool.ts';
import { downloadBytes } from './actions.ts';
import {
  inspectAndDecodeImage,
  MIME_MAP,
  type CropFile as ResizeFile,
} from './imageFileInspection.ts';
import { wrapImageBytesInPdf } from './imagePdfExport.ts';
import { createPalaceSample } from './samplePalaceImage.ts';
export type ResizeOutputFormat = 'same' | 'jpg' | 'png' | 'webp' | 'pdf';
export type { ResizeFile };

const FORMAT_MIME_MAP: Record<string, string> = { ...MIME_MAP, pdf: 'application/pdf' };
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
interface ResizeRunConfig {
  preset: ResolvedPreset;
  file: ResizeFile;
  targetWidth: number;
  targetHeight: number;
  keepAspectRatio: boolean;
  outputFormat: ResizeOutputFormat;
  quality: number;
  customFileName: string;
}
async function convertResizedToPdf(
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
async function executeResizeWorker(cfg: ResizeRunConfig): Promise<Result<ImageResizeResultData>> {
  if (cfg.outputFormat === 'pdf') {
    const pngConfig: ResizeRunConfig = { ...cfg, outputFormat: 'png' };
    const outcome = await executeResizeWorker(pngConfig);
    if (!outcome.ok) return outcome;
    return convertResizedToPdf(cfg, outcome.value);
  }
  const input = {
    file: { name: cfg.file.name, bytes: cfg.file.bytes },
    targetWidth: Math.round(cfg.targetWidth),
    targetHeight: Math.round(cfg.targetHeight),
    keepAspectRatio: cfg.keepAspectRatio,
    outputFormat: cfg.outputFormat,
    quality: cfg.outputFormat === 'jpg' || cfg.outputFormat === 'webp' ? cfg.quality : undefined,
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
function useResizeState() {
  const [file, setFile] = useState<ResizeFile | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [sourceDims, setSourceDims] = useState({ width: 0, height: 0 });
  const [targetWidth, setTargetWidth] = useState(800);
  const [targetHeight, setTargetHeight] = useState(600);
  const [lockAspectRatio, setLockAspectRatio] = useState(true);
  const [scalePercent, setScalePercent] = useState(100);
  const [outputFormat, setOutputFormat] = useState<ResizeOutputFormat>('same');
  const [quality, setQuality] = useState(85);
  const [customFileName, setCustomFileName] = useState('');
  const [phase, setPhase] = useState<FilePhase>('idle');
  const [result, setResult] = useState<ImageResizeResultData | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<OpError | null>(null);
  return {
    file,
    setFile,
    imageSrc,
    setImageSrc,
    sourceDims,
    setSourceDims,
    targetWidth,
    setTargetWidth,
    targetHeight,
    setTargetHeight,
    lockAspectRatio,
    setLockAspectRatio,
    scalePercent,
    setScalePercent,
    outputFormat,
    setOutputFormat,
    quality,
    setQuality,
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
type ResizeState = ReturnType<typeof useResizeState>;
function applyLoadedImage(
  s: ResizeState,
  res: { file: ResizeFile; blobUrl: string; dims: { width: number; height: number } },
  scale = 1,
) {
  if (s.imageSrc) URL.revokeObjectURL(s.imageSrc);
  s.setFile(res.file);
  s.setImageSrc(res.blobUrl);
  s.setSourceDims(res.dims);
  s.setTargetWidth(Math.round(res.dims.width * scale));
  s.setTargetHeight(Math.round(res.dims.height * scale));
  s.setScalePercent(Math.round(scale * 100));
  s.setCustomFileName('');
}

async function handleLoad(
  rawFile: File,
  s: ResizeState,
  invalidate: () => void,
  notify: (msg: string) => void,
  userInteractedRef: { current: boolean },
) {
  userInteractedRef.current = true;
  invalidate();
  try {
    const res = await inspectAndDecodeImage(rawFile);
    if (!res.ok) {
      s.setError(res.error);
      s.setPhase('error');
      notify(`Cannot open image: ${res.error.code}`);
      return;
    }
    applyLoadedImage(s, res.value, 1);
  } catch {
    notify('Failed to read image file');
  }
}

async function handleSample(
  s: ResizeState,
  invalidate: () => void,
  userInteractedRef?: { current: boolean },
) {
  if (userInteractedRef?.current || (userInteractedRef && s.file)) return;
  const sample = await createPalaceSample();
  if (userInteractedRef?.current || (userInteractedRef && s.file)) return;
  const fileObj = new File([sample.file.bytes as BlobPart], sample.file.name, {
    type: 'image/jpeg',
  });
  const res = await inspectAndDecodeImage(fileObj);
  if (!res.ok) return;
  if (userInteractedRef?.current || (userInteractedRef && s.file)) {
    URL.revokeObjectURL(res.value.blobUrl);
    return;
  }
  invalidate();
  applyLoadedImage(s, res.value, 0.5);
}

async function handleRun(
  s: ResizeState,
  preset: ResolvedPreset,
  _toolId: string,
  onPhase: (phase: FilePhase) => void,
  notify: (msg: string) => void,
): Promise<ImageResizeResultData | null> {
  if (!s.file) {
    if (s.error) return null;
    notify('Please select an image first');
    return null;
  }
  if (
    s.targetWidth <= 0 ||
    s.targetHeight <= 0 ||
    Number.isNaN(s.targetWidth) ||
    Number.isNaN(s.targetHeight)
  ) {
    s.setError({ code: 'IMAGE_DIMENSIONS_INVALID', messageKey: 'errors.IMAGE_DIMENSIONS_INVALID' });
    s.setPhase('error');
    onPhase('error');
    return null;
  }
  s.setPhase('running');
  onPhase('running');
  s.setError(null);
  const outcome = await executeResizeWorker({
    preset,
    file: s.file,
    targetWidth: s.targetWidth,
    targetHeight: s.targetHeight,
    keepAspectRatio: s.lockAspectRatio,
    outputFormat: s.outputFormat,
    quality: s.quality,
    customFileName: s.customFileName,
  });
  if (!outcome.ok) {
    s.setError(outcome.error);
    s.setPhase('error');
    onPhase('error');
    notify(`Resize failed: ${outcome.error.code}`);
    return null;
  }
  if (s.resultUrl) URL.revokeObjectURL(s.resultUrl);
  const safeBuffer = outcome.value.bytes.buffer.slice(
    outcome.value.bytes.byteOffset,
    outcome.value.bytes.byteOffset + outcome.value.bytes.byteLength,
  ) as ArrayBuffer;
  const mime = FORMAT_MIME_MAP[outcome.value.outputFormat] ?? 'image/jpeg';
  s.setResultUrl(URL.createObjectURL(new Blob([safeBuffer], { type: mime })));
  s.setResult(outcome.value);
  s.setPhase('result');
  onPhase('result');
  notify(`Resized to ${outcome.value.outputWidth} × ${outcome.value.outputHeight} px`);
  return outcome.value;
}

async function handleRunAndDownload(
  s: ResizeState,
  preset: ResolvedPreset,
  toolId: string,
  onPhase: (phase: FilePhase) => void,
  notify: (msg: string) => void,
) {
  if (s.error) return;
  const res = await handleRun(s, preset, toolId, onPhase, notify);
  if (!res) return;
  downloadBytes(res.bytes, res.fileName, FORMAT_MIME_MAP[res.outputFormat] ?? 'image/jpeg');
  track('tool_complete', { toolId, method: 'download' });
}

function useResizeActions(
  s: ResizeState,
  invalidate: () => void,
  preset: ResolvedPreset,
  toolId: string,
  onPhase: (phase: FilePhase) => void,
  notify: (msg: string) => void,
  userInteractedRef: { current: boolean },
) {
  const withInvalidate =
    <T>(setter: (v: T) => void) =>
    (v: T) => {
      invalidate();
      setter(v);
    };

  return {
    setWidth: (w: number) => {
      invalidate();
      s.setTargetWidth(w);
      if (s.lockAspectRatio && s.sourceDims.width > 0 && w > 0) {
        s.setTargetHeight(Math.max(1, Math.round(w * (s.sourceDims.height / s.sourceDims.width))));
        s.setScalePercent(Math.round((w / s.sourceDims.width) * 100));
      }
    },
    setHeight: (h: number) => {
      invalidate();
      s.setTargetHeight(h);
      if (s.lockAspectRatio && s.sourceDims.height > 0 && h > 0) {
        s.setTargetWidth(Math.max(1, Math.round(h * (s.sourceDims.width / s.sourceDims.height))));
        s.setScalePercent(Math.round((h / s.sourceDims.height) * 100));
      }
    },
    setScalePercent: (pct: number) => {
      invalidate();
      s.setScalePercent(pct);
      if (s.sourceDims.width > 0 && s.sourceDims.height > 0) {
        s.setTargetWidth(Math.max(1, Math.round(s.sourceDims.width * (pct / 100))));
        s.setTargetHeight(Math.max(1, Math.round(s.sourceDims.height * (pct / 100))));
      }
    },
    toggleLock: () => s.setLockAspectRatio((l) => !l),
    setOutputFormat: withInvalidate(s.setOutputFormat),
    setQuality: withInvalidate(s.setQuality),
    setCustomFileName: withInvalidate(s.setCustomFileName),
    loadFile: (f: File) => handleLoad(f, s, invalidate, notify, userInteractedRef),
    loadSample: () => handleSample(s, invalidate),
    executeResize: () => handleRun(s, preset, toolId, onPhase, notify),
    executeResizeAndDownload: () => handleRunAndDownload(s, preset, toolId, onPhase, notify),
    downloadResult: () => {
      if (!s.result) return;
      downloadBytes(
        s.result.bytes,
        s.result.fileName,
        FORMAT_MIME_MAP[s.result.outputFormat] ?? 'image/jpeg',
      );
      track('tool_complete', { toolId, method: 'download' });
    },
    reset: () => {
      if (s.sourceDims.width > 0) {
        invalidate();
        s.setTargetWidth(s.sourceDims.width);
        s.setTargetHeight(s.sourceDims.height);
        s.setScalePercent(100);
        s.setLockAspectRatio(true);
      }
    },
  };
}

export function useImageResize(
  preset: ResolvedPreset,
  toolId: string,
  notify: (msg: string) => void,
  onPhase: (phase: FilePhase) => void,
) {
  const s = useResizeState();
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
      void handleSample(s, invalidate, userInteractedRef);
    }
  }, []);
  const actions = useResizeActions(
    s,
    invalidate,
    preset,
    toolId,
    onPhase,
    notify,
    userInteractedRef,
  );
  return {
    ...s,
    ...actions,
  };
}

export type UseImageResizeReturn = ReturnType<typeof useImageResize>;
