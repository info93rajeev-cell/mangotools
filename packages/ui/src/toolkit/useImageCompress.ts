import type { OpError } from '@mangotools/core';
import { track } from '@mangotools/runtime';
import type { ResolvedPreset } from '@mangotools/schemas';
import { useEffect, useRef, useState } from 'preact/hooks';
import type { FilePhase } from '../archetypes/useFileTool.ts';
import { downloadBytes } from './actions.ts';
import {
  type CompressOutputFormat,
  executeCompressWorker,
  type ImageCompressResultData,
} from './imageCompressWorker.ts';
import { resolveImageErrorMessage } from './imageErrorPresentation.ts';
import {
  type CropFile as CompressFile,
  inspectAndDecodeImage,
  MIME_MAP,
} from './imageFileInspection.ts';
import { createPalaceSample } from './samplePalaceImage.ts';

export type { CompressFile, CompressOutputFormat, ImageCompressResultData };

const FORMAT_MIME_MAP: Record<string, string> = { ...MIME_MAP, pdf: 'application/pdf' };

function useCompressState() {
  const [file, setFile] = useState<CompressFile | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [sourceDims, setSourceDims] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });
  const [outputFormat, setOutputFormat] = useState<CompressOutputFormat>('same');
  const [quality, setQuality] = useState<number>(80);
  const [maxFileSizeKB, setMaxFileSizeKB] = useState<number | null>(null);
  const [customFileName, setCustomFileName] = useState<string>('');
  const [phase, setPhase] = useState<FilePhase>('idle');
  const [result, setResult] = useState<ImageCompressResultData | null>(null);
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
  };
}

type CompressState = ReturnType<typeof useCompressState>;

async function handleLoad(
  rawFile: File,
  s: CompressState,
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
      if (s.imageSrc) URL.revokeObjectURL(s.imageSrc);
      s.setImageSrc(null);
      s.setFile(null);
      s.setSourceDims({ width: 0, height: 0 });
      s.setResult(null);
      if (s.resultUrl) URL.revokeObjectURL(s.resultUrl);
      s.setResultUrl(null);
      s.setError(res.error);
      s.setPhase('error');
      onPhase?.('error');
      notify(resolveImageErrorMessage(res.error, rawFile.name));
      return;
    }
    if (s.imageSrc) URL.revokeObjectURL(s.imageSrc);
    s.setFile(res.value.file);
    s.setImageSrc(res.value.blobUrl);
    s.setSourceDims(res.value.dims);
    s.setCustomFileName('');
  } catch (err) {
    if (s.imageSrc) URL.revokeObjectURL(s.imageSrc);
    s.setImageSrc(null);
    s.setFile(null);
    s.setSourceDims({ width: 0, height: 0 });
    s.setResult(null);
    if (s.resultUrl) URL.revokeObjectURL(s.resultUrl);
    s.setResultUrl(null);
    s.setError({ code: 'IMAGE_UNREADABLE', messageKey: 'IMAGE_UNREADABLE' });
    s.setPhase('error');
    onPhase?.('error');
    notify(resolveImageErrorMessage(err, rawFile.name));
  }
}

async function handleSample(
  s: CompressState,
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
  s: CompressState,
  preset: ResolvedPreset,
  _toolId: string,
  onPhase: (phase: FilePhase) => void,
  notify: (msg: string) => void,
): Promise<ImageCompressResultData | null> {
  if (!s.file) {
    if (s.error) return null;
    notify('Please select an image first');
    return null;
  }
  s.setPhase('running');
  onPhase('running');
  s.setError(null);

  const outcome = await executeCompressWorker({
    preset,
    file: s.file,
    outputFormat: s.outputFormat,
    quality: s.quality,
    maxFileSizeKB: s.maxFileSizeKB ?? undefined,
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
  const mime = FORMAT_MIME_MAP[outcome.value.outputFormat] ?? 'image/jpeg';
  s.setResultUrl(URL.createObjectURL(new Blob([safeBuffer], { type: mime })));
  s.setResult(outcome.value);
  s.setPhase('result');
  onPhase('result');
  notify(`Compressed by ${outcome.value.sizeChangePercent}%`);
  return outcome.value;
}

async function handleRunAndDownload(
  s: CompressState,
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
      FORMAT_MIME_MAP[s.result.outputFormat] ?? 'image/jpeg',
    );
    track('tool_complete', { toolId, method: 'download' });
    return;
  }
  const res = await handleRun(s, preset, toolId, onPhase, notify);
  if (!res) return;
  downloadBytes(res.bytes, res.fileName, FORMAT_MIME_MAP[res.outputFormat] ?? 'image/jpeg');
  track('tool_complete', { toolId, method: 'download' });
}

function useCompressActions(
  s: CompressState,
  invalidate: () => void,
  preset: ResolvedPreset,
  toolId: string,
  onPhase: (phase: FilePhase) => void,
  notify: (msg: string) => void,
  userInteractedRef: { current: boolean },
) {
  return {
    setOutputFormat: (fmt: CompressOutputFormat) => {
      invalidate();
      s.setOutputFormat(fmt);
    },
    setQuality: (q: number) => {
      invalidate();
      s.setQuality(q);
    },
    setMaxFileSizeKB: (kb: number | null) => {
      invalidate();
      s.setMaxFileSizeKB(kb);
    },
    setCustomFileName: (name: string) => {
      invalidate();
      s.setCustomFileName(name);
    },
    loadFile: (f: File) => handleLoad(f, s, invalidate, notify, onPhase, userInteractedRef),
    loadSample: () => handleSample(s, invalidate, userInteractedRef, false),
    executeCompress: () => handleRun(s, preset, toolId, onPhase, notify),
    executeCompressAndDownload: () => handleRunAndDownload(s, preset, toolId, onPhase, notify),
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
      invalidate();
      s.setOutputFormat('same');
      s.setQuality(80);
      s.setMaxFileSizeKB(null);
      s.setCustomFileName('');
    },
  };
}

export function useImageCompress(
  preset: ResolvedPreset,
  toolId: string,
  notify: (msg: string) => void,
  onPhase: (phase: FilePhase) => void,
) {
  const s = useCompressState();
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

  const actions = useCompressActions(
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

export type UseImageCompressReturn = ReturnType<typeof useImageCompress>;
