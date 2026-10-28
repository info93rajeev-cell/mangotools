import { useState } from 'preact/hooks';
import styles from './carton3DPreview.module.css';
import type { VolumetricItem, VolumetricUnit } from './volumetricWeightModel.ts';

interface Carton3DPreviewProps {
  items: VolumetricItem[];
  selectedId: string;
  onSelectId: (id: string) => void;
  unit: VolumetricUnit;
}

// Isometric projection helper
function iso(x: number, y: number, z: number, scale: number, ox: number, oy: number) {
  const cos30 = 0.866;
  const sin30 = 0.5;
  const px = ox + (x - y) * cos30 * scale;
  const py = oy + (x + y) * sin30 * scale - z * scale;
  return { x: px, y: py };
}

// biome-ignore lint/complexity/noExcessiveLinesPerFunction: Studio carton preview
export function Carton3DPreview({ items, selectedId, onSelectId, unit }: Carton3DPreviewProps) {
  const [view, setView] = useState<'3d' | 'top' | 'side' | 'front'>('3d');
  const [zoom, setZoom] = useState(1);

  const selectedItem = items.find((i) => i.id === selectedId) ||
    items[0] || {
      id: 'default',
      description: 'Carton',
      length: 60,
      width: 40,
      height: 40,
      weightKg: 10,
      quantity: 1,
    };

  const handleZoomIn = () => setZoom((z) => Math.min(1.6, z + 0.15));
  const handleZoomOut = () => setZoom((z) => Math.max(0.65, z - 0.15));
  const handleReset = () => {
    setZoom(1);
    setView('3d');
  };

  return (
    <div class={styles.card} data-carton-3d-preview="">
      <div class={styles.cardHead}>
        <span class={styles.cardTitle}>3D Preview (Selected Item)</span>
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
          <SvgRealistic3DCarton
            length={selectedItem.length}
            width={selectedItem.width}
            height={selectedItem.height}
            unit={unit}
            zoom={zoom}
          />
        ) : (
          <SvgRealistic2DCarton
            view={view}
            length={selectedItem.length}
            width={selectedItem.width}
            height={selectedItem.height}
            unit={unit}
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

      <div class={styles.cardFooter}>
        <select
          class={styles.itemSelect}
          value={selectedItem.id}
          onChange={(e) => onSelectId((e.target as HTMLSelectElement).value)}
          aria-label="Select item to preview in 3D"
        >
          {items.map((item, idx) => (
            <option key={item.id} value={item.id}>
              Item {idx + 1} – {item.description || 'Package'} ({item.length}×{item.width}×
              {item.height} {unit})
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

// biome-ignore lint/complexity/noExcessiveLinesPerFunction: SvgRealistic3DCarton view
function SvgRealistic3DCarton({
  length,
  width,
  height,
  unit,
  zoom,
}: {
  length: number;
  width: number;
  height: number;
  unit: string;
  zoom: number;
}) {
  const W = 340;
  const H = 250;
  const ox = 170;
  const oy = 115;

  const maxD = Math.max(length, width, height, 1);
  const scale = (95 / maxD) * zoom;

  const L = length;
  const Wi = width;
  const He = height;

  const _b0 = iso(0, 0, 0, scale, ox, oy);
  const b1 = iso(L, 0, 0, scale, ox, oy);
  const b2 = iso(L, Wi, 0, scale, ox, oy);
  const b3 = iso(0, Wi, 0, scale, ox, oy);

  const t0 = iso(0, 0, He, scale, ox, oy);
  const t1 = iso(L, 0, He, scale, ox, oy);
  const t2 = iso(L, Wi, He, scale, ox, oy);
  const t3 = iso(0, Wi, He, scale, ox, oy);

  // Soft ambient ground shadow points
  const sh0 = iso(-6, -6, 0, scale, ox, oy);
  const sh1 = iso(L + 6, -6, 0, scale, ox, oy);
  const sh2 = iso(L + 6, Wi + 6, 0, scale, ox, oy);
  const sh3 = iso(-6, Wi + 6, 0, scale, ox, oy);

  // Center tape coordinates along top
  const tapeTop1 = { x: (t0.x + t3.x) / 2, y: (t0.y + t3.y) / 2 };
  const tapeTop2 = { x: (t1.x + t2.x) / 2, y: (t1.y + t2.y) / 2 };

  // Center tape continuation down the front-left face
  const tapeFrontBottom = {
    x: (b3.x + b2.x) / 2,
    y: (b3.y + b2.y) / 2,
  };
  const tapeFrontTop = {
    x: (t3.x + t2.x) / 2,
    y: (t3.y + t2.y) / 2,
  };

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      class={styles.canvasSvg}
      aria-label="Photorealistic 3D Isometric Carton Box Preview"
    >
      <defs>
        {/* Soft Ground Shadow Filter */}
        <filter id="cartonGroundBlur" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="4" />
        </filter>

        <marker id="arrowHead" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L0,6 L6,3 z" fill="#0065ff" />
        </marker>
        <marker
          id="arrowHeadStart"
          markerWidth="6"
          markerHeight="6"
          refX="1"
          refY="3"
          orient="auto"
        >
          <path d="M6,0 L6,6 L0,3 z" fill="#0065ff" />
        </marker>

        {/* Kraft Carton Lighting Gradients */}
        <linearGradient id="cartonTopGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#fae4ca" />
          <stop offset="60%" stop-color="#eed3ae" />
          <stop offset="100%" stop-color="#e2bf94" />
        </linearGradient>
        <linearGradient id="cartonLeftGrad" x1="0%" y1="0%" x2="100%" y2="50%">
          <stop offset="0%" stop-color="#dfa066" />
          <stop offset="100%" stop-color="#cb8a4c" />
        </linearGradient>
        <linearGradient id="cartonRightGrad" x1="0%" y1="0%" x2="100%" y2="50%">
          <stop offset="0%" stop-color="#ba793e" />
          <stop offset="100%" stop-color="#a46328" />
        </linearGradient>

        {/* Packaging Tape Gradient */}
        <linearGradient id="cartonTapeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#cca06c" stop-opacity="0.92" />
          <stop offset="50%" stop-color="#e2ba89" stop-opacity="0.95" />
          <stop offset="100%" stop-color="#c1935e" stop-opacity="0.92" />
        </linearGradient>
      </defs>

      {/* 1. SOFT AMBIENT GROUND DROP SHADOW */}
      <polygon
        points={`${sh0.x},${sh0.y} ${sh1.x},${sh1.y} ${sh2.x},${sh2.y} ${sh3.x},${sh3.y}`}
        fill="#0f172a"
        opacity="0.18"
        filter="url(#cartonGroundBlur)"
      />

      {/* 2. CARTON 3D FACES */}
      {/* Front-left face (Length axis, at y = Wi) */}
      <polygon
        points={`${b3.x},${b3.y} ${b2.x},${b2.y} ${t2.x},${t2.y} ${t3.x},${t3.y}`}
        fill="url(#cartonLeftGrad)"
        stroke="#8a4f1a"
        stroke-width="0.8"
      />
      {/* Front-right face (Width axis, at x = L) */}
      <polygon
        points={`${b1.x},${b1.y} ${b2.x},${b2.y} ${t2.x},${t2.y} ${t1.x},${t1.y}`}
        fill="url(#cartonRightGrad)"
        stroke="#8a4f1a"
        stroke-width="0.8"
      />
      {/* Top face */}
      <polygon
        points={`${t0.x},${t0.y} ${t1.x},${t1.y} ${t2.x},${t2.y} ${t3.x},${t3.y}`}
        fill="url(#cartonTopGrad)"
        stroke="#8a4f1a"
        stroke-width="0.8"
      />

      {/* Center packaging tape strip across top flaps */}
      <line
        x1={tapeTop1.x}
        y1={tapeTop1.y}
        x2={tapeTop2.x}
        y2={tapeTop2.y}
        stroke="url(#cartonTapeGrad)"
        stroke-width="8"
      />
      <line
        x1={tapeTop1.x}
        y1={tapeTop1.y}
        x2={tapeTop2.x}
        y2={tapeTop2.y}
        stroke="#8a4f1a"
        stroke-width="0.5"
        opacity="0.6"
      />

      {/* Tape fold down the front-left seam */}
      <line
        x1={tapeFrontTop.x}
        y1={tapeFrontTop.y}
        x2={tapeFrontBottom.x}
        y2={tapeFrontBottom.y}
        stroke="url(#cartonTapeGrad)"
        stroke-width="6"
        opacity="0.85"
      />
      <line
        x1={tapeFrontTop.x}
        y1={tapeFrontTop.y}
        x2={tapeFrontBottom.x}
        y2={tapeFrontBottom.y}
        stroke="#8a4f1a"
        stroke-width="0.5"
        opacity="0.5"
      />

      {/* Edge highlight reflections on top ridges */}
      <line
        x1={t3.x}
        y1={t3.y}
        x2={t2.x}
        y2={t2.y}
        stroke="rgba(255, 255, 255, 0.45)"
        stroke-width="0.8"
      />
      <line
        x1={t2.x}
        y1={t2.y}
        x2={t1.x}
        y2={t1.y}
        stroke="rgba(255, 255, 255, 0.35)"
        stroke-width="0.8"
      />

      {/* Realistic shipping label graphic on the front-right face */}
      {(() => {
        const lx0 = b1.x + (b2.x - b1.x) * 0.25;
        const ly0 = b1.y + (b2.y - b1.y) * 0.25 - He * scale * 0.35;
        const lw = (b2.x - b1.x) * 0.5;
        const lwh = (b2.y - b1.y) * 0.5;
        const lh = He * scale * 0.38;
        return (
          <g opacity="0.92">
            <polygon
              points={`${lx0},${ly0} ${lx0 + lw},${ly0 + lwh} ${lx0 + lw},${ly0 + lwh - lh} ${lx0},${ly0 - lh}`}
              fill="#ffffff"
              stroke="#e2e8f0"
              stroke-width="0.4"
            />
            {/* Barcode stripes */}
            <line
              x1={lx0 + lw * 0.2}
              y1={ly0 + lwh * 0.2 - lh * 0.25}
              x2={lx0 + lw * 0.8}
              y2={ly0 + lwh * 0.8 - lh * 0.25}
              stroke="#0f172a"
              stroke-width="1.8"
            />
            <line
              x1={lx0 + lw * 0.2}
              y1={ly0 + lwh * 0.2 - lh * 0.45}
              x2={lx0 + lw * 0.8}
              y2={ly0 + lwh * 0.8 - lh * 0.45}
              stroke="#0f172a"
              stroke-width="1.2"
            />
            <line
              x1={lx0 + lw * 0.2}
              y1={ly0 + lwh * 0.2 - lh * 0.7}
              x2={lx0 + lw * 0.8}
              y2={ly0 + lwh * 0.8 - lh * 0.7}
              stroke="#64748b"
              stroke-width="0.8"
            />
          </g>
        );
      })()}

      {/* 3. DIMENSION ARROWS & LABELS */}
      {/* Height (H) Dimension Line */}
      <g>
        <line
          x1={b3.x - 22}
          y1={b3.y}
          x2={t3.x - 22}
          y2={t3.y}
          stroke="#0065ff"
          stroke-width="1.8"
          marker-start="url(#arrowHeadStart)"
          marker-end="url(#arrowHead)"
        />
        <line
          x1={b3.x - 4}
          y1={b3.y}
          x2={b3.x - 24}
          y2={b3.y}
          stroke="#94a3b8"
          stroke-width="0.8"
          stroke-dasharray="2,2"
        />
        <line
          x1={t3.x - 4}
          y1={t3.y}
          x2={t3.x - 24}
          y2={t3.y}
          stroke="#94a3b8"
          stroke-width="0.8"
          stroke-dasharray="2,2"
        />
        <rect
          x={b3.x - 74}
          y={(b3.y + t3.y) / 2 - 8}
          width="48"
          height="16"
          rx="4"
          fill="#0065ff"
        />
        <text
          x={b3.x - 50}
          y={(b3.y + t3.y) / 2 + 4}
          font-size="9.5"
          font-weight="700"
          fill="#ffffff"
          text-anchor="middle"
        >
          H: {height} {unit}
        </text>
      </g>

      {/* Length (L) Dimension Line */}
      <g>
        <line
          x1={b3.x}
          y1={b3.y + 18}
          x2={b2.x}
          y2={b2.y + 18}
          stroke="#0065ff"
          stroke-width="1.8"
          marker-start="url(#arrowHeadStart)"
          marker-end="url(#arrowHead)"
        />
        <line
          x1={b3.x}
          y1={b3.y + 4}
          x2={b3.x}
          y2={b3.y + 20}
          stroke="#94a3b8"
          stroke-width="0.8"
          stroke-dasharray="2,2"
        />
        <line
          x1={b2.x}
          y1={b2.y + 4}
          x2={b2.x}
          y2={b2.y + 20}
          stroke="#94a3b8"
          stroke-width="0.8"
          stroke-dasharray="2,2"
        />
        <rect
          x={(b3.x + b2.x) / 2 - 24}
          y={(b3.y + b2.y) / 2 + 22}
          width="48"
          height="16"
          rx="4"
          fill="#0065ff"
        />
        <text
          x={(b3.x + b2.x) / 2}
          y={(b3.y + b2.y) / 2 + 34}
          font-size="9.5"
          font-weight="700"
          fill="#ffffff"
          text-anchor="middle"
        >
          L: {length} {unit}
        </text>
      </g>

      {/* Width (W) Dimension Line */}
      <g>
        <line
          x1={b2.x + 18}
          y1={b2.y + 8}
          x2={b1.x + 18}
          y2={b1.y + 8}
          stroke="#0065ff"
          stroke-width="1.8"
          marker-start="url(#arrowHeadStart)"
          marker-end="url(#arrowHead)"
        />
        <line
          x1={b2.x + 4}
          y1={b2.y + 2}
          x2={b2.x + 20}
          y2={b2.y + 10}
          stroke="#94a3b8"
          stroke-width="0.8"
          stroke-dasharray="2,2"
        />
        <line
          x1={b1.x + 4}
          y1={b1.y + 2}
          x2={b1.x + 20}
          y2={b1.y + 10}
          stroke="#94a3b8"
          stroke-width="0.8"
          stroke-dasharray="2,2"
        />
        <rect
          x={(b2.x + b1.x) / 2 + 24}
          y={(b2.y + b1.y) / 2 + 8}
          width="48"
          height="16"
          rx="4"
          fill="#0065ff"
        />
        <text
          x={(b2.x + b1.x) / 2 + 48}
          y={(b2.y + b1.y) / 2 + 20}
          font-size="9.5"
          font-weight="700"
          fill="#ffffff"
          text-anchor="middle"
        >
          W: {width} {unit}
        </text>
      </g>
    </svg>
  );
}

// biome-ignore lint/complexity/noExcessiveLinesPerFunction: SvgRealistic2DCarton view
function SvgRealistic2DCarton({
  view,
  length,
  width,
  height,
  unit,
  zoom,
}: {
  view: 'top' | 'side' | 'front';
  length: number;
  width: number;
  height: number;
  unit: string;
  zoom: number;
}) {
  const W = 340;
  const H = 250;

  const wDim = view === 'side' ? width : length;
  const hDim = view === 'top' ? width : height;
  const maxDim = Math.max(wDim, hDim, 1);
  const scale = (130 / maxDim) * zoom;

  const boxW = wDim * scale;
  const boxH = hDim * scale;
  const x0 = (W - boxW) / 2;
  const y0 = (H - boxH) / 2 - 8;

  const wLabel = view === 'side' ? `W: ${width} ${unit}` : `L: ${length} ${unit}`;
  const hLabel = view === 'top' ? `W: ${width} ${unit}` : `H: ${height} ${unit}`;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      class={styles.canvasSvg}
      aria-label={`${view} view of carton box`}
    >
      <defs>
        <linearGradient id="orthoCartonGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#fae4ca" />
          <stop offset="100%" stop-color="#eed3ae" />
        </linearGradient>
      </defs>

      {/* Main Box Rect */}
      <rect
        x={x0}
        y={y0}
        width={boxW}
        height={boxH}
        fill="url(#orthoCartonGrad)"
        stroke="#8a4f1a"
        stroke-width="1.8"
        rx="3"
      />

      {/* Center Packaging Tape */}
      <line
        x1={x0 + boxW / 2}
        y1={y0}
        x2={x0 + boxW / 2}
        y2={y0 + boxH}
        stroke="#cca06c"
        stroke-width="6"
        opacity="0.88"
      />
      <line
        x1={x0 + boxW / 2}
        y1={y0}
        x2={x0 + boxW / 2}
        y2={y0 + boxH}
        stroke="#8a4f1a"
        stroke-width="0.5"
      />

      {/* Width / Length label badge */}
      <rect x={W / 2 - 36} y={y0 + boxH + 12} width="72" height="18" rx="4" fill="#0065ff" />
      <text
        x={W / 2}
        y={y0 + boxH + 25}
        text-anchor="middle"
        font-size="10.5"
        font-weight="700"
        fill="#ffffff"
      >
        {wLabel}
      </text>

      {/* Height label badge */}
      <rect x={x0 - 78} y={y0 + boxH / 2 - 9} width="68" height="18" rx="4" fill="#0065ff" />
      <text
        x={x0 - 44}
        y={y0 + boxH / 2 + 4}
        text-anchor="middle"
        font-size="10.5"
        font-weight="700"
        fill="#ffffff"
      >
        {hLabel}
      </text>

      <text
        x={W / 2}
        y={y0 - 12}
        text-anchor="middle"
        font-size="11"
        font-weight="700"
        fill="#334155"
      >
        {view.toUpperCase()} ELEVATION
      </text>
    </svg>
  );
}
