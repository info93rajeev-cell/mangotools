import type { OpWarning } from '@mangotools/core';
import { track } from '@mangotools/runtime';
import type { ResolvedPreset } from '@mangotools/schemas';
import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import type { FilePhase } from '../archetypes/useFileTool.ts';
import { downloadBytes } from './actions.ts';
import {
  AUTO_ENHANCE_PRESET,
  DEFAULT_ENHANCEMENT,
  type EnhancementSettings,
  executeEnhancementPipeline,
} from './imageEnhancementPipeline.ts';
import { type CropFile, inspectAndDecodeImage, MIME_MAP } from './imageFileInspection.ts';
import { wrapImageBytesInPdf } from './imagePdfExport.ts';
import { createPalaceSample } from './samplePalaceImage.ts';

export type EnlargeOutputFormat = 'png' | 'jpg' | 'webp' | 'pdf';

export interface ImageEnlargerResultData {
  fileName: string;
  bytes: Uint8Array;
  originalWidth: number;
  originalHeight: number;
  outputWidth: number;
  outputHeight: number;
  originalFileSize: number;
  outputFileSize: number;
  scale: number;
  outputFormat: string;
  sharpness: number;
  contrast: number;
  warnings: OpWarning[];
}

export interface UseImageEnlargerReturn {
  file: CropFile | null;
  sourceDims: { width: number; height: number };
  imageSrc: string | null;
  phase: FilePhase;
  settings: EnhancementSettings;
  isAutoEnhance: boolean;
  splitPos: number;
  outputFormat: EnlargeOutputFormat;
  customFileName: string;
  result: ImageEnlargerResultData | null;
  resultUrl: string | null;
  error: string | null;
  setScale: (scale: 1 | 2 | 4) => void;
  setSharpness: (val: number) => void;
  setContrast: (val: number) => void;
  setBrightness: (val: number) => void;
  setVibrance: (val: number) => void;
  setWarmth: (val: number) => void;
  setOutputFormat: (fmt: EnlargeOutputFormat) => void;
  setCustomFileName: (name: string) => void;
  setSplitPos: (pos: number) => void;
  toggleAutoEnhance: () => void;
  resetSettings: () => void;
  loadFile: (file: File) => Promise<void>;
  loadSample: () => Promise<void>;
  executeEnlarge: () => Promise<void>;
  downloadResult: (mode?: 'full' | 'fast') => Promise<void>;
}

function useEnlargeSliders() {
  const [settings, setSettings] = useState<EnhancementSettings>({
    ...DEFAULT_ENHANCEMENT,
  });
  const [isAutoEnhance, setIsAutoEnhance] = useState(false);

  const toggleAutoEnhance = useCallback(() => {
    setIsAutoEnhance((prev) => {
      const next = !prev;
      setSettings((s) => ({
        ...s,
        ...(next ? AUTO_ENHANCE_PRESET : DEFAULT_ENHANCEMENT),
        scale: s.scale,
      }));
      return next;
    });
  }, []);

  const resetSettings = useCallback(() => {
    setIsAutoEnhance(false);
    setSettings({ ...DEFAULT_ENHANCEMENT });
  }, []);

  return {
    settings,
    isAutoEnhance,
    setScale: (scale: 1 | 2 | 4) => setSettings((s) => ({ ...s, scale })),
    setSharpness: (val: number) => {
      setIsAutoEnhance(false);
      setSettings((s) => ({ ...s, sharpness: val }));
    },
    setContrast: (val: number) => {
      setIsAutoEnhance(false);
      setSettings((s) => ({ ...s, contrast: val }));
    },
    setBrightness: (val: number) => {
      setIsAutoEnhance(false);
      setSettings((s) => ({ ...s, brightness: val }));
    },
    setVibrance: (val: number) => {
      setIsAutoEnhance(false);
      setSettings((s) => ({ ...s, vibrance: val }));
    },
    setWarmth: (val: number) => {
      setIsAutoEnhance(false);
      setSettings((s) => ({ ...s, warmth: val }));
    },
    toggleAutoEnhance,
    resetSettings,
  };
}

function useEnlargeLoader(updatePhase: (next: FilePhase) => void) {
  const [file, setFile] = useState<CropFile | null>(null);
  const [sourceDims, setSourceDims] = useState({ width: 0, height: 0 });
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const decodedRef = useRef<ImageBitmap | null>(null);

  const loadFile = useCallback(
    async (raw: File) => {
      updatePhase('running');
      setError(null);
      const res = await inspectAndDecodeImage(raw);
      if (!res.ok) {
        setError(res.error.code);
        updatePhase('error');
        return;
      }
      decodedRef.current?.close();
      const bitmap = await createImageBitmap(new Blob([res.value.file.bytes as BlobPart]));
      decodedRef.current = bitmap;
      setFile(res.value.file);
      setSourceDims(res.value.dims);
      setImageSrc(res.value.blobUrl);
      updatePhase('idle');
    },
    [updatePhase],
  );

  const loadSample = useCallback(async () => {
    updatePhase('running');
    const sample = await createPalaceSample();
    decodedRef.current?.close();
    const bitmap = await createImageBitmap(new Blob([sample.file.bytes as BlobPart]));
    decodedRef.current = bitmap;
    setFile(sample.file);
    setSourceDims({ width: bitmap.width, height: bitmap.height });
    setImageSrc(sample.blobUrl);
    updatePhase('idle');
  }, [updatePhase]);

  return {
    file,
    sourceDims,
    imageSrc,
    error,
    setError,
    decodedRef,
    loadFile,
    loadSample,
  };
}

