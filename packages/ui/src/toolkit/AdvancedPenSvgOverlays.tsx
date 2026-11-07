import styles from './advancedPenSelection.module.css';
import type { BezierPoint } from './bezierPathModel.ts';

/** `k` = image pixels per screen pixel, so markers keep the same on-screen size at any zoom. */
type HandleKind = 'cp1' | 'cp2';

function hasHandle(p: BezierPoint, kind: HandleKind): boolean {
  return kind === 'cp1' ? p.cp1x !== p.x || p.cp1y !== p.y : p.cp2x !== p.x || p.cp2y !== p.y;
}

function Handle({
  point,
  kind,
  k,
  onDown,
}: {
  point: BezierPoint;
  kind: HandleKind;
  k: number;
  onDown: (kind: HandleKind, e: PointerEvent) => void;
}) {
  if (!hasHandle(point, kind)) return null;
  const hx = kind === 'cp1' ? point.cp1x : point.cp2x;
  const hy = kind === 'cp1' ? point.cp1y : point.cp2y;
  return (
    <g>
      <line
        x1={point.x}
        y1={point.y}
        x2={hx}
        y2={hy}
        stroke="#3b82f6"
        stroke-width={1.5 * k}
        pointer-events="none"
      />
      <circle
        cx={hx}
        cy={hy}
        r={6 * k}
        fill="#ffffff"
        stroke="#2563eb"
        stroke-width={2 * k}
        class={styles.handleCircle}
        data-handle={kind}
        onPointerDown={(e) => onDown(kind, e)}
      />
    </g>
  );
}

/** Direction handles of the selected point; drag them to bend the curve. */
export function SvgTangentHandles({
  selectedPt,
  selectedPointIndex,
  k,
  onHandlePointerDown,
}: {
  selectedPt: BezierPoint;
  selectedPointIndex: number;
  k: number;
  onHandlePointerDown: (idx: number, type: HandleKind, e: PointerEvent) => void;
}) {
  const onDown = (kind: HandleKind, e: PointerEvent) =>
    onHandlePointerDown(selectedPointIndex, kind, e);
  return (
    <g class={styles.handlesGroup}>
      <Handle point={selectedPt} kind="cp1" k={k} onDown={onDown} />
      <Handle point={selectedPt} kind="cp2" k={k} onDown={onDown} />
    </g>
  );
}

function Anchor({
  pt,
  idx,
  isSelected,
  closeTarget,
  k,
  onDown,
}: {
  pt: BezierPoint;
  idx: number;
  isSelected: boolean;
  closeTarget: boolean;
  k: number;
  onDown: (idx: number, e: PointerEvent) => void;
}) {
  const half = (isSelected ? 6 : 5) * k;
  const fill = isSelected ? '#2563eb' : closeTarget ? '#dcfce7' : '#ffffff';
  return (
    <rect
      x={pt.x - half}
      y={pt.y - half}
      width={half * 2}
      height={half * 2}
      fill={fill}
      stroke={closeTarget ? '#16a34a' : '#1d4ed8'}
      stroke-width={(closeTarget ? 3 : 2) * k}
      class={styles.anchorNode}
      data-anchor={idx}
      data-close-target={closeTarget ? '' : undefined}
      onPointerDown={(e) => onDown(idx, e)}
    >
      <title>
        {closeTarget
          ? 'Click to close the path'
          : 'Drag to move. Double-click: curve ⇄ corner point'}
      </title>
    </rect>
  );
}

export function SvgAnchorPoints({
  points,
  selectedPointIndex,
  closableFirst,
  k,
  onNodePointerDown,
}: {
  points: BezierPoint[];
  selectedPointIndex: number | null;
  /** The first point is highlighted when clicking it would close the path. */
  closableFirst: boolean;
  k: number;
  onNodePointerDown: (idx: number, e: PointerEvent) => void;
}) {
  return (
    <g>
      {points.map((pt, idx) => (
        <Anchor
          key={pt.id}
          pt={pt}
          idx={idx}
          isSelected={idx === selectedPointIndex}
          closeTarget={closableFirst && idx === 0}
          k={k}
          onDown={onNodePointerDown}
        />
      ))}
    </g>
  );
}
