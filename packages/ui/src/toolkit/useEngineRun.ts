import type { OpError } from '@mangotools/core';
import { getWorkerHost } from '@mangotools/runtime';
import { useEffect, useRef, useState } from 'preact/hooks';

export interface EngineRun<T> {
  /** The latest successful result (kept while a newer run is in flight; null after an error). */
  value: T | null;
  /** The error of the latest run, if it failed. */
  error: OpError | null;
}

/**
 * Runs one engine operation in the worker whenever its input changes and keeps the newest answer.
 * Studios use this so every number they show comes from the tested engine, not page maths.
 * `input === null` means "not enough input yet": nothing runs and the last value is cleared.
 */
export function useEngineRun<T>(
  operationId: string,
  input: Record<string, unknown> | null,
  params: unknown,
): EngineRun<T> {
  const [state, setState] = useState<EngineRun<T>>({ value: null, error: null });
  const latest = useRef(0);
  const key = input === null ? '' : JSON.stringify(input);

  useEffect(() => {
    const id = ++latest.current;
    if (input === null) {
      setState({ value: null, error: null });
      return;
    }
    const controller = new AbortController();
    void getWorkerHost()
      .run(operationId, input, params, controller.signal)
      .then((outcome) => {
        if (id !== latest.current) return;
        if (outcome.ok) setState({ value: outcome.value as T, error: null });
        else if (outcome.error.code !== 'ABORTED') setState({ value: null, error: outcome.error });
      });
    return () => controller.abort();
  }, [operationId, key]);

  return state;
}
