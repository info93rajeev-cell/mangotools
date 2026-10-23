import { err, type OpError, type OpWarning, ok, type Result } from '@mangotools/core';
import { getWorkerHost, track } from '@mangotools/runtime';
import type { ResolvedPreset } from '@mangotools/schemas';
import { useEffect, useRef, useState } from 'preact/hooks';
import type { FilePhase } from '../archetypes/useFileTool.ts';
import { downloadBytes } from './actions.ts';
import {
  type CropFile as ConvertFile,
  inspectAndDecodeImage,
  MIME_MAP,
} from './imageFileInspection.ts';
import { wrapImageBytesInPdf } from './imagePdfExport.ts';
import { createPalaceSample } from './samplePalaceImage.ts';

export type TargetImageFormat = 'jpg' | 'png' | 'webp' | 'pdf';
export type { ConvertFile };

const FORMAT_MIME_MAP: Record<string, string> = { ...MIME_MAP, pdf: 'application/pdf' };

export interface ImageFormatConverterResultData {
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
  warnings: OpWarning[];
}

interface ConvertRunConfig {
  preset: ResolvedPreset;
  file: ConvertFile;
  sourceDims: { width: number; height: number };
  targetFormat: TargetImageFormat;
  quality: number;
  customFileName: string;
}

async function convertImageToPdf(
  cfg: ConvertRunConfig,
): Promise<Result<ImageFormatConverterResultData>> {
  const wrapped = await wrapImageBytesInPdf(cfg.file.bytes, 'IMAGE_RESIZE_FAILED');
  if (!wrapped.ok) return wrapped;

  const rawBase = cfg.customFileName.trim() || cfg.file.name.replace(/\.[^.]+$/, '');
  const cleanBase = rawBase.replace(/[^a-zA-Z0-9_\- ]/g, '').trim() || 'image';
  const fileName = `${cleanBase.replace(/-converted$/, '')}-converted.pdf`;

  const isPng = cfg.file.name.toLowerCase().endsWith('.png');
  const isJpg =
    cfg.file.name.toLowerCase().endsWith('.jpg') || cfg.file.name.toLowerCase().endsWith('.jpeg');

  return ok({
    fileName,
    bytes: wrapped.value.pdfBytes,
    originalWidth: cfg.sourceDims.width,
    originalHeight: cfg.sourceDims.height,
    outputWidth: cfg.sourceDims.width,
    outputHeight: cfg.sourceDims.height,
    originalFileSize: cfg.file.size,
    outputFileSize: wrapped.value.pdfBytes.byteLength,
    sizeDifferenceBytes: cfg.file.size - wrapped.value.pdfBytes.byteLength,
    sizeChangePercent: Math.round(
      ((wrapped.value.pdfBytes.byteLength - cfg.file.size) / cfg.file.size) * 100,
    ),
    originalFormat: isPng ? 'png' : isJpg ? 'jpg' : 'webp',
    outputFormat: 'pdf',
    warnings: [],
  });
}

async function executeConvertWorker(
  cfg: ConvertRunConfig,
): Promise<Result<ImageFormatConverterResultData>> {
  if (cfg.targetFormat === 'pdf') {
    return convertImageToPdf(cfg);
  }
  const input = {
    file: { name: cfg.file.name, bytes: cfg.file.bytes },
    targetWidth: cfg.sourceDims.width,
    targetHeight: cfg.sourceDims.height,
    keepAspectRatio: true,
    outputFormat: cfg.targetFormat,
    quality: cfg.targetFormat === 'jpg' || cfg.targetFormat === 'webp' ? cfg.quality : undefined,
    outputFileName: cfg.customFileName.trim() ? cfg.customFileName.trim() : undefined,
  };
  const outcome = await getWorkerHost().run(cfg.preset.operation, input, cfg.preset.params);
  if (!outcome.ok) return err(outcome.error.code, outcome.error);
  const val = outcome.value as Record<string, unknown>;
  const warnings = outcome.warnings ?? [];
  return ok(
    {
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
      warnings,
    },
    warnings,
  );
}

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
      s.setFile(null);
      s.setError(res.error);
      s.setPhase('error');
      notify(`Cannot open image: ${res.error.code}`);
      return;
    }
    if (s.imageSrc) URL.revokeObjectURL(s.imageSrc);
    s.setFile(res.value.file);
    s.setImageSrc(res.value.blobUrl);
    s.setSourceFormat(res.value.format);
    s.setSourceDims(res.value.dims);
    s.setCustomFileName('');
  } catch {
    notify('Failed to read image file');
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
    notify(`Conversion failed: ${outcome.error.code}`);
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
