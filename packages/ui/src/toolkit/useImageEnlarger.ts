import { track } from '@mangotools/runtime';
import type { ResolvedPreset } from '@mangotools/schemas';
import { useCallback, useRef, useState } from 'preact/hooks';
import type { FilePhase } from '../archetypes/useFileTool.ts';
import { downloadBytes } from './actions.ts';
import {
  AUTO_ENHANCE_PRESET,
  DEFAULT_ENHANCEMENT,
  type EnhancementSettings,
  executeEnhancementPipeline,
} from './imageEnhancementPipeline.ts';
import {
  type EnlargeOutputFormat,
  type ImageEnlargerResultData,
  renderAndExportBytes,
  useEnlargeHistory,
  useEnlargeInitialSample,
  useEnlargeKeyboardShortcuts,
  useEnlargePreview,
} from './imageEnlargerHelpers.ts';
import { type CropFile, inspectAndDecodeImage, MIME_MAP } from './imageFileInspection.ts';
import { createPalaceSample } from './samplePalaceImage.ts';

export type { EnlargeOutputFormat, ImageEnlargerResultData };

export interface UseImageEnlargerReturn {
  file: CropFile | null;
  sourceDims: { width: number; height: number };
  imageSrc: string | null;
  previewUrl: string | null;
  phase: FilePhase;
  settings: EnhancementSettings;
  isAutoEnhance: boolean;
  isApplied: boolean;
  canUndo: boolean;
  canRedo: boolean;
  splitPos: number;
  isShowingOriginal: boolean;
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
  applyChanges: () => void;
  undo: () => void;
  redo: () => void;
  setOutputFormat: (fmt: EnlargeOutputFormat) => void;
  setCustomFileName: (name: string) => void;
  setSplitPos: (pos: number) => void;
  setIsShowingOriginal: (show: boolean) => void;
  toggleAutoEnhance: () => void;
  resetSettings: () => void;
  reset: () => void;
  loadFile: (file: File) => Promise<void>;
  loadSample: () => Promise<void>;
  executeEnlarge: () => Promise<void>;
  downloadResult: (mode?: 'full' | 'fast') => Promise<void>;
}

function useEnlargeSliders() {
  const [settings, setSettings] = useState<EnhancementSettings>({ ...DEFAULT_ENHANCEMENT });
  const [isAutoEnhance, setIsAutoEnhance] = useState(false);
  const [isApplied, setIsApplied] = useState(true);
  const hist = useEnlargeHistory();

  const applyChanges = useCallback(() => {
    hist.pushHistory(settings);
    setIsApplied(true);
  }, [settings, hist.pushHistory]);

  const undo = useCallback(() => {
    if (hist.historyIndex > 0) {
      const prev = hist.history[hist.historyIndex - 1];
      hist.setHistoryIndex(hist.historyIndex - 1);
      setSettings(prev);
      setIsApplied(true);
    }
  }, [hist]);

  const redo = useCallback(() => {
    if (hist.historyIndex < hist.history.length - 1) {
      const next = hist.history[hist.historyIndex + 1];
      hist.setHistoryIndex(hist.historyIndex + 1);
      setSettings(next);
      setIsApplied(true);
    }
  }, [hist]);

  const toggleAutoEnhance = useCallback(() => {
    setIsAutoEnhance((prev) => {
      const next = !prev;
      const nextSettings = {
        ...settings,
        ...(next ? AUTO_ENHANCE_PRESET : DEFAULT_ENHANCEMENT),
        scale: settings.scale,
      };
      setSettings(nextSettings);
      hist.pushHistory(nextSettings);
      setIsApplied(true);
      return next;
    });
  }, [settings, hist.pushHistory]);

  const resetSettings = useCallback(() => {
    setIsAutoEnhance(false);
    const def = { ...DEFAULT_ENHANCEMENT, scale: settings.scale };
    setSettings(def);
    hist.pushHistory(def);
    setIsApplied(true);
  }, [settings.scale, hist.pushHistory]);

  const updateSetting = useCallback((updater: (s: EnhancementSettings) => EnhancementSettings) => {
    setIsAutoEnhance(false);
    setIsApplied(false);
    setSettings(updater);
  }, []);

  return {
    settings,
    isAutoEnhance,
    isApplied,
    canUndo: hist.historyIndex > 0,
    canRedo: hist.historyIndex < hist.history.length - 1,
    undo,
    redo,
    applyChanges,
    setScale: (scale: 1 | 2 | 4) => updateSetting((s) => ({ ...s, scale })),
    setSharpness: (val: number) => updateSetting((s) => ({ ...s, sharpness: val })),
    setContrast: (val: number) => updateSetting((s) => ({ ...s, contrast: val })),
    setBrightness: (val: number) => updateSetting((s) => ({ ...s, brightness: val })),
    setVibrance: (val: number) => updateSetting((s) => ({ ...s, vibrance: val })),
    setWarmth: (val: number) => updateSetting((s) => ({ ...s, warmth: val })),
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

  const reset = useCallback(() => {
    decodedRef.current?.close();
    decodedRef.current = null;
    setFile(null);
    setSourceDims({ width: 0, height: 0 });
    setImageSrc(null);
    setError(null);
    updatePhase('idle');
  }, [updatePhase]);

  return { file, sourceDims, imageSrc, error, setError, decodedRef, loadFile, loadSample, reset };
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
  const [isShowingOriginal, setIsShowingOriginal] = useState(false);
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
  const previewUrl = useEnlargePreview(
    loader.decodedRef.current,
    loader.imageSrc,
    sliders.settings,
  );

  useEnlargeInitialSample(loader.file, loader.loadSample);
  useEnlargeKeyboardShortcuts(sliders.undo, sliders.redo);

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
    isShowingOriginal,
    outputFormat,
    customFileName,
    previewUrl,
    ...exec,
    ...sliders,
    setOutputFormat,
    setCustomFileName,
    setSplitPos,
    setIsShowingOriginal,
    downloadResult,
  };
}
