/**
 * Matte refinement for camera photos too large to refine in one piece (over 16 MP).
 * Glass runs a strip at a time at full size (glassCutoutCanvas). Auto / Solid / Tinted are
 * refined on a 12 MP copy; the full-size result then keeps the original pixels wherever the
 * subject is solid and takes the refined pixels only along the edges and see-through parts.
 */
import type { TransparencyMode } from './edgeMatteRefinement.ts';
import { drawRows, glassCutoutCanvas } from './glassCutoutCanvas.ts';
import { refineForBackground } from './refineCutoutImage.ts';

export const REFINE_LIMIT_PIXELS = 16_000_000;
const WORK_PIXELS = 12_000_000;
const STRIP_PIXELS = 4_000_000;

export interface RefineOptions {
  transparencyMode?: TransparencyMode;
  feather?: number;
  tolerance?: number;
}

function canvas2d(w: number, h: number) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  return ctx ? { c, ctx } : null;
}

/** Refines on a copy of at most WORK_PIXELS and returns that small refined canvas. */
function refineSmall(orig: ImageBitmap, cut: ImageBitmap, w: number, h: number, o: RefineOptions) {
  const s = Math.sqrt(WORK_PIXELS / (w * h));
  const sw = Math.max(1, Math.round(w * s));
  const sh = Math.max(1, Math.round(h * s));
  const a = canvas2d(sw, sh);
  const b = canvas2d(sw, sh);
  const r = canvas2d(sw, sh);
  if (!a || !b || !r) return null;
  a.ctx.imageSmoothingQuality = 'high';
  b.ctx.imageSmoothingQuality = 'high';
  a.ctx.drawImage(orig, 0, 0, sw, sh);
  b.ctx.drawImage(cut, 0, 0, sw, sh);
  r.ctx.putImageData(refineForBackground(a.ctx, b.ctx, sw, sh, o), 0, 0);
  return r.c;
}

/** Original pixels where the refined result is solid, refined (upscaled) pixels elsewhere. */
export function mergeStrip(orig: Uint8ClampedArray, refined: Uint8ClampedArray) {
  const out = new Uint8ClampedArray(orig.length);
  for (let i = 0; i < orig.length; i += 4) {
    const a = refined[i + 3] ?? 0;
    const src = a >= 250 ? orig : refined;
    out[i] = src[i] ?? 0;
    out[i + 1] = src[i + 1] ?? 0;
    out[i + 2] = src[i + 2] ?? 0;
    out[i + 3] = a >= 250 ? 255 : a;
  }
  return out;
}

function upscaleMerge(orig: ImageBitmap, small: HTMLCanvasElement, w: number, h: number) {
  const out = canvas2d(w, h);
  const rowsPer = Math.max(1, Math.floor(STRIP_PIXELS / w));
  const sa = canvas2d(w, rowsPer);
  const sb = canvas2d(w, rowsPer);
  if (!out || !sa || !sb) return null;
  sb.ctx.imageSmoothingQuality = 'high';
  for (let y0 = 0; y0 < h; y0 += rowsPer) {
    const rows = Math.min(rowsPer, h - y0);
    sa.ctx.clearRect(0, 0, w, rowsPer);
    sb.ctx.clearRect(0, 0, w, rowsPer);
    drawRows(sa.ctx, orig, w, h, y0, rows);
    drawRows(sb.ctx, small, w, h, y0, rows);
    const merged = mergeStrip(
      sa.ctx.getImageData(0, 0, w, rows).data,
      sb.ctx.getImageData(0, 0, w, rows).data,
    );
    const img = out.ctx.createImageData(w, rows);
    img.data.set(merged);
    out.ctx.putImageData(img, 0, y0);
  }
  return out.c;
}

/** Full-size refined cutout for any photo size, or null if a canvas could not be made. */
export function refineLargeCutout(
  orig: ImageBitmap,
  cut: ImageBitmap,
  w: number,
  h: number,
  o: RefineOptions,
): HTMLCanvasElement | null {
  if (o.transparencyMode === 'glass') return glassCutoutCanvas(orig, cut, w, h);
  const small = refineSmall(orig, cut, w, h, o);
  return small ? upscaleMerge(orig, small, w, h) : null;
}
