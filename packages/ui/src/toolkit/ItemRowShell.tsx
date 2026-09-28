import type { ComponentChildren } from 'preact';
import { Button } from '../primitives/Button.tsx';
import styles from './itemRows.module.css';

export interface ItemRowShellProps {
  index: number;
  itemLabel: string;
  /** Omit (null) to hide the remove action — used for the last remaining row. */
  removeLabel: string | null;
  onRemove: () => void;
  children: ComponentChildren;
}

/**
 * One repeatable row's accessible fieldset: a numbered legend, an optional remove action, and the
 * row's own field controls as children. Shared by the Export Commercial Invoice Generator's
 * (TASK-009G) and Export Packing List Generator's (TASK-009I) item rows — each tool supplies its own
 * field list; this only owns the structural/accessibility shell.
 */
export function ItemRowShell({
  index,
  itemLabel,
  removeLabel,
  onRemove,
  children,
}: ItemRowShellProps) {
  return (
    <fieldset class={styles.itemRow} data-item-row={index}>
      <legend class={styles.itemRowHead}>
        <span>{itemLabel}</span>
        {removeLabel ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            icon="trash-2"
            onClick={onRemove}
            aria-label={removeLabel}
          >
            {removeLabel}
          </Button>
        ) : null}
      </legend>
      <div class={styles.itemRowFields}>{children}</div>
    </fieldset>
  );
}
