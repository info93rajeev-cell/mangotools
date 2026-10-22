export interface PixelRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DisplayRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface ImageDimensions {
  width: number;
  height: number;
}

export type HandlePosition = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

export type AspectRatioPreset = 'free' | '1:1' | '4:3' | '16:9' | '35:45';

export function aspectRatioValue(preset: AspectRatioPreset): number | null {
  if (preset === '1:1') return 1;
  if (preset === '4:3') return 4 / 3;
  if (preset === '16:9') return 16 / 9;
  if (preset === '35:45') return 35 / 45;
  return null;
}

export function calculateFittedDisplay(
  sourceWidth: number,
  sourceHeight: number,
  containerWidth: number,
  containerHeight: number,
): { width: number; height: number; scale: number } {
  if (sourceWidth <= 0 || sourceHeight <= 0 || containerWidth <= 0 || containerHeight <= 0) {
    return { width: 0, height: 0, scale: 1 };
  }
  const scale = Math.min(containerWidth / sourceWidth, containerHeight / sourceHeight, 1);
  return {
    width: Math.max(1, Math.round(sourceWidth * scale)),
    height: Math.max(1, Math.round(sourceHeight * scale)),
    scale,
  };
}

export function sourceToDisplay(rect: PixelRect, scale: number): DisplayRect {
  return {
    left: rect.x * scale,
    top: rect.y * scale,
    width: rect.width * scale,
    height: rect.height * scale,
  };
}

export function clampRectToBounds(
  rect: PixelRect,
  bounds: ImageDimensions,
  minSize = 10,
): PixelRect {
  const maxW = Math.max(1, Math.round(bounds.width));
  const maxH = Math.max(1, Math.round(bounds.height));
  const minW = Math.min(Math.round(minSize), maxW);
  const minH = Math.min(Math.round(minSize), maxH);

  const width = Math.min(maxW, Math.max(minW, Math.round(rect.width)));
  const height = Math.min(maxH, Math.max(minH, Math.round(rect.height)));
  const x = Math.min(maxW - width, Math.max(0, Math.round(rect.x)));
  const y = Math.min(maxH - height, Math.max(0, Math.round(rect.y)));

  return { x, y, width, height };
}

export function displayToSource(
  rect: DisplayRect,
  scale: number,
  bounds: ImageDimensions,
): PixelRect {
  if (scale <= 0) return clampRectToBounds({ x: 0, y: 0, width: 0, height: 0 }, bounds);
  return clampRectToBounds(
    {
      x: Math.round(rect.left / scale),
      y: Math.round(rect.top / scale),
      width: Math.round(rect.width / scale),
      height: Math.round(rect.height / scale),
    },
    bounds,
  );
}

export function defaultSelectionRect(
  bounds: ImageDimensions,
  ratioPreset: AspectRatioPreset = 'free',
  coverageRatio = 0.8,
): PixelRect {
  const maxW = Math.max(1, bounds.width);
  const maxH = Math.max(1, bounds.height);
  const ratio = aspectRatioValue(ratioPreset);

  let w = Math.max(1, Math.round(maxW * coverageRatio));
  let h = Math.max(1, Math.round(maxH * coverageRatio));

  if (ratio !== null) {
    if (w / h > ratio) w = Math.max(1, Math.round(h * ratio));
    else h = Math.max(1, Math.round(w / ratio));
  }

  const x = Math.max(0, Math.round((maxW - w) / 2));
  const y = Math.max(0, Math.round((maxH - h) / 2));

  return clampRectToBounds({ x, y, width: w, height: h }, bounds);
}

export function moveRect(
  current: PixelRect,
  deltaX: number,
  deltaY: number,
  bounds: ImageDimensions,
): PixelRect {
  return clampRectToBounds(
    {
      x: current.x + Math.round(deltaX),
      y: current.y + Math.round(deltaY),
      width: current.width,
      height: current.height,
    },
    bounds,
  );
}

export function applyAspectRatio(
  current: PixelRect,
  ratioPreset: AspectRatioPreset,
  bounds: ImageDimensions,
  minSize = 10,
): PixelRect {
  const ratio = aspectRatioValue(ratioPreset);
  if (ratio === null) return current;

  const cx = current.x + current.width / 2;
  const cy = current.y + current.height / 2;
  let w = current.width;
  let h = current.height;

  if (w / h > ratio) {
    w = Math.max(minSize, Math.round(h * ratio));
    if (w > bounds.width) {
      w = bounds.width;
      h = Math.max(minSize, Math.round(w / ratio));
    }
  } else {
    h = Math.max(minSize, Math.round(w / ratio));
    if (h > bounds.height) {
      h = bounds.height;
      w = Math.max(minSize, Math.round(h * ratio));
    }
  }

  const x = Math.round(cx - w / 2);
  const y = Math.round(cy - h / 2);
  return clampRectToBounds({ x, y, width: w, height: h }, bounds, minSize);
}

