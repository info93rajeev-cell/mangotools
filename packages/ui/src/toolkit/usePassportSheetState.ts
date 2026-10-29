import { useCallback, useMemo, useState } from 'preact/hooks';
import type { PixelRect } from './imageWorkbenchGeometry.ts';
import {
  computeSheetLayout,
  type PaperSizeId,
  printSheetViaIframe,
  renderPrintSheetToCanvas,
  resolvePassportPhysicalSize,
  type SheetLayoutResult,
} from './passportSheetGeometry.ts';

export interface UsePassportSheetProps {
  activePresetId: string | null;
  targetWidth: number;
  targetHeight: number;
  imageSrc: string | null;
  cropRect?: PixelRect | null;
  croppedImageSrc?: string | null;
  customFileName: string;
  notify: (msg: string) => void;
}

function sliceImageToCanvas(
  img: HTMLImageElement,
  cropRect: PixelRect,
  targetWidth: number,
  targetHeight: number,
): HTMLCanvasElement | null {
  const canvas = document.createElement('canvas');
  const targetW = targetWidth > 0 ? targetWidth : Math.round(cropRect.width);
  const targetH = targetHeight > 0 ? targetHeight : Math.round(cropRect.height);
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.drawImage(
    img,
    cropRect.x,
    cropRect.y,
    cropRect.width,
    cropRect.height,
    0,
    0,
    targetW,
    targetH,
  );
  return canvas;
}

// biome-ignore lint/complexity/noExcessiveLinesPerFunction: Sheet state and studio print actions
export function usePassportSheetState({
  activePresetId,
  targetWidth,
  targetHeight,
  imageSrc,
  cropRect,
  croppedImageSrc,
  customFileName,
  notify,
}: UsePassportSheetProps) {
  const [paperSize, setPaperSize] = useState<PaperSizeId>('4x6');
  const [photoCount, setPhotoCount] = useState<number>(6);
  const [showCutGuides, setShowCutGuides] = useState<boolean>(true);
  const [activeStageView, setActiveStageView] = useState<'single' | 'sheet'>('single');
  const [isGeneratingSheet, setIsGeneratingSheet] = useState<boolean>(false);

  const physicalSize = useMemo(
    () => resolvePassportPhysicalSize(activePresetId, targetWidth, targetHeight),
    [activePresetId, targetWidth, targetHeight],
  );

  const sheetLayout: SheetLayoutResult = useMemo(
    () => computeSheetLayout(paperSize, physicalSize.widthMm, physicalSize.heightMm, photoCount),
    [paperSize, physicalSize.widthMm, physicalSize.heightMm, photoCount],
  );

  // Helper to load current photo image for sheet canvas rendering (sliced to crop if needed)
  const loadPhotoImage = useCallback(async (): Promise<CanvasImageSource | null> => {
    const src = croppedImageSrc || imageSrc;
    if (!src) return null;
    const img = await new Promise<HTMLImageElement | null>((resolve) => {
      const el = new Image();
      el.crossOrigin = 'anonymous';
      el.onload = () => resolve(el);
      el.onerror = () => resolve(null);
      el.src = src;
    });
    if (!img) return null;

    if (!croppedImageSrc && cropRect && cropRect.width > 0 && cropRect.height > 0) {
      return sliceImageToCanvas(img, cropRect, targetWidth, targetHeight) ?? img;
    }
    return img;
  }, [croppedImageSrc, imageSrc, cropRect, targetWidth, targetHeight]);

  const generateSheetCanvas = useCallback(async () => {
    const img = await loadPhotoImage();
    if (!img) return null;
    return renderPrintSheetToCanvas(img, sheetLayout, showCutGuides);
  }, [loadPhotoImage, sheetLayout, showCutGuides]);

  const printSheet = useCallback(async () => {
    if (!imageSrc) {
      notify('Please upload or select a photo first.');
      return;
    }
    setIsGeneratingSheet(true);
    try {
      const canvas = await generateSheetCanvas();
      if (!canvas) {
        notify('Failed to generate printable sheet.');
        return;
      }
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      printSheetViaIframe(dataUrl, sheetLayout.paperWidthMm, sheetLayout.paperHeightMm);
      notify(`Opening print dialog for ${sheetLayout.paper.name}...`);
    } finally {
      setIsGeneratingSheet(false);
    }
  }, [imageSrc, generateSheetCanvas, sheetLayout, notify]);

  const downloadSheet = useCallback(async () => {
    if (!imageSrc) {
      notify('Please upload or select a photo first.');
      return;
    }
    setIsGeneratingSheet(true);
    try {
      const canvas = await generateSheetCanvas();
      if (!canvas) {
        notify('Failed to generate sheet image.');
        return;
      }
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.95),
      );
      if (!blob) return;

      const fileName = `${customFileName.trim() || 'passport'}-print-sheet-${sheetLayout.paper.id}.jpg`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      notify(`Downloaded ${fileName}`);
    } finally {
      setIsGeneratingSheet(false);
    }
  }, [imageSrc, generateSheetCanvas, sheetLayout, customFileName, notify]);

  return {
    paperSize,
    setPaperSize,
    photoCount,
    setPhotoCount,
    showCutGuides,
    setShowCutGuides,
    activeStageView,
    setActiveStageView,
    isGeneratingSheet,
    sheetLayout,
    printSheet,
    downloadSheet,
  };
}
