import type { OpError, OpWarning } from '@mangotools/core';
import { getWorkerHost, track } from '@mangotools/runtime';
import type { ResolvedPreset } from '@mangotools/schemas';
import { useState } from 'preact/hooks';
import { t } from '../strings/en.ts';
import { downloadBytes, readFileBytes } from '../toolkit/actions.ts';
import { moveItem, type QueuedFile } from './FileQueue.tsx';

export type FilePhase = 'idle' | 'running' | 'result' | 'error';

export interface MergeResult {
  fileName: string;
  fileCount: number;
  totalPageCount: number;
  bytes: Uint8Array;
  warnings: OpWarning[];
}

const nextId = () =>
  typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

async function toQueuedFiles(list: FileList | File[]): Promise<QueuedFile[]> {
  return Promise.all(
    Array.from(list).map(async (file) => ({
      id: nextId(),
      name: file.name,
      size: file.size,
      bytes: await readFileBytes(file),
    })),
  );
}

function runOperation(preset: ResolvedPreset, files: QueuedFile[], outputFileName: string) {
  const input: Record<string, unknown> = {
    files: files.map((f) => ({ name: f.name, bytes: f.bytes })),
  };
  if (outputFileName.trim() !== '') input.outputFileName = outputFileName;
  return getWorkerHost().run(preset.operation, input, preset.params);
}

export interface FileToolState {
  files: QueuedFile[];
  outputFileName: string;
  phase: FilePhase;
  result: MergeResult | null;
  error: OpError | null;
  addFiles(list: FileList | File[]): Promise<void>;
  removeFile(id: string): void;
  moveFile(id: string, direction: -1 | 1): void;
  clearAll(): void;
  setOutputFileName(value: string): void;
  primaryAction(): void;
}

/** State and actions for a multi-file merge tool (archetype D): the queue, its order, and a run. */
export function useFileTool(
  preset: ResolvedPreset,
  toolId: string,
  notify: (message: string) => void,
  onPhase: (phase: FilePhase) => void,
): FileToolState {
  const [files, setFiles] = useState<QueuedFile[]>([]);
  const [outputFileName, setOutputFileNameState] = useState('');
  const [phase, setPhase] = useState<FilePhase>('idle');
  const [result, setResult] = useState<MergeResult | null>(null);
  const [error, setError] = useState<OpError | null>(null);

  const setPhaseAndNotify = (next: FilePhase) => {
    setPhase(next);
    onPhase(next);
  };
  const clearOutcome = () => {
    setResult(null);
    setError(null);
    setPhaseAndNotify('idle');
  };
  const download = (value: MergeResult) => {
    downloadBytes(value.bytes, value.fileName, 'application/pdf');
    notify(t('toast.downloaded', { name: value.fileName }));
    track('tool_complete', { toolId, method: 'download' });
  };
  const runMerge = async () => {
    setPhaseAndNotify('running');
    const outcome = await runOperation(preset, files, outputFileName);
    if (outcome.ok) {
      const merged: MergeResult = {
        ...(outcome.value as Omit<MergeResult, 'warnings'>),
        warnings: outcome.warnings,
      };
      setResult(merged);
      setError(null);
      setPhaseAndNotify('result');
      track('tool_run', { toolId });
      download(merged);
    } else {
      setError(outcome.error);
      setResult(null);
      setPhaseAndNotify('error');
    }
  };

  return {
    files,
    outputFileName,
    phase,
    result,
    error,
    async addFiles(list) {
      if (list.length === 0) return;
      const added = await toQueuedFiles(list);
      setFiles((prev) => [...prev, ...added]);
      clearOutcome();
    },
    removeFile(id) {
      setFiles((prev) => prev.filter((f) => f.id !== id));
      clearOutcome();
    },
    moveFile(id, direction) {
      setFiles((prev) => {
        const index = prev.findIndex((f) => f.id === id);
        return index === -1 ? prev : moveItem(prev, index, direction);
      });
      clearOutcome();
    },
    clearAll() {
      setFiles([]);
      setOutputFileNameState('');
      clearOutcome();
    },
    setOutputFileName(value) {
      setOutputFileNameState(value);
      clearOutcome();
    },
    primaryAction() {
      if (phase === 'result' && result) return download(result);
      void runMerge();
    },
  };
}
