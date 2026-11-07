/**
 * Glass matte: makes the glass parts of a cutout see-through, keeps everything else solid.
 *
 * 1. Rebuild the background behind the subject from the pixels around it (push-pull fill on a
 *    small copy of the photo, guided by the AI mask).
 * 2. A subject pixel that looks almost like the background behind it is light passing through
 *    glass: it gets a low alpha that grows with the difference. A pixel clearly different from
 *    the background, or inside an area that is different almost everywhere (a white plastic
 *    leg), is an opaque body and stays solid.
 * 3. The old background colour is taken out of see-through pixels (I = aF + (1-a)B), so the
 *    PNG shows the new background through the glass, not the old one.
 */

export const WORK_SIDE = 512;

function smooth(e0: number, e1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}

interface Small {
  w: number;
  h: number;
  rgb: Float32Array;
  alpha: Float32Array;
}

function addPixel(
  t: Small & { count: Float32Array },
  s: number,
  rgba: Uint8ClampedArray,
  cut: Uint8ClampedArray,
  o: number,
) {
  for (let k = 0; k < 3; k++) t.rgb[s * 3 + k] = (t.rgb[s * 3 + k] ?? 0) + (rgba[o + k] ?? 0);
  t.alpha[s] = (t.alpha[s] ?? 0) + (cut[o + 3] ?? 0) / 255;
  t.count[s] = (t.count[s] ?? 0) + 1;
}

/** Box-averaged copy of the photo and the AI alpha, longest side about WORK_SIDE. */
function shrink(rgba: Uint8ClampedArray, cut: Uint8ClampedArray, w: number, h: number): Small {
  const f = Math.max(1, Math.ceil(Math.max(w, h) / WORK_SIDE));
  const sw = Math.ceil(w / f);
  const sh = Math.ceil(h / f);
  const t = {
    w: sw,
    h: sh,
    rgb: new Float32Array(sw * sh * 3),
    alpha: new Float32Array(sw * sh),
    count: new Float32Array(sw * sh),
  };
  for (let y = 0; y < h; y++) {
    const row = Math.floor(y / f) * sw;
    for (let x = 0; x < w; x++) addPixel(t, row + Math.floor(x / f), rgba, cut, (y * w + x) * 4);
  }
  for (let s = 0; s < sw * sh; s++) {
    const n = t.count[s] || 1;
    for (let k = 0; k < 3; k++) t.rgb[s * 3 + k] = (t.rgb[s * 3 + k] ?? 0) / n;
    t.alpha[s] = (t.alpha[s] ?? 0) / n;
  }
  return { w: sw, h: sh, rgb: t.rgb, alpha: t.alpha };
}

interface Level {
  w: number;
  h: number;
  c: Float32Array; // weighted colour sums
  wt: Float32Array; // weights
}

function down(l: Level): Level {
  const w = Math.ceil(l.w / 2);
  const h = Math.ceil(l.h / 2);
  const c = new Float32Array(w * h * 3);
  const wt = new Float32Array(w * h);
  for (let y = 0; y < l.h; y++) {
    for (let x = 0; x < l.w; x++) {
      const s = y * l.w + x;
      const t = (y >> 1) * w + (x >> 1);
      wt[t] = (wt[t] ?? 0) + (l.wt[s] ?? 0);
      for (let k = 0; k < 3; k++) c[t * 3 + k] = (c[t * 3 + k] ?? 0) + (l.c[s * 3 + k] ?? 0);
    }
  }
  return { w, h, c, wt };
}

/** Fills every pixel with the colour of the nearby background (weights = 1 - AI alpha). */
export function pushPullBackground(rgb: Float32Array, alpha: Float32Array, w: number, h: number) {
  const wt = new Float32Array(w * h);
  const c = new Float32Array(w * h * 3);
  for (let i = 0; i < w * h; i++) {
    const bw = Math.max(0, 1 - (alpha[i] ?? 0) * 1.5);
    wt[i] = bw;
    for (let k = 0; k < 3; k++) c[i * 3 + k] = (rgb[i * 3 + k] ?? 0) * bw;
  }
  const levels: Level[] = [{ w, h, c, wt }];
  let top = levels[0] as Level;
  while (top.w > 2 || top.h > 2) {
    top = down(top);
    levels.push(top);
  }
  let est: Float32Array = new Float32Array(top.w * top.h * 3);
  for (let i = 0; i < top.w * top.h; i++) {
    const n = Math.max(top.wt[i] ?? 0, 1e-6);
    for (let k = 0; k < 3; k++) est[i * 3 + k] = (top.c[i * 3 + k] ?? 0) / n;
  }
  for (let li = levels.length - 2; li >= 0; li--) {
    est = pullLevel(levels[li] as Level, est, levels[li + 1] as Level);
  }
  return est;
}

