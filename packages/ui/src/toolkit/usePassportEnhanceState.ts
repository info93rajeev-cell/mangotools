import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import {
  DEFAULT_ADJUSTMENTS,
  type EnhanceAdjustments,
  type NaturalFilterId,
  renderEnhancedPassportImage,
  type SpotEdit,
  ZERO_ADJUSTMENTS,
} from './passportEnhanceEngine.ts';

export type EnhanceToolTab = 'crop' | 'adjust' | 'filters' | 'retouch' | 'background';

export interface UsePassportEnhanceStateReturn {
  activeTab: EnhanceToolTab;
  setActiveTab: (tab: EnhanceToolTab) => void;
  activeFilter: NaturalFilterId;
  setActiveFilter: (filter: NaturalFilterId) => void;
  filterIntensity: number;
  setFilterIntensity: (intensity: number) => void;
  adjustments: EnhanceAdjustments;
  setAdjustment: (key: keyof EnhanceAdjustments, val: number) => void;
  resetAdjustments: () => void;
  resetAll: () => void;
  splitPosition: number;
  setSplitPosition: (pos: number) => void;
  isCompareMode: boolean;
  setIsCompareMode: (compare: boolean) => void;
  spotEdits: SpotEdit[];
  addSpotEdit: (edit: SpotEdit) => void;
  undoSpotEdit: () => void;
  clearSpotEdits: () => void;
  enhancedBlobUrl: string | null;
  brushSize: number;
  setBrushSize: (size: number) => void;
  zoomLevel: number;
  setZoomLevel: (zoom: number) => void;
  panOffset: { x: number; y: number };
  setPanOffset: (offset: { x: number; y: number }) => void;
  resetView: () => void;
}

function useEnhanceView() {
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const resetView = useCallback(() => {
    setZoomLevel(100);
    setPanOffset({ x: 0, y: 0 });
  }, []);
  return { zoomLevel, setZoomLevel, panOffset, setPanOffset, resetView };
}

function useEnhanceRenderer(
  imageElement: HTMLImageElement | null,
  activeFilter: NaturalFilterId,
  filterIntensity: number,
  adjustments: EnhanceAdjustments,
  spotEdits: SpotEdit[],
  setEnhancedBlobUrl: (url: string | null) => void,
) {
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!imageElement) return;

    if (!offscreenCanvasRef.current) {
      offscreenCanvasRef.current = document.createElement('canvas');
    }
    const canvas = offscreenCanvasRef.current;

    renderEnhancedPassportImage(imageElement, canvas, {
      filter: activeFilter,
      filterIntensity,
      adjustments,
      spotEdits,
    });

    canvas.toBlob(
      (blob) => {
        if (blob) {
          setEnhancedBlobUrl(URL.createObjectURL(blob));
        }
      },
      'image/jpeg',
      0.95,
    );
  }, [imageElement, activeFilter, filterIntensity, adjustments, spotEdits, setEnhancedBlobUrl]);
}

export function usePassportEnhanceState(
  imageElement: HTMLImageElement | null,
): UsePassportEnhanceStateReturn {
  const [activeTab, setActiveTab] = useState<EnhanceToolTab>('adjust');
  const [activeFilter, setActiveFilter] = useState<NaturalFilterId>('natural');
  const [filterIntensity, setFilterIntensity] = useState<number>(80);
  const [adjustments, setAdjustments] = useState<EnhanceAdjustments>(DEFAULT_ADJUSTMENTS);
  const [splitPosition, setSplitPosition] = useState<number>(50);
  const [isCompareMode, setIsCompareMode] = useState<boolean>(true);
  const [spotEdits, setSpotEdits] = useState<SpotEdit[]>([]);
  const [brushSize, setBrushSize] = useState<number>(14);
  const [enhancedBlobUrl, setEnhancedBlobUrl] = useState<string | null>(null);
  const view = useEnhanceView();

  const setAdjustment = useCallback((key: keyof EnhanceAdjustments, val: number) => {
    setAdjustments((prev) => ({ ...prev, [key]: val }));
  }, []);

  const resetAdjustments = useCallback(() => {
    setAdjustments(ZERO_ADJUSTMENTS);
    setActiveFilter('none');
  }, []);

  const resetAll = useCallback(() => {
    setAdjustments(DEFAULT_ADJUSTMENTS);
    setActiveFilter('natural');
    setSpotEdits([]);
    setSplitPosition(50);
    view.resetView();
  }, [view.resetView]);

  const addSpotEdit = useCallback((edit: SpotEdit) => {
    setSpotEdits((prev) => [...prev, edit]);
  }, []);

  const undoSpotEdit = useCallback(() => {
    setSpotEdits((prev) => prev.slice(0, -1));
  }, []);

  const clearSpotEdits = useCallback(() => {
    setSpotEdits([]);
  }, []);

  useEnhanceRenderer(
    imageElement,
    activeFilter,
    filterIntensity,
    adjustments,
    spotEdits,
    setEnhancedBlobUrl,
  );

  return {
    activeTab,
    setActiveTab,
    activeFilter,
    setActiveFilter,
    filterIntensity,
    setFilterIntensity,
    adjustments,
    setAdjustment,
    resetAdjustments,
    resetAll,
    splitPosition,
    setSplitPosition,
    isCompareMode,
    setIsCompareMode,
    spotEdits,
    addSpotEdit,
    undoSpotEdit,
    clearSpotEdits,
    enhancedBlobUrl,
    brushSize,
    setBrushSize,
    ...view,
  };
}
