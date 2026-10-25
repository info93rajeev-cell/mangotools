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
  const points: number[] = [
    0,
    4,
    8,
    12,
    16,
    20,
    24,
    28,
    (w - 8) * 4,
    (w - 7) * 4,
    (w - 6) * 4,
    (w - 5) * 4,
    (w - 4) * 4,
    (w - 3) * 4,
    (w - 2) * 4,
    (w - 1) * 4,
    (h - 1) * w * 4,
    ((h - 1) * w + 1) * 4,
    ((h - 1) * w + 2) * 4,
    ((h - 1) * w + w - 3) * 4,
    ((h - 1) * w + w - 2) * 4,
    ((h - 1) * w + w - 1) * 4,
    Math.floor(h / 2) * w * 4,
    (Math.floor(h / 2) * w + w - 1) * 4,
  ];

  let sumR = 0;
  let sumG = 0;
  let sumB = 0;
  for (const p of points) {
    sumR += ref[p];
    sumG += ref[p + 1];
    sumB += ref[p + 2];
  }
  const r = sumR / points.length;
  const g = sumG / points.length;
  const b = sumB / points.length;

  let maxDev = 0;
  for (const p of points) {
    const dr = ref[p] - r;
    const dg = ref[p + 1] - g;
    const db = ref[p + 2] - b;
    const dev = Math.hypot(dr, dg, db);
    if (dev > maxDev) maxDev = dev;
  }

  return {
    r,
    g,
    b,
    isUniform: maxDev <= 35,
    tolerance: Math.max(12, Math.min(28, maxDev * 2.2)),
  };
}

function resolveGlassAlpha(a: number, dist: number, tolerance: number): number {
  // If model detected strong foreground highlight (specular reflection)
  if (a > 0.85) return Math.min(1.0, a);
  // In translucent glass body: preserve soft transmission alpha so new background shines through
  if (dist <= tolerance) {
    return Math.max(0.18, Math.min(0.42, a * 0.5 + 0.15));
  }
  if (dist > 40) return Math.min(1.0, a * 1.25 + 0.1);
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
  if (!bg.isUniform) return a;

  const dist = Math.hypot(r - bg.r, g - bg.g, b - bg.b);

  if (mode === 'glass') {
    return resolveGlassAlpha(a, dist, bg.tolerance);
  }
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
  if (a <= 0.02 || a >= 0.98) return a;

  let sum = a * blendWeight;
  let weight = blendWeight;

  const neighbors = [
    idx - 1,
    idx + 1,
    idx - w,
    idx + w,
    idx - w - 1,
    idx - w + 1,
    idx + w - 1,
    idx + w + 1,
  ];

  for (const n of neighbors) {
    const na = alpha[n];
    const diff = Math.abs(na - a);
    const wf = Math.exp(-diff * 3);
    sum += na * wf;
    weight += wf;
  }

  return sum / weight;
}

export function applySubpixelSmoothing(
  alpha: Float32Array,
  w: number,
  h: number,
  feather: number,
): Float32Array {
  const smoothed = new Float32Array(alpha);
  const blendWeight = Math.max(1.0, Math.min(4.0, feather > 0 ? feather : 2.0));

  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = y * w + x;
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

  const refined = refineAlphaMask(rawAlpha, origData.data, w, h, bg, transparencyMode);
  const smoothed = applySubpixelSmoothing(refined, w, h, feather);
  return buildDefringedImageData(cutCtx, origData.data, smoothed, w, h, bg);
}
