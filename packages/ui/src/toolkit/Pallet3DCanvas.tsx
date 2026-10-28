import { useState } from 'preact/hooks';
import { SvgRealisticIsometricPallet } from './PalletIsometricView.tsx';
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
              onClick={() => setView(angle)}
            >
              {angle === '3d' ? '3D' : angle.charAt(0).toUpperCase() + angle.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div class={styles.canvasWrap}>
        {view === '3d' ? (
          <SvgRealisticIsometricPallet
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
          <SvgRealisticOrthographicPallet
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
      </div>
    </div>
  );
}

// biome-ignore lint/complexity/noExcessiveLinesPerFunction: Svg realistic orthographic view renderer
function SvgRealisticOrthographicPallet({
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
  const H = 250;

  if (view === 'top') {
    const scale = Math.min(230 / palletL, 170 / palletW) * zoom;
    const pw = palletL * scale;
    const ph = palletW * scale;
    const x0 = (W - pw) / 2;
    const y0 = (H - ph) / 2 - 8;
    const bw = pw / nx;
    const bh = ph / ny;

    return (
      <svg
        viewBox={`0 0 ${W} ${H}`}
        class={styles.canvasSvg}
        aria-label="Top view of pallet arrangement"
      >
        <defs>
          <linearGradient id="orthoPalletGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#dfb486" />
            <stop offset="100%" stop-color="#be8c57" />
          </linearGradient>
          <linearGradient id="orthoBoxTop" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#fae3c6" />
            <stop offset="100%" stop-color="#eed2ac" />
          </linearGradient>
        </defs>

        {/* Pallet base rect */}
        <rect
          x={x0}
          y={y0}
          width={pw}
          height={ph}
          fill="url(#orthoPalletGrad)"
          stroke="#8c5832"
          stroke-width="2"
          rx="3"
        />

        {/* Box grid with flap lines and tape */}
        {Array.from({ length: nx }).map((_, xi) =>
          Array.from({ length: ny }).map((_, yi) => {
            const bx = x0 + xi * bw + 1;
            const by = y0 + yi * bh + 1;
            const bWidth = bw - 2;
            const bHeight = bh - 2;
            return (
              <g key={`top-${xi}-${yi}`}>
                <rect
                  x={bx}
                  y={by}
                  width={bWidth}
                  height={bHeight}
                  fill="url(#orthoBoxTop)"
                  stroke="#af7542"
                  stroke-width="1"
                  rx="2"
                />
                {/* Center tape strip */}
                <line
                  x1={bx}
                  y1={by + bHeight / 2}
                  x2={bx + bWidth}
                  y2={by + bHeight / 2}
                  stroke="#cca06c"
                  stroke-width="4"
                  opacity="0.85"
                />
                <line
                  x1={bx}
                  y1={by + bHeight / 2}
                  x2={bx + bWidth}
                  y2={by + bHeight / 2}
                  stroke="#965620"
                  stroke-width="0.5"
                />
              </g>
            );
          }),
        )}

        <text
          x={W / 2}
          y={H - 12}
          text-anchor="middle"
          font-size="11"
          fill="#334155"
          font-weight="700"
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
  const scale = Math.min(250 / totalW, 170 / totalH) * zoom;
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
      <defs>
        <linearGradient id="elevPalletGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#a67341" />
          <stop offset="100%" stop-color="#8a5628" />
        </linearGradient>
        <linearGradient id="elevBoxGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#dfa066" />
          <stop offset="100%" stop-color="#cc8b4e" />
        </linearGradient>
      </defs>

      {/* Wood Pallet Base */}
      <rect
        x={x0}
        y={y0 + ph - palletH}
        width={pw}
        height={palletH}
        fill="url(#elevPalletGrad)"
        stroke="#5e3a1f"
        stroke-width="1.5"
        rx="2"
      />

      {/* Forklift pocket openings */}
      <rect
        x={x0 + pw * 0.18}
        y={y0 + ph - palletH + 3}
        width={pw * 0.22}
        height={palletH - 6}
        fill="#26150b"
        rx="2"
      />
      <rect
        x={x0 + pw * 0.6}
        y={y0 + ph - palletH + 3}
        width={pw * 0.22}
        height={palletH - 6}
        fill="#26150b"
        rx="2"
      />

      {/* Layer stacked boxes */}
      {Array.from({ length: nz }).map((_, zi) =>
        Array.from({ length: widthCount }).map((_, xi) => {
          const by = y0 + ph - palletH - (zi + 1) * boxHeightPx;
          const bx = x0 + xi * boxWidthPx;
          return (
            <g key={`layer-${zi}-${xi}`}>
              <rect
                x={bx + 1}
                y={by + 1}
                width={boxWidthPx - 2}
                height={boxHeightPx - 2}
                fill="url(#elevBoxGrad)"
                stroke="#8a4f1a"
                stroke-width="0.8"
                rx="2"
              />
              {/* Packaging tape seam */}
              <line
                x1={bx + boxWidthPx / 2}
                y1={by + 1}
                x2={bx + boxWidthPx / 2}
                y2={by + boxHeightPx - 1}
                stroke="#cca06c"
                stroke-width="3"
                opacity="0.8"
              />
            </g>
          );
        }),
      )}

      <text
        x={W / 2}
        y={H - 12}
        text-anchor="middle"
        font-size="11"
        fill="#334155"
        font-weight="700"
      >
        {isFront ? 'Front' : 'Side'} Elevation ({nz} layers stacked · {totalH.toFixed(0)} cm high)
      </text>
    </svg>
  );
}