function resizeRectFree(
  current: PixelRect,
  handle: HandlePosition,
  dx: number,
  dy: number,
  bounds: ImageDimensions,
  minSize: number,
): PixelRect {
  let { x, y, width, height } = current;
  const right = x + width;
  const bottom = y + height;

  if (handle === 'e' || handle === 'ne' || handle === 'se') {
    width = Math.max(minSize, Math.min(bounds.width - x, Math.round(current.width + dx)));
  } else if (handle === 'w' || handle === 'nw' || handle === 'sw') {
    const newX = Math.max(0, Math.min(right - minSize, Math.round(current.x + dx)));
    width = right - newX;
    x = newX;
  }

  if (handle === 's' || handle === 'se' || handle === 'sw') {
    height = Math.max(minSize, Math.min(bounds.height - y, Math.round(current.height + dy)));
  } else if (handle === 'n' || handle === 'nw' || handle === 'ne') {
    const newY = Math.max(0, Math.min(bottom - minSize, Math.round(current.y + dy)));
    height = bottom - newY;
    y = newY;
  }

  return clampRectToBounds({ x, y, width, height }, bounds, minSize);
}

function resizeLockedCorner(
  current: PixelRect,
  handle: 'nw' | 'ne' | 'se' | 'sw',
  dx: number,
  dy: number,
  bounds: ImageDimensions,
  ratio: number,
  minSize: number,
): PixelRect {
  const right = current.x + current.width;
  const bottom = current.y + current.height;

  if (handle === 'se') {
    const delta = Math.round(Math.abs(dx) > Math.abs(dy) ? dx : dy * ratio);
    const maxW = Math.min(
      bounds.width - current.x,
      Math.floor((bounds.height - current.y) * ratio),
    );
    const width = Math.max(minSize, Math.min(maxW, current.width + delta));
    const height = Math.min(bounds.height - current.y, Math.round(width / ratio));
    return clampRectToBounds({ x: current.x, y: current.y, width, height }, bounds, minSize);
  }
  if (handle === 'nw') {
    const delta = Math.round(Math.abs(dx) > Math.abs(dy) ? dx : dy * ratio);
    const maxW = Math.min(right, Math.floor(bottom * ratio));
    const width = Math.max(minSize, Math.min(maxW, current.width - delta));
    const height = Math.min(bottom, Math.round(width / ratio));
    return clampRectToBounds(
      { x: right - width, y: bottom - height, width, height },
      bounds,
      minSize,
    );
  }
  if (handle === 'ne') {
    const delta = Math.round(Math.abs(dx) > Math.abs(dy) ? dx : -dy * ratio);
    const maxW = Math.min(bounds.width - current.x, Math.floor(bottom * ratio));
    const width = Math.max(minSize, Math.min(maxW, current.width + delta));
    const height = Math.min(bottom, Math.round(width / ratio));
    return clampRectToBounds({ x: current.x, y: bottom - height, width, height }, bounds, minSize);
  }
  const delta = Math.round(Math.abs(dx) > Math.abs(dy) ? -dx : dy * ratio);
  const maxW = Math.min(right, Math.floor((bounds.height - current.y) * ratio));
  const width = Math.max(minSize, Math.min(maxW, current.width + delta));
  const height = Math.min(bounds.height - current.y, Math.round(width / ratio));
  return clampRectToBounds({ x: right - width, y: current.y, width, height }, bounds, minSize);
}

function resizeLockedSide(
  current: PixelRect,
  handle: 'n' | 's' | 'e' | 'w',
  dx: number,
  dy: number,
  bounds: ImageDimensions,
  ratio: number,
  minSize: number,
): PixelRect {
  if (handle === 'e' || handle === 'w') {
    const change = Math.round(handle === 'e' ? dx : -dx);
    const maxW = Math.min(bounds.width, Math.floor(bounds.height * ratio));
    const width = Math.max(minSize, Math.min(maxW, current.width + change));
    const height = Math.max(minSize, Math.min(bounds.height, Math.round(width / ratio)));
    const cy = current.y + current.height / 2;
    const y = Math.max(0, Math.min(bounds.height - height, Math.round(cy - height / 2)));
    const x = handle === 'e' ? current.x : current.x + current.width - width;
    return clampRectToBounds({ x, y, width, height }, bounds, minSize);
  }
  const change = Math.round(handle === 's' ? dy : -dy);
  const maxH = Math.min(bounds.height, Math.floor(bounds.width / ratio));
  const height = Math.max(minSize, Math.min(maxH, current.height + change));
  const width = Math.max(minSize, Math.min(bounds.width, Math.round(height * ratio)));
  const cx = current.x + current.width / 2;
  const x = Math.max(0, Math.min(bounds.width - width, Math.round(cx - width / 2)));
  const y = handle === 's' ? current.y : current.y + current.height - height;
  return clampRectToBounds({ x, y, width, height }, bounds, minSize);
}

export function resizeRect(
  current: PixelRect,
  handle: HandlePosition,
  deltaX: number,
  deltaY: number,
  bounds: ImageDimensions,
  ratioPreset: AspectRatioPreset = 'free',
  minSize = 10,
): PixelRect {
  const ratio = aspectRatioValue(ratioPreset);
  if (ratio === null) {
    return resizeRectFree(current, handle, deltaX, deltaY, bounds, minSize);
  }
  if (handle === 'nw' || handle === 'ne' || handle === 'se' || handle === 'sw') {
    return resizeLockedCorner(current, handle, deltaX, deltaY, bounds, ratio, minSize);
  }
  return resizeLockedSide(current, handle, deltaX, deltaY, bounds, ratio, minSize);
}
