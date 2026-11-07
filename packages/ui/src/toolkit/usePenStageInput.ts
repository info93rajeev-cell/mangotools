/**
 * Pointer and keyboard input for the pen studio stage: hand tool (or hold Space, or the middle
 * button) to pan, drag anchors and handles, place pen points (drag while placing to curve),
 * click the first point or press C / Enter to close the path.
 */
import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import { findClosestSegment } from './bezierPathModel.ts';
import { canClosePath, isOnFirstPoint } from './penPathEditing.ts';
import type { UseAdvancedPenSelectionReturn } from './useAdvancedPenSelection.ts';
import { type StagePoint, usePenBrushStroke } from './usePenBrushStroke.ts';

type Gesture =
  | { kind: 'pan'; sx: number; sy: number; px: number; py: number }
  | { kind: 'anchor'; idx: number; started: boolean }
  | { kind: 'handle'; idx: number; type: 'cp1' | 'cp2'; started: boolean }
  | { kind: 'place'; idx: number; sx: number; sy: number }
  | { kind: 'brush' };

type Refs = {
  svgRef: { current: SVGSVGElement | null };
  stageRef: { current: HTMLDivElement | null };
};

function isTyping(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  return el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName);
}

/** Image pixels per screen pixel for the overlay, kept current on resize and zoom. */
export function useStageScale(
  svgRef: { current: SVGSVGElement | null },
  imageWidth: number,
  deps: unknown[],
) {
  const [k, setK] = useState(1);
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const measure = () => {
      const w = svg.getBoundingClientRect().width;
      if (w > 0 && imageWidth > 0) setK(imageWidth / w);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(svg);
    return () => ro.disconnect();
  }, [svgRef, imageWidth, ...deps]);
  return k;
}

function keyAction(
  key: string,
  pen: UseAdvancedPenSelectionReturn,
  hovering: boolean,
  selected: number | null,
): (() => void) | null {
  const closable = canClosePath(pen.path);
  if ((key === 'c' || key === 'C') && closable) return pen.onClosePath;
  if (key === 'Enter' && hovering && closable) return pen.onClosePath;
  if (key === 'Escape') return () => pen.setSelectedPointIndex(null);
  if ((key === 'Delete' || key === 'Backspace') && selected !== null) {
    return () => pen.onDeletePoint(selected);
  }
  if (key === 'h' || key === 'H') return () => pen.setActiveTool('pan');
  if (key === 'p' || key === 'P') return () => pen.setActiveTool('pen');
  if (key === 'g' || key === 'G') return () => pen.setActiveTool('brushGlass');
  return null;
}

