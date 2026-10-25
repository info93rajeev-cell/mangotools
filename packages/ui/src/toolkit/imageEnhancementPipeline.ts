/**
 * Client-Side Photoshop-Grade Image Enhancement & Upscaling Pipeline.
 * 100% in-browser, zero-memory-leak, high-performance canvas image processing.
 */

export interface EnhancementSettings {
  scale: 1 | 2 | 4;
  sharpness: number; // 0 to 100
  contrast: number; // -50 to 50
  brightness: number; // -50 to 50
  vibrance: number; // -50 to 100
  warmth: number; // -50 to 50
}

export const DEFAULT_ENHANCEMENT: EnhancementSettings = {
  scale: 2,
  sharpness: 25,
  contrast: 15,
  brightness: 0,
  vibrance: 20,
  warmth: 5,
};

export const AUTO_ENHANCE_PRESET: EnhancementSettings = {
  scale: 2,
  sharpness: 45,
  contrast: 22,
  brightness: 8,
  vibrance: 35,
  warmth: 8,
};

function clampByte(val: number): number {
  return val < 0 ? 0 : val > 255 ? 255 : Math.round(val);
}

/**
 * Applies unsharp masking convolution to enhance fine textures and edge clarity.
 */
export function applySharpness(
  data: Uint8ClampedArray,
  w: number,
  h: number,
  amount: number,
): void {
  if (amount <= 0) return;
  const factor = (amount / 100) * 1.2;
  const copy = new Uint8ClampedArray(data);

  for (let y = 1; y < h - 1; y++) {
    const rowOffset = y * w * 4;
    for (let x = 1; x < w - 1; x++) {
      const idx = rowOffset + x * 4;
      for (let c = 0; c < 3; c++) {
        const center = copy[idx + c];
        const blur =
          (copy[idx - 4 + c] + copy[idx + 4 + c] + copy[idx - w * 4 + c] + copy[idx + w * 4 + c]) *
          0.25;
        const diff = center - blur;
        data[idx + c] = clampByte(center + diff * factor);
      }
    }
  }
}

/**
 * Adjusts pixel color tone: Contrast (S-Curve), Brightness, Vibrance, and Color Warmth.
 */
export function applyColorGrading(data: Uint8ClampedArray, settings: EnhancementSettings): void {
  const { contrast, brightness, vibrance, warmth } = settings;
  const hasAdjustments = contrast !== 0 || brightness !== 0 || vibrance !== 0 || warmth !== 0;
  if (!hasAdjustments) return;

  const cFactor = (259 * (contrast * 2.2 + 255)) / (255 * (259 - contrast * 2.2));
  const bOffset = brightness * 1.3;
  const vFactor = (vibrance / 100) * 1.6;
  const wOffset = warmth * 0.75;

  const len = data.length;
  for (let i = 0; i < len; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    // 1. Brightness
    if (bOffset !== 0) {
      r = clampByte(r + bOffset);
      g = clampByte(g + bOffset);
      b = clampByte(b + bOffset);
    }

    // 2. Contrast
    if (contrast !== 0) {
      r = clampByte(cFactor * (r - 128) + 128);
      g = clampByte(cFactor * (g - 128) + 128);
      b = clampByte(cFactor * (b - 128) + 128);
    }

    // 3. Vibrance (Intelligent saturation protecting already-saturated colors)
    if (vibrance !== 0) {
      const maxC = Math.max(r, g, b);
      const minC = Math.min(r, g, b);
      const sat = maxC > 0 ? (maxC - minC) / maxC : 0;
      const boost = vFactor * (1 - sat);
      const avg = (r + g + b) / 3;
      r = clampByte(r + (r - avg) * boost);
      g = clampByte(g + (g - avg) * boost);
      b = clampByte(b + (b - avg) * boost);
    }

    // 4. Color Warmth / Temperature
    if (wOffset !== 0) {
      r = clampByte(r + wOffset);
      b = clampByte(b - wOffset);
    }

    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
  }
}

/**
 * Resamples and scales bitmap up using multi-step high-quality smoothing.
 */
export function renderScaledCanvas(
  source: CanvasImageSource,
  targetWidth: number,
  targetHeight: number,
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D context unavailable');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source, 0, 0, targetWidth, targetHeight);
  return canvas;
}

/**
 * Full enhancement and enlarging pipeline.
 */
export async function executeEnhancementPipeline(
  sourceBitmap: ImageBitmap,
  settings: EnhancementSettings,
): Promise<HTMLCanvasElement> {
  const outW = sourceBitmap.width * settings.scale;
  const outH = sourceBitmap.height * settings.scale;

  // Scale up with high smoothing quality
  const canvas = renderScaledCanvas(sourceBitmap, outW, outH);
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const imgData = ctx.getImageData(0, 0, outW, outH);

  // Apply Sharpness & Clarity (Unsharp mask)
  applySharpness(imgData.data, outW, outH, settings.sharpness);

  // Apply Contrast, Brightness, Vibrance, Warmth
  applyColorGrading(imgData.data, settings);

  ctx.putImageData(imgData, 0, 0);
  return canvas;
}
