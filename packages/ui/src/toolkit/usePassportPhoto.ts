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
import { resolveAspectRatioPreset, usePassportPhotoState } from './usePassportPhotoState.ts';
import { usePassportSheetState } from './usePassportSheetState.ts';

export type { PassportFile, PassportOutputFormat, PassportPhotoResultData, PassportPresetItem };
export { PASSPORT_PRESETS };

export interface UsePassportPhotoReturn {
  file: PassportFile | null;
  sourceDims: { width: number; height: number };
  imageSrc: string | null;
  croppedImageSrc: string | null;
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
  executeGenerate: () => Promise<void>;
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

function renderCroppedDataUrl(
  img: HTMLImageElement,
  cropRect: PixelRect,
  targetWidth: number,
  targetHeight: number,
): string | null {
  const canvas = document.createElement('canvas');
  const targetW = targetWidth > 0 ? targetWidth : Math.round(cropRect.width);
  const targetH = targetHeight > 0 ? targetHeight : Math.round(cropRect.height);
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.drawImage(
    img,
    cropRect.x,
    cropRect.y,
    cropRect.width,
    cropRect.height,
    0,
    0,
    targetW,
    targetH,
  );
  return canvas.toDataURL('image/jpeg', 0.92);
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

  // Maintain live cropped preview dataUrl so preview stage never reverts to wide uncropped photo
  const [croppedImageSrc, setCroppedImageSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!s.imageSrc || typeof document === 'undefined') {
      setCroppedImageSrc(null);
      return;
    }
    if (s.cropRect.width <= 0 || s.cropRect.height <= 0) {
      setCroppedImageSrc(s.imageSrc);
      return;
    }

    let isSubscribed = true;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (!isSubscribed) return;
      const dataUrl = renderCroppedDataUrl(img, s.cropRect, s.targetWidth, s.targetHeight);
      if (dataUrl) setCroppedImageSrc(dataUrl);
    };
    img.src = s.imageSrc;
    return () => {
      isSubscribed = false;
    };
  }, [
    s.imageSrc,
    s.cropRect.x,
    s.cropRect.y,
    s.cropRect.width,
    s.cropRect.height,
    s.targetWidth,
    s.targetHeight,
  ]);

  const sheet = usePassportSheetState({
    activePresetId: s.activePresetId,
    targetWidth: s.targetWidth,
    targetHeight: s.targetHeight,
    imageSrc: s.imageSrc,
    cropRect: s.cropRect,
    croppedImageSrc,
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

  const executeGenerate = useCallback(
    () =>
      performPassportExecution(
        preset,
        toolId,
        notify,
        s as unknown as PassportExecutionState,
        s.isCropActive,
        false,
      ),
    [preset, toolId, notify, s],
  );

  const executeResizeAndDownload = useCallback(
    () =>
      performPassportExecution(
        preset,
        toolId,
        notify,
        s as unknown as PassportExecutionState,
        s.isCropActive,
        true,
      ),
    [preset, toolId, notify, s],
  );

  const downloadResult = useCallback(() => {
    if (s.result) {
      const mime =
        s.result.outputFormat === 'pdf'
          ? 'application/pdf'
          : (MIME_MAP[s.result.outputFormat] ?? 'image/jpeg');
      downloadBytes(s.result.bytes, s.result.fileName, mime);
      notify(`Downloaded ${s.result.fileName}`);
      track('tool_complete', { toolId, method: 'download' });
    } else {
      void executeResizeAndDownload();
    }
  }, [s.result, notify, toolId, executeResizeAndDownload]);

  return {
    file: s.file,
    sourceDims: s.sourceDims,
    imageSrc: s.imageSrc,
    croppedImageSrc,
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
    executeGenerate,
    executeResizeAndDownload,
    downloadResult,
    ...sheet,
  };
}
