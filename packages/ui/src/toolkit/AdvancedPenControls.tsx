import { useRef } from 'preact/hooks';
import styles from './advancedPenSelection.module.css';
import type { ActiveTool, UseAdvancedPenSelectionReturn } from './useAdvancedPenSelection.ts';
import type { AutoSelectStatus } from './usePenAutoSelect.ts';

function Step1ImageCard({
  loadFile,
  runAutoSelect,
  status,
}: {
  loadFile: (f: File) => Promise<void>;
  runAutoSelect: () => Promise<void>;
  status: AutoSelectStatus;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: Event) => {
    const input = e.target as HTMLInputElement;
    if (input.files?.[0]) {
      void loadFile(input.files[0]);
    }
  };

  return (
    <div class={styles.controlCard}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/bmp"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      <div class={styles.cardHeader}>
        <div class={styles.stepTitleRow}>
          <span class={styles.stepBadge}>1</span>
          <span class={styles.cardTitle}>Image & Selection</span>
        </div>
      </div>

      <p class={styles.stepDescription}>
        Upload an image and click <strong>Auto Select</strong>. The on-device AI selects the
        subject; then fix any spot with the brushes.
      </p>

      <div class={styles.actionButtonGroup}>
        <button
          type="button"
          class={styles.primaryUploadBtn}
          onClick={() => fileInputRef.current?.click()}
        >
          <span class={styles.btnIcon}>📤</span>
          <span>Upload Image</span>
        </button>

        <button
          type="button"
          class={styles.autoSelectBtn}
          onClick={() => void runAutoSelect()}
          disabled={status.busy}
          aria-busy={status.busy}
        >
          <span class={styles.btnIcon}>🪄</span>
          <span>{status.busy ? 'Selecting…' : 'Auto Select (AI)'}</span>
        </button>
      </div>

      {status.busy ? (
        <p class={styles.stepDescription} role="status">
          {status.message} {Math.round(status.progress * 100)}%
        </p>
      ) : null}
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

function Step2ToolsCard({
  activeTool,
  setActiveTool,
  brushRadius,
  setBrushRadius,
  smoothCurrentPath,
  simplifyCurrentPath,
  resetCurrentPath,
}: {
  activeTool: ActiveTool;
  setActiveTool: (tool: ActiveTool) => void;
  brushRadius: number;
  setBrushRadius: (r: number) => void;
  smoothCurrentPath: () => void;
  simplifyCurrentPath: () => void;
  resetCurrentPath: () => void;
}) {
  return (
    <div class={styles.controlCard}>
      <div class={styles.cardHeader}>
        <div class={styles.stepTitleRow}>
          <span class={styles.stepBadgeGreen}>2</span>
          <span class={styles.cardTitle}>Selection Tools</span>
        </div>
      </div>

      <p class={styles.stepDescription}>
        <strong>Brush Add</strong> paints the subject back in, <strong>Brush Remove</strong> erases
        leftover background. <strong>Pen</strong>: click corners to add a hard-edged area.
      </p>

      <div class={styles.toolGrid}>
        <button
          type="button"
          class={`${styles.gridToolBtn} ${activeTool === 'pen' ? styles.toolActive : ''}`}
          onClick={() => setActiveTool('pen')}
          title="Pen Tool (Select & Move Anchors/Handles)"
        >
          <span class={styles.gridToolIcon}>✒️</span>
          <span class={styles.gridToolText}>Pen Tool</span>
        </button>

        <button
          type="button"
          class={`${styles.gridToolBtn} ${activeTool === 'add' ? styles.toolActive : ''}`}
          onClick={() => setActiveTool('add')}
          title="Add Point (Click along curve)"
        >
          <span class={styles.gridToolIcon}>➕</span>
          <span class={styles.gridToolText}>Add Point</span>
        </button>

        <button
          type="button"
          class={`${styles.gridToolBtn} ${activeTool === 'delete' ? styles.toolActive : ''}`}
          onClick={() => setActiveTool('delete')}
          title="Delete Point (Click node to remove)"
        >
          <span class={styles.gridToolIcon}>🗑️</span>
          <span class={styles.gridToolText}>Delete Point</span>
        </button>

        <button
          type="button"
          class={`${styles.gridToolBtn} ${styles.brushAddBtn} ${
            activeTool === 'brushAdd' ? styles.toolActive : ''
          }`}
          onClick={() => setActiveTool('brushAdd')}
          title="Brush Add (Expand selection area)"
        >
          <span class={styles.gridToolIcon}>🖌️</span>
          <span class={styles.gridToolText}>Brush Add</span>
        </button>

        <button
          type="button"
          class={`${styles.gridToolBtn} ${styles.brushRemoveBtn} ${
            activeTool === 'brushRemove' ? styles.toolActive : ''
          }`}
          onClick={() => setActiveTool('brushRemove')}
          title="Brush Remove (Subtract from selection)"
        >
          <span class={styles.gridToolIcon}>🧹</span>
          <span class={styles.gridToolText}>Brush Remove</span>
        </button>
      </div>

      <BrushSize value={brushRadius} onChange={setBrushRadius} />

      <div class={styles.pathActionRow}>
        <button
          type="button"
          class={styles.pathPillBtn}
          onClick={smoothCurrentPath}
          title="Smooth out all Bezier control handles"
        >
          ≈ Smooth Path
        </button>
        <button
          type="button"
          class={styles.pathPillBtn}
          onClick={simplifyCurrentPath}
          title="Reduce excessive anchor points"
        >
          ◰ Simplify Path
        </button>
        <button
          type="button"
          class={styles.pathPillBtn}
          onClick={resetCurrentPath}
          title="Reset path to initial contour"
        >
          ↺ Reset Path
        </button>
      </div>
    </div>
  );
}

export interface AdvancedPenControlsProps {
  penSelection: UseAdvancedPenSelectionReturn;
}

export function AdvancedPenControls({ penSelection }: AdvancedPenControlsProps) {
  const {
    activeTool,
    setActiveTool,
    runAutoSelect,
    smoothCurrentPath,
    simplifyCurrentPath,
    resetCurrentPath,
    loadFile,
    autoSelectStatus,
    brushRadius,
    setBrushRadius,
  } = penSelection;

  return (
    <div class={styles.leftControlsColumn}>
      <Step1ImageCard loadFile={loadFile} runAutoSelect={runAutoSelect} status={autoSelectStatus} />
      <Step2ToolsCard
        activeTool={activeTool}
        setActiveTool={setActiveTool}
        brushRadius={brushRadius}
        setBrushRadius={setBrushRadius}
        smoothCurrentPath={smoothCurrentPath}
        simplifyCurrentPath={simplifyCurrentPath}
        resetCurrentPath={resetCurrentPath}
      />
    </div>
  );
}
