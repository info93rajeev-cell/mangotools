import type { OpError } from '@mangotools/core';
import { track } from '@mangotools/runtime';
import type { ResolvedPreset } from '@mangotools/schemas';
import { useEffect, useRef, useState } from 'preact/hooks';
import type { FilePhase } from '../archetypes/useFileTool.ts';
import { downloadBytes } from './actions.ts';
import { resolveImageErrorMessage } from './imageErrorPresentation.ts';
import {
  type CropFile as ConvertFile,
  inspectAndDecodeImage,
  MIME_MAP,
} from './imageFileInspection.ts';
import {
  executeConvertWorker,
  type ImageFormatConverterResultData,
} from './imageFormatConverterWorker.ts';
import { createPalaceSample } from './samplePalaceImage.ts';

export type TargetImageFormat = 'jpg' | 'png' | 'webp' | 'pdf';
export type { ConvertFile, ImageFormatConverterResultData };

const FORMAT_MIME_MAP: Record<string, string> = { ...MIME_MAP, pdf: 'application/pdf' };

function useConvertState() {
  const [file, setFile] = useState<ConvertFile | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [sourceFormat, setSourceFormat] = useState<TargetImageFormat | null>(null);
  const [sourceDims, setSourceDims] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });
  const [targetFormat, setTargetFormat] = useState<TargetImageFormat>('png');
  const [quality, setQuality] = useState<number>(85);
  const [customFileName, setCustomFileName] = useState<string>('');
  const [phase, setPhase] = useState<FilePhase>('idle');
  const [result, setResult] = useState<ImageFormatConverterResultData | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<OpError | null>(null);

  return {
    file,
    setFile,
    imageSrc,
    setImageSrc,
    sourceFormat,
    setSourceFormat,
    sourceDims,
    setSourceDims,
    targetFormat,
    setTargetFormat,
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

type ConvertState = ReturnType<typeof useConvertState>;

async function handleLoad(
  rawFile: File,
  s: ConvertState,
  invalidate: () => void,
  notify: (msg: string) => void,
  userInteractedRef: { current: boolean },
) {
  userInteractedRef.current = true;
  invalidate();
  try {
    const res = await inspectAndDecodeImage(rawFile);
    if (!res.ok) {
      if (s.imageSrc) {
        URL.revokeObjectURL(s.imageSrc);
        s.setImageSrc(null);
      }
      s.setFile(null);
      s.setSourceDims({ width: 0, height: 0 });
      s.setSourceFormat(null);
      s.setError(res.error);
      s.setPhase('error');
      notify(resolveImageErrorMessage(res.error, rawFile.name));
      return;
    }
    if (s.imageSrc) URL.revokeObjectURL(s.imageSrc);
    s.setFile(res.value.file);
    s.setImageSrc(res.value.blobUrl);
    s.setSourceFormat(res.value.format);
    s.setSourceDims(res.value.dims);
    s.setCustomFileName('');
  } catch {
    if (s.imageSrc) {
      URL.revokeObjectURL(s.imageSrc);
      s.setImageSrc(null);
    }
    s.setFile(null);
    s.setSourceDims({ width: 0, height: 0 });
    s.setSourceFormat(null);
    s.setPhase('error');
    notify(resolveImageErrorMessage({ code: 'IMAGE_UNREADABLE' }, rawFile.name));
  }
}

async function handleSample(
  s: ConvertState,
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
  if (s.imageSrc) URL.revokeObjectURL(s.imageSrc);
  s.setFile(res.value.file);
  s.setImageSrc(res.value.blobUrl);
  s.setSourceFormat(res.value.format);
  s.setSourceDims(res.value.dims);
  s.setCustomFileName('');
}

async function handleRun(
  s: ConvertState,
  preset: ResolvedPreset,
  _toolId: string,
  onPhase: (phase: FilePhase) => void,
  notify: (msg: string) => void,
): Promise<ImageFormatConverterResultData | null> {
  if (!s.file) {
    if (s.error) return null;
    notify('Please select an image first');
    return null;
  }
  s.setPhase('running');
  onPhase('running');
  s.setError(null);
  const outcome = await executeConvertWorker({
    preset,
    file: s.file,
    sourceDims: s.sourceDims,
    targetFormat: s.targetFormat,
    quality: s.quality,
    customFileName: s.customFileName,
  });
  if (!outcome.ok) {
    s.setError(outcome.error);
    s.setPhase('error');
    onPhase('error');
    notify(resolveImageErrorMessage(outcome.error, s.file?.name));
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
  notify(`Converted to ${outcome.value.outputFormat.toUpperCase()}`);
  return outcome.value;
}

async function handleRunAndDownload(
  s: ConvertState,
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

function useConvertActions(
  s: ConvertState,
  invalidate: () => void,
  preset: ResolvedPreset,
  toolId: string,
  onPhase: (phase: FilePhase) => void,
  notify: (msg: string) => void,
  userInteractedRef: { current: boolean },
) {
  return {
    setTargetFormat: (fmt: TargetImageFormat) => {
      invalidate();
      s.setTargetFormat(fmt);
    },
    setQuality: (q: number) => {
      invalidate();
      s.setQuality(q);
    },
    setCustomFileName: (name: string) => {
      invalidate();
      s.setCustomFileName(name);
    },
    loadFile: (f: File) => handleLoad(f, s, invalidate, notify, userInteractedRef),
    loadSample: () => handleSample(s, invalidate),
    executeConvert: () => handleRun(s, preset, toolId, onPhase, notify),
    executeConvertAndDownload: () => handleRunAndDownload(s, preset, toolId, onPhase, notify),
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
      s.setTargetFormat('png');
      s.setQuality(85);
      s.setCustomFileName('');
    },
  };
}

export function useImageFormatConverter(
  preset: ResolvedPreset,
  toolId: string,
  notify: (msg: string) => void,
  onPhase: (phase: FilePhase) => void,
) {
  const s = useConvertState();
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

  const actions = useConvertActions(
    s,
    invalidate,
    preset,
    toolId,
    onPhase,
    notify,
    userInteractedRef,
  );

  return {
    file: s.file,
    imageSrc: s.imageSrc,
    sourceFormat: s.sourceFormat,
    sourceDims: s.sourceDims,
    targetFormat: s.targetFormat,
    quality: s.quality,
    customFileName: s.customFileName,
    phase: s.phase,
    result: s.result,
    resultUrl: s.resultUrl,
    error: s.error,
    ...actions,
  };
}

export type UseImageFormatConverterReturn = ReturnType<typeof useImageFormatConverter>;
