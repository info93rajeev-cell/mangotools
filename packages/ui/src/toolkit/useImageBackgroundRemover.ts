import type { OpError, OpWarning, Result } from '@mangotools/core';
import { track } from '@mangotools/runtime';
import type { ResolvedPreset } from '@mangotools/schemas';
import { useEffect, useRef, useState } from 'preact/hooks';
import type { FilePhase } from '../archetypes/useFileTool.ts';
import { downloadCutout } from './backgroundRemoverDownload.ts';
import { handleRun, handleRunAndDownload } from './backgroundRemoverHandlers.ts';
import { type BgRunConfig, executeBgWorker } from './backgroundRemoverWorker.ts';
import type { TransparencyMode } from './edgeMatteRefinement.ts';
import { type CropFile as BgFile, inspectAndDecodeImage } from './imageFileInspection.ts';
import { executePersonCutout } from './personSegmentation.ts';
import type { ShadowMode } from './productShadowEngine.ts';
import { createPalaceCutoutSample, createPalaceSample } from './samplePalaceImage.ts';
import { executeUniversalCutout } from './universalSegmentation.ts';

export type BgOutputFormat = 'png' | 'webp' | 'jpg' | 'pdf';
export type RemovalMode = 'universal' | 'portrait' | 'solid';
export type { BgFile, ShadowMode, TransparencyMode };

export interface ImageBackgroundRemoverResultData {
  fileName: string;
  bytes: Uint8Array;
  originalWidth: number;
  originalHeight: number;
  outputWidth: number;
  outputHeight: number;
  tolerance: number;
  feather: number;
  originalFileSize: number;
  outputFileSize: number;
  sizeDifferenceBytes: number;
  sizeChangePercent: number;
  originalFormat: string;
  outputFormat: string;
  warnings: OpWarning[];
  mode?: RemovalMode;
}

function useBgConfigState() {
  const [removalMode, setRemovalMode] = useState<RemovalMode>('universal');
  const [outputFormat, setOutputFormat] = useState<BgOutputFormat>('png');
  const [quality, setQuality] = useState<number>(90);
  const [tolerance, setTolerance] = useState<number>(20);
  const [feather, setFeather] = useState<number>(2);
  const [transparencyMode, setTransparencyMode] = useState<TransparencyMode>('auto');
  const [shadowMode, setShadowMode] = useState<ShadowMode>('none');
  const [shadowOpacity, setShadowOpacity] = useState<number>(40);
  const [targetColor, setTargetColor] = useState<string>('auto');
  const [replacementBackground, setReplacementBackground] = useState<string>('transparent');

  return {
    removalMode,
    setRemovalMode,
    outputFormat,
    setOutputFormat,
    quality,
    setQuality,
    tolerance,
    setTolerance,
    feather,
    setFeather,
    transparencyMode,
    setTransparencyMode,
    shadowMode,
    setShadowMode,
    shadowOpacity,
    setShadowOpacity,
    targetColor,
    setTargetColor,
    replacementBackground,
    setReplacementBackground,
  };
}

function useBgState() {
  const config = useBgConfigState();
  const [file, setFile] = useState<BgFile | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [sourceDims, setSourceDims] = useState({ width: 0, height: 0 });
  const [customFileName, setCustomFileName] = useState<string>('');
  const [phase, setPhase] = useState<FilePhase>('idle');
  const [result, setResult] = useState<ImageBackgroundRemoverResultData | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [invalidFile, setInvalidFile] = useState<File | null>(null);
  const [error, setError] = useState<OpError | null>(null);
  const [progressInfo, setProgressInfo] = useState<{
    stage: string;
    progress: number;
    message: string;
  } | null>(null);

  return {
    ...config,
    file,
    setFile,
    invalidFile,
    setInvalidFile,
    imageSrc,
    setImageSrc,
    sourceDims,
    setSourceDims,
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
    progressInfo,
    setProgressInfo,
  };
}

export type BgState = ReturnType<typeof useBgState>;

