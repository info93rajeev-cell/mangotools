import styles from './advancedPenSelection.module.css';
import { BgImageSourceCard } from './BgImageSourceCard.tsx';
import { canClosePath } from './penPathEditing.ts';
import type { ActiveTool, UseAdvancedPenSelectionReturn } from './useAdvancedPenSelection.ts';

export const PEN_SAMPLE_URL = '/samples/kingfisher-sample.jpg';
const ACCEPT = 'image/png,image/jpeg,image/webp,image/bmp';

function Step1ImageCard({ pen }: { pen: UseAdvancedPenSelectionReturn }) {
  const status = pen.autoSelectStatus;
  return (
    <div class={styles.controlCard}>
      <div class={styles.cardHeader}>
        <div class={styles.stepTitleRow}>
          <span class={styles.stepBadge}>1</span>
          <span class={styles.cardTitle}>Image & Selection</span>
        </div>
      </div>

      <BgImageSourceCard
        idPrefix="pen"
        accept={ACCEPT}
        imageUrl={pen.imageSrc}
        fileName={pen.fileName}
        dims={pen.imageDims.width ? pen.imageDims : null}
        isSample={pen.fileName === 'kingfisher-sample.jpg'}
        sampleUrl={PEN_SAMPLE_URL}
        onSelectFile={(f) => void pen.loadFile(f)}
        onTrySample={() => void pen.loadSample()}
        disabled={status.busy}
      />

      <button
        type="button"
        class={styles.autoSelectBtn}
        onClick={() => void pen.runAutoSelect()}
        disabled={status.busy || !pen.image}
        aria-busy={status.busy}
      >
        <span class={styles.btnIcon}>🪄</span>
        <span>{status.busy ? 'Selecting…' : 'Auto Select (AI)'}</span>
      </button>

      <p class={styles.stepDescription} role={status.busy ? 'status' : undefined}>
        {status.busy
          ? `${status.message} ${Math.round(status.progress * 100)}%`
          : 'Auto Select: the on-device AI selects the subject. Then fix any spot with the tools below.'}
      </p>
    </div>
  );
}

const TOOLS: { id: ActiveTool; icon: string; label: string; title: string; extra?: string }[] = [
  {
    id: 'pen',
    icon: '✒️',
    label: 'Pen Tool',
    title: 'Pen (P): click to place points, drag to curve',
  },
  { id: 'add', icon: '➕', label: 'Add Point', title: 'Add Point: click on the path' },
  { id: 'delete', icon: '🗑️', label: 'Delete Point', title: 'Delete Point: click a point' },
  {
    id: 'brushAdd',
    icon: '🖌️',
    label: 'Brush Add',
    title: 'Brush Add: paint to keep',
    extra: 'brushAddBtn',
  },
  {
    id: 'brushRemove',
    icon: '🧹',
    label: 'Brush Remove',
    title: 'Brush Remove: paint to erase',
    extra: 'brushRemoveBtn',
  },
  {
    id: 'brushGlass',
    icon: '💎',
    label: 'Glass Brush',
    title: 'Glass Brush (G): paint over glass parts to make them see-through. Hold Alt to unmark.',
  },
  { id: 'pan', icon: '✋', label: 'Hand (Move)', title: 'Hand (H): drag to move the photo' },
];

function ToolGrid({ pen }: { pen: UseAdvancedPenSelectionReturn }) {
  return (
    <div class={styles.toolGrid}>
      {TOOLS.map((t) => (
        <button
          key={t.id}
          type="button"
          class={`${styles.gridToolBtn} ${t.extra ? styles[t.extra] : ''} ${
            pen.activeTool === t.id ? styles.toolActive : ''
          }`}
          aria-pressed={pen.activeTool === t.id}
          onClick={() => pen.setActiveTool(t.id)}
          title={t.title}
        >
          <span class={styles.gridToolIcon}>{t.icon}</span>
          <span class={styles.gridToolText}>{t.label}</span>
        </button>
      ))}
    </div>
  );
}

function BrushSize({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div class={styles.selectWrapper}>
      <label class={styles.inputLabel} for="pen-brush-size">
        Brush size: {value} px
      </label>
      <input
        id="pen-brush-size"
        type="range"
        min={4}
        max={120}
        step={2}
        value={value}
        onInput={(e) => onChange(Number((e.target as HTMLInputElement).value))}
      />
    </div>
  );
}

function PathActions({ pen }: { pen: UseAdvancedPenSelectionReturn }) {
  const sel = pen.selectedPointIndex;
  const point = sel !== null ? pen.path.points[sel] : undefined;
  const curved =
    !!point && (point.cp1x !== point.x || point.cp2x !== point.x || point.cp1y !== point.y);
  return (
    <div class={styles.pathActionRow}>
      <button
        type="button"
        class={styles.pathPillBtn}
        onClick={pen.onClosePath}
        disabled={!canClosePath(pen.path)}
        title="Close the path (C). The area inside becomes part of the selection."
      >
        ◯ Close Path (C)
      </button>
      <button
        type="button"
        class={styles.pathPillBtn}
        onClick={() => sel !== null && pen.onToggleCurve(sel)}
        disabled={!point}
        title="Selected point: add direction handles (curve) or remove them (corner). Double-click a point does the same."
      >
        {curved ? '⌃ Make Corner' : '◠ Make Curve'}
      </button>
      <button
        type="button"
        class={styles.pathPillBtn}
        onClick={pen.smoothCurrentPath}
        disabled={pen.path.points.length < 3}
        title="Smooth every point of the path"
      >
        ≈ Smooth Path
      </button>
      <button
        type="button"
        class={styles.pathPillBtn}
        onClick={pen.simplifyCurrentPath}
        disabled={pen.path.points.length < 5}
        title="Remove points that are very close together"
      >
        ◰ Simplify
      </button>
      <button
        type="button"
        class={styles.pathPillBtn}
        onClick={pen.resetCurrentPath}
        disabled={pen.path.points.length === 0}
        title="Remove the pen path (AI selection and brush strokes stay)"
      >
        ↺ Remove Path
      </button>
    </div>
  );
}

function Step2ToolsCard({ pen }: { pen: UseAdvancedPenSelectionReturn }) {
  return (
    <div class={styles.controlCard}>
      <div class={styles.cardHeader}>
        <div class={styles.stepTitleRow}>
          <span class={styles.stepBadgeGreen}>2</span>
          <span class={styles.cardTitle}>Selection Tools</span>
        </div>
      </div>
      <p class={styles.stepDescription}>
        <strong>Pen</strong>: click around an area, drag to curve, then close the path (click the
        first point or press C). <strong>Brushes</strong> paint the subject in or out.
      </p>
      <ToolGrid pen={pen} />
      <BrushSize value={pen.brushRadius} onChange={pen.setBrushRadius} />
      <PathActions pen={pen} />
    </div>
  );
}

export interface AdvancedPenControlsProps {
  penSelection: UseAdvancedPenSelectionReturn;
}

export function AdvancedPenControls({ penSelection }: AdvancedPenControlsProps) {
  return (
    <div class={styles.leftControlsColumn}>
      <Step1ImageCard pen={penSelection} />
      <Step2ToolsCard pen={penSelection} />
    </div>
  );
}
