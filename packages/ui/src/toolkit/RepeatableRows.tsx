import type { Row } from '@mangotools/runtime';
import type { PresetField, ResolvedPreset, RowColumn, RowsSpec } from '@mangotools/schemas';
import { useEffect, useRef } from 'preact/hooks';
import { Button, IconButton } from '../primitives/Button.tsx';
import { describedBy, Field, FieldHelp } from '../primitives/Field.tsx';
import formStyles from '../primitives/form.module.css';
import { Icon } from '../primitives/Icon.tsx';
import { NumberField, Select, TextInput } from '../primitives/inputs.tsx';
import { t } from '../strings/en.ts';
import { label } from './presentation.ts';
import styles from './repeatableRows.module.css';
import {
  focusAfterAdd,
  focusAfterRemove,
  type RowCellError,
  type RowsFocusTarget,
  rowCellError,
  rowsState,
  valueAfterAdd,
  valueAfterCellEdit,
  valueAfterRemove,
} from './repeatableRows.ts';

export interface RepeatableRowsProps {
  id: string;
  /** The preset field key; engine error paths start with it. */
  name: string;
  field: PresetField;
  spec: RowsSpec;
  preset: ResolvedPreset;
  value: string;
  error: string | null;
  errorPath: string | undefined;
  onValue: (value: string) => void;
}

/** Preset text for `${labelKey}.row` / `.add`, else the shared default. */
const nounText = (preset: ResolvedPreset, field: PresetField, part: 'row' | 'add') =>
  preset.strings[`${field.labelKey}.${part}`];

const cellId = (id: string, index: number, column: string) => `${id}-${index}-${column}`;

/** UI-only row keys: stable across edits, rebuilt when the row count changes from outside. */
function useRowKeys(count: number): number[] {
  const next = useRef(0);
  const keys = useRef<number[]>([]);
  while (keys.current.length < count) keys.current.push(next.current++);
  if (keys.current.length > count) keys.current = keys.current.slice(0, count);
  return keys.current;
}

interface CellProps {
  id: string;
  column: RowColumn;
  preset: ResolvedPreset;
  value: string;
  text: string;
  error: string | null;
  onValue: (text: string) => void;
}

function Cell({ id, column, preset, value, text, error, onValue }: CellProps) {
  const help = column.helpKey ? label(preset, column.helpKey) : undefined;
  const placeholder = column.placeholderKey ? label(preset, column.placeholderKey) : undefined;
  const described = describedBy(id, undefined, error);
  const common = {
    id,
    value,
    invalid: error !== null,
    'aria-describedby': described,
    'aria-required': column.required || undefined,
    onValue,
  };
  return (
    <Field id={id} label={text} help={help} helpMode="disclosure" error={error}>
      {column.kind === 'enum' ? (
        <Select
          id={id}
          value={value}
          aria-describedby={described}
          options={(column.options ?? []).map((o) => ({
            value: o.value,
            label: o.labelKey ? label(preset, o.labelKey) : o.value,
          }))}
          onValue={onValue}
        />
      ) : column.kind === 'text' ? (
        <TextInput {...common} placeholder={placeholder} />
      ) : (
        <NumberField
          {...common}
          placeholder={placeholder}
          prefix={column.kind === 'money' ? '₹' : undefined}
          suffix={column.kind === 'percent' ? '%' : column.unit}
        />
      )}
    </Field>
  );
}

interface RowEditorProps {
  id: string;
  index: number;
  row: Row;
  spec: RowsSpec;
  preset: ResolvedPreset;
  rowLabel: string;
  cellError: RowCellError | null;
  error: string | null;
  canRemove: boolean;
  onCell: (column: string, text: string) => void;
  onRemove: () => void;
}

