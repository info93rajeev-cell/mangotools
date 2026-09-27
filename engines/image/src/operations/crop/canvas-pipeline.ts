/**
 * Draws only the `(cropX, cropY, cropWidth, cropHeight)` source rectangle onto a fresh canvas exactly
 * that size — the only operation in this engine that reads a sub-region rather than the whole source
 * image, and (by construction) never scales: the destination is always the same size as the source
 * rectangle. When `flattenToWhite` is set, the canvas is filled white first — the same transparent-to-
 * opaque gotcha `image.resize@1` already guards against (see its own README.md), reused here rather than
 * reimplemented.
 */
export function renderCropped(
  bitmap: ImageBitmap,
  cropX: number,
  cropY: number,
  cropWidth: number,
  cropHeight: number,
  flattenToWhite: boolean,
): OffscreenCanvas {
  const canvas = new OffscreenCanvas(cropWidth, cropHeight);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas context unavailable');
  if (flattenToWhite) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, cropWidth, cropHeight);
  }
  ctx.drawImage(bitmap, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
  return canvas;
}
