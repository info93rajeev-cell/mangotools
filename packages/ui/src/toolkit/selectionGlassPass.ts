/**
 * Glass refinement pass for Advanced Pen Selection.
 *
 * For each pixel:
 *   glass weight g = glass mask alpha (0..1)
 *   final alpha = lerp(selAlpha, min(selAlpha, glassAlpha), g)
 *   final colour = lerp(original colour, decontaminated colour, g)
 */
import { type GlassPlan, glassPixel, planGlass, WORK_SIDE } from './glassMatte.ts';

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function sampleBilinear(
  bg: Float32Array,
  bw: number,
  bh: number,
  fx: number,
  fy: number,
): [number, number, number] {
  const x = Math.min(bw - 1, Math.max(0, fx));
  const y = Math.min(bh - 1, Math.max(0, fy));
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const x1 = Math.min(bw - 1, x0 + 1);
  const y1 = Math.min(bh - 1, y0 + 1);
  const tx = x - x0;
  const ty = y - y0;
  const res: [number, number, number] = [0, 0, 0];
  for (let k = 0; k < 3; k++) {
    const top =
      (bg[(y0 * bw + x0) * 3 + k] ?? 0) * (1 - tx) + (bg[(y0 * bw + x1) * 3 + k] ?? 0) * tx;
    const bot =
      (bg[(y1 * bw + x0) * 3 + k] ?? 0) * (1 - tx) + (bg[(y1 * bw + x1) * 3 + k] ?? 0) * tx;
    res[k] = top * (1 - ty) + bot * ty;
  }
  return res;
}

interface SmallAcc {
  rgb: Float32Array;
  alpha: Float32Array;
  count: Float32Array;
  sw: number;
}

function addPixelToSmall(
  acc: SmallAcc,
  photo: Uint8ClampedArray,
  selMask: Uint8ClampedArray,
  s: number,
  o: number,
) {
  acc.rgb[s * 3] = (acc.rgb[s * 3] ?? 0) + (photo[o] ?? 0);
  acc.rgb[s * 3 + 1] = (acc.rgb[s * 3 + 1] ?? 0) + (photo[o + 1] ?? 0);
  acc.rgb[s * 3 + 2] = (acc.rgb[s * 3 + 2] ?? 0) + (photo[o + 2] ?? 0);
  acc.alpha[s] = (acc.alpha[s] ?? 0) + (selMask[o + 3] ?? 0) / 255;
  acc.count[s] = (acc.count[s] ?? 0) + 1;
}

function accumulateSmall(
  photo: Uint8ClampedArray,
  selMask: Uint8ClampedArray,
  w: number,
  h: number,
  f: number,
  sw: number,
  sh: number,
) {
  const acc: SmallAcc = {
    rgb: new Float32Array(sw * sh * 3),
    alpha: new Float32Array(sw * sh),
    count: new Float32Array(sw * sh),
    sw,
  };

  for (let y = 0; y < h; y++) {
    const row = Math.floor(y / f) * sw;
    for (let x = 0; x < w; x++) {
      addPixelToSmall(acc, photo, selMask, row + Math.floor(x / f), (y * w + x) * 4);
    }
  }

  for (let s = 0; s < sw * sh; s++) {
    const n = acc.count[s] || 1;
    acc.rgb[s * 3] = (acc.rgb[s * 3] ?? 0) / n;
    acc.rgb[s * 3 + 1] = (acc.rgb[s * 3 + 1] ?? 0) / n;
    acc.rgb[s * 3 + 2] = (acc.rgb[s * 3 + 2] ?? 0) / n;
    acc.alpha[s] = (acc.alpha[s] ?? 0) / n;
  }

  return { rgb: acc.rgb, alpha: acc.alpha };
}

/** Prepares a GlassPlan from the full-resolution photo and selection mask. */
export function buildGlassPlanForSelection(
  photo: Uint8ClampedArray,
  selMask: Uint8ClampedArray,
  w: number,
  h: number,
): GlassPlan {
  const f = Math.max(1, Math.ceil(Math.max(w, h) / WORK_SIDE));
  const sw = Math.ceil(w / f);
  const sh = Math.ceil(h / f);
  const small = accumulateSmall(photo, selMask, w, h, f, sw, sh);
  return planGlass(small.rgb, small.alpha, sw, sh);
}

