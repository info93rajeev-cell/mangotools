import { useCallback, useRef, useState } from 'preact/hooks';
import type { UseAdvancedPenSelectionReturn } from './useAdvancedPenSelection.ts';

export type StagePoint = { x: number; y: number };

/** Brush Add / Brush Remove: collects one stroke per press, in image pixels. */
export function usePenBrushStroke(
  penSelection: UseAdvancedPenSelectionReturn,
  toImage: (e: PointerEvent) => StagePoint | null,
  k: number,
) {
  const { activeTool, brushRadius, addStroke } = penSelection;
  // The stroke lives in a ref so fast taps (down + up before a re-render) are never lost;
  // `live` only drives the on-screen preview.
  const pointsRef = useRef<StagePoint[] | null>(null);
  const [live, setLive] = useState<StagePoint[] | null>(null);
  const brushing = activeTool === 'brushAdd' || activeTool === 'brushRemove';
  const radius = Math.max(1, brushRadius * k);

  const start = useCallback(
    (e: PointerEvent) => {
      const c = toImage(e);
      if (!c) return false;
      pointsRef.current = [c];
      setLive([c]);
      return true;
    },
    [toImage],
  );
  const move = useCallback(
    (e: PointerEvent) => {
      const pts = pointsRef.current;
      const c = pts ? toImage(e) : null;
      if (!pts || !c) return false;
      pts.push(c);
      setLive([...pts]);
      return true;
    },
    [toImage],
  );
  const end = useCallback(() => {
    const pts = pointsRef.current;
    if (!pts) return;
    pointsRef.current = null;
    addStroke({ mode: activeTool === 'brushAdd' ? 'add' : 'remove', radius, points: pts });
    setLive(null);
  }, [activeTool, addStroke, radius]);

  return { brushing, live, liveRadius: radius, start, move, end };
}
