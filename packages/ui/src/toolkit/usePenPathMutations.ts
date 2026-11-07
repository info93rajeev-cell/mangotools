import { useCallback } from 'preact/hooks';
import {
  deletePointById,
  insertPointAt,
  moveHandleCoords,
  movePointCoords,
} from './bezierPathModel.ts';
import {
  appendOpenPoint,
  canClosePath,
  closePath,
  pullHandles,
  toggleCurvePoint,
} from './penPathEditing.ts';
import type { usePenSelectionHistory } from './usePenSelectionHistory.ts';

type PathState = ReturnType<typeof usePenSelectionHistory>;

/** Live drags (no undo step of their own; beginEdit saves one before the drag). */
function useDragEdits(pathState: PathState) {
  const { path, setPath, pushHistory } = pathState;

  /** Saves the current state as an undo step before a live drag starts. */
  const beginEdit = useCallback(() => pushHistory(path), [path, pushHistory]);
  const onMovePoint = useCallback(
    (idx: number, nx: number, ny: number) => setPath((prev) => movePointCoords(prev, idx, nx, ny)),
    [setPath],
  );
  const onMoveHandle = useCallback(
    (idx: number, handle: 'cp1' | 'cp2', nx: number, ny: number) =>
      setPath((prev) => moveHandleCoords(prev, idx, handle, nx, ny)),
    [setPath],
  );
  const onPullHandles = useCallback(
    (idx: number, x: number, y: number) => setPath((prev) => pullHandles(prev, idx, x, y)),
    [setPath],
  );
  return { beginEdit, onMovePoint, onMoveHandle, onPullHandles };
}

/** Edits that change the path's shape; each is one undo step. */
function useShapeEdits(pathState: PathState, notify: (msg: string) => void) {
  const { path, pushHistory, setSelectedPointIndex } = pathState;
  const onInsertPoint = useCallback(
    (segIdx: number, t: number) => pushHistory(insertPointAt(path, segIdx, t)),
    [path, pushHistory],
  );
  /** Pen tool: adds a point to the open path; returns its index, or null for a closed path. */
  const onAppendPoint = useCallback(
    (x: number, y: number): number | null => {
      if (path.isClosed) {
        notify('Path is closed. Use Add Point to add points on it, or Reset Path to start again.');
        return null;
      }
      pushHistory(appendOpenPoint(path, x, y));
      setSelectedPointIndex(path.points.length);
      return path.points.length;
    },
    [path, pushHistory, setSelectedPointIndex, notify],
  );
  const onClosePath = useCallback(() => {
    if (!canClosePath(path)) {
      notify('Place at least 3 points before closing the path.');
      return;
    }
    pushHistory(closePath(path));
    setSelectedPointIndex(null);
    notify('Path closed: the area inside is now selected.');
  }, [path, pushHistory, setSelectedPointIndex, notify]);
  const onToggleCurve = useCallback(
    (idx: number) => pushHistory(toggleCurvePoint(path, idx)),
    [path, pushHistory],
  );
  return { onInsertPoint, onAppendPoint, onClosePath, onToggleCurve };
}

export function usePenPathMutations(pathState: PathState, notify: (msg: string) => void) {
  const { path, pushHistory, setSelectedPointIndex } = pathState;
  const onDeletePoint = useCallback(
    (idx: number) => {
      const target = path.points[idx];
      if (target) pushHistory(deletePointById(path, target.id));
      setSelectedPointIndex(null);
    },
    [path, pushHistory, setSelectedPointIndex],
  );
  const resetCurrentPath = useCallback(() => {
    pushHistory({ points: [], isClosed: false });
    setSelectedPointIndex(null);
    notify('Pen path removed');
  }, [pushHistory, setSelectedPointIndex, notify]);
  const clearAll = useCallback(() => {
    pathState.setAiMask(null);
    notify('Selection cleared');
  }, [pathState.setAiMask, notify]);

  return {
    ...useDragEdits(pathState),
    ...useShapeEdits(pathState, notify),
    onDeletePoint,
    resetCurrentPath,
    clearAll,
  };
}
