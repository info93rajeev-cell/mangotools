import { err, type OpWarning, ok, type Result } from '@mangotools/core';
import { getWorkerHost, track } from '@mangotools/runtime';
import type { ResolvedPreset } from '@mangotools/schemas';
import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import type { FilePhase } from '../archetypes/useFileTool.ts';
import { downloadBytes } from './actions.ts';
import {
  inspectAndDecodeImage,
  MIME_MAP,
  type CropFile as PassportFile,
} from './imageFileInspection.ts';
import { wrapImageBytesInPdf } from './imagePdfExport.ts';

export type PassportOutputFormat = 'jpg' | 'png' | 'webp' | 'pdf';
export type { PassportFile };

export interface PassportPresetItem {
  id: string;
  name: string;
  width: number;
  height: number;
  unit: string;
  desc: string;
}

export const PASSPORT_PRESETS: PassportPresetItem[] = [
  {
    id: 'in',
    name: 'India (35×45 mm)',
    width: 413,
    height: 531,
    unit: '35×45 mm',
    desc: 'Passport & OCI',
  },
  {
    id: 'us',
    name: 'US (2×2 inch)',
    width: 600,
    height: 600,
    unit: '2×2 inch',
    desc: 'Visa & Passport',
  },
  {
    id: 'schengen',
    name: 'Schengen / Europe',
    width: 413,
    height: 531,
    unit: '35×45 mm',
    desc: 'Schengen Visa',
  },
  {
    id: 'pan',
    name: 'India PAN Card',
    width: 213,
    height: 213,
    unit: '213×213 px',
    desc: 'NSDL / UTIITSL',
  },
  {
    id: 'ssc_upsc',
    name: 'UPSC / SSC Exam',
    width: 350,
    height: 450,
    unit: '350×450 px',
    desc: 'Govt Applications',
  },
];

