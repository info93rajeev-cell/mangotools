import { useState } from 'preact/hooks';
import styles from './carton3DPreview.module.css';
import type { VolumetricItem, VolumetricUnit } from './volumetricWeightModel.ts';

interface Carton3DPreviewProps {
  items: VolumetricItem[];
  selectedId: string;
  onSelectId: (id: string) => void;
  unit: VolumetricUnit;
}

// biome-ignore lint/complexity/noExcessiveLinesPerFunction: Studio carton preview
export function Carton3DPreview({ items, selectedId, onSelectId, unit }: Carton3DPreviewProps) {
  const [view, setView] = useState<'3d' | 'top' | 'side' | 'front'>('3d');
  const [zoom, setZoom] = useState(1);
  const [showPhoto, setShowPhoto] = useState(false);

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
            src="/logistics/carton-3d-sample.png"
            alt="3D Carton render with dimension arrows"
            class={styles.photoSample}
          />
        ) : view === '3d' ? (
          <Svg3DCarton
            length={selectedItem.length}
            width={selectedItem.width}
            height={selectedItem.height}
            unit={unit}
            zoom={zoom}
          />
        ) : (
          <Svg2DCarton
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

function iso(x: number, y: number, z: number, scale: number, ox: number, oy: number) {
  const cos30 = 0.866;
  const sin30 = 0.5;
  const px = ox + (x - y) * cos30 * scale;
  const py = oy + (x + y) * sin30 * scale - z * scale;
  return { x: px, y: py };
}

// biome-ignore lint/complexity/noExcessiveLinesPerFunction: Svg3DCarton view
function Svg3DCarton({
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
  const W = 320;
  const H = 200;
  const ox = 150;
  const oy = 110;

  const maxD = Math.max(length, width, height, 1);
  const scale = (80 / maxD) * zoom;

  const L = length;
  const Wi = width;
  const He = height;

  const b0 = iso(0, 0, 0, scale, ox, oy);
  const b1 = iso(L, 0, 0, scale, ox, oy);
  const b2 = iso(L, Wi, 0, scale, ox, oy);
  const _b3 = iso(0, Wi, 0, scale, ox, oy);

  const t0 = iso(0, 0, He, scale, ox, oy);
  const t1 = iso(L, 0, He, scale, ox, oy);
  const t2 = iso(L, Wi, He, scale, ox, oy);
  const t3 = iso(0, Wi, He, scale, ox, oy);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      class={styles.canvasSvg}
      aria-label="3D Isometric Carton Box Preview"
    >
      <defs>
        <marker id="arrowHead" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L0,6 L6,3 z" fill="#0f172a" />
        </marker>
        <marker
          id="arrowHeadStart"
          markerWidth="6"
          markerHeight="6"
          refX="1"
          refY="3"
          orient="auto"
        >
          <path d="M6,0 L6,6 L0,3 z" fill="#0f172a" />
        </marker>
      </defs>

      {/* Front-left face (Length axis) */}
      <polygon
        points={`${b0.x},${b0.y} ${b1.x},${b1.y} ${t1.x},${t1.y} ${t0.x},${t0.y}`}
        fill="#d08c50"
        stroke="#8a4f1a"
        stroke-width="1.2"
      />
      {/* Front-right face (Width axis) */}
      <polygon
        points={`${b1.x},${b1.y} ${b2.x},${b2.y} ${t2.x},${t2.y} ${t1.x},${t1.y}`}
        fill="#af7542"
        stroke="#8a4f1a"
        stroke-width="1.2"
      />
      {/* Top face */}
      <polygon
        points={`${t0.x},${t0.y} ${t1.x},${t1.y} ${t2.x},${t2.y} ${t3.x},${t3.y}`}
        fill="#e2ad7a"
        stroke="#8a4f1a"
        stroke-width="1.2"
      />

      {/* Center tape strip on top face */}
      <line
        x1={(t0.x + t3.x) / 2}
        y1={(t0.y + t3.y) / 2}
        x2={(t1.x + t2.x) / 2}
        y2={(t1.y + t2.y) / 2}
        stroke="#c48950"
        stroke-width="7"
      />

      {/* Dimension arrow: Height (H) */}
      <g>
        <line
          x1={b0.x - 16}
          y1={b0.y}
          x2={t0.x - 16}
          y2={t0.y}
          stroke="#0f172a"
          stroke-width="1.4"
          marker-start="url(#arrowHeadStart)"
          marker-end="url(#arrowHead)"
        />
        <text
          x={b0.x - 24}
          y={(b0.y + t0.y) / 2 + 3}
          font-size="9"
          font-weight="700"
          fill="#0f172a"
          text-anchor="end"
        >
          H ({height} {unit})
        </text>
      </g>

      {/* Dimension arrow: Length (L) */}
      <g>
        <line
          x1={b0.x}
          y1={b0.y + 14}
          x2={b1.x}
          y2={b1.y + 14}
          stroke="#0f172a"
          stroke-width="1.4"
          marker-start="url(#arrowHeadStart)"
          marker-end="url(#arrowHead)"
        />
        <text
          x={(b0.x + b1.x) / 2 - 10}
          y={(b0.y + b1.y) / 2 + 25}
          font-size="9"
          font-weight="700"
          fill="#0f172a"
          text-anchor="middle"
        >
          L ({length} {unit})
        </text>
      </g>

      {/* Dimension arrow: Width (W) */}
      <g>
        <line
          x1={b1.x + 14}
          y1={b1.y + 6}
          x2={b2.x + 14}
          y2={b2.y + 6}
          stroke="#0f172a"
          stroke-width="1.4"
          marker-start="url(#arrowHeadStart)"
          marker-end="url(#arrowHead)"
        />
        <text
          x={(b1.x + b2.x) / 2 + 32}
          y={(b1.y + b2.y) / 2 + 15}
          font-size="9"
          font-weight="700"
          fill="#0f172a"
          text-anchor="middle"
        >
          W ({width} {unit})
        </text>
      </g>
    </svg>
  );
}

function Svg2DCarton({
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
  const W = 320;
  const H = 200;

  const wDim = view === 'side' ? width : length;
  const hDim = view === 'top' ? width : height;
  const maxDim = Math.max(wDim, hDim, 1);
  const scale = (120 / maxDim) * zoom;

  const boxW = wDim * scale;
  const boxH = hDim * scale;
  const x0 = (W - boxW) / 2;
  const y0 = (H - boxH) / 2;

  const wLabel = view === 'side' ? `W (${width} ${unit})` : `L (${length} ${unit})`;
  const hLabel = view === 'top' ? `W (${width} ${unit})` : `H (${height} ${unit})`;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      class={styles.canvasSvg}
      aria-label={`${view} view of carton box`}
    >
      <rect
        x={x0}
        y={y0}
        width={boxW}
        height={boxH}
        fill="#e2ad7a"
        stroke="#8a4f1a"
        stroke-width="1.8"
        rx="3"
      />
      {/* Center tape */}
      <line
        x1={x0 + boxW / 2}
        y1={y0}
        x2={x0 + boxW / 2}
        y2={y0 + boxH}
        stroke="#c48950"
        stroke-width="5"
      />
      {/* Width / Length label */}
      <text
        x={W / 2}
        y={y0 + boxH + 18}
        text-anchor="middle"
        font-size="10"
        font-weight="700"
        fill="#0f172a"
      >
        {wLabel}
      </text>
      {/* Height label */}
      <text x={x0 - 12} y={H / 2} text-anchor="end" font-size="10" font-weight="700" fill="#0f172a">
        {hLabel}
      </text>
      <text
        x={W / 2}
        y={y0 - 10}
        text-anchor="middle"
        font-size="10"
        fill="#64748b"
        font-weight="600"
      >
        {view.toUpperCase()} VIEW
      </text>
    </svg>
  );
}
