/**
 * Canvas integration for the Advanced Pen Glass Pass.
 * Plans on a small (<= 512 px) copy, then processes row strips of ~4 MP to keep memory bounded.
 */
import { planGlass, WORK_SIDE } from './glassMatte.ts';
import { applySelectionGlassStrip } from './selectionGlassPass.ts';

const STRIP_PIXELS = 4_000_000;

function canvas2d(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Could not create 2D canvas context');
  return [c, ctx];
}

function smallSelectionPlan(
  image: CanvasImageSource,
  maskCanvas: HTMLCanvasElement,
  w: number,
  h: number,
) {
  const f = Math.max(1, Math.ceil(Math.max(w, h) / WORK_SIDE));
  const sw = Math.ceil(w / f);
  const sh = Math.ceil(h / f);
  const [, ctxA] = canvas2d(sw, sh);
  const [, ctxB] = canvas2d(sw, sh);
  ctxA.imageSmoothingQuality = 'high';
  ctxB.imageSmoothingQuality = 'high';
  ctxA.drawImage(image, 0, 0, sw, sh);
  ctxB.drawImage(maskCanvas, 0, 0, sw, sh);

  const o = ctxA.getImageData(0, 0, sw, sh).data;
  const k = ctxB.getImageData(0, 0, sw, sh).data;
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

/** Draws rows y0..y0+rows of source into strip canvas. */
function drawStripRows(
  ctx: CanvasRenderingContext2D,
  src: CanvasImageSource,
  w: number,
  rows: number,
  y0: number,
) {
  ctx.clearRect(0, 0, w, rows);
  ctx.drawImage(src, 0, y0, w, rows, 0, 0, w, rows);
}

/** Applies glass brush pass to output canvas in strips. */
export function applyGlassPassToCanvas(
  outCanvas: HTMLCanvasElement,
  image: CanvasImageSource,
  maskCanvas: HTMLCanvasElement,
  glassMask: HTMLCanvasElement,
): HTMLCanvasElement {
  const w = outCanvas.width;
  const h = outCanvas.height;
  const plan = smallSelectionPlan(image, maskCanvas, w, h);
  const outCtx = outCanvas.getContext('2d');
  if (!plan || !outCtx) return outCanvas;

  const rowsPerStrip = Math.max(1, Math.floor(STRIP_PIXELS / w));
  const [, ctxImg] = canvas2d(w, rowsPerStrip);
  const [, ctxMask] = canvas2d(w, rowsPerStrip);
  const [, ctxGlass] = canvas2d(w, rowsPerStrip);

  for (let y0 = 0; y0 < h; y0 += rowsPerStrip) {
    const rows = Math.min(rowsPerStrip, h - y0);
    drawStripRows(ctxImg, image, w, rows, y0);
    drawStripRows(ctxMask, maskCanvas, w, rows, y0);
    drawStripRows(ctxGlass, glassMask, w, rows, y0);

    const photoData = ctxImg.getImageData(0, 0, w, rows).data;
    const selMaskData = ctxMask.getImageData(0, 0, w, rows).data;
    const glassMaskData = ctxGlass.getImageData(0, 0, w, rows).data;

    const strip = applySelectionGlassStrip(
      photoData,
      selMaskData,
      glassMaskData,
      w,
      h,
      y0,
      rows,
      plan,
      true,
    );
    const imgData = outCtx.createImageData(w, rows);
    imgData.data.set(strip);
    outCtx.putImageData(imgData, 0, y0);
  }

  return outCanvas;
}
