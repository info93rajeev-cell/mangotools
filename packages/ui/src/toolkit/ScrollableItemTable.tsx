import type { ComponentChildren } from 'preact';
import styles from './itemRows.module.css';

export interface ScrollableItemTableProps {
  caption: string;
  children: ComponentChildren;
}

/**
 * An item-result `<table>` wrapped for axe's scrollable-region-focusable rule: a `<section>` with
 * `tabIndex` so a table that overflows horizontally on narrow viewports stays keyboard-reachable —
 * the fix found while building the Export Commercial Invoice Generator's item table (TASK-009G),
 * shared here for the Export Packing List Generator's item table (TASK-009I). Each tool supplies its
 * own `<thead>`/`<tbody>` columns as children; this only owns the accessible scrolling shell.
 */
export function ScrollableItemTable({ caption, children }: ScrollableItemTableProps) {
  return (
    // biome-ignore lint/a11y/noNoninteractiveTabindex: tabIndex here is axe's own fix for scrollable-region-focusable, since this table only scrolls (and needs keyboard focus) on narrow viewports.
    <section class={styles.tableWrap} tabIndex={0} aria-label={caption}>
      <table class={styles.table}>
        <caption>{caption}</caption>
        {children}
      </table>
    </section>
  );
}
