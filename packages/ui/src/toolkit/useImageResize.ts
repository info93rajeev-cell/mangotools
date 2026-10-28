import type { OpError } from '@mangotools/core';
import { track } from '@mangotools/runtime';
import type { ResolvedPreset } from '@mangotools/schemas';
import { useEffect, useRef, useState } from 'preact/hooks';
import type { FilePhase } from '../archetypes/useFileTool.ts';
import { downloadBytes } from './actions.ts';
import { inspectAndDecodeImage, type CropFile as ResizeFile } from './imageFileInspection.ts';
import {
  type ResizeFile as ExportedResizeFile,
  executeResizeWorker,
  FORMAT_MIME_MAP,
  type ImageResizeResultData,
  type ResizeOutputFormat,
} from './imageResizeWorkerService.ts';
import { createPalaceSample } from './samplePalaceImage.ts';

export type { ExportedResizeFile as ResizeFile, ImageResizeResultData, ResizeOutputFormat };

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
  const maxOutputPixels = 80_000_000;
  const currentPixels = res.dims.width * res.dims.height;
  let effectiveScale = scale;
  if (currentPixels > maxOutputPixels && currentPixels > 0) {
    const autoScale = Math.sqrt(maxOutputPixels / currentPixels);
    effectiveScale = Math.min(scale, autoScale);
  }
  s.setTargetWidth(Math.round(res.dims.width * effectiveScale));
  s.setTargetHeight(Math.round(res.dims.height * effectiveScale));
  s.setScalePercent(Math.round(effectiveScale * 100));
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
