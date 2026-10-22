import { lazy, Suspense } from 'preact/compat';

const Workspace = lazy(() =>
  import('./ContainerLoadingLayout.tsx').then((module) => ({
    default: module.ContainerLoadingLayout,
  })),
);
/** Reserved preset identity. Tools-lane activation is separate from the UI implementation. */
export function DynamicContainerLoadingLayout() {
  return (
    <Suspense fallback={null}>
      <Workspace />
    </Suspense>
  );
}
