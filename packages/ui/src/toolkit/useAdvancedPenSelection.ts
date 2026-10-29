import { useCallback, useEffect, useState } from 'preact/hooks';
import {
  type BezierPath,
  createKingfisherReferencePath,
  deletePointById,
  insertPointAt,
  moveHandleCoords,
  movePointCoords,
  simplifyPath,
  smoothAllPoints,
} from './bezierPathModel.ts';
import { autoDetectForegroundPath } from './classicalAutoSelect.ts';
import {
  type RenderCutoutResult,
  renderSelectionCutout,
  type SelectionEdgeSettings,
} from './selectionMaskRenderer.ts';

export type ActiveTool = 'pen' | 'add' | 'delete' | 'brushAdd' | 'brushRemove';
export type BgMode = 'transparent' | 'white' | 'black' | 'custom';

function usePenImageState(notify: (msg: string) => void) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('kingfisher-sample.jpg');
  const [imageDims, setImageDims] = useState<{ width: number; height: number }>({
    width: 1200,
    height: 900,
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
    imageDims,
    setImageDims,
    loadFile,
    loadSample,
  };
}

function usePenPathHistory(
  imageDims: { width: number; height: number },
  notify: (msg: string) => void,
) {
  const [path, setPath] = useState<BezierPath>(() => createKingfisherReferencePath(1200, 900));
  const [history, setHistory] = useState<BezierPath[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(3);

  const pushHistory = useCallback(
    (newPath: BezierPath) => {
      setHistory((prev) => {
        const upToCurrent = prev.slice(0, historyIndex + 1);
        return [...upToCurrent.slice(-20), newPath];
      });
      setHistoryIndex((prev) => prev + 1);
      setPath(newPath);
    },
    [historyIndex],
  );

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex((i) => i - 1);
      setPath(history[historyIndex - 1]);
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex((i) => i + 1);
      setPath(history[historyIndex + 1]);
    }
  }, [history, historyIndex]);

  const smoothCurrentPath = useCallback(() => {
    pushHistory(smoothAllPoints(path));
    notify('Selection path smoothed');
  }, [path, notify, pushHistory]);

  const simplifyCurrentPath = useCallback(() => {
    pushHistory(simplifyPath(path, 14));
    notify('Selection path simplified');
  }, [path, notify, pushHistory]);

  const resetCurrentPath = useCallback(() => {
    pushHistory(createKingfisherReferencePath(imageDims.width, imageDims.height));
    notify('Selection path reset to default');
  }, [imageDims, notify, pushHistory]);

  return {
    path,
    setPath,
    selectedPointIndex,
    setSelectedPointIndex,
    pushHistory,
    undo,
    redo,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1,
    smoothCurrentPath,
    simplifyCurrentPath,
    resetCurrentPath,
  };
}

function usePenEdgeAndBgState() {
  const [edgeSettings, setEdgeSettings] = useState<SelectionEdgeSettings>({
    featherRadius: 5,
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
    let cancelled = false;
    setIsProcessing(true);
    const timer = setTimeout(() => {
      renderSelectionCutout({
        image,
        path,
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
  }, [image, path, edgeSettings, bgMode, customColor]);

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

function usePathPointMutations(
  pathState: ReturnType<typeof usePenPathHistory>,
  notify: (msg: string) => void,
) {
  const onMovePoint = useCallback(
    (idx: number, nx: number, ny: number) => {
      pathState.setPath((prev) => movePointCoords(prev, idx, nx, ny));
    },
    [pathState.setPath],
  );

  const onMoveHandle = useCallback(
    (idx: number, handle: 'cp1' | 'cp2', nx: number, ny: number) => {
      pathState.setPath((prev) => moveHandleCoords(prev, idx, handle, nx, ny));
    },
    [pathState.setPath],
  );

  const onInsertPoint = useCallback(
    (segIdx: number, t: number) => {
      pathState.setPath((prev) => {
        const updated = insertPointAt(prev, segIdx, t);
        pathState.pushHistory(updated);
        return updated;
      });
    },
    [pathState.setPath, pathState.pushHistory],
  );

  const onDeletePoint = useCallback(
    (idx: number) => {
      pathState.setPath((prev) => {
        const target = prev.points[idx];
        if (!target) return prev;
        const updated = deletePointById(prev, target.id);
        pathState.pushHistory(updated);
        return updated;
      });
      pathState.setSelectedPointIndex(null);
    },
    [pathState.setPath, pathState.pushHistory, pathState.setSelectedPointIndex],
  );

  const clearAll = useCallback(() => {
    pathState.pushHistory({ points: [], isClosed: false });
    notify('Selection cleared');
  }, [pathState.pushHistory, notify]);

  return { onMovePoint, onMoveHandle, onInsertPoint, onDeletePoint, clearAll };
}

export interface UseAdvancedPenSelectionReturn {
  image: HTMLImageElement | null;
  imageSrc: string | null;
  fileName: string;
  imageDims: { width: number; height: number };
  path: BezierPath;
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
  runAutoSelect: () => void;
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
  const pathState = usePenPathHistory(imgState.imageDims, notify);
  const edgeState = usePenEdgeAndBgState();
  const [activeTool, setActiveTool] = useState<ActiveTool>('pen');

  const { cutoutResult, isProcessing, downloadCutout } = useCutoutRenderer(
    imgState.image,
    pathState.path,
    edgeState.edgeSettings,
    edgeState.bgMode,
    edgeState.customColor,
    imgState.fileName,
    notify,
  );

  const mutations = usePathPointMutations(pathState, notify);

  useEffect(() => {
    void imgState.loadSample();
  }, [imgState.loadSample]);

  const runAutoSelect = useCallback(() => {
    if (!imgState.image) return;
    pathState.pushHistory(autoDetectForegroundPath(imgState.image));
    notify('Auto selection path generated');
  }, [imgState.image, pathState.pushHistory, notify]);

  return {
    ...imgState,
    ...pathState,
    ...edgeState,
    ...mutations,
    activeTool,
    setActiveTool,
    cutoutResult,
    isProcessing,
    runAutoSelect,
    downloadCutout,
  };
}
