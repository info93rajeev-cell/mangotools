import {
  createToolStore,
  getWorkerHost,
  type RunFn,
  type ToolSnapshot,
  type ToolStore,
} from '@mangotools/runtime';
import type { ResolvedPreset } from '@mangotools/schemas';
import { useEffect, useState } from 'preact/hooks';

const workerRun: RunFn = (operationId, input, params, signal) =>
  getWorkerHost().run(operationId, input, params, signal);

/** Creates the tool's store once and re-renders on every snapshot. */
export function useToolStore(
  preset: ResolvedPreset,
  run: RunFn = workerRun,
): [ToolSnapshot, ToolStore] {
  const [store] = useState(() => createToolStore({ preset, run }));
  const [snapshot, setSnapshot] = useState(store.get());
  useEffect(() => {
    const unsubscribe = store.subscribe(setSnapshot);
    return () => {
      unsubscribe();
      store.dispose();
    };
  }, [store]);
  return [snapshot, store];
}
