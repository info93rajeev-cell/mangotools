import { err, type OpError, ok, type Result } from '@mangotools/core';
import { getWorkerHost, track } from '@mangotools/runtime';
import type { ResolvedPreset } from '@mangotools/schemas';
import { useEffect, useRef, useState } from 'preact/hooks';
import type { FilePhase } from '../archetypes/useFileTool.ts';
import { downloadBytes } from './actions.ts';
import type { ImageCropResultData } from './ImageCropResult.tsx';
import {
  bytesToBlobUrl,
  type CropFile,
  inspectAndDecodeImage,
  MIME_MAP,
} from './imageFileInspection.ts';
import type { AspectRatioPreset, PixelRect } from './imageWorkbenchGeometry.ts';
import { applyAspectRatio, defaultSelectionRect } from './imageWorkbenchGeometry.ts';
import { createPalaceSample } from './samplePalaceImage.ts';

export type CropOutputFormat = 'same' | 'jpg' | 'png' | 'webp';
export type { CropFile };

function stripExt(name: string): string {
  return name.replace(/\.[a-z0-9]+$/i, '');
}

interface CropRunConfig {
  preset: ResolvedPreset;
  file: CropFile;
  dims: { width: number; height: number };
  rect: PixelRect;
  outputFormat: CropOutputFormat;
  resolvedFormat: 'jpg' | 'png' | 'webp';
  quality: number;
  customFileName: string;
}

async function executeCropWorker(cfg: CropRunConfig): Promise<Result<ImageCropResultData>> {
  const cx = Math.round(cfg.rect.x);
  const cy = Math.round(cfg.rect.y);
  const cw = Math.round(cfg.rect.width);
  const ch = Math.round(cfg.rect.height);
  const input = {
    file: { name: cfg.file.name, bytes: cfg.file.bytes },
    cropX: cx,
    cropY: cy,
    cropWidth: cw,
    cropHeight: ch,
    outputFormat: cfg.outputFormat,
    quality: cfg.resolvedFormat !== 'png' ? cfg.quality : undefined,
    outputFileName: cfg.customFileName.trim() ? cfg.customFileName.trim() : undefined,
  };
  const outcome = await getWorkerHost().run(cfg.preset.operation, input, cfg.preset.params);
  if (!outcome.ok) return err(outcome.error.code, outcome.error);
  const val = outcome.value as Record<string, unknown>;
  return ok({
    fileName: String(val.fileName),
    bytes: val.bytes as Uint8Array,
    originalWidth: Number(val.originalWidth),
    originalHeight: Number(val.originalHeight),
    cropX: Number(val.cropX),
    cropY: Number(val.cropY),
    cropWidth: Number(val.cropWidth),
    cropHeight: Number(val.cropHeight),
    outputWidth: Number(val.outputWidth),
    outputHeight: Number(val.outputHeight),
    originalFormat: val.originalFormat as 'jpg' | 'png' | 'webp',
    outputFormat: val.outputFormat as 'jpg' | 'png' | 'webp',
    outputFileSize: Number(val.outputFileSize),
    warnings: outcome.warnings ?? [],
  });
}

function useCropState() {
  const [file, setFile] = useState<CropFile | null>(null);
  const [sourceFormat, setSourceFormat] = useState<'jpg' | 'png' | 'webp' | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [sourceDims, setSourceDims] = useState({ width: 0, height: 0 });
  const [cropRect, setCropRectState] = useState<PixelRect>({ x: 0, y: 0, width: 100, height: 100 });
  const [ratio, setRatioState] = useState<AspectRatioPreset>('free');
  const [outputFormat, setOutputFormatState] = useState<CropOutputFormat>('same');
  const [quality, setQualityState] = useState<number>(85);
  const [customFileName, setCustomFileName] = useState('');
  const [phase, setPhaseState] = useState<FilePhase>('idle');
  const [result, setResult] = useState<ImageCropResultData | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<OpError | null>(null);
  return {
    file,
    setFile,
    sourceFormat,
    setSourceFormat,
    imageSrc,
    setImageSrc,
    sourceDims,
    setSourceDims,
    cropRect,
    setCropRectState,
    ratio,
    setRatioState,
    outputFormat,
    setOutputFormatState,
    quality,
    setQualityState,
    customFileName,
    setCustomFileName,
    phase,
    setPhaseState,
    result,
    setResult,
    resultUrl,
    setResultUrl,
    error,
    setError,
  };
}

