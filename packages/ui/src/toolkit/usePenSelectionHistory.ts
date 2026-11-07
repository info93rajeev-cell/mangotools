import { useCallback, useState } from 'preact/hooks';
import {
  type BezierPath,
  createKingfisherReferencePath,
  simplifyPath,
  smoothAllPoints,
} from './bezierPathModel.ts';
import type { BrushStroke } from './selectionMask.ts';

/** Everything that makes up the selection; one entry per undo step. */
export interface SelectionSnapshot {
  path: BezierPath;
  strokes: BrushStroke[];
  aiMask: ImageBitmap | null;
}

const EMPTY: SelectionSnapshot = {
  path: { points: [], isClosed: false },
  strokes: [],
  aiMask: null,
};
const MAX_STEPS = 30;

function useSnapshotHistory() {
  const [current, setCurrent] = useState<SelectionSnapshot>(EMPTY);
  const [history, setHistory] = useState<SelectionSnapshot[]>([EMPTY]);
  const [index, setIndex] = useState(0);

  const commit = useCallback(
    (next: SelectionSnapshot) => {
      setHistory((prev) => [...prev.slice(0, index + 1), next].slice(-MAX_STEPS));
      setIndex((i) => Math.min(i + 1, MAX_STEPS - 1));
      setCurrent(next);
    },
    [index],
  );
  const reset = useCallback((next: SelectionSnapshot = EMPTY) => {
    setHistory([next]);
    setIndex(0);
    setCurrent(next);
  }, []);
  const undo = useCallback(() => {
    if (index <= 0) return;
    setIndex(index - 1);
    setCurrent(history[index - 1] ?? EMPTY);
  }, [history, index]);
  const redo = useCallback(() => {
    if (index >= history.length - 1) return;
    setIndex(index + 1);
    setCurrent(history[index + 1] ?? EMPTY);
  }, [history, index]);

  return { current, setCurrent, commit, reset, undo, redo, index, length: history.length };
}

export function usePenSelectionHistory(
  imageDims: { width: number; height: number },
  notify: (msg: string) => void,
) {
  const h = useSnapshotHistory();
  const { current, commit } = h;
  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(null);

  /** Live path update while dragging (no undo step). */
  const setPath = useCallback(
    (update: BezierPath | ((prev: BezierPath) => BezierPath)) =>
      h.setCurrent((prev) => ({
        ...prev,
        path: typeof update === 'function' ? update(prev.path) : update,
      })),
    [h.setCurrent],
  );
  const pushHistory = useCallback(
    (path: BezierPath) => commit({ ...current, path }),
    [commit, current],
  );
  const addStroke = useCallback(
    (stroke: BrushStroke) => commit({ ...current, strokes: [...current.strokes, stroke] }),
    [commit, current],
  );
  const setAiMask = useCallback(
    (aiMask: ImageBitmap | null) =>
      commit({ path: { points: [], isClosed: false }, strokes: [], aiMask }),
    [commit],
  );

  const smoothCurrentPath = useCallback(() => {
    pushHistory(smoothAllPoints(current.path));
    notify('Selection path smoothed');
  }, [current.path, notify, pushHistory]);
  const simplifyCurrentPath = useCallback(() => {
    pushHistory(simplifyPath(current.path, 14));
    notify('Selection path simplified');
  }, [current.path, notify, pushHistory]);
  const resetCurrentPath = useCallback(() => {
    pushHistory(createKingfisherReferencePath(imageDims.width, imageDims.height));
    notify('Selection path reset to default');
  }, [imageDims, notify, pushHistory]);

  return {
    path: current.path,
    strokes: current.strokes,
    aiMask: current.aiMask,
    setPath,
    pushHistory,
    addStroke,
    setAiMask,
    resetSelection: h.reset,
    selectedPointIndex,
    setSelectedPointIndex,
    undo: h.undo,
    redo: h.redo,
    canUndo: h.index > 0,
    canRedo: h.index < h.length - 1,
    smoothCurrentPath,
    simplifyCurrentPath,
    resetCurrentPath,
  };
}
