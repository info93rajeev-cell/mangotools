import { err, type OpError, type OpWarning, ok, type Result } from '@mangotools/core';
import { getWorkerHost, track } from '@mangotools/runtime';
import type { ResolvedPreset } from '@mangotools/schemas';
import { useEffect, useRef, useState } from 'preact/hooks';
import type { FilePhase } from '../archetypes/useFileTool.ts';
import { downloadBytes } from './actions.ts';
import {
  inspectAndDecodeImage,
  MIME_MAP,
  type CropFile as WatermarkFile,
} from './imageFileInspection.ts';
import {
  createMountainLakeSample,
  SAMPLE_HEIGHT,
  SAMPLE_WIDTH,
} from './sampleMountainLakeImage.ts';

export type WatermarkPosition =
  | 'top-left'
  | 'top-right'
  | 'center'
  | 'bottom-left'
  | 'bottom-right';

export type WatermarkOutputFormat = 'same' | 'jpg' | 'png' | 'webp';
export type { WatermarkFile };

export interface WatermarkResultData {
  fileName: string;
  bytes: Uint8Array;
  outputWidth: number;
  outputHeight: number;
  originalWidth: number;
  originalHeight: number;
  outputFileSize: number;
  originalFileSize: number;
  outputFormat: string;
  originalFormat: string;
  watermarkText: string;
  position: string;
  opacity: number;
  fontSize: number;
  color: string;
  sizeDifferenceBytes: number;
  warnings: OpWarning[];
}

interface WatermarkRunConfig {
  preset: ResolvedPreset;
  file: WatermarkFile;
  text: string;
  position: WatermarkPosition;
  opacity: number;
  fontSize: number;
  color: string;
  outputFormat: WatermarkOutputFormat;
  quality: number;
  customFileName: string;
}

function resolveFormat(
  format: WatermarkOutputFormat,
  originalFormat: string,
): 'jpg' | 'png' | 'webp' {
  if (format !== 'same') return format;
  if (originalFormat === 'png') return 'png';
  if (originalFormat === 'webp') return 'webp';
  return 'jpg';
}

async function executeWatermarkWorker(
  cfg: WatermarkRunConfig,
): Promise<Result<WatermarkResultData>> {
  const originalFmt = cfg.file.name.toLowerCase().endsWith('.png')
    ? 'png'
    : cfg.file.name.toLowerCase().endsWith('.webp')
      ? 'webp'
      : 'jpg';
  const workerFormat = resolveFormat(cfg.outputFormat, originalFmt);

  const input = {
    file: { name: cfg.file.name, bytes: cfg.file.bytes },
    text: cfg.text.trim(),
    position: cfg.position,
    opacity: cfg.opacity,
    fontSize: cfg.fontSize,
    color: cfg.color,
    outputFormat: workerFormat,
    quality: cfg.quality,
    outputFileName: cfg.customFileName.trim() ? cfg.customFileName.trim() : undefined,
  };

  const outcome = await getWorkerHost().run(cfg.preset.operation, input, cfg.preset.params);
  if (!outcome.ok) return err(outcome.error.code, outcome.error);
  const val = outcome.value as Record<string, unknown>;

  const warnings = (outcome.warnings ?? []) as OpWarning[];

  return ok({
    fileName: String(val.fileName),
    bytes: val.bytes as Uint8Array,
    outputWidth: Number(val.outputWidth),
    outputHeight: Number(val.outputHeight),
    originalWidth: Number(val.originalWidth),
    originalHeight: Number(val.originalHeight),
    outputFileSize: Number(val.outputFileSize),
    originalFileSize: Number(val.originalFileSize),
    outputFormat: String(val.outputFormat),
    originalFormat: String(val.originalFormat ?? originalFmt),
    watermarkText: String(val.watermarkText),
    position: String(val.position),
    opacity: Number(val.opacity),
    fontSize: Number(val.fontSize),
    color: String(val.color),
    sizeDifferenceBytes: Number(val.sizeDifferenceBytes),
    warnings,
  });
}