type CropState = ReturnType<typeof useCropState>;

function updateCropNumeric(
  key: 'x' | 'y' | 'width' | 'height',
  val: number,
  state: CropState,
  clearOutcome: () => void,
) {
  if (Number.isNaN(val)) return;
  const rounded = Math.round(val);
  const next: PixelRect = { ...state.cropRect, [key]: rounded };
  state.setCropRectState(next);
  clearOutcome();
}

function downloadCropResult(
  item: ImageCropResultData,
  toolId: string,
  notify: (msg: string) => void,
) {
  downloadBytes(item.bytes, item.fileName, MIME_MAP[item.outputFormat] ?? 'image/jpeg');
  notify(`Downloaded ${item.fileName}`);
  track('tool_complete', { toolId, method: 'download' });
}

async function handleLoadFile(
  selected: File,
  s: CropState,
  clearOutcome: () => void,
  setPhase: (p: FilePhase) => void,
) {
  clearOutcome();
  if (s.imageSrc) URL.revokeObjectURL(s.imageSrc);
  const res = await inspectAndDecodeImage(selected);
  if (!res.ok) {
    s.setError(res.error);
    setPhase('error');
    return;
  }
  s.setSourceDims(res.value.dims);
  s.setFile(res.value.file);
  s.setSourceFormat(res.value.format);
  s.setImageSrc(res.value.blobUrl);
  s.setCropRectState(defaultSelectionRect(res.value.dims, 'free'));
  s.setRatioState('free');
  setPhase('idle');
}

async function handleLoadPalaceSample(
  s: CropState,
  clearOutcome: () => void,
  setPhase: (p: FilePhase) => void,
) {
  clearOutcome();
  if (s.imageSrc) URL.revokeObjectURL(s.imageSrc);
  const sample = await createPalaceSample();
  const fileObj = new File([sample.file.bytes as BlobPart], sample.file.name, {
    type: 'image/jpeg',
  });
  const res = await inspectAndDecodeImage(fileObj);
  if (!res.ok) {
    s.setError(res.error);
    setPhase('error');
    return;
  }
  const dims = res.value.dims;
  s.setSourceDims(dims);
  s.setFile(res.value.file);
  s.setSourceFormat('jpg');
  s.setImageSrc(res.value.blobUrl);
  const cropW = Math.min(dims.width, dims.height);
  const cropH = cropW;
  const cropX = Math.round((dims.width - cropW) / 2);
  const cropY = Math.round((dims.height - cropH) / 2);
  s.setCropRectState({ x: cropX, y: cropY, width: cropW, height: cropH });
  s.setRatioState('1:1');
  setPhase('idle');
}

async function handleRunCrop(
  s: CropState,
  cfg: {
    preset: ResolvedPreset;
    toolId: string;
    resolvedFormat: 'jpg' | 'png' | 'webp';
    setPhase: (p: FilePhase) => void;
    notify: (msg: string) => void;
    isCurrent: () => boolean;
  },
) {
  if (!s.file || s.sourceDims.width <= 0) return;
  cfg.setPhase('running');
  const out = await executeCropWorker({
    preset: cfg.preset,
    file: s.file,
    dims: s.sourceDims,
    rect: s.cropRect,
    outputFormat: s.outputFormat,
    resolvedFormat: cfg.resolvedFormat,
    quality: s.quality,
    customFileName: s.customFileName,
  });
  if (!cfg.isCurrent()) return;
  if (out.ok) {
    const mime = MIME_MAP[out.value.outputFormat] ?? 'image/jpeg';
    s.setResultUrl(bytesToBlobUrl(out.value.bytes, mime));
    s.setResult(out.value);
    s.setError(null);
    cfg.setPhase('result');
    track('tool_run', { toolId: cfg.toolId });
    downloadCropResult(out.value, cfg.toolId, cfg.notify);
  } else {
    s.setError(out.error);
    s.setResult(null);
    cfg.setPhase('error');
  }
}

