import { boxFaces } from './containerPlacementGeometry.ts';
import type { PlacementBlock } from './containerWorkspaceModel.ts';

type Project = (p: readonly [number, number, number]) => string;
/** Surface details are decorative; all visible box extents come from placement. */
export function ContainerCargo({ block: b, project }: { block: PlacementBlock; project: Project }) {
  const x = Number(b.x),
    y = Number(b.y),
    z = Number(b.z),
    l = Number(b.pieceLength),
    h = Number(b.pieceHeight);
  const point = (a: number, c: number) => project([x + a, y, z + c]);
  const tape = [
    point(l * 0.45, 0),
    point(l * 0.55, 0),
    point(l * 0.55, h),
    point(l * 0.45, h),
  ].join(' ');
  const crate = b.package % 4 === 2;
  return (
    <g data-placement-block={b.package}>
      {boxFaces(b, project).map((face, i) => (
        <g key={i}>
          <polygon
            points={face}
            fill={
              crate ? ['#bc8a53', '#966834', '#e2b57c'][i] : ['#c89e6b', '#ac7f4c', '#e1bd8a'][i]
            }
            stroke="#795831"
            stroke-width=".8"
          />
          <polygon points={face} fill={crate ? 'url(#crate-wood)' : 'url(#cardboard-fibre)'} />
        </g>
      ))}
      <polygon points={tape} fill="#e3c99b" opacity=".55" />
      {crate
        ? [0.08, 0.92].map((a) => (
            <polyline
              key={a}
              points={`${point(l * a, 0)} ${point(l * a, h)}`}
              stroke="#dfb17b"
              stroke-width="4"
            />
          ))
        : null}
      <polyline
        points={`${point(l * 0.12, h * 0.12)} ${point(l * 0.25, h * 0.12)} ${point(l * 0.25, h * 0.22)}`}
        fill="none"
        stroke="#624827"
        stroke-width="1"
      />
    </g>
  );
}
export function ContainerMaterials() {
  return (
    <defs>
      <pattern id="cardboard-fibre" width="6" height="7" patternUnits="userSpaceOnUse">
        <path d="M0 1h4M2 4h3" stroke="#724815" stroke-opacity=".09" stroke-width=".5" />
      </pattern>
      <pattern id="crate-wood" width="13" height="23" patternUnits="userSpaceOnUse">
        <path d="M1 0v23M3 0v23M10 0v23" stroke="#74491f" stroke-width=".7" opacity=".4" />
        <path d="M6 0q-4 9 0 23" stroke="#f9d19c" fill="none" opacity=".35" />
      </pattern>
    </defs>
  );
}
