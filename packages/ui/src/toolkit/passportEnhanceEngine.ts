/**
 * Passport Photo Natural Enhancement Engine
 * Pure client-side Canvas 2D and JavaScript ImageData processing.
 * NO AI, NO ML, NO face generation or facial reconstruction models.
 * Preserves 100% of facial geometry, eyes, lips, jawline, and identifying marks.
 */

export type NaturalFilterId =
  | 'none'
  | 'auto'
  | 'natural'
  | 'bright'
  | 'soft'
  | 'clear'
  | 'warm'
  | 'cool';

export interface EnhanceAdjustments {
  brightness: number; // -50 to +50
  contrast: number; // -50 to +50
  saturation: number; // -50 to +50
  sharpen: number; // 0 to 10
  reduceBlemishes: number; // 0 to 10
  skinSmooth: number; // 0 to 10
}

export interface SpotEdit {
  x: number;
  y: number;
  radius: number;
  strength: number;
}

export interface EnhanceOptions {
  filter: NaturalFilterId;
  filterIntensity: number; // 0 to 100 %
  adjustments: EnhanceAdjustments;
  spotEdits?: SpotEdit[];
}

export const DEFAULT_ADJUSTMENTS: EnhanceAdjustments = {
  brightness: 8,
  contrast: 6,
  saturation: 4,
  sharpen: 3,
  reduceBlemishes: 5,
  skinSmooth: 4,
};

export const ZERO_ADJUSTMENTS: EnhanceAdjustments = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  sharpen: 0,
  reduceBlemishes: 0,
  skinSmooth: 0,
};

function clampByte(val: number): number {
  return Math.max(0, Math.min(255, Math.round(val)));
}

/** Applies natural color presets with conservative adjustments */
function applyFilterPreset(
  r: number,
  g: number,
  b: number,
  filter: NaturalFilterId,
): [number, number, number] {
  switch (filter) {
    case 'auto':
      return [r * 1.03 + 3, g * 1.02 + 2, b * 1.01 + 1];
    case 'natural':
      return [r * 1.02 + 4, g * 1.01 + 2, b * 0.99];
    case 'bright':
      return [r * 1.06 + 8, g * 1.05 + 7, b * 1.05 + 7];
    case 'soft':
      return [r * 0.98 + 5, g * 0.98 + 4, b * 0.97 + 3];
    case 'clear':
      return [r * 1.04 - 2, g * 1.04 - 2, b * 1.05 - 2];
    case 'warm':
      return [r * 1.05 + 8, g * 1.02 + 3, b * 0.94 - 4];
    case 'cool':
      return [r * 0.96 - 3, g * 1.01 + 1, b * 1.07 + 8];
    default:
      return [r, g, b];
  }
}

/** Subtle contrast calculation */
function calcContrast(val: number, contrast: number): number {
  if (contrast === 0) return val;
  const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
  return factor * (val - 128) + 128;
}

/**
 * Applies color adjustments: brightness, contrast, saturation, and filter blending.
 */
function applyColorAndTonalAdjustments(
  data: Uint8ClampedArray,
  filter: NaturalFilterId,
  filterIntensity: number,
  adj: EnhanceAdjustments,
): void {
  const intensityFactor = Math.max(0, Math.min(100, filterIntensity)) / 100;
  const satFactor = 1 + adj.saturation / 50;

  for (let i = 0; i < data.length; i += 4) {
    const origR = data[i];
    const origG = data[i + 1];
    const origB = data[i + 2];

    // 1. Filter Preset
    let [fr, fg, fb] = applyFilterPreset(origR, origG, origB, filter);
    fr = origR + (fr - origR) * intensityFactor;
    fg = origG + (fg - origG) * intensityFactor;
    fb = origB + (fb - origB) * intensityFactor;

    // 2. Brightness & Contrast
    let r = calcContrast(fr + adj.brightness, adj.contrast);
    let g = calcContrast(fg + adj.brightness, adj.contrast);
    let b = calcContrast(fb + adj.brightness, adj.contrast);

    // 3. Saturation
    if (adj.saturation !== 0) {
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      r = lum + (r - lum) * satFactor;
      g = lum + (g - lum) * satFactor;
      b = lum + (b - lum) * satFactor;
    }

    data[i] = clampByte(r);
    data[i + 1] = clampByte(g);
    data[i + 2] = clampByte(b);
  }
}

function isSkinTone(r: number, g: number, b: number): boolean {
  return r > g && g > b && r - b > 15 && r - b < 95;
}

function computeSurfaceBlur(
  copy: Uint8ClampedArray,
  width: number,
  x: number,
  y: number,
  r: number,
  g: number,
  b: number,
  threshold: number,
): [number, number, number, number] {
  let sumR = 0;
  let sumG = 0;
  let sumB = 0;
  let count = 0;
  const maxDiff = threshold * 3;

  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const nIdx = ((y + dy) * width + (x + dx)) * 4;
      const nr = copy[nIdx];
      const ng = copy[nIdx + 1];
      const nb = copy[nIdx + 2];
      if (Math.abs(nr - r) + Math.abs(ng - g) + Math.abs(nb - b) < maxDiff) {
        sumR += nr;
        sumG += ng;
        sumB += nb;
        count++;
      }
    }
  }
  return [sumR, sumG, sumB, count];
}

/**
 * Selective skin smoothing that respects high-frequency edges (eyes, lips, hair).
 */
