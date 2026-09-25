import { parseOperationRef } from '@mangotools/core';
import { ABORTED, type RunOutcome, type WorkerLike, type WorkerResponse } from './protocol.ts';

export interface WorkerHost {
  run(
    operationId: string,
    input: unknown,
    params: unknown,
    signal?: AbortSignal,
  ): Promise<RunOutcome>;
  dispose(): void;
}

const INTERNAL: RunOutcome = {
  ok: false,
  error: { code: 'INTERNAL_ERROR', messageKey: 'errors.INTERNAL_ERROR' },
};

/** Runs operations in one worker per engine, created on first use. */
export function createWorkerHost(createWorker: (engineId: string) => WorkerLike): WorkerHost {
  const workers = new Map<string, WorkerLike>();
  const pending = new Map<number, { engineId: string; resolve: (o: RunOutcome) => void }>();
  let nextId = 1;

  const settle = (id: number, outcome: RunOutcome) => {
    const entry = pending.get(id);
    if (!entry) return;
    pending.delete(id);
    entry.resolve(outcome);
  };

  const workerFor = (engineId: string) => {
    let worker = workers.get(engineId);
    if (worker) return worker;
    worker = createWorker(engineId);
    worker.onmessage = ({ data }: { data: WorkerResponse }) => {
      settle(
        data.id,
        data.ok
          ? { ok: true, value: data.value, warnings: data.warnings }
          : { ok: false, error: data.error },
      );
    };
    worker.onerror = () => {
      for (const [id, entry] of pending) if (entry.engineId === engineId) settle(id, INTERNAL);
      workers.delete(engineId);
    };
    workers.set(engineId, worker);
    return worker;
  };

  return {
    run(operationId, input, params, signal) {
      if (signal?.aborted) return Promise.resolve({ ok: false, error: ABORTED });
      const { engineId } = parseOperationRef(operationId);
      const worker = workerFor(engineId);
      const id = nextId++;
      return new Promise<RunOutcome>((resolve) => {
        pending.set(id, { engineId, resolve });
        signal?.addEventListener(
          'abort',
          () => {
            if (!pending.has(id)) return;
            worker.postMessage({ id, type: 'abort' });
            settle(id, { ok: false, error: ABORTED });
          },
          { once: true },
        );
        worker.postMessage({ id, type: 'run', operationId, input, params });
      });
    },
    dispose() {
      for (const worker of workers.values()) worker.terminate();
      workers.clear();
      for (const id of [...pending.keys()]) settle(id, { ok: false, error: ABORTED });
    },
  };
}

let shared: WorkerHost | null = null;

/** The page-wide host backed by real module workers. */
export function getWorkerHost(): WorkerHost {
  shared ??= createWorkerHost(
    () =>
      new Worker(new URL('./engine.worker.ts', import.meta.url), {
        type: 'module',
      }) as unknown as WorkerLike,
  );
  return shared;
}
