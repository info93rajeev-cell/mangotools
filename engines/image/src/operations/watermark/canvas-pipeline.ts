import type { WatermarkPosition } from './schema.ts';

/** Space kept between the watermark text and the image edge, proportional to font size so it still
 * looks right at both very small and very large font sizes. */
function padding(fontSizePx: number): number {
  return Math.max(8, Math.round(fontSizePx * 0.4));
}

/**
 * The top-left corner to start drawing `text` at, for a canvas of `canvasWidth`×`canvasHeight`, given
 * its already-measured `textWidth`. Assumes `ctx.textBaseline = 'top'`, so `fontSizePx` alone is a good
 * enough approximation of the text's own rendered height without needing per-glyph metrics. Clamped to
 * never start off-canvas, for a caption wider than a very small source image.
 */
function watermarkOrigin(
  position: Exclude<WatermarkPosition, 'tiled'>,
  canvasWidth: number,
  canvasHeight: number,
  textWidth: number,
  fontSizePx: number,
): { x: number; y: number } {
  const pad = padding(fontSizePx);
  const left = pad;
  const right = canvasWidth - pad - textWidth;
  const top = pad;
  const bottom = canvasHeight - pad - fontSizePx;
  const centerX = (canvasWidth - textWidth) / 2;
  const centerY = (canvasHeight - fontSizePx) / 2;
  const byPosition: Record<Exclude<WatermarkPosition, 'tiled'>, { x: number; y: number }> = {
    'top-left': { x: left, y: top },
    'top-right': { x: right, y: top },
    center: { x: centerX, y: centerY },
    'bottom-left': { x: left, y: bottom },
    'bottom-right': { x: right, y: bottom },
  };
  const { x, y } = byPosition[position];
  return { x: Math.max(0, x), y: Math.max(0, y) };
}

/**
 * Draws `bitmap` at its own natural size onto a fresh canvas, then draws `text` on top at the requested
 * position, opacity, font size, and color. When `flattenToWhite` is set, the canvas is filled white
 * before the image is drawn — the same transparent-to-opaque gotcha `image.resize@1` already guards
 * against (see its own README.md), reused here rather than reimplemented.
 */
export function renderWatermarked(
  bitmap: ImageBitmap,
  text: string,
  position: WatermarkPosition,
  opacityPercent: number,
  fontSizePx: number,
  color: string,
  flattenToWhite: boolean,
): OffscreenCanvas {
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas context unavailable');
  if (flattenToWhite) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.drawImage(bitmap, 0, 0);

  if (position === 'tiled') {
    ctx.save();
    ctx.globalAlpha = opacityPercent / 100;
    ctx.fillStyle = color;
    ctx.font = `bold ${fontSizePx}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const angle = (-28 * Math.PI) / 180;
    const textWidth = ctx.measureText(text).width;
    const stepX = Math.max(160, textWidth + 80);
    const stepY = Math.max(90, fontSizePx * 3.8);

    const diagonal = Math.hypot(canvas.width, canvas.height);
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(angle);

    for (let y = -diagonal; y < diagonal; y += stepY) {
      const shift = (Math.floor(Math.abs(y) / stepY) % 2) * (stepX / 2);
      for (let x = -diagonal; x < diagonal; x += stepX) {
        ctx.fillText(text, x + shift, y);
      }
    }
    ctx.restore();
    return canvas;
  }

  ctx.font = `${fontSizePx}px sans-serif`;
  ctx.textBaseline = 'top';
  const textWidth = ctx.measureText(text).width;
  const { x, y } = watermarkOrigin(
    position as Exclude<WatermarkPosition, 'tiled'>,
    canvas.width,
    canvas.height,
    textWidth,
    fontSizePx,
  );
  ctx.globalAlpha = opacityPercent / 100;
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
  ctx.globalAlpha = 1;

  return canvas;
}
