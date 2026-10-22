import type { LoadResult } from './containerWorkspaceModel.ts';

type Project = (point: readonly [number, number, number]) => string;
/** Cutaway container skin surrounds, but never alters, the placement coordinates. */
export function ContainerShell({ result, project }: { result: LoadResult; project: Project }) {
  const l = Number(result.containerLength),
    w = Number(result.containerWidth),
    h = Number(result.containerHeight);
  const polygon = (points: readonly (readonly [number, number, number])[]) =>
    points.map(project).join(' ');
  return (
    <g>
      <defs>
        <linearGradient id="container-steel" x2="0" y2="1">
          <stop stop-color="#8fa5b8" />
          <stop offset="1" stop-color="#c4d0da" />
        </linearGradient>
        <linearGradient id="container-blue" x2="0" y2="1">
          <stop stop-color="#3185ce" />
          <stop offset="1" stop-color="#07549a" />
        </linearGradient>
        <pattern id="carton-grain" width="8" height="8" patternUnits="userSpaceOnUse">
          <path d="M0 2h8M0 6h8" stroke="#fff" stroke-opacity=".1" />
        </pattern>
      </defs>
      <polygon
        points={polygon([
          [0, w, 0],
          [l, w, 0],
          [l, w, h],
          [0, w, h],
        ])}
        fill="url(#container-steel)"
        stroke="#456177"
        stroke-width="3"
      />
      {Array.from({ length: 35 }, (_, i) => (
        <polyline
          key={i}
          points={polygon([
            [(l * i) / 34, w, 0],
            [(l * i) / 34, w, h],
          ])}
          fill="none"
          stroke="#70899e"
          stroke-width="2"
          opacity=".6"
        />
      ))}
      <polygon
        points={polygon([
          [0, 0, 0],
          [l, 0, 0],
          [l, w, 0],
          [0, w, 0],
        ])}
        fill="#9a8f77"
        stroke="#164b7e"
        stroke-width="4"
      />
      <polyline
        points={polygon([
          [0, w, h],
          [l, w, h],
        ])}
        stroke="url(#container-blue)"
        stroke-width="12"
      />
      <polyline
        points={polygon([
          [0, 0, h],
          [0, w, h],
          [0, w, 0],
        ])}
        fill="none"
        stroke="#276aa1"
        stroke-width="8"
      />
    </g>
  );
}
export function ContainerFrame({ result, project }: { result: LoadResult; project: Project }) {
  const l = Number(result.containerLength),
    h = Number(result.containerHeight);
  const a = project([0, 0, 0]),
    b = project([l, 0, 0]),
    c = project([l, 0, h]),
    d = project([0, 0, h]);
  return (
    <g fill="none" stroke="#1463a5" stroke-width="9" stroke-linejoin="round">
      <polyline points={`${d} ${a} ${b} ${c}`} />
      <polyline points={`${d} ${c}`} stroke-width="7" />
      <polyline points={`${a} ${b}`} stroke="#073b72" stroke-width="13" />
    </g>
  );
}
