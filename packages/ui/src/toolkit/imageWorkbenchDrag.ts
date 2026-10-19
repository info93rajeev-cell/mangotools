import { useRef } from 'preact/hooks';
import type {
  AspectRatioPreset,
  HandlePosition,
  ImageDimensions,
  PixelRect,
} from './imageWorkbenchGeometry.ts';
import { moveRect, resizeRect } from './imageWorkbenchGeometry.ts';

interface DragSession {
  pointerId: number;
  mode: 'move' | HandlePosition;
  startX: number;
  startY: number;
  startRect: PixelRect;
  scale: number;
}

export interface UseWorkbenchDragOptions {
  rect: PixelRect;
  scale: number;
  bounds: ImageDimensions;
  ratio: AspectRatioPreset;
  minSize: number;
  disabled?: boolean;
  onUpdate: (rect: PixelRect) => void;
}

export function useWorkbenchDrag({
  rect,
  scale,
  bounds,
  ratio,
  minSize,
  disabled,
  onUpdate,
}: UseWorkbenchDragOptions) {
  const sessionRef = useRef<DragSession | null>(null);

  const startDrag = (e: PointerEvent, mode: 'move' | HandlePosition) => {
    if (disabled || scale <= 0) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    sessionRef.current = {
      pointerId: e.pointerId,
      mode,
      startX: e.clientX,
      startY: e.clientY,
      startRect: rect,
      scale,
    };
    e.stopPropagation();
  };

  const onPointerMove = (e: PointerEvent) => {
    const session = sessionRef.current;
    if (!session || session.pointerId !== e.pointerId) return;
    const dx = (e.clientX - session.startX) / session.scale;
    const dy = (e.clientY - session.startY) / session.scale;

    const next =
      session.mode === 'move'
        ? moveRect(session.startRect, dx, dy, bounds)
        : resizeRect(session.startRect, session.mode, dx, dy, bounds, ratio, minSize);
    onUpdate(next);
  };

  const endDrag = (e: PointerEvent) => {
    const session = sessionRef.current;
    if (!session || session.pointerId !== e.pointerId) return;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignored if capture already lost
    }
    sessionRef.current = null;
  };

  return {
    onMoveStart: (e: PointerEvent) => startDrag(e, 'move'),
    onHandleStart: (e: PointerEvent, handle: HandlePosition) => startDrag(e, handle),
    onPointerMove,
    onPointerUp: endDrag,
    onPointerCancel: endDrag,
  };
}

export function handleMoveKey(
  e: KeyboardEvent,
  rect: PixelRect,
  bounds: ImageDimensions,
  onUpdate: (rect: PixelRect) => void,
) {
  const step = e.shiftKey ? 10 : 1;
  let dx = 0;
  let dy = 0;
  if (e.key === 'ArrowLeft') dx = -step;
  else if (e.key === 'ArrowRight') dx = step;
  else if (e.key === 'ArrowUp') dy = -step;
  else if (e.key === 'ArrowDown') dy = step;
  else return;

  e.preventDefault();
  onUpdate(moveRect(rect, dx, dy, bounds));
}

export function handleResizeKey(
  e: KeyboardEvent,
  handle: HandlePosition,
  rect: PixelRect,
  bounds: ImageDimensions,
  ratio: AspectRatioPreset,
  minSize: number,
  onUpdate: (rect: PixelRect) => void,
) {
  const step = e.shiftKey ? 10 : 1;
  let dx = 0;
  let dy = 0;
  if (e.key === 'ArrowLeft') dx = -step;
  else if (e.key === 'ArrowRight') dx = step;
  else if (e.key === 'ArrowUp') dy = -step;
  else if (e.key === 'ArrowDown') dy = step;
  else return;

  e.preventDefault();
  onUpdate(resizeRect(rect, handle, dx, dy, bounds, ratio, minSize));
}