function createCropActions(
  s: CropState,
  preset: ResolvedPreset,
  toolId: string,
  resolvedFormat: 'jpg' | 'png' | 'webp',
  runTokenRef: { current: number },
  clearOutcome: () => void,
  setPhase: (p: FilePhase) => void,
  notify: (msg: string) => void,
) {
  return {
    clearAll: () => {
      if (s.imageSrc) URL.revokeObjectURL(s.imageSrc);
      s.setImageSrc(null);
      s.setFile(null);
      s.setSourceDims({ width: 0, height: 0 });
      s.setCustomFileName('');
      clearOutcome();
    },
    loadPalaceSample: () => handleLoadPalaceSample(s, clearOutcome, setPhase),
    loadFile: (f: File) => handleLoadFile(f, s, clearOutcome, setPhase),
    setCropRect: (next: PixelRect) => {
      s.setCropRectState(next);
      clearOutcome();
    },
    setRatio: (next: AspectRatioPreset) => {
      s.setRatioState(next);
      if (s.sourceDims.width > 0 && s.sourceDims.height > 0) {
        s.setCropRectState(applyAspectRatio(s.cropRect, next, s.sourceDims));
      }
      clearOutcome();
    },
    setOutputFormat: (f: CropOutputFormat) => {
      s.setOutputFormatState(f);
      clearOutcome();
    },
    setQuality: (q: number) => {
      s.setQualityState(q);
      clearOutcome();
    },
    updateNumeric: (k: 'x' | 'y' | 'width' | 'height', v: number) =>
      updateCropNumeric(k, v, s, clearOutcome),
    runCrop: () => {
      const runToken = ++runTokenRef.current;
      void handleRunCrop(s, {
        preset,
        toolId,
        resolvedFormat,
        setPhase,
        notify,
        isCurrent: () => runTokenRef.current === runToken,
      });
    },
    downloadCurrentResult: () => s.result && downloadCropResult(s.result, toolId, notify),
  };
}

export function useImageCrop(
  preset: ResolvedPreset,
  toolId: string,
  notify: (msg: string) => void,
  onPhase: (phase: FilePhase) => void,
) {
  const s = useCropState();
  const runTokenRef = useRef(0);
  const setPhase = (p: FilePhase) => {
    s.setPhaseState(p);
    onPhase(p);
  };
  const clearOutcome = () => {
    runTokenRef.current++;
    s.setResult(null);
    if (s.resultUrl) URL.revokeObjectURL(s.resultUrl);
    s.setResultUrl(null);
    s.setError(null);
    setPhase('idle');
  };
  const resolvedFormat: 'jpg' | 'png' | 'webp' =
    s.outputFormat === 'same' ? (s.sourceFormat ?? 'jpg') : s.outputFormat;
  const suggestedFileName = s.file
    ? `${stripExt(s.customFileName.trim() || s.file.name)}-cropped.${resolvedFormat}`
    : `cropped-image.${resolvedFormat}`;

  useEffect(() => {
    return () => {
      if (s.imageSrc) URL.revokeObjectURL(s.imageSrc);
      if (s.resultUrl) URL.revokeObjectURL(s.resultUrl);
    };
  }, [s.imageSrc, s.resultUrl]);

  useEffect(() => {
    if (!s.file && typeof window !== 'undefined' && typeof document !== 'undefined') {
      void handleLoadPalaceSample(s, clearOutcome, setPhase);
    }
  }, []);

  const actions = createCropActions(
    s,
    preset,
    toolId,
    resolvedFormat,
    runTokenRef,
    clearOutcome,
    setPhase,
    notify,
  );

  return {
    ...s,
    resolvedFormat,
    suggestedFileName,
    ...actions,
  };
}
