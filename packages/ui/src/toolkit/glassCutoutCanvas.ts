/**
 * Canvas glue for glassMatte: plans the background on a small copy, then processes the
 * full-size photo a strip of rows at a time, so even 24 MP+ camera photos fit in memory.
 */
import { glassStrip, planGlass, WORK_SIDE } from './glassMatte.ts';

/** About this many pixels per strip (16 MB of RGBA per buffer). */
const STRIP_PIXELS = 4_000_000;

function canvas2d(w: number, h: number) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  return ctx ? { c, ctx } : null;
}

type Source = ImageBitmap | HTMLCanvasElement;

function smallCopy(orig: Source, cut: Source, w: number, h: number) {
  const f = Math.max(1, Math.ceil(Math.max(w, h) / WORK_SIDE));
  const sw = Math.ceil(w / f);
  const sh = Math.ceil(h / f);
  const a = canvas2d(sw, sh);
  const b = canvas2d(sw, sh);
  if (!a || !b) return null;
  a.ctx.imageSmoothingQuality = 'high';
  b.ctx.imageSmoothingQuality = 'high';
  a.ctx.drawImage(orig, 0, 0, sw, sh);
  b.ctx.drawImage(cut, 0, 0, sw, sh);
  const o = a.ctx.getImageData(0, 0, sw, sh).data;
  const k = b.ctx.getImageData(0, 0, sw, sh).data;
  const rgb = new Float32Array(sw * sh * 3);
  const alpha = new Float32Array(sw * sh);
  for (let i = 0; i < sw * sh; i++) {
    rgb[i * 3] = o[i * 4] ?? 0;
    rgb[i * 3 + 1] = o[i * 4 + 1] ?? 0;
    rgb[i * 3 + 2] = o[i * 4 + 2] ?? 0;
    alpha[i] = (k[i * 4 + 3] ?? 0) / 255;
  }
  return planGlass(rgb, alpha, sw, sh);
}

/** Draws rows y0..y0+rows (in output pixels) of a source that may be a different size. */
function drawRows(
  ctx: CanvasRenderingContext2D,
  src: Source,
  w: number,
  h: number,
  y0: number,
  rows: number,
) {
  const fy = src.height / h;
  ctx.drawImage(src, 0, y0 * fy, src.width, rows * fy, 0, 0, w, rows);
}

/** Returns the glass cutout at full size, or null if a canvas could not be created. */
export function glassCutoutCanvas(
  orig: Source,
  cut: Source,
  w: number,
  h: number,
): HTMLCanvasElement | null {
  const plan = smallCopy(orig, cut, w, h);
  const out = canvas2d(w, h);
  const rowsPer = Math.max(1, Math.floor(STRIP_PIXELS / w));
  const sa = canvas2d(w, rowsPer);
  const sb = canvas2d(w, rowsPer);
  if (!plan || !out || !sa || !sb) return null;
  for (let y0 = 0; y0 < h; y0 += rowsPer) {
    const rows = Math.min(rowsPer, h - y0);
    sa.ctx.clearRect(0, 0, w, rowsPer);
    sb.ctx.clearRect(0, 0, w, rowsPer);
    drawRows(sa.ctx, orig, w, h, y0, rows);
    drawRows(sb.ctx, cut, w, h, y0, rows);
    const strip = glassStrip(
      plan,
      sa.ctx.getImageData(0, 0, w, rows).data,
      sb.ctx.getImageData(0, 0, w, rows).data,
      { w, h, y0, rows },
    );
    const img = out.ctx.createImageData(w, rows);
    img.data.set(strip);
    out.ctx.putImageData(img, 0, y0);
  }
  return out.c;
}
