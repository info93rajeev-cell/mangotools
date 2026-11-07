/**
 * Edge refinement for the on-device AI mask (no AI here — classic image matting).
 *
 * The model predicts a 512 × 512 mask that is stretched to the photo's full size, so edges are
 * soft and pick up background colour. Two published, deterministic steps fix that:
 *   1. Fast guided filter (He, Sun & Tang 2010; He & Sun 2015): the coarse alpha is refitted to
 *      the full-resolution photo's own edges, but only in the uncertain band around the subject.
 *   2. Blur-fusion foreground colour estimation (Forte & Pitié 2021): edge pixels get the
 *      subject's colour with the *local* background removed, so busy backgrounds do not tint
 *      feathers, hair or leaves.
 * Pure typed-array code (no DOM), so it is unit-testable and runs at any size: heavy work runs on
 * a downscaled copy (≤ LOW_RES_PIXELS) and the result is applied at full resolution.
 */

const LOW_RES_PIXELS = 1_600_000;
const EPS = 1e-4;

export interface Plane {
  w: number;
  h: number;
  data: Float32Array;
}

/** Mean filter with a (2r+1)² window, clipped at the borders. O(w·h) for any radius. */
export function boxMean(src: Plane, r: number): Plane {
  const { w, h, data } = src;
  const tmp = new Float32Array(w * h);
  const out = new Float32Array(w * h);
  for (let y = 0; y < h; y++) runningMean(data, tmp, y * w, 1, w, r);
  for (let x = 0; x < w; x++) runningMean(tmp, out, x, w, h, r);
  return { w, h, data: out };
}

function runningMean(
  src: Float32Array,
  dst: Float32Array,
  start: number,
  step: number,
  n: number,
  r: number,
): void {
  let sum = 0;
  let count = 0;
  for (let i = 0; i < Math.min(r, n); i++) {
    sum += src[start + i * step] ?? 0;
    count++;
  }
  for (let i = 0; i < n; i++) {
    const add = i + r;
    const drop = i - r - 1;
    if (add < n) {
      sum += src[start + add * step] ?? 0;
      count++;
    }
    if (drop >= 0) {
      sum -= src[start + drop * step] ?? 0;
      count--;
    }
    dst[start + i * step] = sum / count;
  }
}

const mul = (a: Plane, b: Plane): Plane => ({
  w: a.w,
  h: a.h,
  data: a.data.map((v, i) => v * (b.data[i] ?? 0)),
});

/** Solve (Σ + εI) a = c for one pixel, Σ symmetric 3×3 given as [xx, xy, xz, yy, yz, zz]. */
function solve3(s: number[], c: [number, number, number]): [number, number, number] {
  const [xx, xy, xz, yy, yz, zz] = s as [number, number, number, number, number, number];
  const A = xx + EPS;
  const D = yy + EPS;
  const F = zz + EPS;
  const i00 = D * F - yz * yz;
  const i01 = xz * yz - xy * F;
  const i02 = xy * yz - xz * D;
  const i11 = A * F - xz * xz;
  const i12 = xy * xz - A * yz;
  const i22 = A * D - xy * xy;
  const det = A * i00 + xy * i01 + xz * i02 || 1e-12;
  return [
    (i00 * c[0] + i01 * c[1] + i02 * c[2]) / det,
    (i01 * c[0] + i11 * c[1] + i12 * c[2]) / det,
    (i02 * c[0] + i12 * c[1] + i22 * c[2]) / det,
  ];
}

/** Colour guided filter: returns smoothed coefficients [a_r, a_g, a_b, b] so q = a·I + b. */
export function guidedCoefficients(I: [Plane, Plane, Plane], p: Plane, r: number): Plane[] {
  const mI = I.map((c) => boxMean(c, r)) as [Plane, Plane, Plane];
  const mP = boxMean(p, r);
  const cov = I.map((c, k) =>
    boxMean(mul(c, p), r).data.map((v, i) => v - (mI[k]?.data[i] ?? 0) * (mP.data[i] ?? 0)),
  );
  const pairs = [
    [0, 0],
    [0, 1],
    [0, 2],
    [1, 1],
    [1, 2],
    [2, 2],
  ] as const;
  const sig = pairs.map(([u, v]) =>
    boxMean(mul(I[u], I[v]), r).data.map((x, i) => x - (mI[u].data[i] ?? 0) * (mI[v].data[i] ?? 0)),
  );
  const n = p.data.length;
  const a = [new Float32Array(n), new Float32Array(n), new Float32Array(n)];
  const b = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const s = sig.map((m) => m[i] ?? 0);
    const c: [number, number, number] = [cov[0]?.[i] ?? 0, cov[1]?.[i] ?? 0, cov[2]?.[i] ?? 0];
    const [x, y, z] = solve3(s, c);
    a[0][i] = x;
    a[1][i] = y;
    a[2][i] = z;
    b[i] =
      (mP.data[i] ?? 0) -
      x * (mI[0].data[i] ?? 0) -
      y * (mI[1].data[i] ?? 0) -
      z * (mI[2].data[i] ?? 0);
  }
  const { w, h } = p;
  return [...a.map((d) => boxMean({ w, h, data: d }, r)), boxMean({ w, h, data: b }, r)];
}

