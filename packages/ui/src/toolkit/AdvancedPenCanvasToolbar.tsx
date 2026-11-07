import styles from './advancedPenSelection.module.css';
import type { BezierPath } from './bezierPathModel.ts';
import type { ActiveTool } from './useAdvancedPenSelection.ts';

export function CanvasTopToolbar({
  zoom,
  setZoom,
  setPan,
  activeTool,
  setActiveTool,
}: {
  zoom: number;
  setZoom: (fn: (z: number) => number) => void;
  setPan: (p: { x: number; y: number }) => void;
  activeTool: ActiveTool;
  setActiveTool: (t: ActiveTool) => void;
}) {
  const panActive = activeTool === 'pan';
  return (
    <div class={styles.canvasHeader}>
      <div class={styles.canvasTitleGroup}>
        <span class={styles.stepBadge}>3</span>
        <span class={styles.canvasTitle}>Edit Selection (Zoom & Pan)</span>
      </div>

      <div class={styles.zoomToolbar}>
        <button
          type="button"
          class={styles.toolIconBtn}
          title="Zoom out"
          aria-label="Zoom out"
          onClick={() => setZoom((prev) => Math.max(25, prev - 25))}
        >
          −
        </button>
        <span class={styles.zoomPercentBadge}>{zoom}%</span>
        <button
          type="button"
          class={styles.toolIconBtn}
          title="Zoom in"
          aria-label="Zoom in"
          onClick={() => setZoom((prev) => Math.min(800, prev + 25))}
        >
          +
        </button>
        <button
          type="button"
          class={styles.toolIconBtn}
          data-active={String(panActive)}
          aria-pressed={panActive}
          title="Hand tool (H): drag to move the photo. Tip: hold Space with any tool."
          aria-label="Hand tool"
          onClick={() => setActiveTool(panActive ? 'pen' : 'pan')}
        >
          ✋
        </button>
        <button
          type="button"
          class={styles.toolIconBtn}
          title="Fit to screen"
          aria-label="Fit to screen"
          onClick={() => {
            setZoom(() => 100);
            setPan({ x: 0, y: 0 });
          }}
        >
          ⛶
        </button>
      </div>
    </div>
  );
}

function penHint(path: BezierPath): string {
  if (path.isClosed) {
    return 'Path closed. Drag points or their handles to adjust; double-click a point to switch curve ⇄ corner.';
  }
  if (path.points.length === 0) {
    return 'Pen: click to place points around the area. Click and drag to make a curve.';
  }
  if (path.points.length < 3) return 'Keep clicking around the area (at least 3 points).';
  return 'Finish the shape: click the green first point, press C, or use Close Path.';
}

const TOOL_HINTS: Partial<Record<ActiveTool, string>> = {
  pan: 'Hand tool: drag the photo to move it. Press P to go back to the pen.',
  add: 'Add Point: click on the path to add a point there.',
  delete: 'Delete Point: click a point to remove it (or select it and press Delete).',
  brushAdd: 'Brush Add: paint over parts of the subject to keep them.',
  brushRemove: 'Brush Remove: paint over leftover background to erase it.',
  brushGlass: 'Glass Brush: paint over glass parts to make them see-through. Hold Alt to unmark.',
};

export function StageHint({ activeTool, path }: { activeTool: ActiveTool; path: BezierPath }) {
  const text = activeTool === 'pen' ? penHint(path) : (TOOL_HINTS[activeTool] ?? '');
  return (
    <p class={styles.stageHint} role="status">
      {text}
    </p>
  );
}
