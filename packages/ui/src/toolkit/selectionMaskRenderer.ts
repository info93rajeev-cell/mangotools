/**
 * Selection Mask & Feather Rendering Engine
 * Pure Canvas 2D browser-side implementation for alpha masking, boundary feathering,
 * background compositing, and transparent image export.
 */

import { type BezierPath, drawPathToCanvas, pathToSvgD } from './bezierPathModel.ts';

export interface SelectionEdgeSettings {
  featherRadius: number; // 0 to 30 px
  expandContract: number; // -20 to +20 px
  smoothPath: number; // 0 to 100 %
  edgeBlur: number; // 0 to 100 %
}

export interface RenderCutoutOptions {
  image: HTMLImageElement | ImageBitmap;
  path: BezierPath;
  settings: SelectionEdgeSettings;
  backgroundType: 'transparent' | 'white' | 'black' | 'custom';
  customBgColor?: string;
}

export interface RenderCutoutResult {
  canvas: HTMLCanvasElement;
  blobUrl: string;
  pngBlob: Blob;
  webpBlob: Blob;
  svgContent: string;
}

/**
 * Creates the feathered alpha mask canvas
 */
function createFeatheredMaskCanvas(
  path: BezierPath,
  width: number,
  height: number,
  feather: number,
  expandContract: number,
): HTMLCanvasElement {
  // Step 1: Base sharp silhouette
  const sharpCanvas = document.createElement('canvas');
  sharpCanvas.width = width;
  sharpCanvas.height = height;
  const sharpCtx = sharpCanvas.getContext('2d');
  if (!sharpCtx) return sharpCanvas;

  sharpCtx.fillStyle = '#ffffff';
  drawPathToCanvas(sharpCtx, path);
  sharpCtx.fill();

  // Apply expand / contract
  if (expandContract !== 0) {
    const strokeWidth = Math.abs(expandContract) * 2;
    sharpCtx.lineWidth = strokeWidth;
    sharpCtx.lineJoin = 'round';
    sharpCtx.lineCap = 'round';

    if (expandContract > 0) {
      sharpCtx.strokeStyle = '#ffffff';
      sharpCtx.stroke();
    } else {
      sharpCtx.globalCompositeOperation = 'destination-out';
      sharpCtx.strokeStyle = '#000000';
      sharpCtx.stroke();
      sharpCtx.globalCompositeOperation = 'source-over';
    }
  }

  if (feather <= 0) return sharpCanvas;

  // Step 2: Feather mask boundary via CSS blur filter on offscreen canvas
  const featheredCanvas = document.createElement('canvas');
  featheredCanvas.width = width;
  featheredCanvas.height = height;
  const featherCtx = featheredCanvas.getContext('2d');
  if (!featherCtx) return sharpCanvas;

  featherCtx.filter = `blur(${feather}px)`;
  featherCtx.drawImage(sharpCanvas, 0, 0);

  return featheredCanvas;
}

/**
 * Renders the final cut-out image with the given path, feather, and background settings.
 */
export async function renderSelectionCutout(
  opts: RenderCutoutOptions,
): Promise<RenderCutoutResult> {
  const { image, path, settings, backgroundType, customBgColor } = opts;
  const width = image.width;
  const height = image.height;

  // 1. Create mask
  const maskCanvas = createFeatheredMaskCanvas(
    path,
    width,
    height,
    settings.featherRadius,
    settings.expandContract,
  );

  // 2. Create composite output canvas
  const outCanvas = document.createElement('canvas');
  outCanvas.width = width;
  outCanvas.height = height;
  const ctx = outCanvas.getContext('2d');
  if (!ctx) throw new Error('Could not create 2D canvas context');

  // Draw feathered mask first
  ctx.drawImage(maskCanvas, 0, 0);

  // Keep foreground original pixels intact through alpha mask
  ctx.globalCompositeOperation = 'source-in';
  ctx.drawImage(image, 0, 0);

  // If a solid or custom background is selected, composite it behind the cutout
  if (backgroundType !== 'transparent') {
    ctx.globalCompositeOperation = 'destination-over';
    if (backgroundType === 'white') {
      ctx.fillStyle = '#ffffff';
    } else if (backgroundType === 'black') {
      ctx.fillStyle = '#000000';
    } else {
      ctx.fillStyle = customBgColor || '#3b82f6';
    }
    ctx.fillRect(0, 0, width, height);
  }

  // Generate PNG and WebP Blobs
  const pngBlob = await new Promise<Blob>((resolve) => {
    outCanvas.toBlob((b) => resolve(b || new Blob()), 'image/png');
  });

  const webpBlob = await new Promise<Blob>((resolve) => {
    outCanvas.toBlob((b) => resolve(b || new Blob()), 'image/webp', 0.92);
  });

  const blobUrl = URL.createObjectURL(pngBlob);

  // SVG representation of the path
  const svgD = pathToSvgD(path);
  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <path d="${svgD}" fill="none" stroke="#2563eb" stroke-width="2"/>
</svg>`;

  return {
    canvas: outCanvas,
    blobUrl,
    pngBlob,
    webpBlob,
    svgContent,
  };
}