function applySelectiveSkinSmooth(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  level: number,
): void {
  if (level <= 0) return;
  const copy = new Uint8ClampedArray(data);
  const blend = level * 0.05; // Maximum 50% blend for very natural texture preservation
  const threshold = 18; // Edge protection threshold

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      const r = copy[idx];
      const g = copy[idx + 1];
      const b = copy[idx + 2];

      if (!isSkinTone(r, g, b)) continue;

      const [sumR, sumG, sumB, count] = computeSurfaceBlur(copy, width, x, y, r, g, b, threshold);

      if (count > 2) {
        data[idx] = clampByte(r + (sumR / count - r) * blend);
        data[idx + 1] = clampByte(g + (sumG / count - g) * blend);
        data[idx + 2] = clampByte(b + (sumB / count - b) * blend);
      }
    }
  }
}

/** Subtle 3x3 unsharp convolution sharpening */
function applySharpening(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  level: number,
): void {
  if (level <= 0) return;
  const copy = new Uint8ClampedArray(data);
  const amount = (level / 10) * 0.35; // Gentle sharpening

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      for (let c = 0; c < 3; c++) {
        const center = copy[idx + c];
        const top = copy[((y - 1) * width + x) * 4 + c];
        const bottom = copy[((y + 1) * width + x) * 4 + c];
        const left = copy[(y * width + (x - 1)) * 4 + c];
        const right = copy[(y * width + (x + 1)) * 4 + c];
        const laplacian = 4 * center - top - bottom - left - right;
        data[idx + c] = clampByte(center + laplacian * amount);
      }
    }
  }
}

function samplePerimeterRing(
  data: Uint8ClampedArray,
  sw: number,
  sh: number,
  rInt: number,
  radius: number,
): [number, number, number, number] {
  let ringR = 0;
  let ringG = 0;
  let ringB = 0;
  let ringCount = 0;
  const minR = radius * 0.75;

  for (let py = 0; py < sh; py++) {
    for (let px = 0; px < sw; px++) {
      const d = Math.hypot(px - rInt, py - rInt);
      if (d >= minR && d <= radius) {
        const idx = (py * sw + px) * 4;
        ringR += data[idx];
        ringG += data[idx + 1];
        ringB += data[idx + 2];
        ringCount++;
      }
    }
  }
  return [ringR, ringG, ringB, ringCount];
}

function blendSpotArea(
  data: Uint8ClampedArray,
  sw: number,
  sh: number,
  rInt: number,
  radius: number,
  strength: number,
  targetRGB: [number, number, number],
): void {
  const [targetR, targetG, targetB] = targetRGB;
  for (let py = 0; py < sh; py++) {
    for (let px = 0; px < sw; px++) {
      const dist = Math.hypot(px - rInt, py - rInt);
      if (dist < radius) {
        const falloff = (1 - dist / radius) * strength;
        const idx = (py * sw + px) * 4;
        data[idx] = clampByte(data[idx] + (targetR - data[idx]) * falloff);
        data[idx + 1] = clampByte(data[idx + 1] + (targetG - data[idx + 1]) * falloff);
        data[idx + 2] = clampByte(data[idx + 2] + (targetB - data[idx + 2]) * falloff);
      }
    }
  }
}

/** Manual spot correction brush */
export function applySpotCorrection(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius = 12,
  strength = 0.7,
): void {
  const rInt = Math.ceil(radius);
  const sx = Math.max(0, Math.floor(x - rInt));
  const sy = Math.max(0, Math.floor(y - rInt));
  const sw = Math.min(ctx.canvas.width - sx, rInt * 2);
  const sh = Math.min(ctx.canvas.height - sy, rInt * 2);

  if (sw <= 0 || sh <= 0) return;
  const imgData = ctx.getImageData(sx, sy, sw, sh);
  const [ringR, ringG, ringB, count] = samplePerimeterRing(imgData.data, sw, sh, rInt, radius);

  if (count === 0) return;
  blendSpotArea(imgData.data, sw, sh, rInt, radius, strength, [
    ringR / count,
    ringG / count,
    ringB / count,
  ]);

  ctx.putImageData(imgData, sx, sy);
}

/**
 * Main enhancement rendering function.
 * Takes a source canvas/image, renders to destination canvas with all adjustments applied.
 */
export function renderEnhancedPassportImage(
  source: HTMLImageElement | HTMLCanvasElement,
  targetCanvas: HTMLCanvasElement,
  options: EnhanceOptions,
): void {
  const w = source.width;
  const h = source.height;
  targetCanvas.width = w;
  targetCanvas.height = h;

  const ctx = targetCanvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return;

  ctx.drawImage(source, 0, 0, w, h);

  // Apply spot edits first on raw image
  if (options.spotEdits && options.spotEdits.length > 0) {
    for (const edit of options.spotEdits) {
      applySpotCorrection(ctx, edit.x, edit.y, edit.radius, edit.strength);
    }
  }

  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;

  // 1. Color and tonal filters + brightness/contrast/saturation
  applyColorAndTonalAdjustments(data, options.filter, options.filterIntensity, options.adjustments);

  // 2. Selective skin smoothing
  applySelectiveSkinSmooth(data, w, h, options.adjustments.skinSmooth);

  // 3. Subtle sharpening
  applySharpening(data, w, h, options.adjustments.sharpen);

  ctx.putImageData(imgData, 0, 0);
}
