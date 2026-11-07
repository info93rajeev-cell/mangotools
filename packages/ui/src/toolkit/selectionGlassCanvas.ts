/**
 * Canvas integration for the Advanced Pen Glass Pass.
 * Runs in strips of ~4 MP to keep memory footprint bounded.
 */
import { applySelectionGlassStrip, buildGlassPlanForSelection } from './selectionGlassPass.ts';

const STRIP_PIXELS = 4_000_000;

function canvas2d(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Could not create 2D canvas context');
  return [c, ctx];
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

  const [, ctxImg] = canvas2d(w, h);
  ctxImg.drawImage(image, 0, 0);
  const photoData = ctxImg.getImageData(0, 0, w, h).data;

  const ctxMask = maskCanvas.getContext('2d', { willReadFrequently: true });
  const selMaskData = ctxMask
    ? ctxMask.getImageData(0, 0, w, h).data
    : new Uint8ClampedArray(w * h * 4);

  const ctxGlass = glassMask.getContext('2d', { willReadFrequently: true });
  const glassMaskData = ctxGlass
    ? ctxGlass.getImageData(0, 0, w, h).data
    : new Uint8ClampedArray(w * h * 4);

  const plan = buildGlassPlanForSelection(photoData, selMaskData, w, h);
  const outCtx = outCanvas.getContext('2d');
  if (!outCtx) return outCanvas;

  const rowsPerStrip = Math.max(1, Math.floor(STRIP_PIXELS / w));
  for (let y0 = 0; y0 < h; y0 += rowsPerStrip) {
    const rows = Math.min(rowsPerStrip, h - y0);
    const strip = applySelectionGlassStrip(
      photoData,
      selMaskData,
      glassMaskData,
      w,
      h,
      y0,
      rows,
      plan,
    );
    const imgData = outCtx.createImageData(w, rows);
    imgData.data.set(strip);
    outCtx.putImageData(imgData, 0, y0);
  }

  return outCanvas;
}