async function renderAndExportBytes(
  canvas: HTMLCanvasElement,
  format: EnlargeOutputFormat,
  baseName: string,
): Promise<{ finalBytes: Uint8Array; finalName: string }> {
  const mime = format === 'pdf' ? 'image/png' : (MIME_MAP[format] ?? 'image/png');
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), mime, 0.92),
  );
  if (!blob) throw new Error('Canvas export failed');

  let finalBytes = new Uint8Array(await blob.arrayBuffer()) as Uint8Array;
  const finalName = `${baseName}.${format}`;

  if (format === 'pdf') {
    const wrapped = await wrapImageBytesInPdf(finalBytes, 'IMAGE_RESIZE_FAILED');
    if (wrapped.ok) finalBytes = wrapped.value.pdfBytes;
  }
  return { finalBytes, finalName };
}

function useEnlargeExecution(
  loader: ReturnType<typeof useEnlargeLoader>,
  sliders: ReturnType<typeof useEnlargeSliders>,
  outputFormat: EnlargeOutputFormat,
  customFileName: string,
  toolId: string,
  updatePhase: (next: FilePhase) => void,
  notify: (msg: string) => void,
) {
  const [result, setResult] = useState<ImageEnlargerResultData | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  const executeEnlarge = useCallback(async () => {
    if (!loader.decodedRef.current || !loader.file) return;
    updatePhase('running');
    loader.setError(null);
    try {
      const canvas = await executeEnhancementPipeline(loader.decodedRef.current, sliders.settings);
      const base = customFileName.trim() || `${loader.file.name.replace(/\.[^.]+$/, '')}-enlarged`;
      const { finalBytes, finalName } = await renderAndExportBytes(canvas, outputFormat, base);
      setResultUrl(URL.createObjectURL(new Blob([finalBytes as BlobPart])));
      setResult({
        fileName: finalName,
        bytes: finalBytes,
        originalWidth: loader.sourceDims.width,
        originalHeight: loader.sourceDims.height,
        outputWidth: canvas.width,
        outputHeight: canvas.height,
        originalFileSize: loader.file.size,
        outputFileSize: finalBytes.byteLength,
        scale: sliders.settings.scale,
        outputFormat,
        sharpness: sliders.settings.sharpness,
        contrast: sliders.settings.contrast,
        warnings: [],
      });
      updatePhase('result');
      track('tool_run', { toolId });
      const mime =
        outputFormat === 'pdf' ? 'application/pdf' : (MIME_MAP[outputFormat] ?? 'image/png');
      downloadBytes(finalBytes, finalName, mime);
      notify(`Downloaded ${finalName}`);
      track('tool_complete', { toolId, method: 'download' });
    } catch (e) {
      loader.setError(e instanceof Error ? e.message : 'Enhancement failed');
      updatePhase('error');
    }
  }, [loader, sliders.settings, outputFormat, customFileName, toolId, updatePhase, notify]);

  return { result, resultUrl, executeEnlarge };
}

export function useImageEnlarger(
  _preset: ResolvedPreset,
  toolId: string,
  notify: (msg: string) => void,
  onPhase: (phase: FilePhase) => void,
): UseImageEnlargerReturn {
  const [phase, setPhase] = useState<FilePhase>('idle');
  const [splitPos, setSplitPos] = useState(50);
  const [outputFormat, setOutputFormat] = useState<EnlargeOutputFormat>('png');
  const [customFileName, setCustomFileName] = useState('');

  const updatePhase = useCallback(
    (next: FilePhase) => {
      setPhase(next);
      onPhase(next);
    },
    [onPhase],
  );

  const loader = useEnlargeLoader(updatePhase);
  const sliders = useEnlargeSliders();

  const initialMountRef = useRef(true);
  useEffect(() => {
    if (initialMountRef.current && !loader.file) {
      initialMountRef.current = false;
      void loader.loadSample();
    }
  }, [loader]);

  const exec = useEnlargeExecution(
    loader,
    sliders,
    outputFormat,
    customFileName,
    toolId,
    updatePhase,
    notify,
  );

  const downloadResult = useCallback(
    async (_mode?: 'full' | 'fast') => {
      if (!exec.result) return;
      const mime =
        exec.result.outputFormat === 'pdf'
          ? 'application/pdf'
          : (MIME_MAP[exec.result.outputFormat] ?? 'image/png');
      downloadBytes(exec.result.bytes, exec.result.fileName, mime);
      notify(`Downloaded ${exec.result.fileName}`);
      track('tool_complete', { toolId, method: 'download' });
    },
    [exec.result, notify, toolId],
  );

  return {
    ...loader,
    phase,
    splitPos,
    outputFormat,
    customFileName,
    ...exec,
    ...sliders,
    setOutputFormat,
    setCustomFileName,
    setSplitPos,
    downloadResult,
  };
}
