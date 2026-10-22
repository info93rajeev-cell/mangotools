import { ContainerCargo, ContainerMaterials } from './ContainerCargo.tsx';
import { ContainerFrame, ContainerShell } from './ContainerShell.tsx';
import { type LoadView, projector, visiblePieces } from './containerPlacementGeometry.ts';
import type { LoadResult } from './containerWorkspaceModel.ts';
import { containerText as t } from './containerWorkspaceStrings.ts';
export function ContainerCalculatedView({
  result,
  selected,
  view,
}: {
  result: LoadResult;
  selected: number;
  view: LoadView;
}) {
  const blocks = result.blocks.filter((b) => b.container === selected),
    project = projector(result, view);
  return (
    <>
      <svg viewBox="0 0 800 300" role="img" aria-label={t.actual} data-placement-view={view}>
        <ContainerMaterials />
        <ContainerShell result={result} project={project} />
        {visiblePieces(blocks)
          .sort((a, b) => Number(b.y) - Number(a.y) || Number(a.z) - Number(b.z))
          .map((b, index) => (
            <ContainerCargo key={index} block={b} project={project} />
          ))}
        <ContainerFrame result={result} project={project} doors={view === 'iso'} />
      </svg>
      {blocks.reduce((sum, b) => sum + b.count, 0) > 250 ? <p>{t.visualLimit}</p> : null}
    </>
  );
}
