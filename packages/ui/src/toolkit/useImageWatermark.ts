import type { OpError, OpWarning } from '@mangotools/core';
import { track } from '@mangotools/runtime';
import type { ResolvedPreset } from '@mangotools/schemas';
import { useEffect, useRef, useState } from 'preact/hooks';
import type { FilePhase } from '../archetypes/useFileTool.ts';
import { downloadBytes } from './actions.ts';
import {
  inspectAndDecodeImage,
  MIME_MAP,
  type CropFile as WatermarkFile,
} from './imageFileInspection.ts';
import {
  executeWatermarkWorker,
  type ImageWatermarkResultData,
  type WatermarkOutputFormat,
  type WatermarkPosition,
} from './imageWatermarkPipeline.ts';
import { createPalaceSample } from './samplePalaceImage.ts';

export type { ImageWatermarkResultData, WatermarkFile, WatermarkOutputFormat, WatermarkPosition };

const FORMAT_MIME_MAP: Record<string, string> = {
  ...MIME_MAP,
  pdf: 'application/pdf',
};

function useWatermarkState() {
  const [file, setFile] = useState<WatermarkFile | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [sourceDims, setSourceDims] = useState<{ width: number; height: number } | null>(null);
  const [text, setText] = useState<string>('MangoTools');
  const [position, setPosition] = useState<WatermarkPosition>('bottom-right');
  const [opacity, setOpacity] = useState<number>(50);
  const [fontSize, setFontSize] = useState<number>(32);
  const [color, setColor] = useState<string>('#ffffff');
  const [outputFormat, setOutputFormat] = useState<WatermarkOutputFormat>('same');
  const [quality, setQuality] = useState<number>(85);
  const [customFileName, setCustomFileName] = useState('');
  const [phase, setPhaseState] = useState<FilePhase>('idle');
  const [result, setResult] = useState<ImageWatermarkResultData | null>(null);
  const [error, setError] = useState<OpError | null>(null);
  const [warnings, setWarnings] = useState<OpWarning[]>([]);

  return {
    file,
    setFile,
    imageSrc,
    setImageSrc,
    sourceDims,
    setSourceDims,
    text,
    setText,
    position,
    setPosition,
    opacity,
    setOpacity,
    fontSize,
    setFontSize,
    color,
    setColor,
    outputFormat,
    setOutputFormat,
    quality,
    setQuality,
    customFileName,
    setCustomFileName,
    phase,
    setPhaseState,
    result,
    setResult,
    error,
    setError,
    warnings,
    setWarnings,
  };
}

type WState = ReturnType<typeof useWatermarkState>;

async function handleLoadFile(
  selected: File,
  s: WState,
  clearOutcome: () => void,
  setPhase: (p: FilePhase) => void,
  userInteractedRef?: { current: boolean },
) {
  if (userInteractedRef) userInteractedRef.current = true;
  clearOutcome();
  if (s.imageSrc) URL.revokeObjectURL(s.imageSrc);
  const res = await inspectAndDecodeImage(selected);
  if (!res.ok) {
    s.setFile(null);
    s.setImageSrc(null);
    s.setSourceDims(null);
    s.setError(res.error);
    setPhase('error');
    return;
  }
  s.setFile(res.value.file);
  s.setImageSrc(res.value.blobUrl);
  s.setSourceDims(res.value.dims);
  s.setError(null);
  setPhase('idle');
}

async function handleLoadPalaceSample(
  s: WState,
  clearOutcome: () => void,
  setPhase: (p: FilePhase) => void,
  userInteractedRef?: { current: boolean },
) {
  if (userInteractedRef?.current || s.file) return;
  const sample = await createPalaceSample();
  if (userInteractedRef?.current || s.file) return;
  clearOutcome();
  if (s.imageSrc) URL.revokeObjectURL(s.imageSrc);
  const fileObj = new File([sample.file.bytes as BlobPart], sample.file.name, {
    type: 'image/jpeg',
  });
  const res = await inspectAndDecodeImage(fileObj);
  if (!res.ok) {
    s.setError(res.error);
    setPhase('error');
    return;
  }
  if (userInteractedRef?.current || s.file) return;
  s.setFile(res.value.file);
  s.setImageSrc(res.value.blobUrl);
  s.setSourceDims(res.value.dims);
  s.setError(null);
  setPhase('idle');
}

