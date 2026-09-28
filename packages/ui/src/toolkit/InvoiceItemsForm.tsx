import type { ResolvedPreset } from '@mangotools/schemas';
import { Button } from '../primitives/Button.tsx';
import { Field } from '../primitives/Field.tsx';
import { NumberField, TextInput } from '../primitives/inputs.tsx';
import { t } from '../strings/en.ts';
import styles from './invoiceItems.module.css';
import type { ItemRowField, ItemRowValues, RowError } from './invoiceItems.ts';
import { label } from './presentation.ts';

interface TextRowFieldProps {
  id: string;
  preset: ResolvedPreset;
  labelKey: string;
  value: string;
  numeric?: boolean;
  error: string | null;
  onValue: (value: string) => void;
}

function RowField({ id, preset, labelKey, value, numeric, error, onValue }: TextRowFieldProps) {
  const text = label(preset, labelKey);
  return (
    <Field id={id} label={text} error={error}>
      {numeric ? (
        <NumberField id={id} value={value} invalid={error !== null} onValue={onValue} />
      ) : (
        <TextInput id={id} value={value} invalid={error !== null} onValue={onValue} />
      )}
    </Field>
  );
}

interface ItemRowProps {
  idPrefix: string;
  index: number;
  preset: ResolvedPreset;
  row: ItemRowValues;
  rowError: RowError | null;
  rowErrorMessage: string | null;
  canRemove: boolean;
  onChange: (field: ItemRowField, value: string) => void;
  onRemove: () => void;
}

const errorFor = (
  rowError: RowError | null,
  message: string | null,
  index: number,
  field: ItemRowField,
) => (rowError && rowError.index === index && rowError.field === field ? message : null);

/** One item's fieldset: description/SKU/HSN, quantity/unit/price, origin/net weight. */
function ItemRow({
  idPrefix,
  index,
  preset,
  row,
  rowError,
  rowErrorMessage,
  canRemove,
  onChange,
  onRemove,
}: ItemRowProps) {
  const number = index + 1;
  const rowId = `${idPrefix}-item-${index}`;
  const field = (name: ItemRowField, labelKey: string, numeric = false) => (
    <RowField
      id={`${rowId}-${name}`}
      preset={preset}
      labelKey={labelKey}
      value={row[name]}
      numeric={numeric}
      error={errorFor(rowError, rowErrorMessage, index, name)}
      onValue={(value) => onChange(name, value)}
    />
  );
  return (
    <fieldset class={styles.itemRow} data-item-row={index}>
      <legend class={styles.itemRowHead}>
        <span>{t('invoiceItems.itemLabel', { number })}</span>
        {canRemove ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            icon="trash-2"
            onClick={onRemove}
            aria-label={t('invoiceItems.removeItem', { number })}
          >
            {t('invoiceItems.removeItem', { number })}
          </Button>
        ) : null}
      </legend>
      <div class={styles.itemRowFields}>
        {field('description', 'invoice.item.description')}
        {field('sku', 'invoice.item.sku')}
        {field('hsn', 'invoice.item.hsn')}
        {field('quantity', 'invoice.item.quantity', true)}
        {field('unit', 'invoice.item.unit')}
        {field('unitPrice', 'invoice.item.unitPrice', true)}
        {field('countryOfOrigin', 'invoice.item.countryOfOrigin')}
        {field('netWeight', 'invoice.item.netWeight', true)}
      </div>
    </fieldset>
  );
}

export interface InvoiceItemsFormProps {
  idPrefix: string;
  preset: ResolvedPreset;
  rows: ItemRowValues[];
  rowError: RowError | null;
  rowErrorMessage: string | null;
  maxItems: number;
  onChange: (index: number, field: ItemRowField, value: string) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
}

/** The invoice's item rows: add up to `maxItems`, remove any but the last remaining one. */
export function InvoiceItemsForm({
  idPrefix,
  preset,
  rows,
  rowError,
  rowErrorMessage,
  maxItems,
  onChange,
  onAdd,
  onRemove,
}: InvoiceItemsFormProps) {
  return (
    <div class={styles.rows} data-item-rows="">
      {rows.map((row, index) => (
        <ItemRow
          key={index}
          idPrefix={idPrefix}
          index={index}
          preset={preset}
          row={row}
          rowError={rowError}
          rowErrorMessage={rowErrorMessage}
          canRemove={rows.length > 1}
          onChange={(field, value) => onChange(index, field, value)}
          onRemove={() => onRemove(index)}
        />
      ))}
      <div class={styles.itemsActions}>
        {rows.length < maxItems ? (
          <Button type="button" icon="plus" onClick={onAdd}>
            {t('invoiceItems.addItem')}
          </Button>
        ) : (
          <p class={styles.maxReached}>{t('invoiceItems.maxReached', { max: maxItems })}</p>
        )}
      </div>
    </div>
  );
}
