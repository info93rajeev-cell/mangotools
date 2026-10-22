interface RGB {
  r: number;
  g: number;
  b: number;
}

export function parseHexColor(hex: string): RGB | null {
  const clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    return Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b) ? null : { r, g, b };
  }
  if (clean.length === 6) {
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    return Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b) ? null : { r, g, b };
  }
  return null;
}

export function detectBackgroundColor(data: ImageData): RGB {
  const w = data.width;
  const h = data.height;
  const d = data.data;

  const points = [
    0, // top-left
    (w - 1) * 4, // top-right
    (h - 1) * w * 4, // bottom-left
    ((h - 1) * w + (w - 1)) * 4, // bottom-right
    Math.floor(w / 2) * 4, // top-center
    ((h - 1) * w + Math.floor(w / 2)) * 4, // bottom-center
    Math.floor(h / 2) * w * 4, // left-center
    (Math.floor(h / 2) * w + (w - 1)) * 4, // right-center
  ];

  let sumR = 0;
  let sumG = 0;
  let sumB = 0;
  for (const p of points) {
    sumR += d[p];
    sumG += d[p + 1];
    sumB += d[p + 2];
  }

  return {
    r: Math.round(sumR / points.length),
    g: Math.round(sumG / points.length),
    b: Math.round(sumB / points.length),
  };
}

function processPixels(
  data: Uint8ClampedArray,
  targetColor: RGB,
  tolDist: number,
  featherDist: number,
  repColor: RGB | null,
): void {
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    if (a === 0) continue;

    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const dr = r - targetColor.r;
    const dg = g - targetColor.g;
    const db = b - targetColor.b;
    const dist = Math.sqrt(dr * dr + dg * dg + db * db);

    if (dist <= tolDist) {
      if (repColor) {
        data[i] = repColor.r;
        data[i + 1] = repColor.g;
        data[i + 2] = repColor.b;
        data[i + 3] = 255;
      } else {
        data[i + 3] = 0;
      }
    } else if (featherDist > 0 && dist < tolDist + featherDist) {
      const factor = (dist - tolDist) / featherDist;
      if (repColor) {
        data[i] = Math.round(repColor.r * (1 - factor) + r * factor);
        data[i + 1] = Math.round(repColor.g * (1 - factor) + g * factor);
        data[i + 2] = Math.round(repColor.b * (1 - factor) + b * factor);
      } else {
        data[i + 3] = Math.round(a * factor);
      }
    }
  }
}

export function renderBackgroundRemoved(
  bitmap: ImageBitmap,
  tolerancePercent: number,
  featherPx: number,
  targetColorHex?: string,
  replacementBackground = 'transparent',
): OffscreenCanvas {
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.drawImage(bitmap, 0, 0);
  const imgData = ctx.getImageData(0, 0, bitmap.width, bitmap.height);

  const targetColor =
    targetColorHex && targetColorHex !== 'auto'
      ? (parseHexColor(targetColorHex) ?? detectBackgroundColor(imgData))
      : detectBackgroundColor(imgData);

  const maxDist = 441.6729559300637; // sqrt(255^2 + 255^2 + 255^2)
  const tolDist = (Math.max(1, tolerancePercent) / 100) * maxDist;
  const featherDist = (Math.max(0, featherPx) / 100) * maxDist;

  const repColor =
    replacementBackground !== 'transparent' ? parseHexColor(replacementBackground) : null;

  processPixels(imgData.data, targetColor, tolDist, featherDist, repColor);

  ctx.putImageData(imgData, 0, 0);
  return canvas;
}
