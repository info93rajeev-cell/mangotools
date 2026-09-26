import type { OpError, OpWarning } from '@mangotools/core';
import type { FieldValues } from '@mangotools/runtime';
import { defaultValues, getWorkerHost, track } from '@mangotools/runtime';
import type { ResolvedPreset } from '@mangotools/schemas';
import { useEffect, useState } from 'preact/hooks';
import { t } from '../strings/en.ts';
import { downloadBytes, readFileBytes } from '../toolkit/actions.ts';
import { moveItem, type QueuedFile } from './FileQueue.tsx';

export type FilePhase = 'idle' | 'running' | 'result' | 'error';

/**
 * An archetype D operation's result: always a downloadable file plus whatever scalar fields the
 * preset's own `outputs` describe (`fileCount`/`totalPageCount` for PDF Merge, `imageCount` for
 * JPG to PDF, `outputWidth`/`outputHeight` for Image Resize, and so on) — rendered generically via
 * `outputRows`.
 */
export interface FileToolResult {
  fileName: string;
  bytes: Uint8Array;
  warnings: OpWarning[];
  [key: string]: unknown;
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

/**
 * Converts this tool's own local field/option state into the extra operation-input values a
 * preset with `fields`/`userOptions` needs alongside its file(s) — generic by field `kind`/control,
 * not specific to any one tool (used today by Image Resize's width/height/quality/format/aspect
 * toggle, reusable by any future single-file tool that needs typed inputs beyond a file queue).
 */
function fieldInputValue(field: ResolvedPreset['fields'][string], raw: string | boolean): unknown {
  if (field.kind === 'boolean') return raw === true || raw === 'true';
  // Only a plain 'number' field is sent as a JS number (image.resize@1's pixel dimensions); every
  // other kind — including 'enum', whose values are strings like "same"/"jpg" — is sent as-is,
  // matching archetype B's buildRequest (money/percent stay decimal strings for the engine to parse).
  return field.kind === 'number' ? Number(raw) : String(raw);
}

function extraInputValues(preset: ResolvedPreset, values: FieldValues): Record<string, unknown> {
  const extra: Record<string, unknown> = {};
  for (const [key, field] of Object.entries(preset.fields)) {
    const raw = values[key];
    if (raw === undefined || raw === '') continue;
    extra[key] = fieldInputValue(field, raw);
  }
  for (const [key, option] of Object.entries(preset.userOptions)) {
    const raw = values[key];
    if (raw === undefined) continue;
    extra[key] = option.control === 'switch' ? raw === true : String(raw);
  }
  return extra;
}

const IMAGE_FORMAT_MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

/** The result's own `outputFormat` (Image Resize) wins over the preset's static `ui.outputMime`
 * (PDF tools), since a single preset can now produce more than one output format. */
function resultMime(value: FileToolResult, presetMime: string | undefined): string {
  const format = typeof value.outputFormat === 'string' ? value.outputFormat : undefined;
  if (format && IMAGE_FORMAT_MIME[format]) return IMAGE_FORMAT_MIME[format];
  return presetMime ?? 'application/pdf';
}

function runOperation(
  preset: ResolvedPreset,
  files: QueuedFile[],
  outputFileName: string,
  values: FieldValues,
) {
  const maxFiles = preset.ui.maxFiles;
  const input: Record<string, unknown> = {
    ...extraInputValues(preset, values),
    ...(maxFiles === 1
      ? { file: files[0] ? { name: files[0].name, bytes: files[0].bytes } : undefined }
      : { files: files.map((f) => ({ name: f.name, bytes: f.bytes })) }),
  };
  if (outputFileName.trim() !== '') input.outputFileName = outputFileName;
  return getWorkerHost().run(preset.operation, input, preset.params);
}

/** Object-URL preview of the single queued file, for single-file tools only; revoked on change/unmount. */
function useSingleFilePreview(preset: ResolvedPreset, files: QueuedFile[]) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const single = preset.ui.maxFiles === 1 ? files[0] : undefined;
  useEffect(() => {
    if (!single) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(new Blob([single.bytes as BlobPart]));
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [single?.id]);
  return previewUrl;
}

export interface FileToolState {
  files: QueuedFile[];
  outputFileName: string;
  values: FieldValues;
  previewUrl: string | null;
  phase: FilePhase;
  result: FileToolResult | null;
  error: OpError | null;
  addFiles(list: FileList | File[]): Promise<void>;
  removeFile(id: string): void;
  moveFile(id: string, direction: -1 | 1): void;
  clearAll(): void;
  setOutputFileName(value: string): void;
  setValue(key: string, value: string | boolean): void;
  onPreviewLoad(width: number, height: number): void;
  primaryAction(): void;
}

interface QueueActionDeps {
  preset: ResolvedPreset;
  maxFiles: number | undefined;
  setFiles: (update: (prev: QueuedFile[]) => QueuedFile[]) => void;
  setOutputFileNameState: (value: string) => void;
  setValues: (update: (prev: FieldValues) => FieldValues) => void;
  clearOutcome: () => void;
}

/** The queue/field mutators shared by every file tool, independent of the run/download logic. */
function queueActions({
  preset,
  maxFiles,
  setFiles,
  setOutputFileNameState,
  setValues,
  clearOutcome,
}: QueueActionDeps) {
  return {
    async addFiles(list: FileList | File[]) {
      if (list.length === 0) return;
      const added = await toQueuedFiles(list);
      setFiles((prev) => (maxFiles === 1 ? added.slice(0, 1) : [...prev, ...added]));
      clearOutcome();
    },
    removeFile(id: string) {
      setFiles((prev) => prev.filter((f) => f.id !== id));
      clearOutcome();
    },
    moveFile(id: string, direction: -1 | 1) {
      setFiles((prev) => {
        const index = prev.findIndex((f) => f.id === id);
        return index === -1 ? prev : moveItem(prev, index, direction);
      });
      clearOutcome();
    },
    clearAll() {
      setFiles(() => []);
      setOutputFileNameState('');
      setValues(() => defaultValues(preset));
      clearOutcome();
    },
    setOutputFileName(value: string) {
      setOutputFileNameState(value);
      clearOutcome();
    },
    setValue(key: string, value: string | boolean) {
      setValues((prev) => ({ ...prev, [key]: value }));
      clearOutcome();
    },
    onPreviewLoad(width: number, height: number) {
      setValues((prev) => ({ ...prev, targetWidth: String(width), targetHeight: String(height) }));
    },
  };
}

/** State and actions for a file tool (archetype D): the queue, its order, extra fields, and a run. */
export function useFileTool(
  preset: ResolvedPreset,
  toolId: string,
  notify: (message: string) => void,
  onPhase: (phase: FilePhase) => void,
): FileToolState {
  const [files, setFiles] = useState<QueuedFile[]>([]);
  const [outputFileName, setOutputFileNameState] = useState('');
  const [values, setValues] = useState<FieldValues>(() => defaultValues(preset));
  const [phase, setPhase] = useState<FilePhase>('idle');
  const [result, setResult] = useState<FileToolResult | null>(null);
  const [error, setError] = useState<OpError | null>(null);
  const previewUrl = useSingleFilePreview(preset, files);

  const setPhaseAndNotify = (next: FilePhase) => {
    setPhase(next);
    onPhase(next);
  };
  const clearOutcome = () => {
    setResult(null);
    setError(null);
    setPhaseAndNotify('idle');
  };
  const download = (value: FileToolResult) => {
    downloadBytes(value.bytes, value.fileName, resultMime(value, preset.ui.outputMime));
    notify(t('toast.downloaded', { name: value.fileName }));
    track('tool_complete', { toolId, method: 'download' });
  };
  const runConversion = async () => {
    setPhaseAndNotify('running');
    const outcome = await runOperation(preset, files, outputFileName, values);
    if (outcome.ok) {
      const value = {
        ...(outcome.value as Record<string, unknown>),
        warnings: outcome.warnings,
      } as FileToolResult;
      setResult(value);
      setError(null);
      setPhaseAndNotify('result');
      track('tool_run', { toolId });
      download(value);
    } else {
      setError(outcome.error);
      setResult(null);
      setPhaseAndNotify('error');
    }
  };

  return {
    files,
    outputFileName,
    values,
    previewUrl,
    phase,
    result,
    error,
    ...queueActions({
      preset,
      maxFiles: preset.ui.maxFiles,
      setFiles,
      setOutputFileNameState,
      setValues,
      clearOutcome,
    }),
    primaryAction() {
      if (phase === 'result' && result) return download(result);
      void runConversion();
    },
  };
}