export interface PassportPhotoResultData {
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

interface PassportRunConfig {
  preset: ResolvedPreset;
  file: PassportFile;
  targetWidth: number;
  targetHeight: number;
  keepAspectRatio: boolean;
  outputFormat: PassportOutputFormat;
  quality: number;
  customFileName: string;
}

async function convertPassportToPdf(
  cfg: PassportRunConfig,
  result: PassportPhotoResultData,
): Promise<Result<PassportPhotoResultData>> {
  const wrapped = await wrapImageBytesInPdf(result.bytes, 'IMAGE_RESIZE_FAILED');
  if (!wrapped.ok) return wrapped;

  const rawBase = cfg.customFileName.trim() || cfg.file.name.replace(/\.[^.]+$/, '');
  const cleanBase = rawBase.replace(/[^a-zA-Z0-9_\- ]/g, '').trim() || 'passport';
  const fileName = `${cleanBase.replace(/-passport$/, '')}-passport.pdf`;

  return ok({
    fileName,
    bytes: wrapped.value.pdfBytes,
    originalWidth: result.originalWidth,
    originalHeight: result.originalHeight,
    outputWidth: result.outputWidth,
    outputHeight: result.outputHeight,
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

async function executePassportWorker(
  cfg: PassportRunConfig,
): Promise<Result<PassportPhotoResultData>> {
  const isPdf = cfg.outputFormat === 'pdf';
  const workerFormat = isPdf ? 'png' : cfg.outputFormat;

  const input = {
    file: { name: cfg.file.name, bytes: cfg.file.bytes },
    targetWidth: cfg.targetWidth,
    targetHeight: cfg.targetHeight,
    keepAspectRatio: cfg.keepAspectRatio,
    outputFormat: workerFormat,
    quality: workerFormat === 'jpg' || workerFormat === 'webp' ? cfg.quality : undefined,
    outputFileName: cfg.customFileName.trim() || undefined,
  };

  const outcome = await getWorkerHost().run(cfg.preset.operation, input, cfg.preset.params);
  if (!outcome.ok) return err(outcome.error.code, outcome.error);

  const val = outcome.value as Record<string, unknown>;
  const baseRes: PassportPhotoResultData = {
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
    warnings: (outcome.warnings ?? []) as OpWarning[],
  };

  if (isPdf) {
    return convertPassportToPdf(cfg, baseRes);
  }
  return ok(baseRes);
}

export interface UsePassportPhotoReturn {
  file: PassportFile | null;
  sourceDims: { width: number; height: number };
  imageSrc: string | null;
  phase: FilePhase;
  targetWidth: number;
  targetHeight: number;
  keepAspectRatio: boolean;
  outputFormat: PassportOutputFormat;
  quality: number;
  customFileName: string;
  showGuides: boolean;
  activePresetId: string | null;
  result: PassportPhotoResultData | null;
  resultUrl: string | null;
  error: string | null;
  warnings: OpWarning[];
  setWidth: (w: number) => void;
  setHeight: (h: number) => void;
  setKeepAspectRatio: (val: boolean) => void;
  setOutputFormat: (fmt: PassportOutputFormat) => void;
  setQuality: (q: number) => void;
  setCustomFileName: (name: string) => void;
  setShowGuides: (val: boolean) => void;
  applyPreset: (preset: PassportPresetItem) => void;
  loadFile: (file: File) => Promise<void>;
  loadSample: () => Promise<void>;
  clearAll: () => void;
  executeResizeAndDownload: () => Promise<void>;
  downloadResult: () => void;
}

export function usePassportPhoto(
  preset: ResolvedPreset,
  toolId: string,
  notify: (msg: string) => void,
  onPhase: (phase: FilePhase) => void,
): UsePassportPhotoReturn {
  const [file, setFile] = useState<PassportFile | null>(null);
  const [invalidFile, setInvalidFile] = useState<File | null>(null);
  const [sourceDims, setSourceDims] = useState({ width: 0, height: 0 });
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [phase, setPhase] = useState<FilePhase>('idle');
  const [targetWidth, setTargetWidth] = useState<number>(8);
  const [targetHeight, setTargetHeight] = useState<number>(8);
  const [keepAspectRatio, setKeepAspectRatio] = useState<boolean>(true);
  const [outputFormat, setOutputFormat] = useState<PassportOutputFormat>('jpg');
  const [quality, setQuality] = useState<number>(85);
  const [customFileName, setCustomFileName] = useState('');
  const [showGuides, setShowGuides] = useState<boolean>(true);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [result, setResult] = useState<PassportPhotoResultData | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<OpWarning[]>([]);

  const updatePhase = useCallback(
    (next: FilePhase) => {
      setPhase(next);
      onPhase(next);
    },
    [onPhase],
  );

  const clearAll = useCallback(() => {
    setFile(null);
    setInvalidFile(null);
    setSourceDims({ width: 0, height: 0 });
    setImageSrc(null);
    setResult(null);
    setResultUrl(null);
    setError(null);
    setWarnings([]);
    setTargetWidth(8);
    setTargetHeight(8);
    setKeepAspectRatio(true);
    setOutputFormat('jpg');
    setQuality(85);
    setActivePresetId(null);
    updatePhase('idle');
  }, [updatePhase]);

  const loadFile = useCallback(
    async (raw: File) => {
      updatePhase('running');
      setError(null);
      setWarnings([]);
      setResult(null);

      // Validate image mime
      const ext = raw.name.toLowerCase();
      const isKnownImage =
        raw.type.startsWith('image/') ||
        ext.endsWith('.jpg') ||
        ext.endsWith('.jpeg') ||
        ext.endsWith('.png') ||
        ext.endsWith('.webp');

      if (!isKnownImage) {
        setFile(null);
        setInvalidFile(raw);
        setError(`"${raw.name}" is not a JPG, PNG, or WebP image.`);
        updatePhase('error');
        return;
      }
      setInvalidFile(null);

      const res = await inspectAndDecodeImage(raw);
      if (!res.ok) {
        setError(res.error.message || `"${raw.name}" is not a JPG, PNG, or WebP image.`);
        updatePhase('error');
        return;
      }

      const dims = res.value.dims;
      setFile(res.value.file);
      setSourceDims(dims);
      setImageSrc(res.value.blobUrl);
      setTargetWidth(dims.width);
      setTargetHeight(dims.height);
      setKeepAspectRatio(true);
      setOutputFormat('jpg');
      setQuality(85);
      setActivePresetId(null);

      // If PNG with transparency, warn immediately
      if (res.value.file.hasAlpha) {
        setWarnings([
          {
            code: 'IMAGE_TRANSPARENT_FLATTENED_TO_WHITE',
            message:
              'Transparent areas will be flattened onto a white background when exporting as JPG.',
          },
        ]);
      }

      updatePhase('idle');
    },
    [updatePhase],
  );

  const loadSample = useCallback(async () => {
    updatePhase('running');
    setError(null);
    try {
      const resp = await fetch('/samples/passport-portrait.jpg');
      const blob = await resp.blob();
      const sampleFile = new File([blob], 'passport-portrait.jpg', { type: 'image/jpeg' });
      await loadFile(sampleFile);
      // Auto-select India 35x45 mm preset
      setTargetWidth(413);
      setTargetHeight(531);
      setActivePresetId('in');
    } catch {
      updatePhase('idle');
    }
  }, [loadFile, updatePhase]);

  // Auto load sample on initial mount
  const initialMountRef = useRef(true);
  useEffect(() => {
    if (initialMountRef.current && !file) {
      initialMountRef.current = false;
      void loadSample();
    }
  }, [file, loadSample]);

  const applyPreset = useCallback((p: PassportPresetItem) => {
    setActivePresetId(p.id);
    setTargetWidth(p.width);
    setTargetHeight(p.height);
  }, []);

  const setWidth = useCallback(
    (w: number) => {
      setActivePresetId(null);
      setTargetWidth(w);
      if (keepAspectRatio && sourceDims.width > 0 && sourceDims.height > 0) {
        setTargetHeight(Math.round((w * sourceDims.height) / sourceDims.width));
      }
    },
    [keepAspectRatio, sourceDims],
  );

  const setHeight = useCallback(
    (h: number) => {
      setActivePresetId(null);
      setTargetHeight(h);
      if (keepAspectRatio && sourceDims.width > 0 && sourceDims.height > 0) {
        setTargetWidth(Math.round((h * sourceDims.width) / sourceDims.height));
      }
    },
    [keepAspectRatio, sourceDims],
  );

  const executeResizeAndDownload = useCallback(async () => {
    if (invalidFile) {
      setError(`"${invalidFile.name}" is not a JPG, PNG, or WebP image.`);
      updatePhase('error');
      return;
    }

    if (!file) {
      setError('Add a photo, then enter the pixel dimensions required by your application.');
      updatePhase('error');
      return;
    }

    if (targetWidth <= 0 || targetHeight <= 0) {
      setError('Enter a width and height greater than 0.');
      updatePhase('error');
      return;
    }

    updatePhase('running');
    setError(null);

    const cfg: PassportRunConfig = {
      preset,
      file,
      targetWidth,
      targetHeight,
      keepAspectRatio,
      outputFormat,
      quality,
      customFileName,
    };

    const outcome = await executePassportWorker(cfg);
    if (!outcome.ok) {
      setError(outcome.error.message || 'Passport photo resizing failed.');
      updatePhase('error');
      return;
    }

    const res = outcome.value;
    setResult(res);
    setWarnings(res.warnings ?? []);

    const mime =
      res.outputFormat === 'pdf' ? 'application/pdf' : (MIME_MAP[res.outputFormat] ?? 'image/jpeg');
    const blobUrl = URL.createObjectURL(new Blob([res.bytes as BlobPart], { type: mime }));
    setResultUrl(blobUrl);

    downloadBytes(res.bytes, res.fileName, mime);
    notify(`Downloaded ${res.fileName}`);
    updatePhase('result');
    track('tool_run', { toolId });
    track('tool_complete', { toolId, method: 'download' });
  }, [
    file,
    targetWidth,
    targetHeight,
    keepAspectRatio,
    outputFormat,
    quality,
    customFileName,
    preset,
    toolId,
    notify,
    updatePhase,
  ]);

  const downloadResult = useCallback(() => {
    if (!result) return;
    const mime =
      result.outputFormat === 'pdf'
        ? 'application/pdf'
        : (MIME_MAP[result.outputFormat] ?? 'image/jpeg');
    downloadBytes(result.bytes, result.fileName, mime);
    notify(`Downloaded ${result.fileName}`);
    track('tool_complete', { toolId, method: 'download' });
  }, [result, notify, toolId]);

  return {
    file,
    sourceDims,
    imageSrc,
    phase,
    targetWidth,
    targetHeight,
    keepAspectRatio,
    outputFormat,
    quality,
    customFileName,
    showGuides,
    activePresetId,
    result,
    resultUrl,
    error,
    warnings,
    setWidth,
    setHeight,
    setKeepAspectRatio,
    setOutputFormat,
    setQuality,
    setCustomFileName,
    setShowGuides,
    applyPreset,
    loadFile,
    loadSample,
    clearAll,
    executeResizeAndDownload,
    downloadResult,
  };
}
