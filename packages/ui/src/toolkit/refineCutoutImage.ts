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
import { recoverFineStructures } from './guidedDetailRecovery.ts';

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

/** Fine-twig recovery on busy backgrounds, written into `cut`'s alpha channel in place. */
function withFineStructures(orig: Uint8ClampedArray, cut: Uint8ClampedArray, w: number, h: number) {
  const bg = detectBackgroundFromPerimeter(orig, w, h);
  if (bg.isUniform) return;
  const raw = new Float32Array(w * h);
  for (let i = 0; i < raw.length; i++) raw[i] = (cut[i * 4 + 3] ?? 0) / 255;
  const structured = recoverFineStructures(raw, orig, w, h, bg);
  for (let i = 0; i < structured.length; i++)
    cut[i * 4 + 3] = Math.round((structured[i] ?? 0) * 255);
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
  withFineStructures(orig, cut, w, h);
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
  w: number,
  h: number,
  input: { transparencyMode?: TransparencyMode; feather?: number; tolerance?: number },
): ImageData {
  const mode = input.transparencyMode ?? 'auto';
  const feather = input.feather ?? 2;
  const orig = ctxOrig.getImageData(0, 0, w, h).data;
  const bg = detectBackgroundFromPerimeter(orig, w, h);
  if (mode === 'glass' || bg.isUniform || w * h > MAX_REFINE_PIXELS) {
    return refineMatte(ctxOrig, ctxCut, w, h, feather, mode, input.tolerance);
  }
  const cut = ctxCut.getImageData(0, 0, w, h);
  const raw = new Float32Array(w * h);
  for (let i = 0; i < raw.length; i++) raw[i] = (cut.data[i * 4 + 3] ?? 0) / 255;
  // Keep the existing fine-twig recovery (it brings back thin parts the model barely saw, such as
  // the branch under the kingfisher), then refit edges and clean edge colours.
  const structured = recoverFineStructures(raw, orig, w, h, bg);
  for (let i = 0; i < structured.length; i++) {
    cut.data[i * 4 + 3] = Math.round((structured[i] ?? 0) * 255);
  }
  const refined = refineCutoutEdges(orig, cut.data, w, h);
  const alpha = new Float32Array(w * h);
  for (let i = 0; i < alpha.length; i++) alpha[i] = (refined[i * 4 + 3] ?? 0) / 255;
  const soft = applySubpixelSmoothing(alpha, w, h, feather);
  for (let i = 0; i < soft.length; i++) refined[i * 4 + 3] = Math.round((soft[i] ?? 0) * 255);
  const out = ctxCut.createImageData(w, h);
  out.data.set(refined);
  return out;
}