/** One pull step: blend this level's own background colour with the coarser estimate. */
function pullLevel(l: Level, coarse: Float32Array, cl: Level): Float32Array {
  const out = new Float32Array(l.w * l.h * 3);
  for (let y = 0; y < l.h; y++) {
    for (let x = 0; x < l.w; x++) {
      const i = y * l.w + x;
      const own = Math.min(1, l.wt[i] ?? 0);
      const n = Math.max(l.wt[i] ?? 0, 1e-6);
      const up = sampleBilinear(coarse, cl.w, cl.h, (x + 0.5) / 2 - 0.5, (y + 0.5) / 2 - 0.5);
      for (let k = 0; k < 3; k++) {
        out[i * 3 + k] = ((l.c[i * 3 + k] ?? 0) / n) * own + (up[k] ?? 0) * (1 - own);
      }
    }
  }
  return out;
}

const tmp = [0, 0, 0];
function sampleBilinear(img: Float32Array, w: number, h: number, fx: number, fy: number) {
  const x = Math.min(w - 1, Math.max(0, fx));
  const y = Math.min(h - 1, Math.max(0, fy));
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const x1 = Math.min(w - 1, x0 + 1);
  const y1 = Math.min(h - 1, y0 + 1);
  const tx = x - x0;
  const ty = y - y0;
  for (let k = 0; k < 3; k++) {
    const a = (img[(y0 * w + x0) * 3 + k] ?? 0) * (1 - tx) + (img[(y0 * w + x1) * 3 + k] ?? 0) * tx;
    const b = (img[(y1 * w + x0) * 3 + k] ?? 0) * (1 - tx) + (img[(y1 * w + x1) * 3 + k] ?? 0) * tx;
    tmp[k] = a * (1 - ty) + b * ty;
  }
  return tmp;
}

function boxMean(src: Float32Array, w: number, h: number, r: number): Float32Array {
  const pass = (a: Float32Array, horizontal: boolean) => {
    const out = new Float32Array(w * h);
    const len = horizontal ? w : h;
    const lines = horizontal ? h : w;
    for (let line = 0; line < lines; line++) {
      const at = (p: number) => (horizontal ? line * w + p : p * w + line);
      let sum = 0;
      for (let p = -r; p <= r; p++) sum += a[at(Math.min(len - 1, Math.max(0, p)))] ?? 0;
      for (let p = 0; p < len; p++) {
        out[at(p)] = sum / (2 * r + 1);
        sum += (a[at(Math.min(len - 1, p + r + 1))] ?? 0) - (a[at(Math.max(0, p - r))] ?? 0);
      }
    }
    return out;
  };
  return pass(pass(src, true), false);
}

/** Difference from the background (0-441) at which a pixel counts as an opaque body. */
const BODY_FROM = 14;
const BODY_FULL = 32;

/** Per small pixel: 0..1, how much the area around it is an opaque body (legs, labels). */
function solidAreas(small: Small, bg: Float32Array): Float32Array {
  const n = small.w * small.h;
  const body = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const dr = (small.rgb[i * 3] ?? 0) - (bg[i * 3] ?? 0);
    const dg = (small.rgb[i * 3 + 1] ?? 0) - (bg[i * 3 + 1] ?? 0);
    const db = (small.rgb[i * 3 + 2] ?? 0) - (bg[i * 3 + 2] ?? 0);
    body[i] = smooth(BODY_FROM, BODY_FULL, Math.hypot(dr, dg, db));
  }
  const local = boxMean(body, small.w, small.h, Math.max(2, Math.round(small.w / 140)));
  for (let i = 0; i < n; i++) local[i] = smooth(0.55, 0.85, local[i] ?? 0);
  return local;
}

