import type { OpError, OpWarning } from '@mangotools/core';

/** Main thread → worker. */
export type WorkerRequest =
  | { id: number; type: 'run'; operationId: string; input: unknown; params: unknown }
  | { id: number; type: 'abort' };

/** Worker → main thread. */
export type WorkerResponse =
  | { id: number; ok: true; value: unknown; warnings: OpWarning[] }
  | { id: number; ok: false; error: OpError };

/** What a caller receives for one run. */
export type RunOutcome =
  | { ok: true; value: unknown; warnings: OpWarning[] }
  | { ok: false; error: OpError };

/** The part of a Worker the host uses; lets tests run the protocol in-process. */
export interface WorkerLike {
  postMessage(message: WorkerRequest): void;
  onmessage: ((event: { data: WorkerResponse }) => void) | null;
  onerror?: ((event: unknown) => void) | null;
  terminate(): void;
}

export const ABORTED: OpError = { code: 'ABORTED', messageKey: 'errors.ABORTED' };
