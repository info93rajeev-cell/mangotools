/**
 * Canvas glue for alphaEdgeRefinement: refits the on-device model's cutout to the original
 * photo's edges and removes local background colour from edge pixels.
 */
import { refineCutoutEdges } from './alphaEdgeRefinement.ts';
import {
  applySubpixelSmoothing,
  detectBackgroundFromPerimeter,
  refineMatte,
  type TransparencyMode,
} from './edgeMatteRefinement.ts';

/** Above this size the full-resolution buffers risk running a mobile tab out of memory. */
export const MAX_REFINE_PIXELS = 16_000_000;

function pixels(src: CanvasImageSource, w: number, h: number): Uint8ClampedArray | null {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(src, 0, 0, w, h);
  return ctx.getImageData(0, 0, w, h).data;
}

/**
 * Returns a canvas with the refined cutout, or null when the image is too large or the canvas
 * is unavailable (callers then keep the model's cutout as it is).
 */
export function refineCutoutCanvas(
  original: CanvasImageSource,
  cutout: CanvasImageSource,
  w: number,
  h: number,
): HTMLCanvasElement | null {
  if (w * h > MAX_REFINE_PIXELS) return null;
  const orig = pixels(original, w, h);
  const cut = pixels(cutout, w, h);
  if (!orig || !cut) return null;
  const refined = refineCutoutEdges(orig, cut, w, h);
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  if (!ctx) return null;
  const img = ctx.createImageData(w, h);
  img.data.set(refined);
  ctx.putImageData(img, 0, 0);
  return c;
}

/**
 * Plain, uniform backgrounds (studio product shots) keep the perimeter-colour matte, which also
 * handles glass. Busy backgrounds get the guided edge refinement with local colour estimation,
 * because a single border colour would tint and erode fine edges such as feathers.
 */
export function refineForBackground(
  ctxOrig: CanvasRenderingContext2D,
  ctxCut: CanvasRenderingContext2D,
  cOrig: HTMLCanvasElement,
  cCut: HTMLCanvasElement,
  w: number,
  h: number,
  input: { transparencyMode?: TransparencyMode; feather?: number; tolerance?: number },
): ImageData {
  const mode = input.transparencyMode ?? 'auto';
  const feather = input.feather ?? 2;
  const bg = detectBackgroundFromPerimeter(ctxOrig.getImageData(0, 0, w, h).data, w, h);
  const guided = mode !== 'glass' && !bg.isUniform ? refineCutoutCanvas(cOrig, cCut, w, h) : null;
  const gctx = guided?.getContext('2d', { willReadFrequently: true });
  if (!gctx) return refineMatte(ctxOrig, ctxCut, w, h, feather, mode, input.tolerance);
  const data = gctx.getImageData(0, 0, w, h);
  const alpha = new Float32Array(w * h);
  for (let i = 0; i < alpha.length; i++) alpha[i] = (data.data[i * 4 + 3] ?? 0) / 255;
  const soft = applySubpixelSmoothing(alpha, w, h, feather);
  for (let i = 0; i < soft.length; i++) data.data[i * 4 + 3] = Math.round((soft[i] ?? 0) * 255);
  return data;
}
