import type { OpError } from '@mangotools/core';
import { track } from '@mangotools/runtime';
import type { ResolvedPreset } from '@mangotools/schemas';
import { useEffect, useRef, useState } from 'preact/hooks';
import type { FilePhase } from '../archetypes/useFileTool.ts';
import { downloadBytes } from './actions.ts';
import { inspectAndDecodeImage, type CropFile as PhotoFile } from './imageFileInspection.ts';
import {
  type PhotoFile as ExportedPhotoFile,
  executePhotoSizeWorker,
  FORMAT_MIME_MAP,
  type PhotoSizeOutputFormat,
  type PhotoSizeResultData,
} from './photoSizeWorkerService.ts';
import { createPalaceSample } from './samplePalaceImage.ts';

export type { ExportedPhotoFile as PhotoFile, PhotoSizeOutputFormat, PhotoSizeResultData };

function usePhotoSizeState() {
  const [file, setFile] = useState<PhotoFile | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [sourceDims, setSourceDims] = useState({ width: 0, height: 0 });
  const [targetWidth, setTargetWidth] = useState(0);
  const [targetHeight, setTargetHeight] = useState(0);
  const [maxFileSizeKB, setMaxFileSizeKB] = useState<number | undefined>(100);
  const [allowDimensionReduction, setAllowDimensionReduction] = useState(false);
  const [outputFormat, setOutputFormat] = useState<PhotoSizeOutputFormat>('jpg');
  const [quality, setQuality] = useState(90);
  const [customFileName, setCustomFileName] = useState('');
  const [phase, setPhase] = useState<FilePhase>('idle');
  const [result, setResult] = useState<PhotoSizeResultData | null>(null);
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
    maxFileSizeKB,
    setMaxFileSizeKB,
    allowDimensionReduction,
    setAllowDimensionReduction,
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

type PhotoSizeState = ReturnType<typeof usePhotoSizeState>;

function applyLoadedImage(
  s: PhotoSizeState,
  res: { file: PhotoFile; blobUrl: string; dims: { width: number; height: number } },
) {
  if (s.imageSrc) URL.revokeObjectURL(s.imageSrc);
  s.setFile(res.file);
  s.setImageSrc(res.blobUrl);
  s.setSourceDims(res.dims);
  s.setTargetWidth(res.dims.width);
  s.setTargetHeight(res.dims.height);
  s.setCustomFileName('');
}

async function handleLoad(
  rawFile: File,
  s: PhotoSizeState,
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
    applyLoadedImage(s, res.value);
  } catch {
    notify('Failed to read image file');
  }
}

async function handleSample(
  s: PhotoSizeState,
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
  applyLoadedImage(s, res.value);
}