function scalarAt(a: Float32Array, w: number, h: number, fx: number, fy: number): number {
  const x = Math.min(w - 1, Math.max(0, fx));
  const y = Math.min(h - 1, Math.max(0, fy));
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const x1 = Math.min(w - 1, x0 + 1);
  const y1 = Math.min(h - 1, y0 + 1);
  const tx = x - x0;
  const ty = y - y0;
  const top = (a[y0 * w + x0] ?? 0) * (1 - tx) + (a[y0 * w + x1] ?? 0) * tx;
  const bot = (a[y1 * w + x0] ?? 0) * (1 - tx) + (a[y1 * w + x1] ?? 0) * tx;
  return top * (1 - ty) + bot * ty;
}

/** Background and solid-area maps, computed once on a small copy of the photo. */
export interface GlassPlan {
  w: number;
  h: number;
  bg: Float32Array;
  solid: Float32Array;
}

/** `rgb` (0-255, 3 per pixel) and `alpha` (0-1, AI mask) of a small copy of the photo. */
export function planGlass(rgb: Float32Array, alpha: Float32Array, w: number, h: number): GlassPlan {
  const bg = pushPullBackground(rgb, alpha, w, h);
  return { w, h, bg, solid: solidAreas({ w, h, rgb, alpha }, bg) };
}

/**
 * Glass matte for rows y0 .. y0 + rows of a full-size photo, so very large photos can be
 * processed a strip at a time. `rgba` and `cut` hold just those rows.
 */
export function glassStrip(
  plan: GlassPlan,
  rgba: Uint8ClampedArray,
  cut: Uint8ClampedArray,
  full: { w: number; h: number; y0: number; rows: number },
): Uint8ClampedArray {
  const out = new Uint8ClampedArray(full.w * full.rows * 4);
  const sx = plan.w / full.w;
  const sy = plan.h / full.h;
  for (let r = 0; r < full.rows; r++) {
    const fy = (full.y0 + r + 0.5) * sy - 0.5;
    for (let x = 0; x < full.w; x++) {
      const fx = (x + 0.5) * sx - 0.5;
      writeGlassPixel(out, rgba, cut, (r * full.w + x) * 4, {
        b: sampleBilinear(plan.bg, plan.w, plan.h, fx, fy),
        solid: scalarAt(plan.solid, plan.w, plan.h, fx, fy),
      });
    }
  }
  return out;
}

/** Whole-image version: glass see-through, other parts solid, old background colour removed. */
export function glassMatte(
  rgba: Uint8ClampedArray,
  cut: Uint8ClampedArray,
  w: number,
  h: number,
): Uint8ClampedArray {
  const small = shrink(rgba, cut, w, h);
  const plan = planGlass(small.rgb, small.alpha, small.w, small.h);
  return glassStrip(plan, rgba, cut, { w, h, y0: 0, rows: h });
}

function writeGlassPixel(
  out: Uint8ClampedArray,
  rgba: Uint8ClampedArray,
  cut: Uint8ClampedArray,
  o: number,
  at: { b: number[]; solid: number },
) {
  const a = (cut[o + 3] ?? 0) / 255;
  const r = rgba[o] ?? 0;
  const g = rgba[o + 1] ?? 0;
  const bl = rgba[o + 2] ?? 0;
  const br = at.b[0] ?? 0;
  const bgc = at.b[1] ?? 0;
  const bb = at.b[2] ?? 0;
  const d = Math.hypot(r - br, g - bgc, bl - bb);
  const body = Math.max(smooth(BODY_FROM, BODY_FULL, d), at.solid);
  const glass = Math.min(1, 0.06 + d / 40);
  const alpha = a * (body + (1 - body) * glass);
  const keep = Math.max(alpha, 0.05);
  out[o] = (r - (1 - alpha) * br) / keep;
  out[o + 1] = (g - (1 - alpha) * bgc) / keep;
  out[o + 2] = (bl - (1 - alpha) * bb) / keep;
  out[o + 3] = Math.round(alpha * 255);
}