function useStageKeys(pen: UseAdvancedPenSelectionReturn, hover: { current: boolean }) {
  const [spaceHeld, setSpaceHeld] = useState(false);
  const { imageSrc, selectedPointIndex } = pen;
  useEffect(() => {
    if (!imageSrc) return;
    const down = (e: KeyboardEvent) => {
      if (isTyping(e.target)) return;
      if (e.key === ' ' && hover.current) {
        e.preventDefault();
        setSpaceHeld(true);
        return;
      }
      const action = keyAction(e.key, pen, hover.current, selectedPointIndex);
      if (!action) return;
      e.preventDefault();
      action();
    };
    const up = (e: KeyboardEvent) => {
      if (e.key === ' ') setSpaceHeld(false);
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, [imageSrc, selectedPointIndex, pen, hover]);
  return spaceHeld;
}

function insertOnPath(pen: UseAdvancedPenSelectionReturn, c: StagePoint, k: number) {
  const hit = findClosestSegment(pen.path, c.x, c.y);
  if (hit && hit.distance < 14 * k) pen.onInsertPoint(hit.segmentIndex, hit.t);
}

function capture(refs: Refs, e: PointerEvent) {
  refs.stageRef.current?.setPointerCapture?.(e.pointerId);
}

// biome-ignore lint/complexity/noExcessiveLinesPerFunction: one gesture state machine
export function usePenStageInput(pen: UseAdvancedPenSelectionReturn, refs: Refs, k: number) {
  const gesture = useRef<Gesture | null>(null);
  const hover = useRef(false);
  const lastAnchorDown = useRef<{ idx: number; t: number } | null>(null);
  const [panning, setPanning] = useState(false);
  const spaceHeld = useStageKeys(pen, hover);

  const toImage = useCallback(
    (e: PointerEvent): StagePoint | null => {
      const svg = refs.svgRef.current;
      if (!svg || !pen.imageDims.width) return null;
      const r = svg.getBoundingClientRect();
      return {
        x: (e.clientX - r.left) * (pen.imageDims.width / r.width),
        y: (e.clientY - r.top) * (pen.imageDims.height / r.height),
      };
    },
    [refs.svgRef, pen.imageDims],
  );
  const brush = usePenBrushStroke(pen, toImage, k);

  const startPen = useCallback(
    (c: StagePoint, e: PointerEvent) => {
      if (canClosePath(pen.path) && isOnFirstPoint(pen.path, c.x, c.y, 9 * k)) {
        pen.onClosePath();
        return;
      }
      const idx = pen.onAppendPoint(c.x, c.y);
      if (idx !== null) gesture.current = { kind: 'place', idx, sx: e.clientX, sy: e.clientY };
    },
    [pen, k],
  );

  const startTool = useCallback(
    (e: PointerEvent) => {
      const c = toImage(e);
      if (!c) return;
      if (brush.brushing) {
        if (brush.start(e)) gesture.current = { kind: 'brush' };
      } else if (pen.activeTool === 'pen') {
        startPen(c, e);
      } else if (pen.activeTool === 'add') {
        insertOnPath(pen, c, k);
      } else {
        pen.setSelectedPointIndex(null);
      }
    },
    [toImage, brush, pen, startPen, k],
  );

  const onPointerDown = useCallback(
    (e: PointerEvent) => {
      if (!pen.imageSrc) return;
      const wantsPan = e.button === 1 || pen.activeTool === 'pan' || spaceHeld;
      if (wantsPan) {
        e.preventDefault();
        gesture.current = {
          kind: 'pan',
          sx: e.clientX,
          sy: e.clientY,
          px: pen.pan.x,
          py: pen.pan.y,
        };
        setPanning(true);
        capture(refs, e);
        return;
      }
      if (e.button !== 0) return;
      e.preventDefault();
      capture(refs, e);
      startTool(e);
    },
    [pen, spaceHeld, refs, startTool],
  );

  const dragPathPart = useCallback(
    (g: Extract<Gesture, { kind: 'anchor' | 'handle' }>, c: StagePoint) => {
      if (!g.started) {
        pen.beginEdit();
        g.started = true;
      }
      if (g.kind === 'anchor') pen.onMovePoint(g.idx, c.x, c.y);
      else pen.onMoveHandle(g.idx, g.type, c.x, c.y);
    },
    [pen],
  );

  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      const g = gesture.current;
      if (!g) return;
      if (g.kind === 'pan') {
        pen.setPan({ x: g.px + e.clientX - g.sx, y: g.py + e.clientY - g.sy });
        return;
      }
      if (g.kind === 'brush') {
        brush.move(e);
        return;
      }
      const c = toImage(e);
      if (!c) return;
      if (g.kind === 'place') {
        if (Math.hypot(e.clientX - g.sx, e.clientY - g.sy) > 4) pen.onPullHandles(g.idx, c.x, c.y);
        return;
      }
      dragPathPart(g, c);
    },
    [pen, brush, toImage, dragPathPart],
  );

  const onPointerUp = useCallback(() => {
    if (gesture.current?.kind === 'brush') brush.end();
    gesture.current = null;
    setPanning(false);
  }, [brush]);

  const onAnchorPointerDown = useCallback(
    (idx: number, e: PointerEvent) => {
      if (e.button !== 0 || spaceHeld || pen.activeTool === 'pan') return;
      e.stopPropagation();
      e.preventDefault();
      if (pen.activeTool === 'delete') {
        pen.onDeletePoint(idx);
        return;
      }
      if (pen.activeTool === 'pen' && idx === 0 && canClosePath(pen.path)) {
        pen.onClosePath();
        return;
      }
      const now = e.timeStamp;
      const last = lastAnchorDown.current;
      lastAnchorDown.current = { idx, t: now };
      if (last && last.idx === idx && now - last.t < 350) {
        pen.onToggleCurve(idx);
        return;
      }
      pen.setSelectedPointIndex(idx);
      gesture.current = { kind: 'anchor', idx, started: false };
      capture(refs, e);
    },
    [pen, spaceHeld, refs],
  );

  const onHandlePointerDown = useCallback(
    (idx: number, type: 'cp1' | 'cp2', e: PointerEvent) => {
      if (e.button !== 0 || spaceHeld || pen.activeTool === 'pan') return;
      e.stopPropagation();
      e.preventDefault();
      gesture.current = { kind: 'handle', idx, type, started: false };
      capture(refs, e);
    },
    [pen, spaceHeld, refs],
  );

  return {
    brush,
    panning,
    panMode: pen.activeTool === 'pan' || spaceHeld,
    stageHandlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: onPointerUp,
      onPointerEnter: () => {
        hover.current = true;
      },
      onPointerLeave: () => {
        hover.current = false;
      },
    },
    onAnchorPointerDown,
    onHandlePointerDown,
  };
}
