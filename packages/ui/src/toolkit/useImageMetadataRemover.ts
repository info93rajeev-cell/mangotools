import { err, type OpError, type OpWarning, ok, type Result } from '@mangotools/core';
import { getWorkerHost, track } from '@mangotools/runtime';
import type { ResolvedPreset } from '@mangotools/schemas';
import { useEffect, useState } from 'preact/hooks';
import type { FilePhase } from '../archetypes/useFileTool.ts';
import { downloadBytes } from './actions.ts';
import {
  inspectAndDecodeImage,
  type CropFile as MetadataFile,
  MIME_MAP,
} from './imageFileInspection.ts';
import {
  createMountainLakeSample,
  SAMPLE_HEIGHT,
  SAMPLE_WIDTH,
} from './sampleMountainLakeImage.ts';

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
    warnings: (outcome.warnings ?? []) as OpWarning[],
  });
}

function useMetadataCoreState(onPhase?: (phase: FilePhase) => void) {
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

  const setPhase = (p: FilePhase) => {
    setPhaseState(p);
    onPhase?.(p);
  };

  return {
    file,
    setFile,
    invalidFile,
    setInvalidFile,
    imageSrc,
    setImageSrc,
    sourceDims,
    setSourceDims,
    outputFormat,
    setOutputFormat,
    quality,
    setQuality,
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
    warnings,
    setWarnings,
  };
}

type MetadataCoreState = ReturnType<typeof useMetadataCoreState>;

async function performClean(
  preset: ResolvedPreset,
  s: MetadataCoreState,
): Promise<Result<MetadataRemoverResultData>> {
  if (s.invalidFile) {
    const errRes: OpError = {
      code: 'IMAGE_INVALID_FILE_TYPE',
      messageKey: 'IMAGE_INVALID_FILE_TYPE',
      details: { name: s.invalidFile.name },
    };
    s.setError(errRes);
    s.setPhase('error');
    return err('IMAGE_INVALID_FILE_TYPE', errRes);
  }
  if (!s.file) {
    const errRes: OpError = {
      code: 'IMAGE_NO_FILE_SELECTED',
      messageKey: 'IMAGE_NO_FILE_SELECTED',
    };
    s.setError(errRes);
    s.setPhase('error');
    return err('IMAGE_NO_FILE_SELECTED', errRes);
  }
  s.setPhase('running');
  s.setError(null);
  const runRes = await executeMetadataWorker({
    preset,
    file: s.file,
    sourceDims: s.sourceDims,
    outputFormat: s.outputFormat,
    quality: s.quality,
    customFileName: s.customFileName,
  });
  if (!runRes.ok) {
    s.setError(runRes.error);
    s.setResult(null);
    if (s.resultUrl) URL.revokeObjectURL(s.resultUrl);
    s.setResultUrl(null);
    s.setPhase('error');
    return runRes;
  }
  const data = runRes.value;
  const blob = new Blob([data.bytes as BlobPart], {
    type: MIME_MAP[data.outputFormat] ?? 'image/jpeg',
  });
  const url = URL.createObjectURL(blob);
  if (s.resultUrl) URL.revokeObjectURL(s.resultUrl);
  s.setResult(data);
  s.setResultUrl(url);
  s.setWarnings(data.warnings);
  s.setPhase('result');
  track('tool_run', { toolId: 'image-metadata-remover' });
  return runRes;
}

function resetMetadataState(s: MetadataCoreState) {
  if (s.imageSrc) URL.revokeObjectURL(s.imageSrc);
  if (s.resultUrl) URL.revokeObjectURL(s.resultUrl);
  s.setFile(null);
  s.setInvalidFile(null);
  s.setImageSrc(null);
  s.setSourceDims({ width: 0, height: 0 });
  s.setOutputFormat('same');
  s.setQuality(85);
  s.setCustomFileName('');
  s.setResult(null);
  s.setResultUrl(null);
  s.setError(null);
  s.setWarnings([]);
  s.setPhase('idle');
}

function useMetadataFileSelection(s: MetadataCoreState) {
  useEffect(() => {
    void loadSample();
  }, []);

  async function loadSample() {
    s.setPhase('running');
    s.setError(null);
    s.setInvalidFile(null);
    try {
      const { file: sampleFile, blobUrl } = await createMountainLakeSample();
      if (s.imageSrc) URL.revokeObjectURL(s.imageSrc);
      if (s.resultUrl) URL.revokeObjectURL(s.resultUrl);
      s.setFile(sampleFile);
      s.setImageSrc(blobUrl);
      s.setSourceDims({ width: SAMPLE_WIDTH, height: SAMPLE_HEIGHT });
      s.setResult(null);
      s.setResultUrl(null);
      s.setPhase('idle');
    } catch {
      s.setPhase('idle');
    }
  }

  async function handleFileSelected(browserFile: File) {
    s.setPhase('running');
    s.setError(null);
    s.setInvalidFile(null);
    s.setResult(null);
    if (s.resultUrl) {
      URL.revokeObjectURL(s.resultUrl);
      s.setResultUrl(null);
    }
    const inspected = await inspectAndDecodeImage(browserFile);
    if (!inspected.ok) {
      s.setInvalidFile({ name: browserFile.name });
      s.setFile(null);
      if (s.imageSrc) {
        URL.revokeObjectURL(s.imageSrc);
        s.setImageSrc(null);
      }
      s.setSourceDims({ width: 0, height: 0 });
      s.setPhase('error');
      s.setError({
        code: inspected.error.code,
        messageKey: inspected.error.code,
        details: { name: browserFile.name },
      });
      return;
    }
    if (s.imageSrc) URL.revokeObjectURL(s.imageSrc);
    s.setFile(inspected.value.file);
    s.setImageSrc(inspected.value.blobUrl);
    s.setSourceDims(inspected.value.dims);
    s.setPhase('idle');
  }

  return { loadSample, handleFileSelected, clearAll: () => resetMetadataState(s) };
}

function useMetadataDownloadActions(preset: ResolvedPreset, s: MetadataCoreState) {
  const executeClean = () => performClean(preset, s);

  async function executeCleanAndDownload() {
    const runRes = await executeClean();
    if (!runRes.ok) return;
    const data = runRes.value;
    downloadBytes(data.bytes, data.fileName, MIME_MAP[data.outputFormat] ?? 'image/jpeg');
  }

  function downloadResult() {
    if (!s.result) return;
    downloadBytes(
      s.result.bytes,
      s.result.fileName,
      MIME_MAP[s.result.outputFormat] ?? 'image/jpeg',
    );
  }

  return { executeClean, executeCleanAndDownload, downloadResult };
}

export function useImageMetadataRemover(
  preset: ResolvedPreset,
  onPhase?: (phase: FilePhase) => void,
) {
  const s = useMetadataCoreState(onPhase);
  const fileActions = useMetadataFileSelection(s);
  const downloadActions = useMetadataDownloadActions(preset, s);

  return {
    file: s.file,
    invalidFile: s.invalidFile,
    imageSrc: s.imageSrc,
    sourceDims: s.sourceDims,
    outputFormat: s.outputFormat,
    setOutputFormat: s.setOutputFormat,
    quality: s.quality,
    setQuality: s.setQuality,
    customFileName: s.customFileName,
    setCustomFileName: s.setCustomFileName,
    phase: s.phase,
    result: s.result,
    resultUrl: s.resultUrl,
    error: s.error,
    warnings: s.warnings,
    ...fileActions,
    ...downloadActions,
  };
}

export type UseImageMetadataRemoverReturn = ReturnType<typeof useImageMetadataRemover>;
