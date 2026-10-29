import type { OpWarning } from '@mangotools/core';
import { useCallback, useState } from 'preact/hooks';
import type { FilePhase } from '../archetypes/useFileTool.ts';
import type { AspectRatioPreset, PixelRect } from './imageWorkbenchGeometry.ts';
import type {
  PassportFile,
  PassportOutputFormat,
  PassportPhotoResultData,
} from './passportPhotoPresets.ts';

export function resolveAspectRatioPreset(
  targetWidth: number,
  targetHeight: number,
): AspectRatioPreset {
  if (targetWidth <= 0 || targetHeight <= 0) return '35:45';
  const ratio = targetWidth / targetHeight;
  if (Math.abs(ratio - 1) < 0.05) return '1:1';
  if (Math.abs(ratio - 35 / 45) < 0.05) return '35:45';
  if (Math.abs(ratio - 4 / 3) < 0.05) return '4:3';
  if (Math.abs(ratio - 16 / 9) < 0.05) return '16:9';
  return '35:45';
}

// biome-ignore lint/complexity/noExcessiveLinesPerFunction: Hook state management
export function usePassportPhotoState(onPhase: (phase: FilePhase) => void) {
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

export type PassportPhotoState = ReturnType<typeof usePassportPhotoState>;
