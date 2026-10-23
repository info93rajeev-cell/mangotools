import type { RefObject } from 'preact';
import { useRef, useState } from 'preact/hooks';

export interface RowDrag {
  from: number;
  over: number;
}

/** Insertion position from the pointer, converted to the destination index of the moved row. */
function destination(list: HTMLElement | null, from: number, y: number): number {
  const rows = [...(list?.querySelectorAll<HTMLElement>('[data-package-row]') ?? [])];
  const before = rows.findIndex((row) => {
    const box = row.getBoundingClientRect();
    return y < box.top + box.height / 2;
  });
  const insert = before === -1 ? rows.length : before;
  return Math.max(0, Math.min(rows.length - 1, insert > from ? insert - 1 : insert));
}

/**
 * Row handle behaviour: a click (or Space/Enter) selects the row; dragging it, or Alt + arrow keys,
 * reorders the rows. Returns per-row handlers and the drag in progress for styling.
 */
export function useRowDrag(
  list: RefObject<HTMLElement>,
  count: number,
  onMove: (from: number, to: number) => void,
  onToggle: (index: number) => void,
) {
  const [drag, setDrag] = useState<RowDrag | null>(null);
  const start = useRef<{ index: number; y: number } | null>(null);
  const dragged = useRef(false);
  const handlers = (index: number) => ({
    onPointerDown: (event: PointerEvent) => {
      if (event.button !== 0) return;
      start.current = { index, y: event.clientY };
      dragged.current = false;
      (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
    },
    onPointerMove: (event: PointerEvent) => {
      const origin = start.current;
      if (!origin || (!dragged.current && Math.abs(event.clientY - origin.y) < 5)) return;
      dragged.current = true;
      setDrag({ from: origin.index, over: destination(list.current, origin.index, event.clientY) });
    },
    onPointerUp: (event: PointerEvent) => {
      const origin = start.current;
      start.current = null;
      setDrag(null);
      if (origin && dragged.current)
        onMove(origin.index, destination(list.current, origin.index, event.clientY));
    },
    onPointerCancel: () => {
      start.current = null;
      setDrag(null);
    },
    onClick: () => {
      if (dragged.current) dragged.current = false;
      else onToggle(index);
    },
    onKeyDown: (event: KeyboardEvent) => {
      const step = { ArrowUp: -1, ArrowDown: 1 }[event.key];
      if (!event.altKey || !step) return;
      event.preventDefault();
      const to = index + step;
      if (to >= 0 && to < count) onMove(index, to);
    },
  });
  return { drag, handlers };
}
export type RowHandle = ReturnType<ReturnType<typeof useRowDrag>['handlers']>;
