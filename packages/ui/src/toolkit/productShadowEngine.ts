export type ShadowMode = 'none' | 'contact' | 'drop' | 'original';

export interface ShadowOptions {
  mode: ShadowMode;
  opacity: number; // 0 to 1
  replacementBackground?: string; // 'transparent', '#ffffff', etc.
}

interface BoundingBox {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

interface BoundsAcc {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  found: boolean;
}

function updateBounds(acc: BoundsAcc, x: number, y: number): void {
  if (x < acc.minX) acc.minX = x;
  if (x > acc.maxX) acc.maxX = x;
  if (y < acc.minY) acc.minY = y;
  if (y > acc.maxY) acc.maxY = y;
  acc.found = true;
}

function findForegroundBounds(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
): BoundingBox | null {
  const data = ctx.getImageData(0, 0, w, h).data;
  const acc: BoundsAcc = { minX: w, maxX: 0, minY: h, maxY: 0, found: false };
  const step = Math.max(2, Math.floor(Math.max(w, h) / 1000));

  for (let y = 0; y < h; y += step) {
    const rowOffset = y * w;
    for (let x = 0; x < w; x += step) {
      if (data[(rowOffset + x) * 4 + 3] > 40) {
        updateBounds(acc, x, y);
      }
    }
  }

  if (!acc.found || acc.maxX <= acc.minX || acc.maxY <= acc.minY) return null;
  return { minX: acc.minX, maxX: acc.maxX, minY: acc.minY, maxY: acc.maxY };
}

function renderContactShadow(
  ctx: CanvasRenderingContext2D,
  bounds: BoundingBox,
  opacity: number,
): void {
  const centerX = (bounds.minX + bounds.maxX) / 2;
  const baseY = bounds.maxY;
  const width = bounds.maxX - bounds.minX;

  const rx = Math.max(10, width * 0.46);
  const ry = Math.max(6, width * 0.055);

  ctx.save();
  // 1. Core tight occlusion shadow directly touching base
  ctx.beginPath();
  ctx.ellipse(centerX, baseY, rx, ry, 0, 0, Math.PI * 2);
  const coreGrad = ctx.createRadialGradient(centerX, baseY, 0, centerX, baseY, rx);
  coreGrad.addColorStop(0, `rgba(0, 0, 0, ${Math.min(0.85, opacity * 0.95)})`);
  coreGrad.addColorStop(0.35, `rgba(0, 0, 0, ${Math.min(0.6, opacity * 0.65)})`);
  coreGrad.addColorStop(0.7, `rgba(0, 0, 0, ${Math.min(0.25, opacity * 0.25)})`);
  coreGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = coreGrad;
  ctx.fill();

  // 2. Soft diffuse ambient shadow spreading wider on floor
  const diffuseRx = Math.max(16, width * 0.54);
  const diffuseRy = Math.max(12, width * 0.11);
  const diffuseY = baseY + Math.max(3, width * 0.02);

  ctx.beginPath();
  ctx.ellipse(centerX, diffuseY, diffuseRx, diffuseRy, 0, 0, Math.PI * 2);
  const diffuseGrad = ctx.createRadialGradient(centerX, diffuseY, 0, centerX, diffuseY, diffuseRx);
  diffuseGrad.addColorStop(0, `rgba(0, 0, 0, ${Math.min(0.4, opacity * 0.35)})`);
  diffuseGrad.addColorStop(0.5, `rgba(0, 0, 0, ${Math.min(0.18, opacity * 0.15)})`);
  diffuseGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = diffuseGrad;
  ctx.fill();

  ctx.restore();
}

function renderDropShadow(
  ctx: CanvasRenderingContext2D,
  cutoutCanvas: HTMLCanvasElement,
  w: number,
  h: number,
  opacity: number,
): void {
  ctx.save();
  const blur = Math.max(8, Math.min(28, Math.round(w * 0.015)));
  const offsetY = Math.max(4, Math.min(22, Math.round(h * 0.012)));
  ctx.shadowColor = `rgba(0, 0, 0, ${Math.min(0.75, opacity * 0.65)})`;
  ctx.shadowBlur = blur;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = offsetY;
  ctx.drawImage(cutoutCanvas, 0, 0);
  ctx.restore();
}

function extractOriginalShadow(
  outCtx: CanvasRenderingContext2D,
  origCanvas: HTMLCanvasElement,
  cutoutCanvas: HTMLCanvasElement,
  w: number,
  h: number,
  opacity: number,
): void {
  const origCtx = origCanvas.getContext('2d');
  const cutCtx = cutoutCanvas.getContext('2d');
  if (!origCtx || !cutCtx) return;

  const origData = origCtx.getImageData(0, 0, w, h);
  const cutData = cutCtx.getImageData(0, 0, w, h);
  const shadowData = outCtx.createImageData(w, h);

  const p1 = 0;
  const p2 = (w - 1) * 4;
  const l1 =
    0.299 * origData.data[p1] + 0.587 * origData.data[p1 + 1] + 0.114 * origData.data[p1 + 2];
  const l2 =
    0.299 * origData.data[p2] + 0.587 * origData.data[p2 + 1] + 0.114 * origData.data[p2 + 2];
  const bgL = (l1 + l2) / 2;

  const total = w * h;
  for (let i = 0; i < total; i++) {
    const off = i * 4;
    const cutAlpha = cutData.data[off + 3];

    if (cutAlpha < 100) {
      const r = origData.data[off];
      const g = origData.data[off + 1];
      const b = origData.data[off + 2];
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;

      if (lum < bgL - 10) {
        const diff = (bgL - lum) / Math.max(1, bgL);
        const a = Math.max(0, Math.min(0.7, diff * 1.5 * opacity * (1 - cutAlpha / 255)));
        shadowData.data[off] = 0;
        shadowData.data[off + 1] = 0;
        shadowData.data[off + 2] = 0;
        shadowData.data[off + 3] = Math.round(a * 255);
      }
    }
  }

  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = w;
  tempCanvas.height = h;
  tempCanvas.getContext('2d')?.putImageData(shadowData, 0, 0);

  outCtx.save();
  outCtx.filter = 'blur(3px)';
  outCtx.drawImage(tempCanvas, 0, 0);
  outCtx.restore();
}

function drawShadowLayer(
  ctx: CanvasRenderingContext2D,
  cutoutCanvas: HTMLCanvasElement,
  origCanvas: HTMLCanvasElement | null,
  options: ShadowOptions,
  w: number,
  h: number,
): void {
  if (options.mode === 'contact') {
    const cutCtx = cutoutCanvas.getContext('2d');
    const bounds = cutCtx ? findForegroundBounds(cutCtx, w, h) : null;
    if (bounds) renderContactShadow(ctx, bounds, options.opacity);
    return;
  }
  if (options.mode === 'drop') {
    renderDropShadow(ctx, cutoutCanvas, w, h, options.opacity);
    return;
  }
  if (options.mode === 'original' && origCanvas) {
    extractOriginalShadow(ctx, origCanvas, cutoutCanvas, w, h, options.opacity);
  }
}

export function applyProductShadowAndBackground(
  cutoutCanvas: HTMLCanvasElement,
  origCanvas: HTMLCanvasElement | null,
  options: ShadowOptions,
): HTMLCanvasElement {
  const w = cutoutCanvas.width;
  const h = cutoutCanvas.height;

  const outCanvas = document.createElement('canvas');
  outCanvas.width = w;
  outCanvas.height = h;
  const ctx = outCanvas.getContext('2d');
  if (!ctx) return cutoutCanvas;

  const bg = options.replacementBackground ?? 'transparent';
  if (bg !== 'transparent') {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
  }

  if (options.mode !== 'none' && options.opacity > 0) {
    drawShadowLayer(ctx, cutoutCanvas, origCanvas, options, w, h);
  }

  ctx.drawImage(cutoutCanvas, 0, 0);
  return outCanvas;
}