// biome-ignore lint/complexity/noExcessiveLinesPerFunction: Hook manages comprehensive state and worker execution for image watermarking
export function useImageWatermark(preset: ResolvedPreset, onPhase?: (phase: FilePhase) => void) {
  const [file, setFile] = useState<WatermarkFile | null>(null);
  const [invalidFile, setInvalidFile] = useState<{ name: string } | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [sourceDims, setSourceDims] = useState({ width: 0, height: 0 });
  const [text, setText] = useState('');
  const [position, setPosition] = useState<WatermarkPosition>('bottom-right');
  const [opacity, setOpacity] = useState(50);
  const [fontSize, setFontSize] = useState(32);
  const [color, setColor] = useState('#ffffff');
  const [outputFormat, setOutputFormat] = useState<WatermarkOutputFormat>('same');
  const [quality, setQuality] = useState(85);
  const [customFileName, setCustomFileName] = useState('');
  const [phase, setPhaseState] = useState<FilePhase>('idle');
  const [result, setResult] = useState<WatermarkResultData | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<OpError | null>(null);
  const [warnings, setWarnings] = useState<OpWarning[]>([]);

  const sampleLoadedRef = useRef(false);
  const userInteractedRef = useRef(false);

  const setPhase = (p: FilePhase) => {
    setPhaseState(p);
    onPhase?.(p);
  };

  // Auto-load Jaipur Palace sample on mount
  useEffect(() => {
    if (sampleLoadedRef.current || file) return;
    sampleLoadedRef.current = true;
    void loadSample();
  }, []);

  async function loadSample() {
    setPhase('running');
    setError(null);
    setInvalidFile(null);
    try {
      const { file: sampleFile, blobUrl } = await createMountainLakeSample();
      if (userInteractedRef.current) {
        URL.revokeObjectURL(blobUrl);
        return;
      }
      const dims = { width: SAMPLE_WIDTH, height: SAMPLE_HEIGHT };
      if (imageSrc) URL.revokeObjectURL(imageSrc);
      setFile(sampleFile);
      setImageSrc(blobUrl);
      setSourceDims(dims);
      setResult(null);
      if (resultUrl) URL.revokeObjectURL(resultUrl);
      setResultUrl(null);
      setPhase('idle');
    } catch {
      setPhase('idle');
    }
  }

  async function handleFileSelected(browserFile: File) {
    userInteractedRef.current = true;
    setPhase('running');
    setError(null);
    setInvalidFile(null);
    setResult(null);
    if (resultUrl) {
      URL.revokeObjectURL(resultUrl);
      setResultUrl(null);
    }

    const inspected = await inspectAndDecodeImage(browserFile);
    if (!inspected.ok) {
      setInvalidFile({ name: browserFile.name });
      setFile(null);
      if (imageSrc) {
        URL.revokeObjectURL(imageSrc);
        setImageSrc(null);
      }
      setSourceDims({ width: 0, height: 0 });
      setPhase('error');
      setError({
        code: inspected.error.code,
        messageKey: inspected.error.code,
        details: { name: browserFile.name },
      });
      return;
    }

    if (imageSrc) URL.revokeObjectURL(imageSrc);
    setFile(inspected.value.file);
    setImageSrc(inspected.value.blobUrl);
    setSourceDims(inspected.value.dims);
    setPhase('idle');
  }

  function clearAll() {
    if (imageSrc) URL.revokeObjectURL(imageSrc);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setFile(null);
    setInvalidFile(null);
    setImageSrc(null);
    setSourceDims({ width: 0, height: 0 });
    setText('');
    setPosition('bottom-right');
    setOpacity(50);
    setFontSize(32);
    setColor('#ffffff');
    setOutputFormat('same');
    setQuality(85);
    setCustomFileName('');
    setResult(null);
    setResultUrl(null);
    setError(null);
    setWarnings([]);
    setPhase('idle');
  }

  async function executeWatermark(): Promise<Result<WatermarkResultData>> {
    if (invalidFile) {
      const errRes: OpError = {
        code: 'IMAGE_INVALID_FILE_TYPE',
        messageKey: 'IMAGE_INVALID_FILE_TYPE',
        details: { name: invalidFile.name },
      };
      setError(errRes);
      setPhase('error');
      return err('IMAGE_INVALID_FILE_TYPE', errRes);
    }

    if (!file) {
      const errRes: OpError = {
        code: 'IMAGE_NO_FILE_SELECTED',
        messageKey: 'IMAGE_NO_FILE_SELECTED',
      };
      setError(errRes);
      setPhase('error');
      return err('IMAGE_NO_FILE_SELECTED', errRes);
    }

    if (!text.trim()) {
      const errRes: OpError = {
        code: 'IMAGE_WATERMARK_TEXT_REQUIRED',
        messageKey: 'IMAGE_WATERMARK_TEXT_REQUIRED',
      };
      setError(errRes);
      setPhase('error');
      return err('IMAGE_WATERMARK_TEXT_REQUIRED', errRes);
    }

    setPhase('running');
    setError(null);

    const runRes = await executeWatermarkWorker({
      preset,
      file,
      text,
      position,
      opacity,
      fontSize,
      color,
      outputFormat,
      quality,
      customFileName,
    });

    if (!runRes.ok) {
      setError(runRes.error);
      setResult(null);
      if (resultUrl) URL.revokeObjectURL(resultUrl);
      setResultUrl(null);
      setPhase('error');
      return runRes;
    }

    const data = runRes.value;
    const blob = new Blob([data.bytes as BlobPart], {
      type: MIME_MAP[data.outputFormat] ?? 'image/jpeg',
    });
    const url = URL.createObjectURL(blob);

    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setResult(data);
    setResultUrl(url);
    setWarnings(data.warnings);
    setPhase('result');
    track('tool_run', { toolId: 'image-watermark' });

    return runRes;
  }

  async function executeWatermarkAndDownload(): Promise<void> {
    const runRes = await executeWatermark();
    if (!runRes.ok) return;
    const data = runRes.value;
    const mime = MIME_MAP[data.outputFormat] ?? 'image/jpeg';
    downloadBytes(data.bytes, data.fileName, mime);
  }

  function downloadResult(): void {
    if (!result) return;
    const mime = MIME_MAP[result.outputFormat] ?? 'image/jpeg';
    downloadBytes(result.bytes, result.fileName, mime);
  }

  return {
    file,
    invalidFile,
    imageSrc,
    sourceDims,
    text,
    setText,
    position,
    setPosition,
    opacity,
    setOpacity,
    fontSize,
    setFontSize,
    color,
    setColor,
    outputFormat,
    setOutputFormat,
    quality,
    setQuality,
    customFileName,
    setCustomFileName,
    phase,
    result,
    resultUrl,
    error,
    warnings,
    loadSample,
    handleFileSelected,
    clearAll,
    executeWatermark,
    executeWatermarkAndDownload,
    downloadResult,
  };
}

export type UseImageWatermarkReturn = ReturnType<typeof useImageWatermark>;
