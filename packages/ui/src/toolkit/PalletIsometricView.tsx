import styles from './pallet3DCanvas.module.css';

// Isometric projection helper
export function iso(x: number, y: number, z: number, scale: number, ox: number, oy: number) {
  const cos30 = 0.866;
  const sin30 = 0.5;
  const px = ox + (x - y) * cos30 * scale;
  const py = oy + (x + y) * sin30 * scale - z * scale;
  return { x: px, y: py };
}

interface SvgRealisticIsometricPalletProps {
  nx: number;
  ny: number;
  nz: number;
  palletL: number;
  palletW: number;
  boxL?: number;
  boxW?: number;
  boxH: number;
  zoom: number;
}

// biome-ignore lint/complexity/noExcessiveLinesPerFunction: Realistic 3D SVG isometric view
export function SvgRealisticIsometricPallet({
  nx,
  ny,
  nz,
  palletL,
  palletW,
  boxH,
  zoom,
}: SvgRealisticIsometricPalletProps) {
  const W = 380;
  const H = 250;
  const ox = 190;
  const oy = 115;
  const maxDim = Math.max(palletL, palletW, nz * boxH + 18);
  const baseScale = (105 / maxDim) * zoom;

  const pL = palletL;
  const pW = palletW;
  const pH = 14; // standard wood pallet height (cm)
  const runnerH = 2.4;
  const blockH = 9.2;
  const deckH = 2.4;

  // Ground shadow points
  const sh0 = iso(-6, -6, 0, baseScale, ox, oy);
  const sh1 = iso(pL + 6, -6, 0, baseScale, ox, oy);
  const sh2 = iso(pL + 6, pW + 6, 0, baseScale, ox, oy);
  const sh3 = iso(-6, pW + 6, 0, baseScale, ox, oy);

  // Pallet corners at ground level
  const pP1 = iso(pL, 0, 0, baseScale, ox, oy);
  const pP2 = iso(pL, pW, 0, baseScale, ox, oy);
  const pP3 = iso(0, pW, 0, baseScale, ox, oy);

  // Wooden deck boards / slats on top (5 planks across width)
  const numSlats = 5;
  const slatW = pW / (numSlats * 1.25);
  const slatGap = (pW - numSlats * slatW) / Math.max(1, numSlats - 1);

  // Generate boxes sorted by painter's algorithm: layer first, then back-to-front
  const boxes: Array<{
    key: string;
    depth: number;
    t0: { x: number; y: number };
    t1: { x: number; y: number };
    t2: { x: number; y: number };
    t3: { x: number; y: number };
    b1: { x: number; y: number };
    b2: { x: number; y: number };
    b3: { x: number; y: number };
    tapeTopStart: { x: number; y: number };
    tapeTopEnd: { x: number; y: number };
    tapeFrontEnd: { x: number; y: number };
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

        const t0 = iso(x0, y0, z1, baseScale, ox, oy);
        const t1 = iso(x1, y0, z1, baseScale, ox, oy);
        const t2 = iso(x1, y1, z1, baseScale, ox, oy);
        const t3 = iso(x0, y1, z1, baseScale, ox, oy);

        const b1 = iso(x1, y0, z0, baseScale, ox, oy);
        const b2 = iso(x1, y1, z0, baseScale, ox, oy);
        const b3 = iso(x0, y1, z0, baseScale, ox, oy);

        // Center tape line along top face
        const tapeTopStart = { x: (t0.x + t3.x) / 2, y: (t0.y + t3.y) / 2 };
        const tapeTopEnd = { x: (t1.x + t2.x) / 2, y: (t1.y + t2.y) / 2 };
        const tapeFrontEnd = {
          x: (b2.x + b3.x) / 2,
          y: ((t2.y + t3.y) / 2 + (b2.y + b3.y) / 2) / 2,
        };

        boxes.push({
          key: `box-${x}-${y}-${z}`,
          depth: z * 1000 + x + y,
          t0,
          t1,
          t2,
          t3,
          b1,
          b2,
          b3,
          tapeTopStart,
          tapeTopEnd,
          tapeFrontEnd,
        });
      }
    }
  }

  boxes.sort((a, b) => a.depth - b.depth);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      class={styles.canvasSvg}
      aria-label="Photorealistic 3D Pallet load isometric diagram"
    >
      <defs>
        {/* Soft Ambient Ground Shadow Filter */}
        <filter id="palletGroundBlur" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="4" />
        </filter>

        {/* Wood Slat Gradients */}
        <linearGradient id="woodTopGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#dfb486" />
          <stop offset="50%" stop-color="#d0a16f" />
          <stop offset="100%" stop-color="#be8c57" />
        </linearGradient>
        <linearGradient id="woodFrontGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#a67341" />
          <stop offset="100%" stop-color="#8a5628" />
        </linearGradient>
        <linearGradient id="woodSideGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#7a481c" />
          <stop offset="100%" stop-color="#643812" />
        </linearGradient>

        {/* Kraft Box Lighting Gradients */}
        <linearGradient id="kraftTopGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#fae3c6" />
          <stop offset="60%" stop-color="#eed2ac" />
          <stop offset="100%" stop-color="#e2bf94" />
        </linearGradient>
        <linearGradient id="kraftLeftGrad" x1="0%" y1="0%" x2="100%" y2="50%">
          <stop offset="0%" stop-color="#dfa066" />
          <stop offset="100%" stop-color="#cc8b4e" />
        </linearGradient>
        <linearGradient id="kraftRightGrad" x1="0%" y1="0%" x2="100%" y2="50%">
          <stop offset="0%" stop-color="#b9783e" />
          <stop offset="100%" stop-color="#a36329" />
        </linearGradient>

        {/* Golden Kraft Packaging Tape */}
        <linearGradient id="tapeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#cca06c" stop-opacity="0.9" />
          <stop offset="50%" stop-color="#dfb785" stop-opacity="0.95" />
          <stop offset="100%" stop-color="#c1935e" stop-opacity="0.9" />
        </linearGradient>
      </defs>

      {/* 1. SOFT AMBIENT GROUND DROP SHADOW */}
      <polygon
        points={`${sh0.x},${sh0.y} ${sh1.x},${sh1.y} ${sh2.x},${sh2.y} ${sh3.x},${sh3.y}`}
        fill="#0f172a"
        opacity="0.18"
        filter="url(#palletGroundBlur)"
      />

      {/* 2. REALISTIC WOODEN PALLET BASE */}
      {/* 2a. Bottom Runner Planks */}
      <polygon
        points={`${pP3.x},${pP3.y} ${pP2.x},${pP2.y} ${pP2.x},${pP2.y - runnerH * baseScale} ${pP3.x},${pP3.y - runnerH * baseScale}`}
        fill="url(#woodFrontGrad)"
      />
      <polygon
        points={`${pP1.x},${pP1.y} ${pP2.x},${pP2.y} ${pP2.x},${pP2.y - runnerH * baseScale} ${pP1.x},${pP1.y - runnerH * baseScale}`}
        fill="url(#woodSideGrad)"
      />

      {/* 2b. Solid Forklift Blocks & Pocket Openings */}
      <polygon
        points={`${pP3.x},${pP3.y - runnerH * baseScale} ${pP2.x},${pP2.y - runnerH * baseScale} ${pP2.x},${pP2.y - (runnerH + blockH) * baseScale} ${pP3.x},${pP3.y - (runnerH + blockH) * baseScale}`}
        fill="#26150b"
      />
      {/* 3 Wooden Blocks on the front elevation */}
      {[0, 0.44, 0.88].map((ratio) => {
        const bx0 = pP3.x + (pP2.x - pP3.x) * ratio;
        const by0 = pP3.y + (pP2.y - pP3.y) * ratio - runnerH * baseScale;
        const bw = (pP2.x - pP3.x) * 0.12;
        const bwh = (pP2.y - pP3.y) * 0.12;
        const bh = blockH * baseScale;
        return (
          <polygon
            key={`block-${ratio}`}
            points={`${bx0},${by0} ${bx0 + bw},${by0 + bwh} ${bx0 + bw},${by0 + bwh - bh} ${bx0},${by0 - bh}`}
            fill="url(#woodFrontGrad)"
            stroke="#633b17"
            stroke-width="0.5"
          />
        );
      })}

      {/* 2c. Wooden Top Deck Slats */}
      {Array.from({ length: numSlats }).map((_, si) => {
        const y0 = si * (slatW + slatGap);
        const y1 = y0 + slatW;
        const z0 = runnerH + blockH;
        const z1 = z0 + deckH;

        const sp1 = iso(pL, y0, z0, baseScale, ox, oy);
        const sp2 = iso(pL, y1, z0, baseScale, ox, oy);
        const sp3 = iso(0, y1, z0, baseScale, ox, oy);

        const st0 = iso(0, y0, z1, baseScale, ox, oy);
        const st1 = iso(pL, y0, z1, baseScale, ox, oy);
        const st2 = iso(pL, y1, z1, baseScale, ox, oy);
        const st3 = iso(0, y1, z1, baseScale, ox, oy);

        return (
          <g key={`slat-${si}`}>
            {/* Front Edge of Slat */}
            <polygon
              points={`${sp3.x},${sp3.y} ${sp2.x},${sp2.y} ${st2.x},${st2.y} ${st3.x},${st3.y}`}
              fill="url(#woodFrontGrad)"
              stroke="#542e0f"
              stroke-width="0.4"
            />
            {/* Right Edge of Slat */}
            <polygon
              points={`${sp1.x},${sp1.y} ${sp2.x},${sp2.y} ${st2.x},${st2.y} ${st1.x},${st1.y}`}
              fill="url(#woodSideGrad)"
              stroke="#542e0f"
              stroke-width="0.4"
            />
            {/* Top Deck Surface of Slat */}
            <polygon
              points={`${st0.x},${st0.y} ${st1.x},${st1.y} ${st2.x},${st2.y} ${st3.x},${st3.y}`}
              fill="url(#woodTopGrad)"
              stroke="#542e0f"
              stroke-width="0.4"
            />
          </g>
        );
      })}

      {/* 3. STACKED CORRUGATED KRAFT BOXES */}
      {boxes.map((b) => (
        <g key={b.key}>
          {/* Front-left face (Length axis, at y = y1) */}
          <polygon
            points={`${b.b3.x},${b.b3.y} ${b.b2.x},${b.b2.y} ${b.t2.x},${b.t2.y} ${b.t3.x},${b.t3.y}`}
            fill="url(#kraftLeftGrad)"
            stroke="#965620"
            stroke-width="0.6"
          />
          {/* Front-right face (Width axis, at x = x1) */}
          <polygon
            points={`${b.b1.x},${b.b1.y} ${b.b2.x},${b.b2.y} ${b.t2.x},${b.t2.y} ${b.t1.x},${b.t1.y}`}
            fill="url(#kraftRightGrad)"
            stroke="#965620"
            stroke-width="0.6"
          />
          {/* Top face (at z = z1) */}
          <polygon
            points={`${b.t0.x},${b.t0.y} ${b.t1.x},${b.t1.y} ${b.t2.x},${b.t2.y} ${b.t3.x},${b.t3.y}`}
            fill="url(#kraftTopGrad)"
            stroke="#965620"
            stroke-width="0.6"
          />

          {/* Center packaging tape strip across top flaps */}
          <line
            x1={b.tapeTopStart.x}
            y1={b.tapeTopStart.y}
            x2={b.tapeTopEnd.x}
            y2={b.tapeTopEnd.y}
            stroke="url(#tapeGrad)"
            stroke-width="3"
            stroke-linecap="round"
          />
          {/* Flap crease line */}
          <line
            x1={b.tapeTopStart.x}
            y1={b.tapeTopStart.y}
            x2={b.tapeTopEnd.x}
            y2={b.tapeTopEnd.y}
            stroke="#965620"
            stroke-width="0.4"
            opacity="0.6"
          />

          {/* Edge highlight reflection on top ridges */}
          <line
            x1={b.t3.x}
            y1={b.t3.y}
            x2={b.t2.x}
            y2={b.t2.y}
            stroke="rgba(255, 255, 255, 0.45)"
            stroke-width="0.7"
          />
          <line
            x1={b.t2.x}
            y1={b.t2.y}
            x2={b.t1.x}
            y2={b.t1.y}
            stroke="rgba(255, 255, 255, 0.35)"
            stroke-width="0.7"
          />
        </g>
      ))}
    </svg>
  );
}
