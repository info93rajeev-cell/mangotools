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
import {
  executePassportWorker,
  initMountedPassportSample,
  PASSPORT_PRESETS,
  type PassportOutputFormat,
  type PassportPhotoResultData,
  type PassportPresetItem,
  type PassportRunConfig,
} from './passportPhotoPresets.ts';
import { createPassportPortraitSample } from './samplePassportPortraitImage.ts';

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

function usePassportPhotoState(onPhase: (phase: FilePhase) => void) {
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

type PassportState = ReturnType<typeof usePassportPhotoState>;

async function inspectPassportFile(raw: File, s: PassportState) {
  const ext = raw.name.toLowerCase();
  const isKnownImage =
    raw.type.startsWith('image/') ||
    ext.endsWith('.jpg') ||
    ext.endsWith('.jpeg') ||
    ext.endsWith('.png') ||
    ext.endsWith('.webp');

  if (!isKnownImage) {
    s.setFile(null);
    s.setInvalidFile(raw);
    s.setError(`"${raw.name}" is not a JPG, PNG, or WebP image.`);
    s.updatePhase('error');
    return;
  }
  s.setInvalidFile(null);

  const res = await inspectAndDecodeImage(raw);
  if (!res.ok) {
    s.setError(res.error.messageKey || `"${raw.name}" is not a JPG, PNG, or WebP image.`);
    s.updatePhase('error');
    return;
  }

  const dims = res.value.dims;
  s.setFile(res.value.file);
  s.setSourceDims(dims);
  s.setImageSrc(res.value.blobUrl);
  s.setTargetWidth(dims.width);
  s.setTargetHeight(dims.height);
  s.setKeepAspectRatio(true);
  s.setOutputFormat('jpg');
  s.setQuality(85);
  s.setActivePresetId(null);

  if (res.value.format === 'png' || res.value.format === 'webp') {
    s.setWarnings([
      {
        code: 'IMAGE_TRANSPARENT_FLATTENED_TO_WHITE',
        messageKey: 'IMAGE_TRANSPARENT_FLATTENED_TO_WHITE',
      },
    ]);
  }
  s.updatePhase('idle');
}

function clearPassportState(s: PassportState) {
  s.setFile(null);
  s.setInvalidFile(null);
  s.setSourceDims({ width: 0, height: 0 });
  s.setImageSrc(null);
  s.setResult(null);
  s.setResultUrl(null);
  s.setError(null);
  s.setWarnings([]);
  s.setTargetWidth(8);
  s.setTargetHeight(8);
  s.setKeepAspectRatio(true);
  s.setOutputFormat('jpg');
  s.setQuality(85);
  s.setActivePresetId(null);
  s.updatePhase('idle');
}

function usePassportFileActions(s: PassportState, userInteractedRef: { current: boolean }) {
  const loadFile = useCallback(
    async (raw: File) => {
      userInteractedRef.current = true;
      s.updatePhase('running');
      s.setError(null);
      s.setWarnings([]);
      s.setResult(null);
      await inspectPassportFile(raw, s);
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
    },
    [s, userInteractedRef],
  );

  return {
    loadFile,
    loadSample,
    clearAll: () => {
      userInteractedRef.current = true;
      clearPassportState(s);
    },
    applyPreset,
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

async function performPassportExecution(
  preset: ResolvedPreset,
  toolId: string,
  notify: (msg: string) => void,
  s: PassportState,
) {
  if (s.invalidFile) {
    s.setError(`"${s.invalidFile.name}" is not a JPG, PNG, or WebP image.`);
    s.updatePhase('error');
    return;
  }
  if (!s.file) {
    s.setError('Add a photo, then enter the pixel dimensions required by your application.');
    s.updatePhase('error');
    return;
  }
  if (s.targetWidth <= 0 || s.targetHeight <= 0) {
    s.setError('Enter a width and height greater than 0.');
    s.updatePhase('error');
    return;
  }
  s.updatePhase('running');
  s.setError(null);
  const cfg: PassportRunConfig = {
    preset,
    file: s.file,
    targetWidth: s.targetWidth,
    targetHeight: s.targetHeight,
    keepAspectRatio: s.keepAspectRatio,
    outputFormat: s.outputFormat,
    quality: s.quality,
    customFileName: s.customFileName,
  };
  const outcome = await executePassportWorker(cfg);
  if (!outcome.ok) {
    s.setError(outcome.error.messageKey || 'Passport photo resizing failed.');
    s.updatePhase('error');
    return;
  }
  const res = outcome.value;
  s.setResult(res);
  s.setWarnings(res.warnings ?? []);
  const mime =
    res.outputFormat === 'pdf' ? 'application/pdf' : (MIME_MAP[res.outputFormat] ?? 'image/jpeg');
  const blobUrl = URL.createObjectURL(new Blob([res.bytes as BlobPart], { type: mime }));
  s.setResultUrl(blobUrl);
  downloadBytes(res.bytes, res.fileName, mime);
  notify(`Downloaded ${res.fileName}`);
  s.updatePhase('result');
  track('tool_run', { toolId });
  track('tool_complete', { toolId, method: 'download' });
}

function usePassportExecution(
  preset: ResolvedPreset,
  toolId: string,
  notify: (msg: string) => void,
  s: PassportState,
) {
  const executeResizeAndDownload = useCallback(
    () => performPassportExecution(preset, toolId, notify, s),
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

  return { executeResizeAndDownload, downloadResult };
}

export function usePassportPhoto(
  preset: ResolvedPreset,
  toolId: string,
  notify: (msg: string) => void,
  onPhase: (phase: FilePhase) => void,
): UsePassportPhotoReturn {
  const s = usePassportPhotoState(onPhase);
  const userInteractedRef = useRef(false);
  const fileActions = usePassportFileActions(s, userInteractedRef);
  const exec = usePassportExecution(preset, toolId, notify, s);

  useEffect(() => {
    if (!s.file && typeof window !== 'undefined' && typeof document !== 'undefined') {
      void initMountedPassportSample(s, userInteractedRef);
    }
  }, []);

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
    result: s.result,
    resultUrl: s.resultUrl,
    error: s.error,
    warnings: s.warnings,
    setKeepAspectRatio: s.setKeepAspectRatio,
    setOutputFormat: s.setOutputFormat,
    setQuality: s.setQuality,
    setCustomFileName: s.setCustomFileName,
    setShowGuides: s.setShowGuides,
    ...fileActions,
    ...exec,
  };
}
