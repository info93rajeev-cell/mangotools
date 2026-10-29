import { track } from '@mangotools/runtime';
import type { ResolvedPreset } from '@mangotools/schemas';
import { downloadBytes } from './actions.ts';
import {
  inspectAndDecodeImage,
  MIME_MAP,
  type CropFile as PassportFile,
} from './imageFileInspection.ts';
import type { PixelRect } from './imageWorkbenchGeometry.ts';
import { defaultSelectionRect } from './imageWorkbenchGeometry.ts';
import {
  executePassportWorker,
  type PassportOutputFormat,
  type PassportPhotoResultData,
  type PassportRunConfig,
} from './passportPhotoPresets.ts';

export interface PassportExecutionState {
  file: PassportFile | null;
  invalidFile: File | null;
  sourceDims: { width: number; height: number };
  imageSrc: string | null;
  targetWidth: number;
  targetHeight: number;
  keepAspectRatio: boolean;
  outputFormat: PassportOutputFormat;
  quality: number;
  customFileName: string;
  cropRect: PixelRect;
  setFile: (f: PassportFile | null) => void;
  setInvalidFile: (f: File | null) => void;
  setSourceDims: (dims: { width: number; height: number }) => void;
  setImageSrc: (src: string | null) => void;
  setTargetWidth: (w: number) => void;
  setTargetHeight: (h: number) => void;
  setKeepAspectRatio: (val: boolean) => void;
  setOutputFormat: (fmt: PassportOutputFormat) => void;
  setQuality: (q: number) => void;
  setActivePresetId: (id: string | null) => void;
  setCropRect: (rect: PixelRect) => void;
  setResult: (res: PassportPhotoResultData | null) => void;
  setResultUrl: (url: string | null) => void;
  setError: (err: string | null) => void;
  setWarnings: (warn: Array<{ code: string; messageKey?: string }>) => void;
  updatePhase: (phase: 'idle' | 'running' | 'result' | 'error') => void;
}

export async function inspectPassportFile(raw: File, s: PassportExecutionState) {
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

  // Default centered passport crop matching 35:45 ratio
  const initCrop = defaultSelectionRect(dims, '35:45');
  s.setCropRect(initCrop);

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

export function clearPassportState(s: PassportExecutionState) {
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
  s.setCropRect({ x: 0, y: 0, width: 0, height: 0 });
  s.updatePhase('idle');
}

function validatePassportInputs(s: PassportExecutionState): boolean {
  if (s.invalidFile) {
    s.setError(`"${s.invalidFile.name}" is not a JPG, PNG, or WebP image.`);
    s.updatePhase('error');
    return false;
  }
  if (!s.file) {
    s.setError('Add a photo, then enter the pixel dimensions required by your application.');
    s.updatePhase('error');
    return false;
  }
  if (s.targetWidth <= 0 || s.targetHeight <= 0) {
    s.setError('Enter a width and height greater than 0.');
    s.updatePhase('error');
    return false;
  }
  return true;
}

export async function performPassportExecution(
  preset: ResolvedPreset,
  toolId: string,
  notify: (msg: string) => void,
  s: PassportExecutionState,
  isCropActive = true,
  triggerDownload = false,
) {
  if (!validatePassportInputs(s)) return;
  s.updatePhase('running');
  s.setError(null);

  const cfg: PassportRunConfig = {
    preset,
    file: s.file as PassportFile,
    targetWidth: s.targetWidth,
    targetHeight: s.targetHeight,
    keepAspectRatio: s.keepAspectRatio,
    outputFormat: s.outputFormat,
    quality: s.quality,
    customFileName: s.customFileName,
    cropRect: isCropActive && s.cropRect.width > 0 ? s.cropRect : null,
    sourceDims: s.sourceDims,
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
  s.updatePhase('result');
  track('tool_run', { toolId });

  if (triggerDownload) {
    downloadBytes(res.bytes, res.fileName, mime);
    notify(`Downloaded ${res.fileName}`);
    track('tool_complete', { toolId, method: 'download' });
  } else {
    notify('Passport photo generated successfully! Ready for download.');
  }
}
