import { recoverFineStructures } from './guidedDetailRecovery.ts';

export interface DetectedBg {
  r: number;
  g: number;
  b: number;
  isUniform: boolean;
  tolerance: number;
}

export type TransparencyMode = 'auto' | 'glass' | 'solid';

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

  const r = sumR / cleanCount;
  const g = sumG / cleanCount;
  const b = sumB / cleanCount;

  return {
    r,
    g,
    b,
    isUniform: maxDev <= 40,
    tolerance: Math.max(14, Math.min(32, maxDev * 2.0)),
  };
}

function resolveGlassAlpha(
  a: number,
  r: number,
  g: number,
  b: number,
  dist: number,
  tolerance: number,
): number {
  // Strong specular highlights stay crisp and solid
  if (r > 235 && g > 235 && b > 235) {
    return Math.min(1.0, a);
  }

  // Colored glass (e.g. red cup, purple liquid, green glass)
  const saturation = Math.max(r, g, b) - Math.min(r, g, b);
  if (saturation > 25 && a > 0.2) {
    return Math.max(0.35, Math.min(0.68, a * 0.5 + 0.15));
  }

  // Clear / neutral glass
  if (dist <= tolerance) {
    return Math.max(0.18, Math.min(0.45, a * 0.45 + 0.12));
  }
  if (dist > 40) return Math.min(1.0, a * 1.15 + 0.1);
  const factor = (dist - tolerance) / (40 - tolerance);
  return Math.max(0.18, Math.min(1.0, a * factor + 0.12));
}

function resolveSolidAlpha(a: number, dist: number, tolerance: number): number {
  if (a >= 0.88) return 1.0;
  if (dist <= tolerance) return 0;
  if (dist > 40) return Math.min(1.0, a * 1.35 + 0.15);
  const factor = (dist - tolerance) / (40 - tolerance);
  return Math.max(0, Math.min(1.0, a * factor));
}

function refineBoundaryAlpha(
  a: number,
  r: number,
  g: number,
  b: number,
  bg: DetectedBg,
  mode: TransparencyMode = 'auto',
): number {
  if (a <= 0.005) return 0.0;

  const dist = Math.hypot(r - bg.r, g - bg.g, b - bg.b);

  if (mode === 'glass') {
    return resolveGlassAlpha(a, r, g, b, dist, bg.tolerance);
  }

  if (!bg.isUniform) return a;

  if (mode === 'solid') {
    return resolveSolidAlpha(a, dist, bg.tolerance);
  }

  // Auto mode: check if region has subtle translucent gradient
  if (a >= 0.88) return 1.0;
  if (a > 0.25 && dist <= bg.tolerance) {
    // Preserve soft translucency for transparent wings, veils, glass
    return Math.max(0.15, Math.min(0.4, a * 0.4 + 0.12));
  }
  return resolveSolidAlpha(a, dist, bg.tolerance);
}

export function refineAlphaMask(
  rawAlpha: Float32Array,
  ref: Uint8ClampedArray,
  _w: number,
  _h: number,
  bg: DetectedBg,
  mode: TransparencyMode = 'auto',
): Float32Array {
  const refined = new Float32Array(rawAlpha.length);
  for (let i = 0; i < rawAlpha.length; i++) {
    const off = i * 4;
    refined[i] = refineBoundaryAlpha(rawAlpha[i], ref[off], ref[off + 1], ref[off + 2], bg, mode);
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
  const clean = (val - (1 - a) * bgVal) / a;
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

    if (a >= 0.95 || !bg.isUniform) {
      out.data[off] = r;
      out.data[off + 1] = g;
      out.data[off + 2] = b;
      out.data[off + 3] = Math.round(a * 255);
    } else {
      out.data[off] = cleanChannelRgb(r, a, bg.r);
      out.data[off + 1] = cleanChannelRgb(g, a, bg.g);
      out.data[off + 2] = cleanChannelRgb(b, a, bg.b);
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
): ImageData {
  const origData = origCtx.getImageData(0, 0, w, h);
  const cutData = cutCtx.getImageData(0, 0, w, h);

  const bg = detectBackgroundFromPerimeter(origData.data, w, h);

  const total = w * h;
  const rawAlpha = new Float32Array(total);
  for (let i = 0; i < total; i++) {
    rawAlpha[i] = cutData.data[i * 4 + 3] / 255;
  }

  const structuredAlpha = recoverFineStructures(rawAlpha, origData.data, w, h, bg);
  const refined = refineAlphaMask(structuredAlpha, origData.data, w, h, bg, transparencyMode);
  const smoothed = applySubpixelSmoothing(refined, w, h, feather);
  return buildDefringedImageData(cutCtx, origData.data, smoothed, w, h, bg);
}
