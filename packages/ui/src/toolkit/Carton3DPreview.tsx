import { useState } from 'preact/hooks';
import { SvgRealistic3DCarton } from './Carton3DIsometricView.tsx';
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
