/**
 * Selection Mask & Feather Rendering Engine
 * Pure Canvas 2D browser-side implementation for alpha masking, boundary feathering,
 * background compositing, and transparent image export.
 */

import { pathToSvgD } from './bezierPathModel.ts';
import { applyGlassPassToCanvas } from './selectionGlassCanvas.ts';
import { buildSelectionMask, composeGlassMask, type MaskSources } from './selectionMask.ts';

export interface SelectionEdgeSettings {
  featherRadius: number; // 0 to 30 px
  expandContract: number; // -20 to +20 px
  smoothPath: number; // 0 to 100 %
  edgeBlur: number; // 0 to 100 %
}

export interface RenderCutoutOptions {
  image: HTMLImageElement | ImageBitmap;
  /** AI mask, pen path and brush strokes that make up the selection. */
  sources: MaskSources;
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
 * Renders the final cut-out image with the given path, feather, and background settings.
 */
export async function renderSelectionCutout(
  opts: RenderCutoutOptions,
): Promise<RenderCutoutResult> {
  const { image, sources, settings, backgroundType, customBgColor } = opts;
  const path = sources.path;
  const width = image.width;
  const height = image.height;

  // 1. Create mask
  const maskCanvas = buildSelectionMask(
    width,
    height,
    sources,
    settings.expandContract,
    settings.featherRadius,
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

  // If glass strokes exist, apply the glass pass (makes glass see-through and decontaminated)
  const glassMaskCanvas = composeGlassMask(width, height, sources.strokes);
  if (glassMaskCanvas) {
    applyGlassPassToCanvas(outCanvas, image, maskCanvas, glassMaskCanvas);
  }

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
