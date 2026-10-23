import { useEffect, useRef, useState } from 'preact/hooks';
import type { AspectRatioPreset, ImageDimensions, PixelRect } from './imageWorkbenchGeometry.ts';
import {
  applyAspectRatio,
  clampRectToBounds,
  defaultSelectionRect,
  sourceToDisplay,
} from './imageWorkbenchGeometry.ts';

export function useImageDisplaySize(imageSrc: string) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [displaySize, setDisplaySize] = useState({ width: 0, height: 0 });

  const update = () => {
    if (imgRef.current && imgRef.current.clientWidth > 0) {
      setDisplaySize({
        width: imgRef.current.clientWidth,
        height: imgRef.current.clientHeight,
      });
    }
  };

  useEffect(() => {
    update();
    const el = imgRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [imageSrc]);

  return { imgRef, displaySize, updateDisplaySize: update };
}

export interface WorkbenchStateOptions {
  imageSrc: string;
  sourceWidth: number;
  sourceHeight: number;
  value?: PixelRect;
  onChange?: (rect: PixelRect) => void;
  aspectRatio?: AspectRatioPreset;
  onAspectRatioChange?: (ratio: AspectRatioPreset) => void;
  minSelectionSize: number;
}

export function useWorkbenchState({
  imageSrc,
  sourceWidth,
  sourceHeight,
  value,
  onChange,
  aspectRatio,
  onAspectRatioChange,
  minSelectionSize,
}: WorkbenchStateOptions) {
  const bounds: ImageDimensions = { width: sourceWidth, height: sourceHeight };
  const [internalRatio, setInternalRatio] = useState<AspectRatioPreset>(aspectRatio ?? 'free');
  const activeRatio = aspectRatio ?? internalRatio;

  const [internalRect, setInternalRect] = useState<PixelRect>(() =>
    clampRectToBounds(value ?? defaultSelectionRect(bounds, activeRatio), bounds, minSelectionSize),
  );
  const currentRect = value ? clampRectToBounds(value, bounds, minSelectionSize) : internalRect;

  useEffect(() => {
    if (!value) {
      const initial = clampRectToBounds(
        defaultSelectionRect(bounds, activeRatio),
        bounds,
        minSelectionSize,
      );
      setInternalRect(initial);
      onChange?.(initial);
    }
  }, [imageSrc, sourceWidth, sourceHeight]);

  const updateRect = (next: PixelRect) => {
    const clamped = clampRectToBounds(next, bounds, minSelectionSize);
    if (!value) setInternalRect(clamped);
    onChange?.(clamped);
  };

  const { imgRef, displaySize, updateDisplaySize } = useImageDisplaySize(imageSrc);
  const scale = sourceWidth > 0 && displaySize.width > 0 ? displaySize.width / sourceWidth : 1;
  const displayRect = sourceToDisplay(currentRect, scale);

  const handleRatio = (next: AspectRatioPreset) => {
    if (!aspectRatio) setInternalRatio(next);
    onAspectRatioChange?.(next);
    updateRect(applyAspectRatio(currentRect, next, bounds, minSelectionSize));
  };

  return {
    bounds,
    activeRatio,
    currentRect,
    updateRect,
    imgRef,
    displaySize,
    updateDisplaySize,
    scale,
    displayRect,
    handleRatio,
  };
}
