import type { OpWarning } from '@mangotools/core';
import { track } from '@mangotools/runtime';
import type { ResolvedPreset } from '@mangotools/schemas';
import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import type { FilePhase } from '../archetypes/useFileTool.ts';
import { downloadBytes } from './actions.ts';
import {
  inspectAndDecodeImage,
  MIME_MAP,
  type CropFile as PassportFile,
} from './imageFileInspection.ts';
import type { AspectRatioPreset, PixelRect } from './imageWorkbenchGeometry.ts';
import { defaultSelectionRect } from './imageWorkbenchGeometry.ts';
import {
  clearPassportState,
  inspectPassportFile,
  type PassportExecutionState,
  performPassportExecution,
} from './passportPhotoExecution.ts';
import {
  initMountedPassportSample,
  PASSPORT_PRESETS,
  type PassportOutputFormat,
  type PassportPhotoResultData,
  type PassportPresetItem,
} from './passportPhotoPresets.ts';
import type { PaperSizeId, SheetLayoutResult } from './passportSheetGeometry.ts';
import { createPassportPortraitSample } from './samplePassportPortraitImage.ts';
import { usePassportSheetState } from './usePassportSheetState.ts';

export type { PassportFile, PassportOutputFormat, PassportPhotoResultData, PassportPresetItem };
export { PASSPORT_PRESETS };

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
  cropRect: PixelRect;
  isCropActive: boolean;
  activeCropRatio: AspectRatioPreset;
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
  setCropRect: (rect: PixelRect) => void;
  setIsCropActive: (val: boolean) => void;
  resetCrop: () => void;
  applyPreset: (preset: PassportPresetItem) => void;
  loadFile: (file: File) => Promise<void>;
  loadSample: () => Promise<void>;
  clearAll: () => void;
  executeResizeAndDownload: () => Promise<void>;
  downloadResult: () => void;

  // Print sheet state
  paperSize: PaperSizeId;
  setPaperSize: (size: PaperSizeId) => void;
  photoCount: number;
  setPhotoCount: (count: number) => void;
  showCutGuides: boolean;
  setShowCutGuides: (val: boolean) => void;
  activeStageView: 'single' | 'sheet';
  setActiveStageView: (view: 'single' | 'sheet') => void;
  isGeneratingSheet: boolean;
  sheetLayout: SheetLayoutResult;
  printSheet: () => Promise<void>;
  downloadSheet: () => Promise<void>;
}

function resolveAspectRatioPreset(targetWidth: number, targetHeight: number): AspectRatioPreset {
  if (targetWidth <= 0 || targetHeight <= 0) return '35:45';
  const ratio = targetWidth / targetHeight;
  if (Math.abs(ratio - 1) < 0.05) return '1:1';
  if (Math.abs(ratio - 35 / 45) < 0.05) return '35:45';
  if (Math.abs(ratio - 4 / 3) < 0.05) return '4:3';
  if (Math.abs(ratio - 16 / 9) < 0.05) return '16:9';
  return '35:45';
}

// biome-ignore lint/complexity/noExcessiveLinesPerFunction: Hook state management
function usePassportPhotoState(onPhase: (phase: FilePhase) => void) {
  const [file, setFile] = useState<PassportFile | null>(null);
  const [invalidFile, setInvalidFile] = useState<File | null>(null);
  const [sourceDims, setSourceDims] = useState({ width: 0, height: 0 });
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [phase, setPhase] = useState<FilePhase>('idle');
  const [targetWidth, setTargetWidth] = useState<number>(413);
  const [targetHeight, setTargetHeight] = useState<number>(531);
  const [keepAspectRatio, setKeepAspectRatio] = useState<boolean>(true);
  const [outputFormat, setOutputFormat] = useState<PassportOutputFormat>('jpg');
  const [quality, setQuality] = useState<number>(85);
  const [customFileName, setCustomFileName] = useState('');
  const [showGuides, setShowGuides] = useState<boolean>(true);
  const [activePresetId, setActivePresetId] = useState<string | null>('in');
  const [cropRect, setCropRect] = useState<PixelRect>({ x: 0, y: 0, width: 0, height: 0 });
  const [isCropActive, setIsCropActive] = useState<boolean>(true);
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

  return {
    file,
    setFile,
    invalidFile,
    setInvalidFile,
    sourceDims,
    setSourceDims,
    imageSrc,
    setImageSrc,
    phase,
    updatePhase,
    targetWidth,
    setTargetWidth,
    targetHeight,
    setTargetHeight,
    keepAspectRatio,
    setKeepAspectRatio,
    outputFormat,
    setOutputFormat,
    quality,
    setQuality,
    customFileName,
    setCustomFileName,
    showGuides,
    setShowGuides,
    activePresetId,
    setActivePresetId,
    cropRect,
    setCropRect,
    isCropActive,
    setIsCropActive,
    result,
    setResult,
    resultUrl,
    setResultUrl,
    error,
    setError,
    warnings,
    setWarnings,
  };
}

