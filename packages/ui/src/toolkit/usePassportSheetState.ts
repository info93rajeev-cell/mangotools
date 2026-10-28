import { useCallback, useMemo, useState } from 'preact/hooks';
import { downloadBytes } from './actions.ts';
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
  customFileName: string;
  notify: (msg: string) => void;
}

// biome-ignore lint/complexity/noExcessiveLinesPerFunction: Sheet state and studio print actions
export function usePassportSheetState({
  activePresetId,
  targetWidth,
  targetHeight,
  imageSrc,
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

  // Helper to load current photo image for sheet canvas rendering
  const loadPhotoImage = useCallback(async (): Promise<HTMLImageElement | null> => {
    if (!imageSrc) return null;
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = imageSrc;
    });
  }, [imageSrc]);

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

      const bytes = new Uint8Array(await blob.arrayBuffer());
      const baseName = customFileName.trim() || 'passport-sheet';
      const cleanBase = baseName.replace(/[^a-zA-Z0-9_\- ]/g, '').trim() || 'passport-sheet';
      const fileName = `${cleanBase}-${paperSize}-${photoCount}photos.jpg`;

      downloadBytes(bytes, fileName, 'image/jpeg');
      notify(`Downloaded ${fileName}`);
    } finally {
      setIsGeneratingSheet(false);
    }
  }, [imageSrc, generateSheetCanvas, customFileName, paperSize, photoCount, notify]);

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
    physicalSize,
    sheetLayout,
    printSheet,
    downloadSheet,
  };
}

export type UsePassportSheetReturn = ReturnType<typeof usePassportSheetState>;
