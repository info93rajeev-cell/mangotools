/**
 * Advanced Edge-Preserving Sharpness & Clarity Algorithms for Image Operations.
 *
 * Prevents blurriness and muddiness during image reduction, downscaling, and compression.
 * Prevents fuzzy, pixelated strokes during signature resizing and upscaling.
 */

function clampByte(val: number): number {
  return val < 0 ? 0 : val > 255 ? 255 : Math.round(val);
}

/**
 * 3x3 unsharp mask convolution kernel to restore edge sharpness lost during downscaling or upscaling.
 * Boosts high-frequency micro-contrast along edges without producing halos or noise.
 */
export function applyUnsharpMask(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  amount: number, // 0 to 100
): void {
  if (amount <= 0 || width < 3 || height < 3) return;
  const factor = (amount / 100) * 0.85;
  const copy = new Uint8ClampedArray(data);

  for (let y = 1; y < height - 1; y++) {
    const rowOffset = y * width * 4;
    for (let x = 1; x < width - 1; x++) {
      const idx = rowOffset + x * 4;
      // Skip fully transparent pixels
      if (copy[idx + 3] === 0) continue;

      for (let c = 0; c < 3; c++) {
        const center = copy[idx + c];
        const blur =
          (copy[idx - 4 + c] +
            copy[idx + 4 + c] +
            copy[idx - width * 4 + c] +
            copy[idx + width * 4 + c]) *
          0.25;
        const diff = center - blur;
        data[idx + c] = clampByte(center + diff * factor);
      }
    }
  }
}

/**
 * Signature-specific ink sharpness and clarity enhancement:
 * - Eliminates blurriness and pixelation when signatures are upscaled or fitted into portal dimensions.
 * - For JPG (white background): cleans paper haze (near-white pixels) to solid 255, while deepening dark ink.
 * - For PNG (alpha): sharpens stroke edges without disturbing transparency.
 */
export function enhanceSignatureClarity(
  context: OffscreenCanvasRenderingContext2D,
  width: number,
  height: number,
  isJpg: boolean,
  upscaled: boolean,
): void {
  if (!context.getImageData || width < 3 || height < 3) return;
  try {
    const imgData = context.getImageData(0, 0, width, height);
    const data = imgData.data;

    // 1. Edge unsharp mask (amount 40 if upscaled to prevent pixelation blur, 25 if downscaled/fitted)
    applyUnsharpMask(data, width, height, upscaled ? 40 : 25);

    // 2. Ink contrast and background cleaning
    const len = data.length;
    for (let i = 0; i < len; i += 4) {
      const a = data[i + 3];
      if (a === 0) continue;

      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

      if (isJpg) {
        if (lum > 0.92) {
          // Pristine white paper: remove background haze, scanning grain, JPEG noise
          data[i] = 255;
          data[i + 1] = 255;
          data[i + 2] = 255;
        } else if (lum < 0.60) {
          // Deepen dark ink strokes for clear, bold legibility on government application forms
          const darken = 0.85;
          data[i] = clampByte(r * darken);
          data[i + 1] = clampByte(g * darken);
          data[i + 2] = clampByte(b * darken);
        }
      } else {
        // PNG: sharpen stroke density
        if (lum < 0.60) {
          const darken = 0.9;
          data[i] = clampByte(r * darken);
          data[i + 1] = clampByte(g * darken);
          data[i + 2] = clampByte(b * darken);
        }
      }
    }

    context.putImageData(imgData, 0, 0);
  } catch {
    // Non-fatal if canvas security / extraction is restricted
  }
}

/**
 * Photo-specific sharpness preservation:
 * Restores edge definition and micro-contrast lost during downsampling or JPEG compression.
 */
export function enhancePhotoSharpness(
  context: OffscreenCanvasRenderingContext2D,
  width: number,
  height: number,
  downscaled: boolean,
  quality: number,
): void {
  if (!context.getImageData || width < 3 || height < 3) return;
  try {
    // Determine adaptive sharpening amount:
    // Base sharpening: 18
    // If downscaled: +14
    // If quality compressed (< 90): +10
    let amount = 18;
    if (downscaled) amount += 14;
    if (quality < 90) amount += 10;

    const imgData = context.getImageData(0, 0, width, height);
    applyUnsharpMask(imgData.data, width, height, amount);
    context.putImageData(imgData, 0, 0);
  } catch {
    // Non-fatal fallback
  }
}
