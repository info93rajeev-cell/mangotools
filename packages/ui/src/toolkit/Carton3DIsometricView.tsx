import { CartonSvgDefs } from './CartonSvgDefs.tsx';
import styles from './carton3DPreview.module.css';
import type { VolumetricUnit } from './volumetricWeightModel.ts';

// Isometric projection helper
export function iso(x: number, y: number, z: number, scale: number, ox: number, oy: number) {
  const cos30 = 0.866;
  const sin30 = 0.5;
  const px = ox + (x - y) * cos30 * scale;
  const py = oy + (x + y) * sin30 * scale - z * scale;
  return { x: px, y: py };
}

interface SvgRealistic3DCartonProps {
  length: number;
  width: number;
  height: number;
  unit: VolumetricUnit;
  zoom: number;
}

// biome-ignore lint/complexity/noExcessiveLinesPerFunction: Photorealistic 3D Isometric SVG Carton renderer
export function SvgRealistic3DCarton({
  length,
  width,
  height,
  unit,
  zoom,
}: SvgRealistic3DCartonProps) {
  const W = 380;
  const H = 250;
  const ox = 170;
  const oy = 115;

  const maxD = Math.max(length, width, height, 1);
  const scale = (95 / maxD) * zoom;

  const L = length;
  const Wi = width;
  const He = height;

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
      <CartonSvgDefs />

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
