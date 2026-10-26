import { recoverFineStructures } from './guidedDetailRecovery.ts';

export interface SurfaceBg {
  r: number;
  g: number;
  b: number;
  tolerance: number;
}

export interface DetectedBg {
  r: number;
  g: number;
  b: number;
  isUniform: boolean;
  tolerance: number;
  wall?: SurfaceBg;
  floor?: SurfaceBg;
  hasTableFloor?: boolean;
  contactBaseY?: number;
}

export type TransparencyMode = 'auto' | 'glass' | 'solid';

function sampleSurface(
  ref: Uint8ClampedArray,
  w: number,
  yStart: number,
  yEnd: number,
  xStep: number,
): SurfaceBg | undefined {
  let sumR = 0;
  let sumG = 0;
  let sumB = 0;
  let count = 0;

  for (let x = 10; x < w - 10; x += xStep) {
    for (let y = yStart; y < yEnd; y += 2) {
      const off = (y * w + x) * 4;
      sumR += ref[off];
      sumG += ref[off + 1];
      sumB += ref[off + 2];
      count++;
    }
  }

  if (count === 0) return undefined;
  const avgR = sumR / count;
  const avgG = sumG / count;
  const avgB = sumB / count;

  const devs: number[] = [];
  for (let x = 10; x < w - 10; x += xStep) {
    for (let y = yStart; y < yEnd; y += 2) {
      const off = (y * w + x) * 4;
      devs.push(Math.hypot(ref[off] - avgR, ref[off + 1] - avgG, ref[off + 2] - avgB));
    }
  }
  devs.sort((a, b) => a - b);
  const medDev = devs[Math.floor(devs.length * 0.5)] || 0;

  return {
    r: avgR,
    g: avgG,
    b: avgB,
    tolerance: Math.max(16, Math.min(32, medDev * 1.6)),
  };
}

function detectContactBaseline(ref: Uint8ClampedArray, w: number, h: number): number | undefined {
  let maxGrad = 0;
  let bestY = Math.round(h * 0.46);
  const yScanStart = Math.round(h * 0.38);
  const yScanEnd = Math.round(h * 0.58);
  const xStart = Math.round(w * 0.15);
  const xEnd = Math.round(w * 0.85);
  const xScanStep = Math.max(2, Math.floor(w / 100));

  for (let y = yScanStart; y <= yScanEnd; y += 2) {
    let gradSum = 0;
    let count = 0;
    for (let x = xStart; x < xEnd; x += xScanStep) {
      const up = ((y - 2) * w + x) * 4;
      const down = ((y + 2) * w + x) * 4;
      gradSum += Math.hypot(
        ref[down] - ref[up],
        ref[down + 1] - ref[up + 1],
        ref[down + 2] - ref[up + 2],
      );
      count++;
    }
    const avg = count > 0 ? gradSum / count : 0;
    if (avg > maxGrad) {
      maxGrad = avg;
      bestY = y;
    }
  }

  return maxGrad >= 32 ? bestY : undefined;
}

export function detectBackgroundFromPerimeter(
  ref: Uint8ClampedArray,
  w: number,
  h: number,
): DetectedBg {
  const points: number[] = [];
  const steps = 8;
  for (let i = 0; i < steps; i++) {
    const x = Math.floor(w * ((i + 0.5) / steps));
    points.push(x * 4);
    points.push(((h - 1) * w + x) * 4);
  }
  for (let i = 0; i < steps; i++) {
    const y = Math.floor(h * ((i + 0.5) / steps));
    points.push(y * w * 4);
    points.push((y * w + w - 1) * 4);
  }

  // Calculate median color to withstand corner/side occluders
  const rVals = points.map((p) => ref[p]).sort((a, b) => a - b);
  const gVals = points.map((p) => ref[p + 1]).sort((a, b) => a - b);
  const bVals = points.map((p) => ref[p + 2]).sort((a, b) => a - b);
  const mid = Math.floor(points.length / 2);
  const medR = rVals[mid];
  const medG = gVals[mid];
  const medB = bVals[mid];

  // Discard furthest 25% outlier points
  const withDist = points.map((p) => {
    const d = Math.hypot(ref[p] - medR, ref[p + 1] - medG, ref[p + 2] - medB);
    return { p, d };
  });
  withDist.sort((a, b) => a.d - b.d);
  const cleanCount = Math.max(8, Math.floor(points.length * 0.75));
  const clean = withDist.slice(0, cleanCount);

  let sumR = 0;
  let sumG = 0;
  let sumB = 0;
  let maxDev = 0;
  for (const item of clean) {
    sumR += ref[item.p];
    sumG += ref[item.p + 1];
    sumB += ref[item.p + 2];
    if (item.d > maxDev) maxDev = item.d;
  }

  const xStep = Math.max(1, Math.floor(w / 40));
  const yTopLimit = Math.min(15, Math.max(2, Math.floor(h * 0.05)));
  const yBtmStart = Math.max(0, h - yTopLimit);

  const wall = sampleSurface(ref, w, 1, yTopLimit, xStep);
  const floor = sampleSurface(ref, w, yBtmStart, h - 1, xStep);
  const surfaceDist =
    wall && floor ? Math.hypot(wall.r - floor.r, wall.g - floor.g, wall.b - floor.b) : 0;
  const hasTableFloor = surfaceDist > 30;
  const contactBaseY = hasTableFloor ? detectContactBaseline(ref, w, h) : undefined;

  return {
    r: sumR / cleanCount,
    g: sumG / cleanCount,
    b: sumB / cleanCount,
    isUniform: maxDev <= 40 || hasTableFloor,
    tolerance: Math.max(14, Math.min(32, maxDev * 2.0)),
    wall,
    floor,
    hasTableFloor,
    contactBaseY,
  };
}

