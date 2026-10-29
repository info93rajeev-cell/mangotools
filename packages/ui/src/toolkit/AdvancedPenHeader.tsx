import { useRef } from 'preact/hooks';
import styles from './advancedPenSelection.module.css';
import type { UseAdvancedPenSelectionReturn } from './useAdvancedPenSelection.ts';

export interface AdvancedPenHeaderProps {
  penSelection: UseAdvancedPenSelectionReturn;
}

export function AdvancedPenHeader({ penSelection }: AdvancedPenHeaderProps) {
  const { loadFile, loadSample, undo, redo, clearAll, canUndo, canRedo } = penSelection;
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: Event) => {
    const input = e.target as HTMLInputElement;
    if (input.files?.[0]) {
      void loadFile(input.files[0]);
    }
  };

  return (
    <div class={styles.studioHeader}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/bmp"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      <div class={styles.headerInfo}>
        <div class={styles.titleWithIcon}>
          <div class={styles.headerBrandBadge}>✒️</div>
          <div>
            <h2 class={styles.studioTitle}>Background Remover – Advanced Selection</h2>
            <p class={styles.studioSubtitle}>
              Automatically detect object, refine with editable pen tool, adjust feather and export
              with transparent background.
            </p>
          </div>
        </div>
      </div>

      <div class={styles.headerActionToolbar}>
        <button
          type="button"
          class={styles.headerBtn}
          onClick={() => fileInputRef.current?.click()}
          title="Open new image file"
        >
          📂 Open Image
        </button>

        <button
          type="button"
          class={styles.headerBtn}
          onClick={loadSample}
          title="Load reference sample image"
        >
          🖼️ Sample Image
        </button>

        <button
          type="button"
          class={styles.headerBtn}
          onClick={undo}
          disabled={!canUndo}
          title="Undo last action"
        >
          ↶ Undo
        </button>

        <button
          type="button"
          class={styles.headerBtn}
          onClick={redo}
          disabled={!canRedo}
          title="Redo action"
        >
          ↷ Redo
        </button>

        <button
          type="button"
          class={`${styles.headerBtn} ${styles.headerBtnDanger}`}
          onClick={clearAll}
          title="Clear current selection"
        >
          🗑️ Clear All
        </button>
      </div>
    </div>
  );
}