/** Integer-factor area downsample of one RGBA channel (or the alpha) to a Plane in 0..1. */
export function downsample(
  rgba: Uint8ClampedArray,
  w: number,
  h: number,
  k: number,
  ch: number,
): Plane {
  const lw = Math.max(1, Math.floor(w / k));
  const lh = Math.max(1, Math.floor(h / k));
  const out = new Float32Array(lw * lh);
  for (let y = 0; y < lh; y++) {
    for (let x = 0; x < lw; x++) {
      let sum = 0;
      for (let dy = 0; dy < k; dy++) {
        const row = ((y * k + dy) * w + x * k) * 4 + ch;
        for (let dx = 0; dx < k; dx++) sum += rgba[row + dx * 4] ?? 0;
      }
      out[y * lw + x] = sum / (k * k * 255);
    }
  }
  return { w: lw, h: lh, data: out };
}

/** Bilinear sample of a low-res plane at full-res pixel (x, y) for downscale factor k. */
export function sampleAt(p: Plane, x: number, y: number, k: number): number {
  const fx = Math.min(p.w - 1, Math.max(0, (x + 0.5) / k - 0.5));
  const fy = Math.min(p.h - 1, Math.max(0, (y + 0.5) / k - 0.5));
  const x0 = Math.floor(fx);
  const y0 = Math.floor(fy);
  const x1 = Math.min(p.w - 1, x0 + 1);
  const y1 = Math.min(p.h - 1, y0 + 1);
  const tx = fx - x0;
  const ty = fy - y0;
  const d = p.data;
  const top = (d[y0 * p.w + x0] ?? 0) * (1 - tx) + (d[y0 * p.w + x1] ?? 0) * tx;
  const bot = (d[y1 * p.w + x0] ?? 0) * (1 - tx) + (d[y1 * p.w + x1] ?? 0) * tx;
  return top * (1 - ty) + bot * ty;
}

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (lo: number, hi: number, v: number) => {
  const t = clamp01((v - lo) / (hi - lo));
  return t * t * (3 - 2 * t);
};

/** q = a·I + b with the low-res guided-filter coefficients sampled at (x, y). */
function guidedAlpha(
  coef: Plane[],
  rgba: Uint8ClampedArray,
  o: number,
  x: number,
  y: number,
  k: number,
): number {
  const [c0, c1, c2, cb] = coef as [Plane, Plane, Plane, Plane];
  return clamp01(
    sampleAt(c0, x, y, k) * ((rgba[o] ?? 0) / 255) +
      sampleAt(c1, x, y, k) * ((rgba[o + 1] ?? 0) / 255) +
      sampleAt(c2, x, y, k) * ((rgba[o + 2] ?? 0) / 255) +
      sampleAt(cb, x, y, k),
  );
}

/**
 * Colour-line alpha: project the pixel onto the line from the local background colour B to the
 * local subject colour F. Trusted where F and B clearly differ; otherwise the guided value `q`.
 */
function colourLineAlpha(
  rgba: Uint8ClampedArray,
  o: number,
  local: (ch: number) => [number, number],
  q: number,
): number {
  let dot = 0;
  let len = 0;
  for (let ch = 0; ch < 3; ch++) {
    const [F, B] = local(ch);
    const d = F - B;
    dot += ((rgba[o + ch] ?? 0) / 255 - B) * d;
    len += d * d;
  }
  const conf = smooth(0.15, 0.35, Math.sqrt(len));
  return conf * clamp01(dot / (len || 1)) + (1 - conf) * q;
}

