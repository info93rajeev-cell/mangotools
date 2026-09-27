/**
 * Center-crops the bitmap to a square — cropping the longer axis, centered — then scales that square
 * to `size` x `size`. This is the deliberate v1 behavior for a non-square source image (documented in
 * `tools/favicon-generator/content.md`): the entire output canvas is always filled by the source image,
 * so there is never any padding or background color to choose (no transparent-vs-white decision needed,
 * unlike `image.resize@1`'s "contain" mode). Uses the 9-argument form of `drawImage` that draws a source
 * sub-rectangle scaled into a destination rectangle — the same overload `image.crop@1` added to
 * `browser-globals.d.ts`, reused here rather than re-declared.
 */
export function renderFavicon(bitmap: ImageBitmap, size: number): OffscreenCanvas {
  const side = Math.min(bitmap.width, bitmap.height);
  const cropX = Math.floor((bitmap.width - side) / 2);
  const cropY = Math.floor((bitmap.height - side) / 2);
  const canvas = new OffscreenCanvas(size, size);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas context unavailable');
  ctx.drawImage(bitmap, cropX, cropY, side, side, 0, 0, size, size);
  return canvas;
}
