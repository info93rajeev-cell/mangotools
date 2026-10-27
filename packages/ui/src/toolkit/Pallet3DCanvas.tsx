import { useState } from 'preact/hooks';
import styles from './pallet3DCanvas.module.css';
import type { PalletLoadingResult } from './palletLoadingModel.ts';

export type PalletViewAngle = '3d' | 'top' | 'side' | 'front';

interface Pallet3DCanvasProps {
  result: PalletLoadingResult;
  palletLength: number;
  palletWidth: number;
  boxLength: number;
  boxWidth: number;
  boxHeight: number;
}

// biome-ignore lint/complexity/noExcessiveLinesPerFunction: Studio canvas component
export function Pallet3DCanvas({
  result,
  palletLength,
  palletWidth,
  boxLength,
  boxWidth,
  boxHeight,
}: Pallet3DCanvasProps) {
  const [view, setView] = useState<PalletViewAngle>('3d');
  const [zoom, setZoom] = useState(1);
  const [showPhoto, setShowPhoto] = useState(false);

  const nx = Math.max(1, result.alongLength || 2);
  const ny = Math.max(1, result.alongWidth || 5);
  const nz = Math.max(1, Math.min(8, result.totalLayers || 5));

  const handleZoomIn = () => setZoom((z) => Math.min(1.6, z + 0.15));
  const handleZoomOut = () => setZoom((z) => Math.max(0.65, z - 0.15));
  const handleReset = () => {
    setZoom(1);
    setView('3d');
  };

  return (
    <div class={styles.card} data-pallet-3d-canvas="">
      <div class={styles.cardHead}>
        <span class={styles.cardTitle}>2. 3D Pallet View</span>
        <div class={styles.viewGroup}>
          {(['3d', 'top', 'side', 'front'] as const).map((angle) => (
            <button
              type="button"
              key={angle}
              class={`${styles.viewBtn} ${view === angle ? styles.viewBtnActive : ''}`}
              aria-pressed={view === angle}
              onClick={() => {
                setView(angle);
                setShowPhoto(false);
              }}
            >
              {angle === '3d' ? '3D' : angle.charAt(0).toUpperCase() + angle.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div class={styles.canvasWrap}>
        {showPhoto ? (
          <img
            src="/logistics/pallet-3d-sample.png"
            alt="3D Pallet load realistic render with boxes stacked on wooden pallet"
            class={styles.photoSample}
          />
        ) : view === '3d' ? (
          <SvgIsometricView
            nx={nx}
            ny={ny}
            nz={nz}
            palletL={palletLength}
            palletW={palletWidth}
            boxL={boxLength}
            boxW={boxWidth}
            boxH={boxHeight}
            zoom={zoom}
          />
        ) : (
          <SvgOrthographicView
            view={view}
            nx={nx}
            ny={ny}
            nz={nz}
            palletL={palletLength}
            palletW={palletWidth}
            boxL={boxLength}
            boxW={boxWidth}
            boxH={boxHeight}
            zoom={zoom}
          />
        )}

        <div class={styles.zoomOverlay}>
          <button type="button" class={styles.zoomBtn} onClick={handleZoomIn} aria-label="Zoom in">
            +
          </button>
          <button
            type="button"
            class={styles.zoomBtn}
            onClick={handleZoomOut}
            aria-label="Zoom out"
          >
            −
          </button>
          <button
            type="button"
            class={styles.zoomBtn}
            onClick={handleReset}
            aria-label="Reset zoom and view"
          >
            ↺
          </button>
        </div>

        <div class={styles.modeToggleWrap}>
          <button
            type="button"
            class={styles.modeToggleBtn}
            onClick={() => setShowPhoto((p) => !p)}
            title="Toggle between Interactive SVG diagram and Photo-realistic 3D render"
          >
            {showPhoto ? 'Show Diagram' : 'Photo 3D'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Isometric projection helper
function iso(x: number, y: number, z: number, scale: number, ox: number, oy: number) {
  const cos30 = 0.866;
  const sin30 = 0.5;
  const px = ox + (x - y) * cos30 * scale;
  const py = oy + (x + y) * sin30 * scale - z * scale;
  return { x: px, y: py };
}

// biome-ignore lint/complexity/noExcessiveLinesPerFunction: Svg isometric view renderer
function SvgIsometricView({
  nx,
  ny,
  nz,
  palletL,
  palletW,
  boxH,
  zoom,
}: {
  nx: number;
  ny: number;
  nz: number;
  palletL: number;
  palletW: number;
  boxL?: number;
  boxW?: number;
  boxH: number;
  zoom: number;
}) {
  const W = 380;
  const H = 220;
  const ox = 190;
  const oy = 110;
  const maxDim = Math.max(palletL, palletW, nz * boxH + 15);
  const baseScale = (100 / maxDim) * zoom;

  const pL = palletL;
  const pW = palletW;
  const pH = 14;

  const palletP0 = iso(0, 0, 0, baseScale, ox, oy);
  const palletP1 = iso(pL, 0, 0, baseScale, ox, oy);
  const palletP2 = iso(pL, pW, 0, baseScale, ox, oy);
  const _palletP3 = iso(0, pW, 0, baseScale, ox, oy);

  const palletT0 = iso(0, 0, pH, baseScale, ox, oy);
  const palletT1 = iso(pL, 0, pH, baseScale, ox, oy);
  const palletT2 = iso(pL, pW, pH, baseScale, ox, oy);
  const palletT3 = iso(0, pW, pH, baseScale, ox, oy);

  const boxes: Array<{
    key: string;
    depth: number;
    points: {
      t0: { x: number; y: number };
      t1: { x: number; y: number };
      t2: { x: number; y: number };
      t3: { x: number; y: number };
      b0: { x: number; y: number };
      b1: { x: number; y: number };
      b2: { x: number; y: number };
      b3: { x: number; y: number };
    };
  }> = [];

  const bLx = pL / nx;
  const bWy = pW / ny;

  for (let z = 0; z < nz; z++) {
    for (let x = 0; x < nx; x++) {
      for (let y = 0; y < ny; y++) {
        const x0 = x * bLx;
        const x1 = (x + 1) * bLx;
        const y0 = y * bWy;
        const y1 = (y + 1) * bWy;
        const z0 = pH + z * boxH;
        const z1 = pH + (z + 1) * boxH;

        boxes.push({
          key: `b-${x}-${y}-${z}`,
          depth: x + y + z * 10,
          points: {
            b0: iso(x0, y0, z0, baseScale, ox, oy),
            b1: iso(x1, y0, z0, baseScale, ox, oy),
            b2: iso(x1, y1, z0, baseScale, ox, oy),
            b3: iso(x0, y1, z0, baseScale, ox, oy),
            t0: iso(x0, y0, z1, baseScale, ox, oy),
            t1: iso(x1, y0, z1, baseScale, ox, oy),
            t2: iso(x1, y1, z1, baseScale, ox, oy),
            t3: iso(x0, y1, z1, baseScale, ox, oy),
          },
        });
      }
    }
  }

  boxes.sort((a, b) => a.depth - b.depth);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      class={styles.canvasSvg}
      aria-label="3D Pallet load isometric diagram"
    >
      <defs>
        <linearGradient id="palletTopGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#d4a373" />
          <stop offset="100%" stop-color="#c58f5e" />
        </linearGradient>
        <linearGradient id="palletSideGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#a47148" />
          <stop offset="100%" stop-color="#8c5832" />
        </linearGradient>
      </defs>

      {/* Pallet Wooden Base (Isometric) */}
      <polygon
        points={`${palletP0.x},${palletP0.y} ${palletP1.x},${palletP1.y} ${palletT1.x},${palletT1.y} ${palletT0.x},${palletT0.y}`}
        fill="#8c5832"
        stroke="#5e3a1f"
        stroke-width="0.8"
      />
      <polygon
        points={`${palletP1.x},${palletP1.y} ${palletP2.x},${palletP2.y} ${palletT2.x},${palletT2.y} ${palletT1.x},${palletT1.y}`}
        fill="#a47148"
        stroke="#5e3a1f"
        stroke-width="0.8"
      />
      <polygon
        points={`${palletT0.x},${palletT0.y} ${palletT1.x},${palletT1.y} ${palletT2.x},${palletT2.y} ${palletT3.x},${palletT3.y}`}
        fill="url(#palletTopGrad)"
        stroke="#5e3a1f"
        stroke-width="0.8"
      />

      {/* Forklift pocket cutouts on the front side */}
      <rect
        x={(palletP1.x + palletP2.x) / 2 - 28}
        y={(palletP1.y + palletP2.y) / 2 - 4}
        width="22"
        height="6"
        fill="#3b2314"
        rx="1"
      />
      <rect
        x={(palletP1.x + palletP2.x) / 2 + 6}
        y={(palletP1.y + palletP2.y) / 2 - 4}
        width="22"
        height="6"
        fill="#3b2314"
        rx="1"
      />

      {/* Stacked Cartons */}
      {boxes.map((b) => (
        <g key={b.key}>
          {/* Front face (X-axis) */}
          <polygon
            points={`${b.points.b0.x},${b.points.b0.y} ${b.points.b1.x},${b.points.b1.y} ${b.points.t1.x},${b.points.t1.y} ${b.points.t0.x},${b.points.t0.y}`}
            fill="#d08c50"
            stroke="#8a4f1a"
            stroke-width="0.6"
          />
          {/* Right face (Y-axis) */}
          <polygon
            points={`${b.points.b1.x},${b.points.b1.y} ${b.points.b2.x},${b.points.b2.y} ${b.points.t2.x},${b.points.t2.y} ${b.points.t1.x},${b.points.t1.y}`}
            fill="#af7542"
            stroke="#8a4f1a"
            stroke-width="0.6"
          />
          {/* Top face */}
          <polygon
            points={`${b.points.t0.x},${b.points.t0.y} ${b.points.t1.x},${b.points.t1.y} ${b.points.t2.x},${b.points.t2.y} ${b.points.t3.x},${b.points.t3.y}`}
            fill="#e2ad7a"
            stroke="#8a4f1a"
            stroke-width="0.6"
          />
        </g>
      ))}
    </svg>
  );
}

// biome-ignore lint/complexity/noExcessiveLinesPerFunction: Svg orthographic view renderer
function SvgOrthographicView({
  view,
  nx,
  ny,
  nz,
  palletL,
  palletW,
  boxH,
  zoom,
}: {
  view: 'top' | 'side' | 'front';
  nx: number;
  ny: number;
  nz: number;
  palletL: number;
  palletW: number;
  boxL?: number;
  boxW?: number;
  boxH: number;
  zoom: number;
}) {
  const W = 380;
  const H = 220;

  if (view === 'top') {
    const scale = Math.min(220 / palletL, 160 / palletW) * zoom;
    const pw = palletL * scale;
    const ph = palletW * scale;
    const x0 = (W - pw) / 2;
    const y0 = (H - ph) / 2;
    const bw = pw / nx;
    const bh = ph / ny;

    return (
      <svg
        viewBox={`0 0 ${W} ${H}`}
        class={styles.canvasSvg}
        aria-label="Top view of pallet arrangement"
      >
        {/* Pallet base rect */}
        <rect
          x={x0}
          y={y0}
          width={pw}
          height={ph}
          fill="#d4a373"
          stroke="#8c5832"
          stroke-width="2"
          rx="3"
        />
        {/* Box grid */}
        {Array.from({ length: nx }).map((_, xi) =>
          Array.from({ length: ny }).map((_, yi) => (
            <rect
              key={`top-${xi}-${yi}`}
              x={x0 + xi * bw + 1}
              y={y0 + yi * bh + 1}
              width={bw - 2}
              height={bh - 2}
              fill="#e2ad7a"
              stroke="#af7542"
              stroke-width="1"
              rx="2"
            />
          )),
        )}
        <text
          x={W / 2}
          y={H - 12}
          text-anchor="middle"
          font-size="10"
          fill="#64748b"
          font-weight="600"
        >
          Top View ({nx} × {ny} = {nx * ny} boxes per layer)
        </text>
      </svg>
    );
  }

  // Front or Side view
  const isFront = view === 'front';
  const widthCount = isFront ? nx : ny;
  const totalW = isFront ? palletL : palletW;
  const totalH = nz * boxH + 14;
  const scale = Math.min(240 / totalW, 160 / totalH) * zoom;
  const pw = totalW * scale;
  const ph = totalH * scale;
  const palletH = 14 * scale;
  const boxHeightPx = boxH * scale;
  const boxWidthPx = pw / widthCount;

  const x0 = (W - pw) / 2;
  const y0 = H - 35 - ph;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      class={styles.canvasSvg}
      aria-label={`${view} view of pallet stack`}
    >
      {/* Wood Pallet Footprint */}
      <rect
        x={x0}
        y={y0 + ph - palletH}
        width={pw}
        height={palletH}
        fill="#8c5832"
        stroke="#5e3a1f"
        stroke-width="1.5"
        rx="2"
      />
      {/* Forklift openings */}
      <rect
        x={x0 + pw * 0.2}
        y={y0 + ph - palletH + 3}
        width={pw * 0.22}
        height={palletH - 6}
        fill="#3b2314"
        rx="2"
      />
      <rect
        x={x0 + pw * 0.58}
        y={y0 + ph - palletH + 3}
        width={pw * 0.22}
        height={palletH - 6}
        fill="#3b2314"
        rx="2"
      />

      {/* Layer stacked boxes */}
      {Array.from({ length: nz }).map((_, zi) =>
        Array.from({ length: widthCount }).map((_, xi) => {
          const by = y0 + ph - palletH - (zi + 1) * boxHeightPx;
          const bx = x0 + xi * boxWidthPx;
          return (
            <rect
              key={`layer-${zi}-${xi}`}
              x={bx + 1}
              y={by + 1}
              width={boxWidthPx - 2}
              height={boxHeightPx - 2}
              fill="#d08c50"
              stroke="#8a4f1a"
              stroke-width="1"
              rx="2"
            />
          );
        }),
      )}
      <text
        x={W / 2}
        y={H - 12}
        text-anchor="middle"
        font-size="10"
        fill="#64748b"
        font-weight="600"
      >
        {isFront ? 'Front' : 'Side'} Elevation ({nz} layers stacked)
      </text>
    </svg>
  );
}