export function resolveGlassAlpha(
  a: number,
  r: number,
  g: number,
  b: number,
  dist: number,
  tolerance: number,
): number {
  const maxC = Math.max(r, g, b);
  const minC = Math.min(r, g, b);
  const saturation = maxC - minC;
  const lum = 0.299 * r + 0.587 * g + 0.114 * b;

  // 1. Specular glints (direct reflection of light source) stay solid
  if (minC >= 240 && saturation <= 15) {
    return 1.0;
  }

  // 2. Background pixels are 100% transparent (never turned into glass)
  if (dist <= tolerance) {
    return 0.0;
  }

  // 3. Clear transparent glass body (color close to background)
  if (dist <= tolerance * 1.25 && a > 0.05) {
    return Math.max(0.18, Math.min(0.45, a * 0.4 + 0.1));
  }

  // 4. Opaque solid bodies (ceramic vase, plastic birds, hats, boots)
  // Low luminance or high distance from background means it is a solid object, not transparent glass!
  if (a >= 0.85 && (lum < 110 || dist > 60)) {
    return 1.0;
  }

  // 5. Tinted luminous glass (e.g. red cocktail cup, amber bottle, stained glass)
  if (saturation > 25 && lum >= 110 && a > 0.2) {
    return Math.max(0.38, Math.min(0.65, a * 0.45 + 0.2));
  }

  if (a >= 0.85) return 1.0;
  if (dist > 40) return Math.min(1.0, a * 1.25 + 0.1);
  const factor = (dist - tolerance) / (40 - tolerance);
  return Math.max(0, Math.min(1.0, a * factor));
}

function resolveSolidAlpha(a: number, dist: number, tolerance: number): number {
  if (a >= 0.85) return 1.0;
  if (dist <= tolerance) return 0;
  if (dist > 40) return Math.min(1.0, a * 1.35 + 0.15);
  const factor = (dist - tolerance) / (40 - tolerance);
  return Math.max(0, Math.min(1.0, a * factor));
}

function computeActiveDistance(
  r: number,
  g: number,
  b: number,
  bg: DetectedBg,
  yNorm: number,
): { dist: number; tol: number } {
  if (bg.hasTableFloor && bg.wall && bg.floor) {
    if (yNorm < 0.45) {
      return {
        dist: Math.hypot(r - bg.wall.r, g - bg.wall.g, b - bg.wall.b),
        tol: bg.wall.tolerance,
      };
    }
    const dWall = Math.hypot(r - bg.wall.r, g - bg.wall.g, b - bg.wall.b);
    const dFloor = Math.hypot(r - bg.floor.r, g - bg.floor.g, b - bg.floor.b);
    return {
      dist: Math.min(dWall, dFloor),
      tol: Math.min(bg.wall.tolerance, bg.floor.tolerance),
    };
  }

  return {
    dist: Math.hypot(r - bg.r, g - bg.g, b - bg.b),
    tol: bg.tolerance,
  };
}

function shouldRemoveFloorTable(bg: DetectedBg, y: number): boolean {
  return Boolean(bg.hasTableFloor && bg.contactBaseY !== undefined && y > bg.contactBaseY + 2);
}

function refineBoundaryAlpha(
  a: number,
  r: number,
  g: number,
  b: number,
  bg: DetectedBg,
  mode: TransparencyMode = 'auto',
  y = 0,
  h = 1,
): number {
  if (a <= 0.005) return 0.0;
  if (shouldRemoveFloorTable(bg, y)) return 0.0;

  const yNorm = h > 0 ? y / h : 0.5;
  if (bg.wall && yNorm < 0.4) {
    const dWall = Math.hypot(r - bg.wall.r, g - bg.wall.g, b - bg.wall.b);
    if (dWall <= bg.wall.tolerance) return 0.0;
  }

  const { dist, tol } = computeActiveDistance(r, g, b, bg, yNorm);
  if (mode === 'glass') return resolveGlassAlpha(a, r, g, b, dist, tol);
  if (dist <= tol) return 0.0;
  if (mode === 'solid') return resolveSolidAlpha(a, dist, tol);
  if (a >= 0.85) return 1.0;
  if (!bg.isUniform && !bg.hasTableFloor) return a;
  return resolveSolidAlpha(a, dist, tol);
}

