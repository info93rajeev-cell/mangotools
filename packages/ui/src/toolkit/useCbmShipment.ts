import { getWorkerHost, type RunFn } from '@mangotools/runtime';
import { useEffect, useState } from 'preact/hooks';
import { createCbmController } from './cbmShipmentController.ts';

const workerRun: RunFn = (...args) => getWorkerHost().run(...args);
export function useCbmShipment(run: RunFn = workerRun) {
  const [controller] = useState(() => createCbmController(run));
  const [snapshot, setSnapshot] = useState(controller.get());
  useEffect(() => {
    const unsubscribe = controller.subscribe(setSnapshot);
    void controller.calculate();
    return () => {
      unsubscribe();
      controller.dispose();
    };
  }, [controller]);
  return [snapshot, controller] as const;
}
