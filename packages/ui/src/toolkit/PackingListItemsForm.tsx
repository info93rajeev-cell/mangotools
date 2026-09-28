import type { ResolvedPreset } from '@mangotools/schemas';
import { Button } from '../primitives/Button.tsx';
import { Field } from '../primitives/Field.tsx';
import { NumberField, TextInput } from '../primitives/inputs.tsx';
import { t } from '../strings/en.ts';
import { ItemRowShell } from './ItemRowShell.tsx';
import styles from './itemRows.module.css';
import type { PackingItemRowField, PackingItemRowValues, PackingRowError } from './packingItems.ts';
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
  row: PackingItemRowValues;
  rowError: PackingRowError | null;
  rowErrorMessage: string | null;
  canRemove: boolean;
  onChange: (field: PackingItemRowField, value: string) => void;
  onRemove: () => void;
}

const errorFor = (
  rowError: PackingRowError | null,
  message: string | null,
  index: number,
  field: PackingItemRowField,
) => (rowError && rowError.index === index && rowError.field === field ? message : null);

/** One item's fieldset: description/SKU/HSN, quantity/unit, country of origin. */
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
  const field = (name: PackingItemRowField, labelKey: string, numeric = false) => (
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
    <ItemRowShell
      index={index}
      itemLabel={t('itemRows.itemLabel', { number })}
      removeLabel={canRemove ? t('itemRows.removeItem', { number }) : null}
      onRemove={onRemove}
    >
      {field('description', 'packing.item.description')}
      {field('sku', 'packing.item.sku')}
      {field('hsn', 'packing.item.hsn')}
      {field('countryOfOrigin', 'packing.item.countryOfOrigin')}
      {field('quantity', 'packing.item.quantity', true)}
      {field('unit', 'packing.item.unit')}
    </ItemRowShell>
  );
}

export interface PackingListItemsFormProps {
  idPrefix: string;
  preset: ResolvedPreset;
  rows: PackingItemRowValues[];
  rowError: PackingRowError | null;
  rowErrorMessage: string | null;
  maxItems: number;
  onChange: (index: number, field: PackingItemRowField, value: string) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
}

/** The packing list's item rows: add up to `maxItems`, remove any but the last remaining one. */
export function PackingListItemsForm({
  idPrefix,
  preset,
  rows,
  rowError,
  rowErrorMessage,
  maxItems,
  onChange,
  onAdd,
  onRemove,
}: PackingListItemsFormProps) {
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
            {t('itemRows.addItem')}
          </Button>
        ) : (
          <p class={styles.maxReached}>{t('packingItems.maxReached', { max: maxItems })}</p>
        )}
      </div>
    </div>
  );
}