function RowEditor(props: RowEditorProps) {
  const { id, index, row, spec, preset, rowLabel, cellError, error, canRemove } = props;
  return (
    <fieldset class={styles.row} data-row={index}>
      <legend class="visually-hidden">{rowLabel}</legend>
      <p class={styles.rowLabel} aria-hidden="true">
        {rowLabel}
      </p>
      <div class={styles.cells}>
        {Object.entries(spec.columns).map(([key, column]) => {
          const hasError = cellError?.index === index && cellError.column === key;
          return (
            <Cell
              key={key}
              id={cellId(id, index, key)}
              column={column}
              preset={preset}
              value={row[key] ?? ''}
              text={label(preset, column.labelKey)}
              error={hasError ? error : null}
              onValue={(text) => props.onCell(key, text)}
            />
          );
        })}
      </div>
      <IconButton
        id={`${id}-${index}-remove`}
        size="sm"
        variant="ghost"
        icon="trash-2"
        label={t('rows.remove', { label: rowLabel })}
        disabled={!canRemove}
        onClick={props.onRemove}
      />
    </fieldset>
  );
}

/** Moves focus to the requested control after the rows re-render. */
function useFocusAfter(id: string, spec: RowsSpec, value: string) {
  const pending = useRef<RowsFocusTarget | null>(null);
  useEffect(() => {
    const target = pending.current;
    pending.current = null;
    if (!target || typeof document === 'undefined') return;
    const first = Object.keys(spec.columns)[0] ?? '';
    const elementId =
      target.kind === 'cell'
        ? cellId(id, target.index, first)
        : target.kind === 'remove'
          ? `${id}-${target.index}-remove`
          : `${id}-add`;
    document.getElementById(elementId)?.focus();
  }, [value, id, spec]);
  return pending;
}

/** A generic list of strict rows with primitive columns, added and removed by buttons. */
export function RepeatableRows(props: RepeatableRowsProps) {
  const { id, name, field, spec, preset, value, error, errorPath, onValue } = props;
  const { rows, canAdd, canRemove } = rowsState(spec, value);
  const keys = useRowKeys(rows.length);
  const focus = useFocusAfter(id, spec, value);
  const cellError = rowCellError(name, spec, errorPath);
  const help = field.helpKey ? label(preset, field.helpKey) : undefined;
  const groupLabel = label(preset, field.labelKey);
  const rowLabel = (n: number) =>
    (nounText(preset, field, 'row') ?? t('rows.row')).replace('{number}', String(n));
  const fieldError = error && !cellError ? error : null;
  const remove = (index: number) => {
    keys.splice(index, 1);
    focus.current = focusAfterRemove(index, rows.length, spec.minRows ?? 0);
    onValue(valueAfterRemove(spec, value, index));
  };
  const add = () => {
    focus.current = focusAfterAdd(rows.length);
    onValue(valueAfterAdd(spec, value));
  };
  return (
    <fieldset
      class={styles.group}
      data-rows-field={name}
      style={{ '--row-columns': String(Object.keys(spec.columns).length) }}
      aria-describedby={describedBy(id, help, fieldError, 'disclosure')}
    >
      <legend class={styles.legend}>
        <span>{groupLabel}</span>
        <FieldHelp id={id} help={help} mode="disclosure" label={groupLabel} />
      </legend>
      {rows.length > 0 ? (
        <div class={styles.headers} aria-hidden="true">
          <span>{t('rows.item')}</span>
          {Object.entries(spec.columns).map(([key, column]) => (
            <span key={key}>{label(preset, column.labelKey)}</span>
          ))}
          <span />
        </div>
      ) : null}
      <div class={styles.rows}>
        {rows.map((row, index) => (
          <RowEditor
            key={keys[index]}
            id={id}
            index={index}
            row={row}
            spec={spec}
            preset={preset}
            rowLabel={rowLabel(index + 1)}
            cellError={cellError}
            error={error}
            canRemove={canRemove}
            onCell={(column, text) => onValue(valueAfterCellEdit(spec, value, index, column, text))}
            onRemove={() => remove(index)}
          />
        ))}
      </div>
      {fieldError ? (
        <p class={`${formStyles.error} ${styles.groupError}`} id={`${id}-error`}>
          <Icon name="circle-alert" />
          <span>{fieldError}</span>
        </p>
      ) : null}
      <div class={styles.actions}>
        <Button
          id={`${id}-add`}
          type="button"
          size="sm"
          icon="plus"
          disabled={!canAdd}
          onClick={add}
        >
          {nounText(preset, field, 'add') ?? t('rows.add')}
        </Button>
        {canAdd ? null : <p class={styles.limit}>{t('rows.max', { max: spec.maxRows })}</p>}
      </div>
    </fieldset>
  );
}
