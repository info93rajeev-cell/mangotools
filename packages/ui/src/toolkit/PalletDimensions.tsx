import { iso } from './PalletIsometricView.tsx';
import styles from './pallet3DCanvas.module.css';

const fmtCm = (v: number) => `${Math.round(v * 10) / 10} cm`;

/** Length, width and loaded height marked beside the pallet, as in the approved reference. */
export function PalletDimensions(props: {
  pL: number;
  pW: number;
  top: number;
  scale: number;
  ox: number;
  oy: number;
}) {
  const { pL, pW, top, scale, ox, oy } = props;
  const gap = 16;
  const a = iso(0, pW + gap, 0, scale, ox, oy);
  const b = iso(pL, pW + gap, 0, scale, ox, oy);
  const c = iso(pL + gap, 0, 0, scale, ox, oy);
  const d = iso(pL + gap, pW, 0, scale, ox, oy);
  const h0 = iso(pL + gap, -gap * 0.2, 0, scale, ox, oy);
  const h1 = iso(pL + gap, -gap * 0.2, top, scale, ox, oy);
  const line = (p: { x: number; y: number }, q: { x: number; y: number }) => (
    <line
      x1={p.x}
      y1={p.y}
      x2={q.x}
      y2={q.y}
      class={styles.dimLine}
      stroke-width="1.1"
      marker-start="url(#palletDimArrow)"
      marker-end="url(#palletDimArrow)"
    />
  );
  const label = (
    p: { x: number; y: number },
    q: { x: number; y: number },
    text: string,
    dy: number,
  ) => (
    <text x={(p.x + q.x) / 2} y={(p.y + q.y) / 2 + dy} text-anchor="middle" class={styles.dimLabel}>
      {text}
    </text>
  );
  return (
    <g>
      <defs>
        <marker
          id="palletDimArrow"
          viewBox="0 0 10 10"
          refX="5"
          refY="5"
          markerWidth="5"
          markerHeight="5"
          orient="auto-start-reverse"
        >
          <path d="M0 0 L10 5 L0 10 z" class={styles.dimArrow} />
        </marker>
      </defs>
      {line(a, b)}
      {label(a, b, fmtCm(pL), 14)}
      {line(c, d)}
      {label(c, d, fmtCm(pW), 14)}
      {line(h0, h1)}
      <text x={h1.x + 6} y={(h0.y + h1.y) / 2} class={styles.dimLabel}>
        {fmtCm(top)}
      </text>
    </g>
  );
}
