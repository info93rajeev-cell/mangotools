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

interface HistoryState {
  stack: SelectionSnapshot[];
  index: number;
}

/** Undo stack with functional updates, so rapid edits always build on the latest state. */
function useSnapshotHistory() {
  const [h, setH] = useState<HistoryState>({ stack: [EMPTY], index: 0 });
  const current = h.stack[h.index] ?? EMPTY;

  const commit = useCallback(
    (next: (cur: SelectionSnapshot) => SelectionSnapshot) =>
      setH((prev) => {
        const cur = prev.stack[prev.index] ?? EMPTY;
        const stack = [...prev.stack.slice(0, prev.index + 1), next(cur)].slice(-MAX_STEPS);
        return { stack, index: stack.length - 1 };
      }),
    [],
  );
  /** Replace the current step in place (live dragging; no new undo step). */
  const setCurrent = useCallback(
    (next: (cur: SelectionSnapshot) => SelectionSnapshot) =>
      setH((prev) => {
        const stack = [...prev.stack];
        stack[prev.index] = next(stack[prev.index] ?? EMPTY);
        return { stack, index: prev.index };
      }),
    [],
  );
  const reset = useCallback(() => setH({ stack: [EMPTY], index: 0 }), []);
  const undo = useCallback(() => setH((p) => ({ ...p, index: Math.max(0, p.index - 1) })), []);
  const redo = useCallback(
    () => setH((p) => ({ ...p, index: Math.min(p.stack.length - 1, p.index + 1) })),
    [],
  );
  return { current, commit, setCurrent, reset, undo, redo, index: h.index, length: h.stack.length };
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
      h.setCurrent((cur) => ({
        ...cur,
        path: typeof update === 'function' ? update(cur.path) : update,
      })),
    [h.setCurrent],
  );
  const pushHistory = useCallback(
    (path: BezierPath) => commit((cur) => ({ ...cur, path })),
    [commit],
  );
  const addStroke = useCallback(
    (stroke: BrushStroke) => commit((cur) => ({ ...cur, strokes: [...cur.strokes, stroke] })),
    [commit],
  );
  const setAiMask = useCallback(
    (aiMask: ImageBitmap | null) =>
      commit(() => ({ path: { points: [], isClosed: false }, strokes: [], aiMask })),
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