function blendGlassPixel(
  orig: [number, number, number],
  selA: number,
  g: number,
  plan: GlassPlan,
  fx: number,
  fy: number,
): [number, number, number, number] {
  const bg = sampleBilinear(plan.bg, plan.w, plan.h, fx, fy);
  const [dr, dg, db, da] = glassPixel(orig, bg, selA, plan.limits, 0);
  const glassA = da / 255;
  const finalA = lerp(selA, Math.min(selA, glassA), g);
  return [
    Math.round(lerp(orig[0], dr, g)),
    Math.round(lerp(orig[1], dg, g)),
    Math.round(lerp(orig[2], db, g)),
    Math.round(finalA * 255),
  ];
}

interface StripRowContext {
  photo: Uint8ClampedArray;
  selMask: Uint8ClampedArray;
  glassMask: Uint8ClampedArray;
  out: Uint8ClampedArray;
  plan: GlassPlan;
  w: number;
  sx: number;
  fy: number;
  localStrip: boolean;
  y: number;
}

function processRowPixel(ctx: StripRowContext, r: number, x: number) {
  const outIdx = (r * ctx.w + x) * 4;
  const srcIdx = ctx.localStrip ? outIdx : (ctx.y * ctx.w + x) * 4;

  const g = (ctx.glassMask[srcIdx + 3] ?? 0) / 255;
  const selA = (ctx.selMask[srcIdx + 3] ?? 0) / 255;
  const origR = ctx.photo[srcIdx] ?? 0;
  const origG = ctx.photo[srcIdx + 1] ?? 0;
  const origB = ctx.photo[srcIdx + 2] ?? 0;

  if (g <= 0 || selA <= 0) {
    ctx.out[outIdx] = origR;
    ctx.out[outIdx + 1] = origG;
    ctx.out[outIdx + 2] = origB;
    ctx.out[outIdx + 3] = Math.round(selA * 255);
    return;
  }

  const fx = (x + 0.5) * ctx.sx - 0.5;
  const [cr, cg, cb, ca] = blendGlassPixel([origR, origG, origB], selA, g, ctx.plan, fx, ctx.fy);
  ctx.out[outIdx] = cr;
  ctx.out[outIdx + 1] = cg;
  ctx.out[outIdx + 2] = cb;
  ctx.out[outIdx + 3] = ca;
}

/** Processes rows y0..y0+rows of a cutout given photo, selection mask, and glass brush mask.
 * When localStrip is true (the default in canvas strip processing), photo, selMask, and glassMask
 * contain only the `rows` slice (index `r * w + x`). When false, they index into full-size buffers.
 */
export function applySelectionGlassStrip(
  photo: Uint8ClampedArray,
  selMask: Uint8ClampedArray,
  glassMask: Uint8ClampedArray,
  w: number,
  h: number,
  y0: number,
  rows: number,
  sharedPlan?: GlassPlan,
  localStrip = false,
): Uint8ClampedArray {
  const plan = sharedPlan ?? buildGlassPlanForSelection(photo, selMask, w, h);
  const out = new Uint8ClampedArray(w * rows * 4);
  const sx = plan.w / w;
  const sy = plan.h / h;

  for (let r = 0; r < rows; r++) {
    const y = y0 + r;
    const fy = (y + 0.5) * sy - 0.5;
    const rowCtx: StripRowContext = {
      photo,
      selMask,
      glassMask,
      out,
      plan,
      w,
      sx,
      fy,
      localStrip,
      y,
    };
    for (let x = 0; x < w; x++) {
      processRowPixel(rowCtx, r, x);
    }
  }

  return out;
}

/** Whole-image execution. */
export function applySelectionGlassPass(
  photo: Uint8ClampedArray,
  selMask: Uint8ClampedArray,
  glassMask: Uint8ClampedArray,
  w: number,
  h: number,
): Uint8ClampedArray {
  const plan = buildGlassPlanForSelection(photo, selMask, w, h);
  return applySelectionGlassStrip(photo, selMask, glassMask, w, h, 0, h, plan);
}
