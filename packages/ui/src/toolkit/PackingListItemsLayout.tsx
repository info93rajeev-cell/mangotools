import type { ToolSnapshot, ToolStore } from '@mangotools/runtime';
import type { ResolvedPreset } from '@mangotools/schemas';
import { CalculatorFields } from '../archetypes/CalculatorFields.tsx';
import { t } from '../strings/en.ts';
import { OptionControls } from './OptionControls.tsx';
import { PackingListItemsForm } from './PackingListItemsForm.tsx';
import { PackingListItemsResult } from './PackingListItemsResult.tsx';
import {
  emptyPackingItemRow,
  type PackingItemRowField,
  type PackingItemRowValues,
  parsePackingItemRows,
  parsePackingRowError,
  serializePackingItemRows,
} from './packingItems.ts';
import { messageFor, reconcileOptions, visibleEntries } from './presentation.ts';
import styles from './toolkit.module.css';

/** Fallback only; the shipped preset always sets `ui.maxItems` explicitly. */
const DEFAULT_MAX_ITEMS = 5;

export interface PackingListItemsLayoutProps {
  idPrefix: string;
  preset: ResolvedPreset;
  snapshot: ToolSnapshot;
  store: ToolStore;
}

function useRowErrorMessage(preset: ResolvedPreset, snapshot: ToolSnapshot) {
  const rowError = parsePackingRowError(snapshot.error?.path);
  if (!rowError || !snapshot.error) return { rowError: null, rowErrorMessage: null };
  const message = t('itemRows.rowError', {
    number: rowError.index + 1,
    message: messageFor(preset, snapshot.error),
  });
  return { rowError, rowErrorMessage: message };
}

/**
 * Archetype B's usual two-panel layout (fields · result), but for exactly this one tool: the item
 * fields are replaced with repeatable rows (`PackingListItemsForm`) and the result gains an item table
 * (`PackingListItemsResult`). Every other field — including every shipment-level packing/weight field
 * — still goes through the ordinary `CalculatorFields`/`ToolStore` pipe unchanged; only the `items`
 * field is special-cased here (TASK-009I, following the pattern proven by TASK-009G's Invoice).
 */
export function PackingListItemsLayout({
  idPrefix,
  preset,
  snapshot,
  store,
}: PackingListItemsLayoutProps) {
  const { values, error } = snapshot;
  const maxItems = preset.ui.maxItems ?? DEFAULT_MAX_ITEMS;
  const rows = parsePackingItemRows(typeof values.items === 'string' ? values.items : '');
  const { rowError, rowErrorMessage } = useRowErrorMessage(preset, snapshot);

  const otherFields = visibleEntries(preset.fields, values).filter(([key]) => key !== 'items');
  const fieldError =
    error?.path && otherFields.some(([key]) => key === error.path) ? error.path : null;
  const errorFor = (key: string) =>
    error && key === fieldError ? messageFor(preset, error) : null;

  const updateRows = (next: PackingItemRowValues[]) =>
    store.set('items', serializePackingItemRows(next));
  const onChangeItem = (index: number, field: PackingItemRowField, value: string) => {
    updateRows(rows.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  };
  const onAdd = () => {
    if (rows.length < maxItems) updateRows([...rows, emptyPackingItemRow()]);
  };
  const onRemove = (index: number) => {
    if (rows.length <= 1) return;
    const confirmed = window.confirm(t('itemRows.removeConfirm', { number: index + 1 }));
    if (confirmed) updateRows(rows.filter((_, i) => i !== index));
  };

  return (
    <div class={styles.calculator}>
      <section class={styles.panel} aria-label={t('input.label')}>
        <OptionControls
          idPrefix={idPrefix}
          preset={preset}
          values={values}
          onChange={(key, next) =>
            store.setMany(reconcileOptions(preset, { ...values, [key]: next }))
          }
        />
        <CalculatorFields
          idPrefix={idPrefix}
          preset={preset}
          fields={otherFields}
          values={values}
          errorFor={errorFor}
          onValue={(key, next) => store.set(key, next)}
        />
        <PackingListItemsForm
          idPrefix={idPrefix}
          preset={preset}
          rows={rows}
          rowError={rowError}
          rowErrorMessage={rowErrorMessage}
          maxItems={maxItems}
          onChange={onChangeItem}
          onAdd={onAdd}
          onRemove={onRemove}
        />
      </section>
      <PackingListItemsResult
        idPrefix={idPrefix}
        preset={preset}
        snapshot={snapshot}
        shownInline={rowError !== null || fieldError !== null}
      />
    </div>
  );
}
