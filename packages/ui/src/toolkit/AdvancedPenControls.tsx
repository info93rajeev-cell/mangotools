import { useRef } from 'preact/hooks';
import styles from './advancedPenSelection.module.css';
import type { ActiveTool, UseAdvancedPenSelectionReturn } from './useAdvancedPenSelection.ts';

function Step1ImageCard({
  loadFile,
  runAutoSelect,
  isProcessing,
}: {
  loadFile: (f: File) => Promise<void>;
  runAutoSelect: () => void;
  isProcessing: boolean;
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
        Upload an image and click <strong>Auto Select</strong> to detect the main object.
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
          onClick={runAutoSelect}
          disabled={isProcessing}
        >
          <span class={styles.btnIcon}>🪄</span>
          <span>{isProcessing ? 'Detecting...' : 'Auto Select'}</span>
        </button>
      </div>

      <div class={styles.selectWrapper}>
        <label class={styles.inputLabel} for="object-select">
          Detected Target:
        </label>
        <select id="object-select" class={styles.toolSelect}>
          <option value="main">Main Subject (Bird / Foreground)</option>
          <option value="entire">Entire Foreground Object</option>
          <option value="custom">Custom Pen Path</option>
        </select>
      </div>
    </div>
  );
}

function Step2ToolsCard({
  activeTool,
  setActiveTool,
  smoothCurrentPath,
  simplifyCurrentPath,
  resetCurrentPath,
}: {
  activeTool: ActiveTool;
  setActiveTool: (tool: ActiveTool) => void;
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
        Refine the path with Bezier pen tool, add or remove points, and adjust curves.
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
    isProcessing,
  } = penSelection;

  return (
    <div class={styles.leftControlsColumn}>
      <Step1ImageCard
        loadFile={loadFile}
        runAutoSelect={runAutoSelect}
        isProcessing={isProcessing}
      />
      <Step2ToolsCard
        activeTool={activeTool}
        setActiveTool={setActiveTool}
        smoothCurrentPath={smoothCurrentPath}
        simplifyCurrentPath={simplifyCurrentPath}
        resetCurrentPath={resetCurrentPath}
      />
    </div>
  );
}