async function handleLoad(
  rawFile: File,
  s: BgState,
  invalidate: () => void,
  notify: (msg: string) => void,
  _onPhase?: (phase: FilePhase) => void,
  userInteractedRef?: { current: boolean },
) {
  if (userInteractedRef) userInteractedRef.current = true;
  invalidate();
  const isImage =
    rawFile.type.startsWith('image/') || /\.(jpe?g|png|webp|bmp)$/i.test(rawFile.name);
  if (!isImage) {
    s.setInvalidFile(rawFile);
    s.setFile({ name: rawFile.name, size: rawFile.size, bytes: new Uint8Array(0) });
    s.setImageSrc(null);
    s.setSourceDims({ width: 0, height: 0 });
    return;
  }
  s.setInvalidFile(null);
  try {
    const res = await inspectAndDecodeImage(rawFile);
    if (!res.ok) {
      s.setInvalidFile(rawFile);
      s.setFile({ name: rawFile.name, size: rawFile.size, bytes: new Uint8Array(0) });
      s.setImageSrc(null);
      s.setSourceDims({ width: 0, height: 0 });
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

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Sample loading flow
async function handleSample(
  s: BgState,
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

  // Pre-load the transparent cutout (sky removed) for the sample palace
  try {
    const cutout = await createPalaceCutoutSample();
    if (cutout && !userInteractedRef?.current) {
      if (s.resultUrl) URL.revokeObjectURL(s.resultUrl);
      s.setResultUrl(cutout.blobUrl);
      s.setResult({
        fileName: 'jaipur-palace-no-bg.png',
        bytes: cutout.file.bytes,
        originalWidth: res.value.dims.width || 1600,
        originalHeight: res.value.dims.height || 1200,
        outputWidth: res.value.dims.width || 1600,
        outputHeight: res.value.dims.height || 1200,
        tolerance: s.tolerance,
        feather: s.feather,
        originalFileSize: res.value.file.size || 633957,
        outputFileSize: cutout.file.size,
        sizeDifferenceBytes: (res.value.file.size || 633957) - cutout.file.size,
        sizeChangePercent: 35,
        originalFormat: 'jpg',
        outputFormat: 'png',
        warnings: [],
        mode: s.removalMode,
      });
      s.setPhase('result');
    }
  } catch {
    // offline fallback
  }
}

export async function dispatchRemoval(
  s: BgState,
  cfg: BgRunConfig,
  isNode: boolean,
): Promise<Result<ImageBackgroundRemoverResultData>> {
  if (s.removalMode === 'universal' && !isNode && s.file) {
    return executeUniversalCutout({
      file: s.file,
      imageSrc: s.imageSrc,
      outputFormat: s.outputFormat,
      quality: s.quality,
      tolerance: s.tolerance,
      feather: s.feather,
      transparencyMode: s.transparencyMode,
      shadowMode: s.shadowMode,
      shadowOpacity: s.shadowOpacity,
      replacementBackground: s.replacementBackground,
      customFileName: s.customFileName,
      onProgress: s.setProgressInfo,
    });
  }
  if (s.removalMode === 'portrait' && !isNode && s.file) {
    return executePersonCutout({
      file: s.file,
      imageSrc: s.imageSrc,
      outputFormat: s.outputFormat,
      quality: s.quality,
      replacementBackground: s.replacementBackground,
      customFileName: s.customFileName,
    });
  }
  return executeBgWorker(cfg);
}

function useBgActions(
  s: BgState,
  invalidate: () => void,
  preset: ResolvedPreset,
  toolId: string,
  onPhase: (phase: FilePhase) => void,
  notify: (msg: string) => void,
  userInteractedRef: { current: boolean },
) {
  const setWithInvalidate =
    <T>(setter: (v: T) => void) =>
    (val: T) => {
      invalidate();
      setter(val);
    };

  return {
    setRemovalMode: setWithInvalidate(s.setRemovalMode),
    setOutputFormat: setWithInvalidate(s.setOutputFormat),
    setQuality: setWithInvalidate(s.setQuality),
    setTolerance: setWithInvalidate(s.setTolerance),
    setFeather: setWithInvalidate(s.setFeather),
    setTransparencyMode: setWithInvalidate(s.setTransparencyMode),
    setShadowMode: setWithInvalidate(s.setShadowMode),
    setShadowOpacity: setWithInvalidate(s.setShadowOpacity),
    setTargetColor: setWithInvalidate(s.setTargetColor),
    setReplacementBackground: setWithInvalidate(s.setReplacementBackground),
    setCustomFileName: setWithInvalidate(s.setCustomFileName),
    loadFile: (f: File) => handleLoad(f, s, invalidate, notify, onPhase, userInteractedRef),
    loadSample: () => handleSample(s, invalidate, userInteractedRef, false),
    executeRemoveBackground: () => handleRun(s, preset, toolId, onPhase, notify),
    executeRemoveBackgroundAndDownload: () =>
      handleRunAndDownload(s, preset, toolId, onPhase, notify),
    downloadResult: (size: 'original' | 'fast' = 'original') => {
      if (!s.result) return;
      void downloadCutout(s.result, s.resultUrl, size);
      track('tool_complete', { toolId, method: 'download' });
    },
    reset: () => {
      invalidate();
      s.setRemovalMode('universal');
      s.setOutputFormat('png');
      s.setTolerance(20);
      s.setFeather(2);
      s.setTransparencyMode('auto');
      s.setShadowMode('none');
      s.setShadowOpacity(40);
      s.setTargetColor('auto');
      s.setReplacementBackground('transparent');
      s.setCustomFileName('');
    },
  };
}

export function useImageBackgroundRemover(
  preset: ResolvedPreset,
  toolId: string,
  notify: (msg: string) => void,
  onPhase: (phase: FilePhase) => void,
) {
  const s = useBgState();
  const userInteractedRef = useRef(false);

  const invalidate = () => {
    s.setInvalidFile(null);
    if (s.result || s.phase !== 'idle') {
      s.setResult(null);
      s.setError(null);
      s.setProgressInfo(null);
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

  const actions = useBgActions(s, invalidate, preset, toolId, onPhase, notify, userInteractedRef);

  return {
    ...s,
    ...actions,
  };
}

export type UseImageBackgroundRemoverReturn = ReturnType<typeof useImageBackgroundRemover>;
