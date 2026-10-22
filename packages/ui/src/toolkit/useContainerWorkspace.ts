import { getWorkerHost, type RunFn } from '@mangotools/runtime';
import { useEffect, useState } from 'preact/hooks';
import { createLoadController } from './containerWorkspaceController.ts';

const runWorker: RunFn = (...args) => getWorkerHost().run(...args);
export function useContainerWorkspace(run: RunFn = runWorker) {
  const [controller] = useState(() => createLoadController(run));
  const [state, setState] = useState(controller.get());
  useEffect(() => {
    const unsubscribe = controller.subscribe(setState);
    void controller.calculate();
    return () => {
      unsubscribe();
      controller.dispose();
    };
  }, [controller]);
  return [state, controller] as const;
}
