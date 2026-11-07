import { useCallback, useEffect, useState } from 'preact/hooks';
import type { BezierPath } from './bezierPathModel.ts';
import { type BrushStroke, hasNoEdits } from './selectionMask.ts';
import {
  type RenderCutoutResult,
  renderSelectionCutout,
  type SelectionEdgeSettings,
} from './selectionMaskRenderer.ts';
import { type AutoSelectStatus, useAutoSelect } from './usePenAutoSelect.ts';
import { usePenPathMutations } from './usePenPathMutations.ts';
import { usePenSelectionHistory } from './usePenSelectionHistory.ts';

export type ActiveTool = 'pen' | 'add' | 'delete' | 'brushAdd' | 'brushRemove' | 'pan';
export type BgMode = 'transparent' | 'white' | 'black' | 'custom';

function usePenImageState(notify: (msg: string) => void) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [imageDims, setImageDims] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

  const loadFile = useCallback(
    async (file: File) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        setImage(img);
        setImageSrc(url);
        setFileName(file.name);
        setImageDims({ width: img.naturalWidth, height: img.naturalHeight });
        notify(`Loaded ${file.name}`);
      };
      img.src = url;
    },
    [notify],
  );

  const loadSample = useCallback(async () => {
    const img = new Image();
    img.onload = () => {
      setImage(img);
      setImageSrc('/samples/kingfisher-sample.jpg');
      setFileName('kingfisher-sample.jpg');
      setImageDims({ width: img.naturalWidth || 1200, height: img.naturalHeight || 900 });
      notify('Sample Kingfisher image loaded');
    };
    img.src = '/samples/kingfisher-sample.jpg';
  }, [notify]);

  return {
    image,
    setImage,
    imageSrc,
    setImageSrc,
    fileName,
    setFileName,
    imageDims,
    setImageDims,
    loadFile,
    loadSample,
  };
}

function usePenEdgeAndBgState() {
  const [edgeSettings, setEdgeSettings] = useState<SelectionEdgeSettings>({
    featherRadius: 2,
    expandContract: 0,
    smoothPath: 0,
    edgeBlur: 0,
  });
  const [bgMode, setBgMode] = useState<BgMode>('transparent');
  const [customColor, setCustomColor] = useState<string>('#4f46e5');
  const [showOriginal, setShowOriginal] = useState<boolean>(false);
  const [showMask, setShowMask] = useState<boolean>(true);
  const [zoom, setZoom] = useState<number>(100);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  return {
    edgeSettings,
    setEdgeSettings,
    bgMode,
    setBgMode,
    customColor,
    setCustomColor,
    showOriginal,
    setShowOriginal,
    showMask,
    setShowMask,
    zoom,
    setZoom,
    pan,
    setPan,
  };
}

