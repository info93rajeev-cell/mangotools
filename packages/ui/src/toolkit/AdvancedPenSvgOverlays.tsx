import styles from './advancedPenSelection.module.css';
import type { BezierPoint } from './bezierPathModel.ts';

export function SvgCalloutBadge({ anchor }: { anchor: BezierPoint }) {
  return (
    <g class={styles.calloutGroup} pointerEvents="none">
      <path
        d={`M ${anchor.x + 90} ${anchor.y - 40} Q ${anchor.x + 40} ${anchor.y - 30} ${anchor.x + 10} ${anchor.y}`}
        fill="none"
        stroke="#ec4899"
        strokeWidth="2.5"
        strokeLinecap="round"
        markerEnd="url(#arrowhead)"
      />
      <defs>
        <marker id="arrowhead" markerWidth="8" markerHeight="8" refX="5" refY="4" orient="auto">
          <polygon points="0 1, 8 4, 0 7" fill="#ec4899" />
        </marker>
      </defs>
      <rect
        x={anchor.x + 80}
        y={anchor.y - 85}
        width="230"
        height="42"
        rx="8"
        fill="#fce7f3"
        stroke="#f472b6"
        strokeWidth="1.5"
      />
      <text
        x={anchor.x + 92}
        y={anchor.y - 69}
        fill="#be185d"
        fontSize="11"
        fontWeight="700"
        fontFamily="Inter, sans-serif"
      >
        Editable pen tool path
      </text>
      <text
        x={anchor.x + 92}
        y={anchor.y - 54}
        fill="#be185d"
        fontSize="10"
        fontFamily="Inter, sans-serif"
      >
        with anchor points and handles
      </text>
    </g>
  );
}

export function SvgTangentHandles({
  selectedPt,
  selectedPointIndex,
  onHandleMouseDown,
}: {
  selectedPt: BezierPoint;
  selectedPointIndex: number;
  onHandleMouseDown: (idx: number, type: 'cp1' | 'cp2', e: MouseEvent) => void;
}) {
  return (
    <g class={styles.handlesGroup}>
      <line
        x1={selectedPt.x}
        y1={selectedPt.y}
        x2={selectedPt.cp1x}
        y2={selectedPt.cp1y}
        stroke="#3b82f6"
        strokeWidth="1.5"
      />
      {/* biome-ignore lint/a11y/noStaticElementInteractions: Control handle manipulation */}
      <circle
        cx={selectedPt.cp1x}
        cy={selectedPt.cp1y}
        r="4.5"
        fill="#ffffff"
        stroke="#2563eb"
        strokeWidth="2"
        class={styles.handleCircle}
        onMouseDown={(e) => onHandleMouseDown(selectedPointIndex, 'cp1', e)}
      />
      <line
        x1={selectedPt.x}
        y1={selectedPt.y}
        x2={selectedPt.cp2x}
        y2={selectedPt.cp2y}
        stroke="#3b82f6"
        strokeWidth="1.5"
      />
      {/* biome-ignore lint/a11y/noStaticElementInteractions: Control handle manipulation */}
      <circle
        cx={selectedPt.cp2x}
        cy={selectedPt.cp2y}
        r="4.5"
        fill="#ffffff"
        stroke="#2563eb"
        strokeWidth="2"
        class={styles.handleCircle}
        onMouseDown={(e) => onHandleMouseDown(selectedPointIndex, 'cp2', e)}
      />
    </g>
  );
}

export function SvgAnchorPoints({
  points,
  selectedPointIndex,
  onNodeClick,
  onNodeMouseDown,
}: {
  points: BezierPoint[];
  selectedPointIndex: number | null;
  onNodeClick: (idx: number, e: MouseEvent) => void;
  onNodeMouseDown: (idx: number, e: MouseEvent) => void;
}) {
  return (
    <g>
      {points.map((pt, idx) => {
        const isSelected = idx === selectedPointIndex;
        return (
          // biome-ignore lint/a11y/noStaticElementInteractions: Bezier anchor point interaction
          <circle
            key={pt.id}
            cx={pt.x}
            cy={pt.y}
            r={isSelected ? '6.5' : '4.5'}
            fill={isSelected ? '#3b82f6' : '#ffffff'}
            stroke={isSelected ? '#1d4ed8' : '#2563eb'}
            strokeWidth={isSelected ? '2.5' : '2'}
            class={styles.anchorNode}
            onClick={(e) => onNodeClick(idx, e)}
            onMouseDown={(e) => onNodeMouseDown(idx, e)}
          />
        );
      })}
    </g>
  );
}
