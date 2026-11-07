import styles from './advancedPenSelection.module.css';
import type { UseAdvancedPenSelectionReturn } from './useAdvancedPenSelection.ts';

export interface AdvancedPenHeaderProps {
  penSelection: UseAdvancedPenSelectionReturn;
}

export function AdvancedPenHeader({ penSelection }: AdvancedPenHeaderProps) {
  const { undo, redo, clearAll, canUndo, canRedo } = penSelection;
  return (
    <div class={styles.studioHeader}>
      <div class={styles.headerInfo}>
        <div class={styles.titleWithIcon}>
          <div class={styles.headerBrandBadge}>✒️</div>
          <div>
            <h2 class={styles.studioTitle}>Background Remover – Advanced Selection</h2>
            <p class={styles.studioSubtitle}>
              For advanced users: Auto Select with AI, refine with the pen and brushes, adjust the
              feather, then export with a transparent background.
            </p>
          </div>
        </div>
      </div>

      <div class={styles.headerActionToolbar}>
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
