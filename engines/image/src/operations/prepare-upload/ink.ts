import type { Dimensions } from '../resize/dimensions.ts';

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PaddedBounds {
  destX: number;
  destY: number;
  destWidth: number;
  destHeight: number;
}

/** Check if pixel qualifies as ink (dark or colored stroke vs light paper / transparent). */
export function isInkPixel(r: number, g: number, b: number, a: number): boolean {
  if (a < 25) return false;
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum < 0.88;
}

function countRowAndColInk(
  data: Uint8ClampedArray | Uint8Array,
  width: number,
  height: number,
): { rowCounts: Uint32Array; colCounts: Uint32Array; totalInk: number } {
  const rowCounts = new Uint32Array(height);
  const colCounts = new Uint32Array(width);
  let totalInk = 0;
  for (let y = 0; y < height; y++) {
    const rowOffset = y * width * 4;
    for (let x = 0; x < width; x++) {
      const idx = rowOffset + x * 4;
      if (isInkPixel(data[idx], data[idx + 1], data[idx + 2], data[idx + 3])) {
        rowCounts[y]++;
        colCounts[x]++;
        totalInk++;
      }
    }
  }
  return { rowCounts, colCounts, totalInk };
}

function findRange(counts: Uint32Array, threshold: number): { min: number; max: number } {
  let min = -1;
  let max = -1;
  for (let i = 0; i < counts.length; i++) {
    if (counts[i] >= threshold) {
      if (min === -1) min = i;
      max = i;
    }
  }
  return { min, max };
}

/** Detect ink bounding box from raw pixel data with noise filtering and margin. */
export function findInkBoundingBox(
  data: Uint8ClampedArray | Uint8Array,
  width: number,
  height: number,
): BoundingBox {
  if (width <= 0 || height <= 0 || data.length < width * height * 4) {
    return { x: 0, y: 0, width: Math.max(1, width), height: Math.max(1, height) };
  }

  const { rowCounts, colCounts, totalInk } = countRowAndColInk(data, width, height);

  // Require minimum ink pixels to constitute a stroke; isolated dust specks (1-5px) fall back to full bounds
  const minTotalInk = Math.min(16, Math.max(6, Math.round(width * height * 0.0001)));
  if (totalInk < minTotalInk) {
    return { x: 0, y: 0, width, height };
  }

  const minRowInk = Math.max(1, Math.min(4, Math.round(width * 0.002)));
  const minColInk = Math.max(1, Math.min(4, Math.round(height * 0.002)));

  const yRange = findRange(rowCounts, minRowInk);
  const xRange = findRange(colCounts, minColInk);

  if (xRange.min === -1 || yRange.min === -1) {
    return { x: 0, y: 0, width, height };
  }

  const marginX = Math.max(2, Math.round(width * 0.01));
  const marginY = Math.max(2, Math.round(height * 0.01));
  const x = Math.max(0, xRange.min - marginX);
  const y = Math.max(0, yRange.min - marginY);
  const w = Math.min(width, xRange.max + marginX + 1) - x;
  const h = Math.min(height, yRange.max + marginY + 1) - y;

  return { x, y, width: w, height: h };
}

/** Calculate aspect-safe destination bounds with ~8% controlled padding inside target canvas. */
export function calculatePaddedFittedBounds(
  sourceBox: BoundingBox,
  target: Dimensions,
  paddingFraction = 0.08,
): PaddedBounds {
  const availWidth = Math.max(1, Math.round(target.width * (1 - 2 * paddingFraction)));
  const availHeight = Math.max(1, Math.round(target.height * (1 - 2 * paddingFraction)));

  const scale = Math.min(availWidth / sourceBox.width, availHeight / sourceBox.height);

  const destWidth = Math.max(1, Math.round(sourceBox.width * scale));
  const destHeight = Math.max(1, Math.round(sourceBox.height * scale));

  const destX = Math.round((target.width - destWidth) / 2);
  const destY = Math.round((target.height - destHeight) / 2);

  return { destX, destY, destWidth, destHeight };
}

/** Detect ink bounding box from an ImageBitmap in worker context. */
export function detectBitmapInkBounds(bitmap: ImageBitmap): BoundingBox {
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const context = canvas.getContext('2d');
  if (!context) return { x: 0, y: 0, width: bitmap.width, height: bitmap.height };
  context.drawImage(bitmap, 0, 0);
  const imageData = context.getImageData(0, 0, bitmap.width, bitmap.height);
  return findInkBoundingBox(imageData.data, bitmap.width, bitmap.height);
}
