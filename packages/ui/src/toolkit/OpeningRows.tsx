import type { PresetField, ResolvedPreset } from '@mangotools/schemas';
import { Button, IconButton } from '../primitives/Button.tsx';
import { describedBy, Field, FieldHelp } from '../primitives/Field.tsx';
import formStyles from '../primitives/form.module.css';
import { Icon } from '../primitives/Icon.tsx';
import { NumberField, Select, type SelectOption } from '../primitives/inputs.tsx';
import { type StringKey, t } from '../strings/en.ts';
import {
  blankOpeningRow,
  MAX_OPENING_ROWS,
  OPENING_MEASURE_FIELDS,
  type OpeningField,
  type OpeningRowValues,
  openingRowError,
  readOpeningRows,
  writeOpeningRows,
} from './openingRows.ts';
import styles from './openings.module.css';
import { label } from './presentation.ts';

export interface OpeningRowsProps {
  id: string;
  field: PresetField;
  preset: ResolvedPreset;
  value: string;
  /** Message for an error anywhere in this list, and the engine path it came from. */
  error: string | null;
  errorPath: string | undefined;
  unitLabel: string | undefined;
  onValue: (value: string) => void;
}

const FIELD_LABEL: Record<OpeningField, StringKey> = {
  type: 'openings.type',
  width: 'openings.width',
  height: 'openings.height',
  quantity: 'openings.quantity',
};

/** Preset text for `${labelKey}.row` / `.add`, else the shared default. */
const nounText = (preset: ResolvedPreset, field: PresetField, part: 'row' | 'add') =>
  preset.strings[`${field.labelKey}.${part}`];

interface OpeningRowEditorProps {
  id: string;
  index: number;
  row: OpeningRowValues;
  rowLabel: string;
  rowError: ReturnType<typeof openingRowError>;
  error: string | null;
  cellLabel: (key: OpeningField) => string;
  typeOptions: SelectOption[];
  onChange: (key: OpeningField, text: string) => void;
  onRemove: () => void;
}

function OpeningRowEditor(props: OpeningRowEditorProps) {
  const { id, index, row, rowLabel, rowError, error, cellLabel, typeOptions, onChange, onRemove } =
    props;
  const keys: readonly OpeningField[] =
    typeOptions.length > 0 ? ['type', ...OPENING_MEASURE_FIELDS] : OPENING_MEASURE_FIELDS;
  return (
    <fieldset class={styles.openingRow} data-item-row={index}>
      <legend class="visually-hidden">{rowLabel}</legend>
      <p class={styles.rowLabel} aria-hidden="true">
        {rowLabel}
      </p>
      <div class={`${styles.openingFields} ${typeOptions.length > 0 ? styles.withType : ''}`}>
        {keys.map((key) => {
          const cellId = `${id}-${index}-${key}`;
          const cellError = rowError?.index === index && rowError.field === key ? error : null;
          return (
            <Field key={key} id={cellId} label={cellLabel(key)} error={cellError}>
              {key === 'type' ? (
                <Select
                  id={cellId}
                  value={row.type}
                  options={typeOptions}
                  aria-describedby={cellError ? `${cellId}-error` : undefined}
                  onValue={(text) => onChange(key, text)}
                />
              ) : (
                <NumberField
                  id={cellId}
                  value={row[key]}
                  invalid={cellError !== null}
                  aria-describedby={cellError ? `${cellId}-error` : undefined}
                  onValue={(text) => onChange(key, text)}
                />
              )}
            </Field>
          );
        })}
      </div>
      <IconButton
        size="sm"
        variant="ghost"
        icon="trash-2"
        label={t('openings.remove', { label: rowLabel })}
        onClick={onRemove}
      />
    </fieldset>
  );
}

/** Width × height × quantity rows, added and removed by touch-friendly buttons. */
export function OpeningRows(props: OpeningRowsProps) {
  const { id, field, preset, value, error, errorPath, unitLabel, onValue } = props;
  const rows = readOpeningRows(value);
  const rowError = openingRowError(errorPath);
  const help = field.helpKey ? label(preset, field.helpKey) : undefined;
  const helpMode = 'disclosure' as const;
  const update = (next: OpeningRowValues[]) => onValue(writeOpeningRows(next));
  const change = (index: number, key: OpeningField, text: string) =>
    update(rows.map((row, i) => (i === index ? { ...row, [key]: text } : row)));
  // The unit goes in the label, not an in-field suffix, so narrow phone cells keep room for digits.
  const cellLabel = (key: OpeningField) =>
    key === 'type' || key === 'quantity' || !unitLabel
      ? t(FIELD_LABEL[key])
      : `${t(FIELD_LABEL[key])} (${unitLabel})`;
  const rowLabel = (number: number) =>
    (nounText(preset, field, 'row') ?? t('openings.row')).replace('{number}', String(number));
  const groupLabel = label(preset, field.labelKey);
  const typeOptions = (field.options ?? []).map((option) => ({
    value: String(option.value),
    label: option.labelKey ? label(preset, option.labelKey) : String(option.value),
  }));
  const columns: readonly OpeningField[] =
    typeOptions.length > 0 ? ['type', ...OPENING_MEASURE_FIELDS] : OPENING_MEASURE_FIELDS;
  return (
    <fieldset
      class={styles.group}
      data-openings={id}
      aria-describedby={describedBy(id, help, error && !rowError ? error : null, helpMode)}
    >
      <legend class={styles.legend}>
        <span>{groupLabel}</span>
        <FieldHelp id={id} help={help} mode="disclosure" label={groupLabel} />
      </legend>
      {rows.length > 0 ? (
        <div
          class={styles.columnHeaders}
          data-has-type={typeOptions.length > 0 ? 'true' : undefined}
          aria-hidden="true"
        >
          <span>{t('openings.item')}</span>
          {columns.map((key) => (
            <span key={key}>{cellLabel(key)}</span>
          ))}
          <span />
        </div>
      ) : null}
      <div class={styles.rows}>
        {rows.map((row, index) => (
          <OpeningRowEditor
            key={index}
            id={id}
            index={index}
            row={row}
            rowLabel={rowLabel(index + 1)}
            rowError={rowError}
            error={error}
            cellLabel={cellLabel}
            typeOptions={typeOptions}
            onChange={(key, text) => change(index, key, text)}
            onRemove={() => update(rows.filter((_, i) => i !== index))}
          />
        ))}
      </div>
      {error && !rowError ? (
        <p class={`${formStyles.error} ${styles.groupError}`} id={`${id}-error`}>
          <Icon name="circle-alert" />
          <span>{error}</span>
        </p>
      ) : null}
      <div class={styles.actions}>
        {rows.length < MAX_OPENING_ROWS ? (
          <Button
            type="button"
            size="sm"
            icon="plus"
            onClick={() => update([...rows, blankOpeningRow()])}
          >
            {nounText(preset, field, 'add') ?? t('openings.add')}
          </Button>
        ) : (
          <p class={styles.maxReached}>{t('openings.max', { max: MAX_OPENING_ROWS })}</p>
        )}
      </div>
    </fieldset>
  );
}
