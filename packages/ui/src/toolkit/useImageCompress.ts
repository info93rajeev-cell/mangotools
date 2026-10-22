import { err, type OpError, type OpWarning, ok, type Result } from '@mangotools/core';
import { getWorkerHost, track } from '@mangotools/runtime';
import type { ResolvedPreset } from '@mangotools/schemas';
import { useEffect, useRef, useState } from 'preact/hooks';
import type { FilePhase } from '../archetypes/useFileTool.ts';
import { downloadBytes } from './actions.ts';
import {
  type CropFile as CompressFile,
  inspectAndDecodeImage,
  MIME_MAP,
} from './imageFileInspection.ts';
import { wrapImageBytesInPdf } from './imagePdfExport.ts';
import { createPalaceSample } from './samplePalaceImage.ts';

export type CompressOutputFormat = 'same' | 'jpg' | 'png' | 'webp' | 'pdf';
export type { CompressFile };

const FORMAT_MIME_MAP: Record<string, string> = { ...MIME_MAP, pdf: 'application/pdf' };

export interface ImageCompressResultData {
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
  outputQuality: number;
  dimensions: string;
  status: string;
  encodeAttempts: number;
  warnings: OpWarning[];
}

interface CompressRunConfig {
  preset: ResolvedPreset;
  file: CompressFile;
  outputFormat: CompressOutputFormat;
  quality: number;
  maxFileSizeKB?: number;
  customFileName: string;
}

async function convertCompressedToPdf(
  cfg: CompressRunConfig,
  compressed: ImageCompressResultData,
): Promise<Result<ImageCompressResultData>> {
  const wrapped = await wrapImageBytesInPdf(compressed.bytes, 'IMAGE_COMPRESSION_FAILED');
  if (!wrapped.ok) return wrapped;

  const rawBase = cfg.customFileName.trim() || cfg.file.name.replace(/\.[^.]+$/, '');
  const cleanBase = rawBase.replace(/[^a-zA-Z0-9_\- ]/g, '').trim() || 'image';
  const fileName = `${cleanBase.replace(/-compressed$/, '')}-compressed.pdf`;

  return ok({
    fileName,
    bytes: wrapped.value.pdfBytes,
    originalWidth: compressed.originalWidth,
    originalHeight: compressed.originalHeight,
    outputWidth: compressed.outputWidth,
    outputHeight: compressed.outputHeight,
    originalFileSize: cfg.file.size,
    outputFileSize: wrapped.value.pdfBytes.byteLength,
    sizeDifferenceBytes: cfg.file.size - wrapped.value.pdfBytes.byteLength,
    sizeChangePercent: Math.round(
      ((cfg.file.size - wrapped.value.pdfBytes.byteLength) / cfg.file.size) * 100,
    ),
    originalFormat: compressed.originalFormat,
    outputFormat: 'pdf',
    outputQuality: compressed.outputQuality,
    dimensions: compressed.dimensions,
    status: 'Compressed into PDF document',
    encodeAttempts: compressed.encodeAttempts,
    warnings: compressed.warnings,
  });
}

async function executeCompressWorker(
  cfg: CompressRunConfig,
): Promise<Result<ImageCompressResultData>> {
  const isPdf = cfg.outputFormat === 'pdf';
  const workerFormat = isPdf ? 'jpg' : cfg.outputFormat;

  const input = {
    file: { name: cfg.file.name, bytes: cfg.file.bytes },
    outputFormat: workerFormat,
    quality: cfg.quality,
    maxFileSizeKB: cfg.maxFileSizeKB && cfg.maxFileSizeKB > 0 ? cfg.maxFileSizeKB : undefined,
    outputFileName: cfg.customFileName.trim() ? cfg.customFileName.trim() : undefined,
    allowDimensionReduction: false,
  };

  const outcome = await getWorkerHost().run(cfg.preset.operation, input, cfg.preset.params);
  if (!outcome.ok) return err(outcome.error.code, outcome.error);
  const val = outcome.value as Record<string, unknown>;
  const warnings = outcome.warnings ?? [];

  const rawResult: ImageCompressResultData = {
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
    outputQuality: Number(val.outputQuality),
    dimensions: String(val.dimensions),
    status: String(val.status),
    encodeAttempts: Number(val.encodeAttempts),
    warnings,
  };

  if (isPdf) {
    return convertCompressedToPdf(cfg, rawResult);
  }

  return ok(rawResult, warnings);
}

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
    notify(`Compression failed: ${outcome.error.code}`);
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
