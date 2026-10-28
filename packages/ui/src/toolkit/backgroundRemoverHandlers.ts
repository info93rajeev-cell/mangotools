import type { OpError } from '@mangotools/core';
import { track } from '@mangotools/runtime';
import type { ResolvedPreset } from '@mangotools/schemas';
import type { FilePhase } from '../archetypes/useFileTool.ts';
import { downloadBytes } from './actions.ts';
import { FORMAT_MIME_MAP } from './backgroundRemoverDownload.ts';
import type { BgRunConfig } from './backgroundRemoverWorker.ts';
import {
  type BgState,
  dispatchRemoval,
  type ImageBackgroundRemoverResultData,
} from './useImageBackgroundRemover.ts';

export async function handleRun(
  s: BgState,
  preset: ResolvedPreset,
  _toolId: string,
  onPhase: (phase: FilePhase) => void,
  notify: (msg: string) => void,
): Promise<ImageBackgroundRemoverResultData | null> {
  if (s.invalidFile) {
    const errRes: OpError = {
      code: 'IMAGE_INVALID_FILE_TYPE',
      messageKey: 'IMAGE_INVALID_FILE_TYPE',
      details: { name: s.invalidFile.name },
    };
    s.setError(errRes);
    s.setPhase('error');
    onPhase('error');
    return null;
  }
  if (!s.file) {
    if (s.error) return null;
    notify('Please select an image first');
    return null;
  }
  s.setPhase('running');
  onPhase('running');
  s.setError(null);

  const cfg: BgRunConfig = {
    preset,
    file: s.file,
    removalMode: s.removalMode,
    outputFormat: s.outputFormat,
    quality: s.quality,
    tolerance: s.tolerance,
    feather: s.feather,
    targetColor: s.targetColor,
    replacementBackground: s.replacementBackground,
    customFileName: s.customFileName,
  };

  const isNode = typeof window === 'undefined' || typeof Image === 'undefined';
  const outcome = await dispatchRemoval(s, cfg, isNode);
  s.setProgressInfo(null);

  if (!outcome.ok) {
    s.setError(outcome.error);
    s.setPhase('error');
    onPhase('error');
    notify(`Background removal failed: ${outcome.error.code}`);
    return null;
  }

  if (s.resultUrl) URL.revokeObjectURL(s.resultUrl);
  const safeBuffer = outcome.value.bytes.buffer.slice(
    outcome.value.bytes.byteOffset,
    outcome.value.bytes.byteOffset + outcome.value.bytes.byteLength,
  ) as ArrayBuffer;
  const mime = FORMAT_MIME_MAP[outcome.value.outputFormat] ?? 'image/png';
  s.setResultUrl(URL.createObjectURL(new Blob([safeBuffer], { type: mime })));
  s.setResult(outcome.value);
  s.setPhase('result');
  onPhase('result');
  if (outcome.value.warnings?.some((w) => w.code === 'NO_CLEAR_FOREGROUND')) {
    notify('No distinct foreground subject detected.');
  } else {
    notify('Background removed successfully');
  }
  return outcome.value;
}

export async function handleRunAndDownload(
  s: BgState,
  preset: ResolvedPreset,
  toolId: string,
  onPhase: (phase: FilePhase) => void,
  notify: (msg: string) => void,
) {
  if (s.invalidFile) {
    const errRes: OpError = {
      code: 'IMAGE_INVALID_FILE_TYPE',
      messageKey: 'IMAGE_INVALID_FILE_TYPE',
      details: { name: s.invalidFile.name },
    };
    s.setError(errRes);
    s.setPhase('error');
    onPhase('error');
    return;
  }
  if (s.error) return;
  if (s.result && s.phase === 'result') {
    downloadBytes(
      s.result.bytes,
      s.result.fileName,
      FORMAT_MIME_MAP[s.result.outputFormat] ?? 'image/png',
    );
    track('tool_complete', { toolId, method: 'download' });
    return;
  }
  const res = await handleRun(s, preset, toolId, onPhase, notify);
  if (!res) return;
  downloadBytes(res.bytes, res.fileName, FORMAT_MIME_MAP[res.outputFormat] ?? 'image/png');
  track('tool_complete', { toolId, method: 'download' });
}