async function handleRun(
  s: PhotoSizeState,
  preset: ResolvedPreset,
  _toolId: string,
  onPhase: (phase: FilePhase) => void,
  notify: (msg: string) => void,
): Promise<PhotoSizeResultData | null> {
  if (!s.file) {
    s.setError({
      code: 'INVALID_INPUT',
      messageKey: 'INVALID_INPUT',
      details: { message: 'Please select a photo first' },
    });
    s.setPhase('error');
    onPhase('error');
    notify('Please select a photo first');
    return null;
  }

  if (
    s.maxFileSizeKB === undefined ||
    s.maxFileSizeKB === null ||
    s.maxFileSizeKB <= 0 ||
    Number.isNaN(s.maxFileSizeKB)
  ) {
    s.setError({
      code: 'INVALID_INPUT',
      messageKey: 'INVALID_INPUT',
      details: { path: 'maxFileSizeKB' },
    });
    s.setPhase('error');
    onPhase('error');
    notify('Maximum file size is required');
    return null;
  }

  s.setPhase('running');
  onPhase('running');
  s.setError(null);

  const outcome = await executePhotoSizeWorker({
    preset,
    file: s.file,
    maxFileSizeKB: s.maxFileSizeKB,
    targetWidth: s.targetWidth > 0 ? s.targetWidth : s.sourceDims.width,
    targetHeight: s.targetHeight > 0 ? s.targetHeight : s.sourceDims.height,
    allowDimensionReduction: s.allowDimensionReduction,
    outputFormat: s.outputFormat,
    quality: s.quality,
    customFileName: s.customFileName,
  });

  if (!outcome.ok) {
    s.setError(outcome.error);
    s.setPhase('error');
    onPhase('error');
    if (outcome.error.code === 'IMAGE_SIZE_TARGET_UNREACHABLE') {
      notify(
        'Size limit unreachable. Try enabling "Allow smaller dimensions" or increase KB limit.',
      );
    } else {
      notify(`Reduction failed: ${outcome.error.code}`);
    }
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
  notify(`Reduced to ${Math.round(outcome.value.outputFileSize / 1000)} KB`);
  return outcome.value;
}

async function handleRunAndDownload(
  s: PhotoSizeState,
  preset: ResolvedPreset,
  toolId: string,
  onPhase: (phase: FilePhase) => void,
  notify: (msg: string) => void,
) {
  const res = await handleRun(s, preset, toolId, onPhase, notify);
  if (!res) return;
  downloadBytes(res.bytes, res.fileName, FORMAT_MIME_MAP[res.outputFormat] ?? 'image/jpeg');
  track('tool_complete', { toolId, method: 'download' });
}

function usePhotoSizeActions(
  s: PhotoSizeState,
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
    setTargetWidth: withInvalidate(s.setTargetWidth),
    setTargetHeight: withInvalidate(s.setTargetHeight),
    setMaxFileSizeKB: withInvalidate(s.setMaxFileSizeKB),
    setAllowDimensionReduction: withInvalidate(s.setAllowDimensionReduction),
    toggleAllowDimensionReduction: () => {
      invalidate();
      s.setAllowDimensionReduction((prev) => !prev);
    },
    setQuality: withInvalidate(s.setQuality),
    setOutputFormat: withInvalidate(s.setOutputFormat),
    setCustomFileName: withInvalidate(s.setCustomFileName),
    loadFile: (f: File) => handleLoad(f, s, invalidate, notify, userInteractedRef),
    loadSample: () => handleSample(s, invalidate),
    executeReduce: () => handleRun(s, preset, toolId, onPhase, notify),
    executeReduceAndDownload: () => handleRunAndDownload(s, preset, toolId, onPhase, notify),
    downloadResult: () => {
      if (!s.result) return;
      downloadBytes(
        s.result.bytes,
        s.result.fileName,
        FORMAT_MIME_MAP[s.result.outputFormat] ?? 'image/jpeg',
      );
      track('tool_complete', { toolId, method: 'download' });
    },
    clearAll: () => {
      invalidate();
      if (s.imageSrc) {
        URL.revokeObjectURL(s.imageSrc);
        s.setImageSrc(null);
      }
      s.setFile(null);
      s.setSourceDims({ width: 0, height: 0 });
      s.setTargetWidth(0);
      s.setTargetHeight(0);
      s.setMaxFileSizeKB(100);
      s.setAllowDimensionReduction(false);
      s.setOutputFormat('jpg');
      s.setQuality(90);
      s.setCustomFileName('');
      s.setError(null);
      s.setPhase('idle');
      onPhase('idle');
      userInteractedRef.current = true;
    },
    reset: () => {
      invalidate();
      s.setMaxFileSizeKB(100);
      s.setAllowDimensionReduction(false);
      s.setQuality(90);
      s.setOutputFormat('jpg');
      s.setCustomFileName('');
      if (s.sourceDims.width > 0) {
        s.setTargetWidth(s.sourceDims.width);
        s.setTargetHeight(s.sourceDims.height);
      }
    },
  };
}

export function usePhotoSizeReducer(
  preset: ResolvedPreset,
  toolId: string,
  notify: (msg: string) => void,
  onPhase: (phase: FilePhase) => void,
) {
  const s = usePhotoSizeState();
  const userInteractedRef = useRef(false);

  const invalidate = () => {
    if (s.result || s.phase !== 'idle' || s.error) {
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

  // Pre-load Jaipur Palace sample image on mount so the window is NEVER blank!
  useEffect(() => {
    if (!s.file && typeof window !== 'undefined' && typeof document !== 'undefined') {
      void handleSample(s, invalidate, userInteractedRef);
    }
  }, []);

  const actions = usePhotoSizeActions(
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

export type UsePhotoSizeReducerReturn = ReturnType<typeof usePhotoSizeReducer>;
