import type { OpError, OpWarning } from '@mangotools/core';
import type { ResolvedPreset } from '@mangotools/schemas';
import type { RunOutcome } from './protocol.ts';
import {
  buildRequest,
  defaultValues,
  type FieldValue,
  type FieldValues,
  sampleValues,
} from './tool-input.ts';

export type ToolPhase = 'idle' | 'editing' | 'running' | 'result' | 'error';

export interface ToolSnapshot {
  phase: ToolPhase;
  values: FieldValues;
  /** The latest successful result; kept while the user edits so the layout does not jump. */
  result: { value: Record<string, unknown>; warnings: OpWarning[] } | null;
  error: OpError | null;
  missing: string[];
}

export type RunFn = (
  operationId: string,
  input: unknown,
  params: unknown,
  signal: AbortSignal,
) => Promise<RunOutcome>;

export interface Timer {
  set(fn: () => void, ms: number): unknown;
  clear(handle: unknown): void;
}

export interface ToolStoreOptions {
  preset: ResolvedPreset;
  run: RunFn;
  /** Live-compute delay after the last keystroke. */
  debounceMs?: number;
  timer?: Timer;
}

export interface ToolStore {
  get(): ToolSnapshot;
  subscribe(listener: (snapshot: ToolSnapshot) => void): () => void;
  set(key: string, value: FieldValue): void;
  setMany(values: FieldValues): void;
  loadSample(sampleId: string): Promise<void>;
  runNow(): Promise<void>;
  reset(): void;
  dispose(): void;
}

const defaultTimer: Timer = {
  set: (fn, ms) => setTimeout(fn, ms),
  clear: (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>),
};

interface Machine {
  listeners: Set<(s: ToolSnapshot) => void>;
  current(): ToolSnapshot;
  emit(next: Partial<ToolSnapshot>): void;
  compute(): Promise<void>;
  edited(): void;
  stop(): void;
}

function createMachine(options: ToolStoreOptions): Machine {
  const { preset, run } = options;
  const timer = options.timer ?? defaultTimer;
  const live = (preset.ui.compute ?? 'live') === 'live';
  const listeners = new Set<(s: ToolSnapshot) => void>();
  let snapshot: ToolSnapshot = {
    phase: 'idle',
    values: defaultValues(preset),
    result: null,
    error: null,
    missing: [],
  };
  let pendingTimer: unknown = null;
  let inflight: AbortController | null = null;
  let generation = 0;

  const emit = (next: Partial<ToolSnapshot>) => {
    snapshot = { ...snapshot, ...next };
    for (const listener of listeners) listener(snapshot);
  };
  const stop = () => {
    if (pendingTimer !== null) timer.clear(pendingTimer);
    pendingTimer = null;
    inflight?.abort();
    inflight = null;
    generation++;
  };
  const settle = (outcome: RunOutcome) => {
    if (outcome.ok) {
      const result = {
        value: outcome.value as Record<string, unknown>,
        warnings: outcome.warnings,
      };
      emit({ phase: 'result', result, error: null });
    } else if (outcome.error.code !== 'ABORTED') emit({ phase: 'error', error: outcome.error });
  };
  const compute = async () => {
    stop();
    const request = buildRequest(preset, snapshot.values);
    if (request.missing.length > 0)
      return emit({ phase: 'idle', result: null, error: null, missing: request.missing });
    const mine = generation;
    const controller = new AbortController();
    inflight = controller;
    emit({ phase: 'running', missing: [] });
    const outcome = await run(preset.operation, request.input, request.params, controller.signal);
    if (mine !== generation || controller.signal.aborted) return;
    inflight = null;
    settle(outcome);
  };
  const edited = () => {
    stop();
    emit({ phase: 'editing' });
    if (live) pendingTimer = timer.set(() => void compute(), options.debounceMs ?? 150);
  };
  return { listeners, current: () => snapshot, emit, compute, edited, stop };
}

/** State machine for one tool island: idle → editing → running → result | error. */
export function createToolStore(options: ToolStoreOptions): ToolStore {
  const { preset } = options;
  const m = createMachine(options);
  return {
    get: m.current,
    subscribe(listener) {
      m.listeners.add(listener);
      return () => m.listeners.delete(listener);
    },
    set(key, value) {
      m.emit({ values: { ...m.current().values, [key]: value } });
      m.edited();
    },
    setMany(values) {
      m.emit({ values: { ...m.current().values, ...values } });
      m.edited();
    },
    async loadSample(sampleId) {
      const values = sampleValues(preset, sampleId);
      if (!values) return;
      m.emit({ values });
      await m.compute();
    },
    runNow: m.compute,
    reset() {
      m.stop();
      m.emit({
        phase: 'idle',
        values: defaultValues(preset),
        result: null,
        error: null,
        missing: [],
      });
    },
    dispose() {
      m.stop();
      m.listeners.clear();
    },
  };
}
