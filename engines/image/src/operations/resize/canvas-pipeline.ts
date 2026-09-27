import type { Dimensions } from './dimensions.ts';

/**
 * Draws `bitmap` scaled to `output` onto a fresh canvas of exactly that size. When `flattenToWhite` is
 * set, the canvas is filled white first — otherwise a transparent source flattened to an opaque format
 * (JPG) would render solid black, a real canvas default, not a hypothetical (see README.md). Resize-
 * specific: it scales; a same-size draw (Compress, Format Converter, Metadata Remover, Watermark) can
 * simply call `ctx.drawImage(bitmap, 0, 0)` at the bitmap's own size instead.
 */
export function renderResized(
  bitmap: ImageBitmap,
  output: Dimensions,
  flattenToWhite: boolean,
): OffscreenCanvas {
  const canvas = new OffscreenCanvas(output.width, output.height);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas context unavailable');
  if (flattenToWhite) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, output.width, output.height);
  }
  ctx.drawImage(bitmap, 0, 0, output.width, output.height);
  return canvas;
}