async function handleRunWatermark(
  s: WState,
  preset: ResolvedPreset,
  clearOutcome: () => void,
  setPhase: (p: FilePhase) => void,
  notify: (msg: string) => void,
  runTokenRef: { current: number },
) {
  if (!s.file || !s.sourceDims) return null;
  if (!s.text.trim()) {
    s.setError({
      code: 'IMAGE_WATERMARK_TEXT_REQUIRED',
      messageKey: 'errors.IMAGE_WATERMARK_TEXT_REQUIRED',
    });
    setPhase('error');
    return null;
  }
  const token = ++runTokenRef.current;
  clearOutcome();
  setPhase('running');

  const res = await executeWatermarkWorker({
    preset,
    file: s.file,
    sourceDims: s.sourceDims,
    text: s.text.trim(),
    position: s.position,
    opacity: s.opacity,
    fontSize: s.fontSize,
    color: s.color,
    outputFormat: s.outputFormat,
    quality: s.quality,
    customFileName: s.customFileName,
  });

  if (token !== runTokenRef.current) return null;
  if (!res.ok) {
    s.setError(res.error);
    setPhase('error');
    notify(`Failed to apply watermark: ${res.error.code}`);
    return null;
  }

  s.setResult(res.value);
  s.setWarnings(res.warnings ?? []);
  setPhase('result');
  track('tool_run', { toolId: 'image-watermark' });
  return res.value;
}

function createWatermarkActions(
  s: WState,
  clearOutcome: () => void,
  setPhase: (p: FilePhase) => void,
  notify: (msg: string) => void,
  preset: ResolvedPreset,
  userInteractedRef: { current: boolean },
  runTokenRef: { current: number },
) {
  const clearAll = () => {
    userInteractedRef.current = true;
    if (s.imageSrc) URL.revokeObjectURL(s.imageSrc);
    s.setFile(null);
    s.setImageSrc(null);
    s.setSourceDims(null);
    s.setCustomFileName('');
    clearOutcome();
    setPhase('idle');
  };

  const applyWatermark = () =>
    handleRunWatermark(s, preset, clearOutcome, setPhase, notify, runTokenRef);

  const downloadResult = () => {
    if (!s.result) return;
    const mime = FORMAT_MIME_MAP[s.result.outputFormat] || 'application/octet-stream';
    downloadBytes(s.result.bytes, s.result.fileName, mime);
    notify(`Downloaded ${s.result.fileName}`);
    track('tool_complete', { toolId: 'image-watermark', method: 'download' });
  };

  const executeAndDownload = async () => {
    if (s.error) return;
    if (s.result && s.phase === 'result') {
      downloadResult();
      return;
    }
    const applied = await applyWatermark();
    if (applied) {
      const mime = FORMAT_MIME_MAP[applied.outputFormat] || 'application/octet-stream';
      downloadBytes(applied.bytes, applied.fileName, mime);
      notify(`Downloaded ${applied.fileName}`);
      track('tool_complete', { toolId: 'image-watermark', method: 'download' });
    }
  };

  return {
    clearAll,
    applyWatermark,
    downloadResult,
    executeAndDownload,
    loadFile: (f: File) => handleLoadFile(f, s, clearOutcome, setPhase, userInteractedRef),
    loadPalaceSample: () => handleLoadPalaceSample(s, clearOutcome, setPhase, userInteractedRef),
  };
}

function createWatermarkReturn(
  s: WState,
  actions: ReturnType<typeof createWatermarkActions>,
  clearOutcome: () => void,
) {
  return {
    file: s.file,
    imageSrc: s.imageSrc,
    sourceDims: s.sourceDims,
    text: s.text,
    setText: (t: string) => {
      s.setText(t);
      clearOutcome();
    },
    position: s.position,
    setPosition: (p: WatermarkPosition) => {
      s.setPosition(p);
      clearOutcome();
    },
    opacity: s.opacity,
    setOpacity: (o: number) => {
      s.setOpacity(o);
      clearOutcome();
    },
    fontSize: s.fontSize,
    setFontSize: (f: number) => {
      s.setFontSize(f);
      clearOutcome();
    },
    color: s.color,
    setColor: (c: string) => {
      s.setColor(c);
      clearOutcome();
    },
    outputFormat: s.outputFormat,
    setOutputFormat: (f: WatermarkOutputFormat) => {
      s.setOutputFormat(f);
      clearOutcome();
    },
    quality: s.quality,
    setQuality: (q: number) => {
      s.setQuality(q);
      clearOutcome();
    },
    customFileName: s.customFileName,
    setCustomFileName: (n: string) => s.setCustomFileName(n),
    phase: s.phase,
    result: s.result,
    error: s.error,
    warnings: s.warnings,
    ...actions,
  };
}

export function useImageWatermark(
  preset: ResolvedPreset,
  onPhase: (p: FilePhase) => void,
  notify: (msg: string) => void,
) {
  const s = useWatermarkState();
  const runTokenRef = useRef(0);
  const userInteractedRef = useRef(false);

  const setPhase = (p: FilePhase) => {
    s.setPhaseState(p);
    onPhase(p);
  };

  const clearOutcome = () => {
    s.setResult(null);
    s.setError(null);
    s.setWarnings([]);
  };

  useEffect(() => {
    if (!s.file && typeof window !== 'undefined' && typeof document !== 'undefined') {
      void handleLoadPalaceSample(s, clearOutcome, setPhase, userInteractedRef);
    }
  }, []);

  const actions = createWatermarkActions(
    s,
    clearOutcome,
    setPhase,
    notify,
    preset,
    userInteractedRef,
    runTokenRef,
  );

  return createWatermarkReturn(s, actions, clearOutcome);
}