// biome-ignore lint/complexity/noExcessiveLinesPerFunction: Studio action handlers
function usePassportActions(
  s: ReturnType<typeof usePassportPhotoState>,
  userInteractedRef: { current: boolean },
) {
  const loadFile = useCallback(
    async (raw: File) => {
      userInteractedRef.current = true;
      s.updatePhase('running');
      s.setError(null);
      s.setWarnings([]);
      s.setResult(null);
      await inspectPassportFile(raw, s as unknown as PassportExecutionState);
    },
    [s, userInteractedRef],
  );

  const loadSample = useCallback(async () => {
    userInteractedRef.current = true;
    s.updatePhase('running');
    s.setError(null);
    try {
      const sample = await createPassportPortraitSample();
      const fileObj = new File([sample.file.bytes as BlobPart], sample.file.name, {
        type: 'image/jpeg',
      });
      const res = await inspectAndDecodeImage(fileObj);
      if (!res.ok) return;
      if (s.imageSrc) URL.revokeObjectURL(s.imageSrc);
      s.setFile(res.value.file);
      s.setImageSrc(res.value.blobUrl);
      s.setSourceDims(res.value.dims);
      s.setTargetWidth(413);
      s.setTargetHeight(531);
      s.setKeepAspectRatio(true);
      s.setOutputFormat('jpg');
      s.setQuality(85);
      s.setActivePresetId('in');
      const initCrop = defaultSelectionRect(res.value.dims, '35:45');
      s.setCropRect(initCrop);
      s.updatePhase('idle');
    } catch {
      s.updatePhase('idle');
    }
  }, [s, userInteractedRef]);

  const applyPreset = useCallback(
    (p: PassportPresetItem) => {
      userInteractedRef.current = true;
      s.setActivePresetId(p.id);
      s.setTargetWidth(p.width);
      s.setTargetHeight(p.height);
      if (s.sourceDims.width > 0) {
        const ratio = p.id === 'us' || p.id === 'pan' ? '1:1' : '35:45';
        s.setCropRect(defaultSelectionRect(s.sourceDims, ratio));
      }
    },
    [s, userInteractedRef],
  );

  const resetCrop = useCallback(() => {
    if (s.sourceDims.width > 0) {
      const ratio = resolveAspectRatioPreset(s.targetWidth, s.targetHeight);
      s.setCropRect(defaultSelectionRect(s.sourceDims, ratio));
    }
  }, [s]);

  return {
    loadFile,
    loadSample,
    clearAll: () => {
      userInteractedRef.current = true;
      clearPassportState(s as unknown as PassportExecutionState);
    },
    applyPreset,
    resetCrop,
    setWidth: (w: number) => {
      userInteractedRef.current = true;
      s.setActivePresetId(null);
      s.setTargetWidth(w);
    },
    setHeight: (h: number) => {
      userInteractedRef.current = true;
      s.setActivePresetId(null);
      s.setTargetHeight(h);
    },
  };
}

// biome-ignore lint/complexity/noExcessiveLinesPerFunction: Studio hook composition
export function usePassportPhoto(
  preset: ResolvedPreset,
  toolId: string,
  notify: (msg: string) => void,
  onPhase: (phase: FilePhase) => void,
): UsePassportPhotoReturn {
  const s = usePassportPhotoState(onPhase);
  const userInteractedRef = useRef(false);
  const actions = usePassportActions(s, userInteractedRef);

  const sheet = usePassportSheetState({
    activePresetId: s.activePresetId,
    targetWidth: s.targetWidth,
    targetHeight: s.targetHeight,
    imageSrc: s.imageSrc,
    customFileName: s.customFileName,
    notify,
  });

  const activeCropRatio = resolveAspectRatioPreset(s.targetWidth, s.targetHeight);

  useEffect(() => {
    if (!s.file && typeof window !== 'undefined' && typeof document !== 'undefined') {
      void initMountedPassportSample(s, userInteractedRef).then(() => {
        if (s.sourceDims.width > 0 && s.cropRect.width === 0) {
          s.setCropRect(defaultSelectionRect(s.sourceDims, '35:45'));
        }
      });
    }
  }, []);

  const executeResizeAndDownload = useCallback(
    () =>
      performPassportExecution(
        preset,
        toolId,
        notify,
        s as unknown as PassportExecutionState,
        s.isCropActive,
      ),
    [preset, toolId, notify, s],
  );

  const downloadResult = useCallback(() => {
    if (!s.result) return;
    const mime =
      s.result.outputFormat === 'pdf'
        ? 'application/pdf'
        : (MIME_MAP[s.result.outputFormat] ?? 'image/jpeg');
    downloadBytes(s.result.bytes, s.result.fileName, mime);
    notify(`Downloaded ${s.result.fileName}`);
    track('tool_complete', { toolId, method: 'download' });
  }, [s.result, notify, toolId]);

  return {
    file: s.file,
    sourceDims: s.sourceDims,
    imageSrc: s.imageSrc,
    phase: s.phase,
    targetWidth: s.targetWidth,
    targetHeight: s.targetHeight,
    keepAspectRatio: s.keepAspectRatio,
    outputFormat: s.outputFormat,
    quality: s.quality,
    customFileName: s.customFileName,
    showGuides: s.showGuides,
    activePresetId: s.activePresetId,
    cropRect: s.cropRect,
    isCropActive: s.isCropActive,
    activeCropRatio,
    result: s.result,
    resultUrl: s.resultUrl,
    error: s.error,
    warnings: s.warnings,
    setKeepAspectRatio: s.setKeepAspectRatio,
    setOutputFormat: s.setOutputFormat,
    setQuality: s.setQuality,
    setCustomFileName: s.setCustomFileName,
    setShowGuides: s.setShowGuides,
    setCropRect: s.setCropRect,
    setIsCropActive: s.setIsCropActive,
    ...actions,
    executeResizeAndDownload,
    downloadResult,
    ...sheet,
  };
}
