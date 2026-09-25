import {
  type AnyOperation,
  type EngineModule,
  executeOperation,
  type OperationContext,
  parseOperationRef,
} from '@mangotools/core';
import type { WorkerRequest, WorkerResponse } from './protocol.ts';

export type EngineLoaders = Readonly<Record<string, () => Promise<EngineModule>>>;

/** Mutable per-request signal the handler flips when an abort message arrives. */
interface RequestSignal {
  aborted: boolean;
}

function findOperation(engine: EngineModule, ref: string): AnyOperation | undefined {
  const { id, major } = parseOperationRef(ref);
  return engine.operations.find((op) => op.id === id && op.major === major);
}

/**
 * The worker's message logic, independent of the Worker global so it can be tested in Node.
 * Returns a function that handles one request and resolves with the response to post (or null).
 */
export function createRequestHandler(
  loaders: EngineLoaders,
  makeContext: (signal: RequestSignal) => OperationContext,
) {
  const engines = new Map<string, Promise<EngineModule>>();
  const signals = new Map<number, RequestSignal>();

  const engineFor = (engineId: string) => {
    const load = loaders[engineId];
    if (!load) return null;
    let engine = engines.get(engineId);
    if (!engine) {
      engine = load();
      engines.set(engineId, engine);
    }
    return engine;
  };

  const run = async (request: Extract<WorkerRequest, { type: 'run' }>): Promise<WorkerResponse> => {
    const { engineId } = parseOperationRef(request.operationId);
    const engine = await engineFor(engineId);
    const op = engine ? findOperation(engine, request.operationId) : undefined;
    if (!op) {
      const details = { reason: 'unknown-operation' };
      return {
        id: request.id,
        ok: false,
        error: { code: 'INTERNAL_ERROR', messageKey: 'errors.INTERNAL_ERROR', details },
      };
    }
    const signal: RequestSignal = { aborted: false };
    signals.set(request.id, signal);
    try {
      const result = await executeOperation(op, request.input, request.params, makeContext(signal));
      return result.ok
        ? { id: request.id, ok: true, value: result.value, warnings: result.warnings }
        : { id: request.id, ok: false, error: result.error };
    } finally {
      signals.delete(request.id);
    }
  };

  return async (request: WorkerRequest): Promise<WorkerResponse | null> => {
    if (request.type === 'abort') {
      const signal = signals.get(request.id);
      if (signal) signal.aborted = true;
      return null;
    }
    return run(request);
  };
}
