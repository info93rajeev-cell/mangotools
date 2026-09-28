import type { ToolSnapshot, ToolStore } from '@mangotools/runtime';
import type { ResolvedPreset } from '@mangotools/schemas';
import { CalculatorFields } from '../archetypes/CalculatorFields.tsx';
import { t } from '../strings/en.ts';
import { InvoiceItemsForm } from './InvoiceItemsForm.tsx';
import { InvoiceItemsResult } from './InvoiceItemsResult.tsx';
import {
  emptyItemRow,
  type ItemRowField,
  type ItemRowValues,
  parseItemRows,
  parseRowError,
  serializeItemRows,
} from './invoiceItems.ts';
import { OptionControls } from './OptionControls.tsx';
import { messageFor, reconcileOptions, visibleEntries } from './presentation.ts';
import styles from './toolkit.module.css';

/** Fallback only; the shipped preset always sets `ui.maxItems` explicitly. */
const DEFAULT_MAX_ITEMS = 5;

export interface InvoiceItemsLayoutProps {
  idPrefix: string;
  preset: ResolvedPreset;
  snapshot: ToolSnapshot;
  store: ToolStore;
}

function useRowErrorMessage(preset: ResolvedPreset, snapshot: ToolSnapshot) {
  const rowError = parseRowError(snapshot.error?.path);
  if (!rowError || !snapshot.error) return { rowError: null, rowErrorMessage: null };
  const message = t('invoiceItems.rowError', {
    number: rowError.index + 1,
    message: messageFor(preset, snapshot.error),
  });
  return { rowError, rowErrorMessage: message };
}

/**
 * Archetype B's usual two-panel layout (fields · result), but for exactly this one tool: the item
 * fields are replaced with repeatable rows (`InvoiceItemsForm`) and the result gains an item table
 * (`InvoiceItemsResult`). Every other field on the invoice still goes through the ordinary
 * `CalculatorFields`/`ToolStore` pipe unchanged — only the `items` field is special-cased here.
 */
export function InvoiceItemsLayout({ idPrefix, preset, snapshot, store }: InvoiceItemsLayoutProps) {
  const { values, error } = snapshot;
  const maxItems = preset.ui.maxItems ?? DEFAULT_MAX_ITEMS;
  const rows = parseItemRows(typeof values.items === 'string' ? values.items : '');
  const { rowError, rowErrorMessage } = useRowErrorMessage(preset, snapshot);

  const otherFields = visibleEntries(preset.fields, values).filter(([key]) => key !== 'items');
  const fieldError =
    error?.path && otherFields.some(([key]) => key === error.path) ? error.path : null;
  const errorFor = (key: string) =>
    error && key === fieldError ? messageFor(preset, error) : null;

  const updateRows = (next: ItemRowValues[]) => store.set('items', serializeItemRows(next));
  const onChangeItem = (index: number, field: ItemRowField, value: string) => {
    updateRows(rows.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  };
  const onAdd = () => {
    if (rows.length < maxItems) updateRows([...rows, emptyItemRow()]);
  };
  const onRemove = (index: number) => {
    if (rows.length <= 1) return;
    const confirmed = window.confirm(t('invoiceItems.removeConfirm', { number: index + 1 }));
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
        <InvoiceItemsForm
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
      <InvoiceItemsResult
        idPrefix={idPrefix}
        preset={preset}
        snapshot={snapshot}
        shownInline={rowError !== null || fieldError !== null}
      />
    </div>
  );
}