function useCutoutRenderer(
  image: HTMLImageElement | null,
  path: BezierPath,
  strokes: BrushStroke[],
  aiMask: ImageBitmap | null,
  edgeSettings: SelectionEdgeSettings,
  bgMode: BgMode,
  customColor: string,
  fileName: string,
  notify: (msg: string) => void,
) {
  const [cutoutResult, setCutoutResult] = useState<RenderCutoutResult | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  useEffect(() => {
    if (!image) return;
    // Nothing selected yet: show the photo itself, not an empty transparent cutout.
    if (hasNoEdits({ path, strokes, aiMask })) {
      setCutoutResult(null);
      setIsProcessing(false);
      return;
    }
    let cancelled = false;
    setIsProcessing(true);
    const timer = setTimeout(() => {
      renderSelectionCutout({
        image,
        sources: { path, strokes, aiMask },
        settings: edgeSettings,
        backgroundType: bgMode,
        customBgColor: customColor,
      })
        .then((res) => {
          if (!cancelled) {
            setCutoutResult(res);
            setIsProcessing(false);
          }
        })
        .catch(() => {
          if (!cancelled) setIsProcessing(false);
        });
    }, 40);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [image, path, strokes, aiMask, edgeSettings, bgMode, customColor]);

  const downloadCutout = useCallback(
    (format: 'png' | 'webp' | 'svg') => {
      if (!cutoutResult) return;
      const baseName = fileName.replace(/\.[^/.]+$/, '');
      const a = document.createElement('a');
      if (format === 'svg') {
        a.href = URL.createObjectURL(
          new Blob([cutoutResult.svgContent], { type: 'image/svg+xml;charset=utf-8' }),
        );
        a.download = `${baseName}_selection_path.svg`;
      } else if (format === 'webp') {
        a.href = URL.createObjectURL(cutoutResult.webpBlob);
        a.download = `${baseName}_cutout.webp`;
      } else {
        a.href = URL.createObjectURL(cutoutResult.pngBlob);
        a.download = `${baseName}_cutout.png`;
      }
      a.click();
      notify(`Downloaded ${format.toUpperCase()}`);
    },
    [cutoutResult, fileName, notify],
  );

  return { cutoutResult, isProcessing, downloadCutout };
}

export interface UseAdvancedPenSelectionReturn {
  image: HTMLImageElement | null;
  imageSrc: string | null;
  fileName: string;
  imageDims: { width: number; height: number };
  path: BezierPath;
  strokes: BrushStroke[];
  aiMask: ImageBitmap | null;
  autoSelectStatus: AutoSelectStatus;
  brushRadius: number;
  setBrushRadius: (r: number) => void;
  addStroke: (stroke: BrushStroke) => void;
  onAppendPoint: (x: number, y: number) => number | null;
  onClosePath: () => void;
  onToggleCurve: (idx: number) => void;
  onPullHandles: (idx: number, x: number, y: number) => void;
  beginEdit: () => void;
  selectedPointIndex: number | null;
  activeTool: ActiveTool;
  edgeSettings: SelectionEdgeSettings;
  bgMode: BgMode;
  customColor: string;
  showOriginal: boolean;
  showMask: boolean;
  zoom: number;
  pan: { x: number; y: number };
  canUndo: boolean;
  canRedo: boolean;
  cutoutResult: RenderCutoutResult | null;
  isProcessing: boolean;
  setActiveTool: (tool: ActiveTool) => void;
  setSelectedPointIndex: (idx: number | null) => void;
  setEdgeSettings: (updater: (prev: SelectionEdgeSettings) => SelectionEdgeSettings) => void;
  setBgMode: (mode: BgMode) => void;
  setCustomColor: (color: string) => void;
  setShowOriginal: (v: boolean) => void;
  setShowMask: (v: boolean) => void;
  setZoom: (v: number | ((prev: number) => number)) => void;
  setPan: (
    pan: { x: number; y: number } | ((prev: { x: number; y: number }) => { x: number; y: number }),
  ) => void;
  loadFile: (file: File) => Promise<void>;
  loadSample: () => Promise<void>;
  runAutoSelect: () => Promise<void>;
  smoothCurrentPath: () => void;
  simplifyCurrentPath: () => void;
  resetCurrentPath: () => void;
  undo: () => void;
  redo: () => void;
  clearAll: () => void;
  onMovePoint: (idx: number, nx: number, ny: number) => void;
  onMoveHandle: (idx: number, handle: 'cp1' | 'cp2', nx: number, ny: number) => void;
  onInsertPoint: (segIdx: number, t: number) => void;
  onDeletePoint: (idx: number) => void;
  downloadCutout: (format: 'png' | 'webp' | 'svg') => void;
}

export function useAdvancedPenSelection(
  notify: (msg: string) => void,
): UseAdvancedPenSelectionReturn {
  const imgState = usePenImageState(notify);
  const pathState = usePenSelectionHistory(notify);
  const edgeState = usePenEdgeAndBgState();
  const [activeTool, setActiveTool] = useState<ActiveTool>('pen');
  const [brushRadius, setBrushRadius] = useState<number>(24);

  const { cutoutResult, isProcessing, downloadCutout } = useCutoutRenderer(
    imgState.image,
    pathState.path,
    pathState.strokes,
    pathState.aiMask,
    edgeState.edgeSettings,
    edgeState.bgMode,
    edgeState.customColor,
    imgState.fileName,
    notify,
  );

  const mutations = usePenPathMutations(pathState, notify);
  const auto = useAutoSelect(imgState.image, pathState, notify);
  const { resetSelection } = pathState;

  const loadFile = useCallback(
    async (file: File) => {
      resetSelection();
      await imgState.loadFile(file);
    },
    [imgState.loadFile, resetSelection],
  );

  const loadSample = useCallback(async () => {
    const img = new Image();
    img.onload = () => {
      imgState.setImage(img);
      imgState.setImageSrc('/samples/kingfisher-sample.jpg');
      imgState.setFileName('kingfisher-sample.jpg');
      imgState.setImageDims({ width: img.naturalWidth || 1200, height: img.naturalHeight || 900 });
      resetSelection();
      notify('Sample loaded — click Auto Select to select the bird.');
    };
    img.src = '/samples/kingfisher-sample.jpg';
  }, [imgState, resetSelection, notify]);

  return {
    ...imgState,
    ...pathState,
    ...edgeState,
    ...mutations,
    ...auto,
    loadFile,
    loadSample,
    activeTool,
    setActiveTool,
    brushRadius,
    setBrushRadius,
    cutoutResult,
    isProcessing,
    downloadCutout,
  };
}
