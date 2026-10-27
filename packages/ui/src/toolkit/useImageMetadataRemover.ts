import { err, type OpError, type OpWarning, ok, type Result } from '@mangotools/core';
import { getWorkerHost, track } from '@mangotools/runtime';
import type { ResolvedPreset } from '@mangotools/schemas';
import { useEffect, useRef, useState } from 'preact/hooks';
import type { FilePhase } from '../archetypes/useFileTool.ts';
import { downloadBytes } from './actions.ts';
import {
  inspectAndDecodeImage,
  type CropFile as MetadataFile,
  MIME_MAP,
} from './imageFileInspection.ts';
import { createPalaceSample, SAMPLE_NAME } from './samplePalaceImage.ts';

export type MetadataOutputFormat = 'same' | 'jpg' | 'png' | 'webp';
export type { MetadataFile };

export interface MetadataRemoverResultData {
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
  sizeDifferenceBytes: number;
  warnings: OpWarning[];
}

interface MetadataRemoverRunConfig {
  preset: ResolvedPreset;
  file: MetadataFile;
  sourceDims: { width: number; height: number };
  outputFormat: MetadataOutputFormat;
  quality: number;
  customFileName: string;
}

function resolveFormat(
  format: MetadataOutputFormat,
  originalFormat: string,
): 'jpg' | 'png' | 'webp' {
  if (format !== 'same') return format;
  if (originalFormat === 'png') return 'png';
  if (originalFormat === 'webp') return 'webp';
  return 'jpg';
}

async function executeMetadataWorker(
  cfg: MetadataRemoverRunConfig,
): Promise<Result<MetadataRemoverResultData>> {
  const originalFmt = cfg.file.name.toLowerCase().endsWith('.png')
    ? 'png'
    : cfg.file.name.toLowerCase().endsWith('.webp')
      ? 'webp'
      : 'jpg';
  const workerFormat = resolveFormat(cfg.outputFormat, originalFmt);

  const targetWidth = cfg.sourceDims.width > 0 ? cfg.sourceDims.width : 800;
  const targetHeight = cfg.sourceDims.height > 0 ? cfg.sourceDims.height : 600;

  const input = {
    file: { name: cfg.file.name, bytes: cfg.file.bytes },
    targetWidth,
    targetHeight,
    keepAspectRatio: true,
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
    sizeDifferenceBytes: Number(val.sizeDifferenceBytes),
    warnings,
  });
}

export function useImageMetadataRemover(
  preset: ResolvedPreset,
  onPhase?: (phase: FilePhase) => void,
) {
  const [file, setFile] = useState<MetadataFile | null>(null);
  const [invalidFile, setInvalidFile] = useState<{ name: string } | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [sourceDims, setSourceDims] = useState({ width: 0, height: 0 });
  const [outputFormat, setOutputFormat] = useState<MetadataOutputFormat>('same');
  const [quality, setQuality] = useState(85);
  const [customFileName, setCustomFileName] = useState('');
  const [phase, setPhaseState] = useState<FilePhase>('idle');
  const [result, setResult] = useState<MetadataRemoverResultData | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<OpError | null>(null);
  const [warnings, setWarnings] = useState<OpWarning[]>([]);

  const sampleLoadedRef = useRef(false);

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
      const { file: sampleFile, blobUrl } = await createPalaceSample();
      const dims = { width: 1600, height: 1200 };
      if (imageSrc) URL.revokeObjectURL(imageSrc);
      setFile(sampleFile);
      setImageSrc(blobUrl);
      setSourceDims(dims);
      setResult(null);
      if (resultUrl) URL.revokeObjectURL(resultUrl);
      setResultUrl(null);
      setPhase('ready');
    } catch {
      setPhase('idle');
    }
  }

  async function handleFileSelected(browserFile: File) {
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
        message: inspected.error.message,
        details: { name: browserFile.name },
      });
      return;
    }

    if (imageSrc) URL.revokeObjectURL(imageSrc);
    setFile(inspected.value.file);
    setImageSrc(inspected.value.blobUrl);
    setSourceDims(inspected.value.dims);
    setPhase('ready');
  }

  function clearAll() {
    if (imageSrc) URL.revokeObjectURL(imageSrc);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setFile(null);
    setInvalidFile(null);
    setImageSrc(null);
    setSourceDims({ width: 0, height: 0 });
    setOutputFormat('same');
    setQuality(85);
    setCustomFileName('');
    setResult(null);
    setResultUrl(null);
    setError(null);
    setWarnings([]);
    setPhase('idle');
  }

  async function executeClean(): Promise<Result<MetadataRemoverResultData>> {
    if (invalidFile) {
      const errRes: OpError = {
        code: 'IMAGE_INVALID_FILE_TYPE',
        message: `"${invalidFile.name}" is not a JPG, PNG, or WebP image.`,
        details: { name: invalidFile.name },
      };
      setError(errRes);
      setPhase('error');
      return err('IMAGE_INVALID_FILE_TYPE', errRes);
    }

    if (!file) {
      const errRes: OpError = {
        code: 'IMAGE_NO_FILE_SELECTED',
        message: 'Select an image to resize.',
      };
      setError(errRes);
      setPhase('error');
      return err('IMAGE_NO_FILE_SELECTED', errRes);
    }

    setPhase('running');
    setError(null);

    const runRes = await executeMetadataWorker({
      preset,
      file,
      sourceDims,
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
    const blob = new Blob([data.bytes], {
      type: MIME_MAP[data.outputFormat] ?? 'image/jpeg',
    });
    const url = URL.createObjectURL(blob);

    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setResult(data);
    setResultUrl(url);
    setWarnings(data.warnings);
    setPhase('result');
    track('tool_run', { toolId: 'image-metadata-remover' });

    return runRes;
  }

  async function executeCleanAndDownload(): Promise<void> {
    const runRes = await executeClean();
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
    executeClean,
    executeCleanAndDownload,
    downloadResult,
  };
}

export type UseImageMetadataRemoverReturn = ReturnType<typeof useImageMetadataRemover>;