/** Keep the refined alpha inside the model's own support: no new subject in sure background. */
function boundBySupport(q: number, sup: number): number {
  // A mild contrast curve settles the filter's residual ramp; mid values (fine hair) stay soft.
  const crisp = smooth(0.1, 0.9, q);
  return Math.max(crisp * smooth(0, 0.08, sup), smooth(0.92, 1, sup));
}

/** Local foreground / background colour per channel: box(I·α)/box(α), box(I·(1−α))/box(1−α). */
function colourEstimates(I: Plane[], alpha: Plane, r: number) {
  const inv: Plane = { ...alpha, data: alpha.data.map((v) => 1 - v) };
  const ma = boxMean(alpha, r).data;
  const mb = boxMean(inv, r).data;
  const ratio = (num: Float32Array, den: Float32Array, fb: Float32Array) =>
    num.map((v, i) => ((den[i] ?? 0) > 1e-4 ? v / (den[i] ?? 1) : (fb[i] ?? 0)));
  const fg = I.map((c) => ({ ...c, data: ratio(boxMean(mul(c, alpha), r).data, ma, c.data) }));
  const bg = I.map((c) => ({ ...c, data: ratio(boxMean(mul(c, inv), r).data, mb, c.data) }));
  return { fg, bg };
}

export interface RefineResult {
  rgba: Uint8ClampedArray;
}

/** Low-res analysis: guided-filter coefficients, the uncertain band and local colours. */
function analyse(rgba: Uint8ClampedArray, alpha: Uint8ClampedArray, w: number, h: number) {
  const k = Math.max(1, Math.ceil(Math.sqrt((w * h) / LOW_RES_PIXELS)));
  const I = [0, 1, 2].map((ch) => downsample(rgba, w, h, k, ch)) as [Plane, Plane, Plane];
  const a = downsample(alpha, w, h, k, 3);
  // The model mask is 512 px wide, so its soft edge spans ~2–3 mask pixels = (w / 512) · 2–3 photo
  // pixels. The window must cover that band on both sides.
  const r = Math.max(4, Math.ceil((3 * Math.max(1, w / 512)) / k));
  const coef = guidedCoefficients(I, a, r);
  const band = boxMean(a, r * 2);
  // Where the model is sure (nearby mask all 0 or all 1) the refinement may not add or remove.
  const support = boxMean(a, Math.max(2, Math.round(r / 2)));
  const { fg, bg } = colourEstimates(I, a, r * 2);
  return { k, coef, band, support, fg, bg };
}

/**
 * Refine the cutout: `rgba` is the original photo, `alpha` an RGBA buffer whose alpha channel is
 * the model's (upscaled) mask. Returns a new RGBA cutout at the same size.
 */
export function refineCutoutEdges(
  rgba: Uint8ClampedArray,
  alpha: Uint8ClampedArray,
  w: number,
  h: number,
): Uint8ClampedArray {
  const { k, coef, band, support, fg, bg } = analyse(rgba, alpha, w, h);
  const out = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const o = (y * w + x) * 4;
      const raw = (alpha[o + 3] ?? 0) / 255;
      const bv = sampleAt(band, x, y, k);
      const local = (ch: number): [number, number] => [
        sampleAt(fg[ch] as Plane, x, y, k),
        sampleAt(bg[ch] as Plane, x, y, k),
      ];
      const a =
        bv > 0.004 && bv < 0.996
          ? boundBySupport(
              colourLineAlpha(rgba, o, local, guidedAlpha(coef, rgba, o, x, y, k)),
              sampleAt(support, x, y, k),
            )
          : raw;
      writePixel(out, rgba, o, a, local);
    }
  }
  return out;
}

function writePixel(
  out: Uint8ClampedArray,
  rgba: Uint8ClampedArray,
  o: number,
  a: number,
  local: (ch: number) => [number, number],
): void {
  out[o + 3] = Math.round(a * 255);
  if (a <= 0.004) return;
  for (let ch = 0; ch < 3; ch++) {
    const I = (rgba[o + ch] ?? 0) / 255;
    if (a >= 0.996) {
      out[o + ch] = rgba[o + ch] ?? 0;
      continue;
    }
    const [F, B] = local(ch);
    out[o + ch] = Math.round(clamp01(F + a * (I - a * F - (1 - a) * B)) * 255);
  }
}
