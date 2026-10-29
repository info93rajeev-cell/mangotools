/**
 * Classical Boundary Detection & Auto-Select Algorithm
 * Pure JavaScript Canvas 2D image processing without AI or neural models.
 * Uses corner background sampling, color distance metrics, radial perimeter tracing,
 * and tangent-based Bezier curve fitting.
 */

import { type BezierPath, type BezierPoint, smoothAllPoints } from './bezierPathModel.ts';

export type AutoSelectMode = 'auto' | 'object' | 'color';

interface RgbColor {
  r: number;
  g: number;
  b: number;
}

function sampleCornerColors(pixels: Uint8ClampedArray, width: number, height: number): RgbColor[] {
  const corners: RgbColor[] = [];
  const coords = [
    [2, 2],
    [width - 3, 2],
    [2, height - 3],
    [width - 3, height - 3],
  ];

  for (const [cx, cy] of coords) {
    const idx = (cy * width + cx) * 4;
    corners.push({
      r: pixels[idx],
      g: pixels[idx + 1],
      b: pixels[idx + 2],
    });
  }

  return corners;
}

function colorDistSq(c1: RgbColor, c2: RgbColor): number {
  const dr = c1.r - c2.r;
  const dg = c1.g - c2.g;
  const db = c1.b - c2.b;
  return dr * dr + dg * dg + db * db;
}

function buildForegroundMask(
  pixels: Uint8ClampedArray,
  sw: number,
  sh: number,
  bgColors: RgbColor[],
  thresholdSq: number,
): Uint8Array {
  const mask = new Uint8Array(sw * sh);
  for (let y = 0; y < sh; y++) {
    for (let x = 0; x < sw; x++) {
      const idx = (y * sw + x) * 4;
      const pixel: RgbColor = {
        r: pixels[idx],
        g: pixels[idx + 1],
        b: pixels[idx + 2],
      };
      let minDistSq = Number.POSITIVE_INFINITY;
      for (const bg of bgColors) {
        const d = colorDistSq(pixel, bg);
        if (d < minDistSq) minDistSq = d;
      }
      if (minDistSq > thresholdSq) {
        mask[y * sw + x] = 255;
      }
    }
  }
  return mask;
}

function tracePerimeter(
  mask: Uint8Array,
  width: number,
  height: number,
): { x: number; y: number }[] {
  const cx = width / 2;
  const cy = height / 2;
  const numRays = 24;
  const perimeterPoints: { x: number; y: number }[] = [];

  for (let i = 0; i < numRays; i++) {
    const angle = (i / numRays) * Math.PI * 2;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const maxRadius = Math.min(width, height) * 0.48;

    let hitX = cx + cos * (maxRadius * 0.4);
    let hitY = cy + sin * (maxRadius * 0.4);

    for (let r = maxRadius; r >= 10; r -= 3) {
      const rx = Math.round(cx + cos * r);
      const ry = Math.round(cy + sin * r);
      if (rx >= 0 && rx < width && ry >= 0 && ry < height) {
        if (mask[ry * width + rx] === 255) {
          hitX = rx;
          hitY = ry;
          break;
        }
      }
    }

    perimeterPoints.push({ x: hitX, y: hitY });
  }

  return perimeterPoints;
}

export function classicalAutoDetect(
  img: HTMLImageElement | ImageBitmap,
  mode: AutoSelectMode = 'auto',
): BezierPath {
  const w = img.width || 1200;
  const h = img.height || 900;
  const scale = Math.min(1, 320 / Math.max(w, h));
  const sw = Math.max(32, Math.floor(w * scale));
  const sh = Math.max(32, Math.floor(h * scale));

  const canvas = document.createElement('canvas');
  canvas.width = sw;
  canvas.height = sh;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return fallbackEllipsePath(w, h);

  ctx.drawImage(img, 0, 0, sw, sh);
  const imgData = ctx.getImageData(0, 0, sw, sh);
  const bgColors = sampleCornerColors(imgData.data, sw, sh);
  const thresholdSq = mode === 'color' ? 35 * 35 : 45 * 45;
  const mask = buildForegroundMask(imgData.data, sw, sh, bgColors, thresholdSq);

  const rawPoints = tracePerimeter(mask, sw, sh);
  if (rawPoints.length < 4) return fallbackEllipsePath(w, h);

  const invScale = 1 / scale;
  const bezierPoints: BezierPoint[] = rawPoints.map((pt, i) => {
    const px = pt.x * invScale;
    const py = pt.y * invScale;
    return {
      id: `pt_${i}_${Date.now()}`,
      x: px,
      y: py,
      cp1x: px - 15,
      cp1y: py,
      cp2x: px + 15,
      cp2y: py,
      isSmooth: true,
    };
  });

  return smoothAllPoints({ points: bezierPoints, isClosed: true });
}

export function fallbackEllipsePath(w: number, h: number): BezierPath {
  const cx = w * 0.5;
  const cy = h * 0.5;
  const rx = w * 0.35;
  const ry = h * 0.38;
  const kx = rx * 0.5522847498;
  const ky = ry * 0.5522847498;

  const points: BezierPoint[] = [
    {
      id: 'pt_top',
      x: cx,
      y: cy - ry,
      cp1x: cx - kx,
      cp1y: cy - ry,
      cp2x: cx + kx,
      cp2y: cy - ry,
      isSmooth: true,
    },
    {
      id: 'pt_right',
      x: cx + rx,
      y: cy,
      cp1x: cx + rx,
      cp1y: cy - ky,
      cp2x: cx + rx,
      cp2y: cy + ky,
      isSmooth: true,
    },
    {
      id: 'pt_bottom',
      x: cx,
      y: cy + ry,
      cp1x: cx + kx,
      cp1y: cy + ry,
      cp2x: cx - kx,
      cp2y: cy + ry,
      isSmooth: true,
    },
    {
      id: 'pt_left',
      x: cx - rx,
      y: cy,
      cp1x: cx - rx,
      cp1y: cy + ky,
      cp2x: cx - rx,
      cp2y: cy - ky,
      isSmooth: true,
    },
  ];

  return { points, isClosed: true };
}

export function autoDetectForegroundPath(img: HTMLImageElement | ImageBitmap): BezierPath {
  try {
    return classicalAutoDetect(img, 'auto');
  } catch {
    return fallbackEllipsePath(img.width || 1200, img.height || 900);
  }
}
