import type { ResolvedPreset } from '@mangotools/schemas';
import { lazy, Suspense } from 'preact/compat';

const Workspace = lazy(() =>
  import('./CbmShipmentLayout.tsx').then((module) => ({ default: module.CbmShipmentLayout })),
);
export function DynamicCbmShipmentLayout({ preset }: { preset: ResolvedPreset }) {
  return (
    <Suspense fallback={null}>
      <Workspace preset={preset} />
    </Suspense>
  );
}