export function refineAlphaMask(
  rawAlpha: Float32Array,
  ref: Uint8ClampedArray,
  w: number,
  h: number,
  bg: DetectedBg,
  mode: TransparencyMode = 'auto',
): Float32Array {
  const refined = new Float32Array(rawAlpha.length);
  for (let y = 0; y < h; y++) {
    const rowOffset = y * w;
    for (let x = 0; x < w; x++) {
      const i = rowOffset + x;
      const off = i * 4;
      refined[i] = refineBoundaryAlpha(
        rawAlpha[i],
        ref[off],
        ref[off + 1],
        ref[off + 2],
        bg,
        mode,
        y,
        h,
      );
    }
  }
  return refined;
}

function smoothPixelAlpha(
  alpha: Float32Array,
  idx: number,
  w: number,
  blendWeight: number,
): number {
  const a = alpha[idx];
  if (a <= 0.03 || a >= 0.97) return a;

  const a1 = alpha[idx - 1];
  const a2 = alpha[idx + 1];
  const a3 = alpha[idx - w];
  const a4 = alpha[idx + w];

  const w1 = Math.exp(-Math.abs(a1 - a) * 3);
  const w2 = Math.exp(-Math.abs(a2 - a) * 3);
  const w3 = Math.exp(-Math.abs(a3 - a) * 3);
  const w4 = Math.exp(-Math.abs(a4 - a) * 3);

  const sum = a * blendWeight + a1 * w1 + a2 * w2 + a3 * w3 + a4 * w4;
  const weight = blendWeight + w1 + w2 + w3 + w4;

  return sum / weight;
}

export function applySubpixelSmoothing(
  alpha: Float32Array,
  w: number,
  h: number,
  feather: number,
): Float32Array {
  if (feather <= 0) return alpha;
  const smoothed = new Float32Array(alpha);
  const blendWeight = Math.max(1.0, Math.min(4.0, feather));

  for (let y = 1; y < h - 1; y++) {
    const rowOffset = y * w;
    for (let x = 1; x < w - 1; x++) {
      const idx = rowOffset + x;
      if (alpha[idx] <= 0.03 || alpha[idx] >= 0.97) continue;
      smoothed[idx] = smoothPixelAlpha(alpha, idx, w, blendWeight);
    }
  }

  return smoothed;
}

function cleanChannelRgb(val: number, a: number, bgVal: number): number {
  const safeA = Math.max(0.12, a);
  const clean = (val - (1 - a) * bgVal) / safeA;
  return Math.max(0, Math.min(255, Math.round(clean)));
}

export function buildDefringedImageData(
  ctx: CanvasRenderingContext2D,
  ref: Uint8ClampedArray,
  alpha: Float32Array,
  w: number,
  h: number,
  bg: DetectedBg,
): ImageData {
  const out = ctx.createImageData(w, h);
  const total = w * h;

  for (let i = 0; i < total; i++) {
    const a = alpha[i];
    const off = i * 4;

    if (a <= 0.005) {
      out.data[off] = 0;
      out.data[off + 1] = 0;
      out.data[off + 2] = 0;
      out.data[off + 3] = 0;
      continue;
    }

    const r = ref[off];
    const g = ref[off + 1];
    const b = ref[off + 2];

    if (a >= 0.95) {
      out.data[off] = r;
      out.data[off + 1] = g;
      out.data[off + 2] = b;
      out.data[off + 3] = Math.round(a * 255);
    } else {
      const y = Math.floor(i / w);
      const activeBg = bg.hasTableFloor && bg.wall && y / h < 0.45 ? bg.wall : bg;
      out.data[off] = cleanChannelRgb(r, a, activeBg.r);
      out.data[off + 1] = cleanChannelRgb(g, a, activeBg.g);
      out.data[off + 2] = cleanChannelRgb(b, a, activeBg.b);
      out.data[off + 3] = Math.max(0, Math.min(255, Math.round(a * 255)));
    }
  }

  return out;
}

export function refineMatte(
  origCtx: CanvasRenderingContext2D,
  cutCtx: CanvasRenderingContext2D,
  w: number,
  h: number,
  feather = 2,
  transparencyMode: TransparencyMode = 'auto',
  customTolerance?: number,
): ImageData {
  const origData = origCtx.getImageData(0, 0, w, h);
  const cutData = cutCtx.getImageData(0, 0, w, h);

  const bg = detectBackgroundFromPerimeter(origData.data, w, h);
  if (customTolerance !== undefined && customTolerance > 0) {
    bg.tolerance = Math.max(10, customTolerance);
  }

  const total = w * h;
  const rawAlpha = new Float32Array(total);
  for (let i = 0; i < total; i++) {
    rawAlpha[i] = cutData.data[i * 4 + 3] / 255;
  }

  const structuredAlpha =
    transparencyMode === 'glass'
      ? rawAlpha
      : recoverFineStructures(rawAlpha, origData.data, w, h, bg);
  const refined = refineAlphaMask(structuredAlpha, origData.data, w, h, bg, transparencyMode);
  const smoothed = applySubpixelSmoothing(refined, w, h, feather);
  return buildDefringedImageData(cutCtx, origData.data, smoothed, w, h, bg);
}
