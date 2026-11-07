/**
 * Raster selection for the Advanced Pen studio.
 *
 * The selection is an alpha mask at full image resolution, built in this order:
 *   1. the on-device AI mask (Auto Select), when present;
 *   2. the pen path, filled, when it has at least three points (a hard-edged area added on top);
 *   3. brush strokes, in order: "add" paints the subject back in, "remove" erases background.
 * Expand/contract and feather are applied to the finished mask, so they work the same for an
 * AI mask, a pen area or brush edits.
 */
import { type BezierPath, drawPathToCanvas } from './bezierPathModel.ts';

export interface BrushStroke {
  mode: 'add' | 'remove';
  /** Brush radius in image pixels. */
  radius: number;
  points: { x: number; y: number }[];
}

export interface MaskSources {
  aiMask: CanvasImageSource | null;
  path: BezierPath;
  strokes: readonly BrushStroke[];
}

function canvas2d(width: number, height: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = width;
  c.height = height;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Could not create 2D canvas context');
  return [c, ctx];
}

export function drawStroke(ctx: CanvasRenderingContext2D, stroke: BrushStroke): void {
  const [first, ...rest] = stroke.points;
  if (!first) return;
  ctx.save();
  ctx.globalCompositeOperation = stroke.mode === 'add' ? 'source-over' : 'destination-out';
  ctx.strokeStyle = '#ffffff';
  ctx.fillStyle = '#ffffff';
  ctx.lineWidth = stroke.radius * 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (rest.length === 0) {
    ctx.beginPath();
    ctx.arc(first.x, first.y, stroke.radius, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.moveTo(first.x, first.y);
    for (const p of rest) ctx.lineTo(p.x, p.y);
    ctx.stroke();
  }
  ctx.restore();
}

/** Only a closed pen path with three or more points selects an area. */
export function isFillablePath(path: MaskSources['path']): boolean {
  return path.isClosed && path.points.length >= 3;
}

/** True when nothing has been selected yet (no AI mask, no closed path, no added strokes). */
export function isEmptySelection(src: MaskSources): boolean {
  return !src.aiMask && !isFillablePath(src.path) && !src.strokes.some((s) => s.mode === 'add');
}

/** True when there is nothing to show yet, so the stage should show the photo itself. */
export function hasNoEdits(src: MaskSources): boolean {
  return isEmptySelection(src) && src.strokes.length === 0;
}

/** The sharp (unfeathered) selection mask. White = keep, transparent = remove. */
export function composeSelectionMask(width: number, height: number, src: MaskSources) {
  const [c, ctx] = canvas2d(width, height);
  // Brush Remove with nothing selected yet erases from the whole photo.
  if (isEmptySelection(src) && src.strokes.length > 0) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
  }
  if (src.aiMask) ctx.drawImage(src.aiMask, 0, 0, width, height);
  if (isFillablePath(src.path)) {
    ctx.fillStyle = '#ffffff';
    drawPathToCanvas(ctx, src.path);
    ctx.fill();
  }
  for (const stroke of src.strokes) drawStroke(ctx, stroke);
  return c;
}

/**
 * Grow (px > 0) or shrink (px < 0) the mask edge by about |px| pixels: blur by |px|, then keep
 * every pixel whose blurred alpha is above (grow) or at full strength near (shrink) the edge.
 */
export function adjustMaskEdge(mask: HTMLCanvasElement, px: number): HTMLCanvasElement {
  if (px === 0) return mask;
  const [c, ctx] = canvas2d(mask.width, mask.height);
  ctx.filter = `blur(${Math.abs(px) / 2}px)`;
  ctx.drawImage(mask, 0, 0);
  ctx.filter = 'none';
  const data = ctx.getImageData(0, 0, c.width, c.height);
  const a = data.data;
  const grow = px > 0;
  for (let i = 3; i < a.length; i += 4) {
    const v = a[i] ?? 0;
    a[i] = grow ? (v > 8 ? 255 : v * 32) : v >= 247 ? 255 : Math.max(0, (v - 200) * 5);
  }
  ctx.putImageData(data, 0, 0);
  return c;
}

/** Soften the mask edge with a Gaussian blur of `radius` pixels. */
export function featherMask(mask: HTMLCanvasElement, radius: number): HTMLCanvasElement {
  if (radius <= 0) return mask;
  const [c, ctx] = canvas2d(mask.width, mask.height);
  ctx.filter = `blur(${radius}px)`;
  ctx.drawImage(mask, 0, 0);
  return c;
}

/** Full pipeline: compose, then expand/contract, then feather. */
export function buildSelectionMask(
  width: number,
  height: number,
  src: MaskSources,
  expandContract: number,
  feather: number,
): HTMLCanvasElement {
  return featherMask(
    adjustMaskEdge(composeSelectionMask(width, height, src), expandContract),
    feather,
  );
}
