import type { FieldValues } from '@mangotools/runtime';
import type { PresetField, ResolvedPreset } from '@mangotools/schemas';
import { useState } from 'preact/hooks';
import { SegmentedControl, Switch } from '../primitives/choices.tsx';
import { describedBy, Field } from '../primitives/Field.tsx';
import { NumberField, Select, TextInput } from '../primitives/inputs.tsx';
import { t } from '../strings/en.ts';
import { label } from '../toolkit/presentation.ts';
import styles from '../toolkit/toolkit.module.css';

const CUSTOM = '__custom__';

export interface FieldControlProps {
  id: string;
  name: string;
  field: PresetField;
  preset: ResolvedPreset;
  value: string;
  error: string | null;
  onValue: (value: string) => void;
}

const optionLabel = (
  preset: ResolvedPreset,
  field: PresetField,
  value: string | number,
  key?: string,
) =>
  key
    ? label(preset, key)
    : `${value}${field.unit === '%' ? '%' : field.unit ? ` ${field.unit}` : ''}`;

/** Select of common values plus "Custom", which reveals a number field (e.g. GST rate). */
function ChoiceOrNumber({ id, field, preset, value, error, onValue }: FieldControlProps) {
  const options = field.options ?? [];
  const isOption = options.some((o) => String(o.value) === value);
  const [custom, setCustom] = useState(!isOption && value !== '');
  const text = label(preset, field.labelKey);
  const help = field.helpKey ? label(preset, field.helpKey) : undefined;
  const choices = [
    ...options.map((o) => ({
      value: String(o.value),
      label: optionLabel(preset, field, o.value, o.labelKey),
    })),
    ...(field.allowCustom ? [{ value: CUSTOM, label: t('field.custom') }] : []),
  ];
  return (
    <div class={styles.rateRow}>
      <Field id={id} label={text} help={help} error={custom ? null : error}>
        <Select
          id={id}
          value={custom ? CUSTOM : value}
          options={choices}
          aria-describedby={describedBy(id, help, custom ? null : error)}
          onValue={(next) => {
            setCustom(next === CUSTOM);
            if (next !== CUSTOM) onValue(next);
          }}
        />
      </Field>
      {custom ? (
        <Field
          id={`${id}-custom`}
          label={t('field.customValue', { label: text.toLowerCase() })}
          error={error}
        >
          <NumberField
            id={`${id}-custom`}
            value={value}
            suffix={field.unit}
            invalid={error !== null}
            aria-describedby={describedBy(`${id}-custom`, undefined, error)}
            onValue={onValue}
          />
        </Field>
      ) : null}
    </div>
  );
}

/** Select or segmented control over the field's fixed `options`. */
function EnumField({ id, field, preset, value, error, onValue }: FieldControlProps) {
  const text = label(preset, field.labelKey);
  const help = field.helpKey ? label(preset, field.helpKey) : undefined;
  const described = describedBy(id, help, error);
  const options = (field.options ?? []).map((o) => ({
    value: String(o.value),
    label: optionLabel(preset, field, o.value, o.labelKey),
  }));
  if (field.control === 'select') {
    return (
      <Field id={id} label={text} help={help} error={error}>
        <Select
          id={id}
          value={value}
          options={options}
          aria-describedby={described}
          onValue={onValue}
        />
      </Field>
    );
  }
  return (
    <SegmentedControl
      id={id}
      label={text}
      value={value}
      options={options}
      onValue={onValue}
      describedBy={described}
    />
  );
}

/** A boolean *input* field (contrast `userOptionSchema`'s `control: 'switch'`, routed to params). */
function BooleanField({ id, field, preset, value, onValue }: FieldControlProps) {
  const text = label(preset, field.labelKey);
  const checked = value === '' ? String(field.default) === 'true' : value === 'true';
  return (
    <div class={styles.optionSwitch}>
      <Switch
        id={id}
        label={text}
        checked={checked}
        onValue={(next) => onValue(next ? 'true' : 'false')}
      />
    </div>
  );
}

/** One preset field rendered with the control its kind asks for. */
export function FieldControl(props: FieldControlProps) {
  const { id, field, preset, value, error, onValue } = props;
  if (field.kind === 'enum-or-number') return <ChoiceOrNumber {...props} />;
  if (field.kind === 'enum') return <EnumField {...props} />;
  if (field.kind === 'boolean') return <BooleanField {...props} />;
  const text = label(preset, field.labelKey);
  const help = field.helpKey ? label(preset, field.helpKey) : undefined;
  const described = describedBy(id, help, error);
  const placeholder = field.placeholderKey ? label(preset, field.placeholderKey) : undefined;
  return (
    <Field id={id} label={text} help={help} error={error}>
      {field.kind === 'text' ? (
        <TextInput
          id={id}
          value={value}
          placeholder={placeholder}
          invalid={error !== null}
          aria-describedby={described}
          onValue={onValue}
        />
      ) : (
        <NumberField
          id={id}
          value={value}
          prefix={field.currency === 'INR' ? '₹' : undefined}
          suffix={field.unit}
          placeholder={placeholder ?? '0'}
          invalid={error !== null}
          aria-describedby={described}
          aria-required={field.required || undefined}
          onValue={onValue}
        />
      )}
    </Field>
  );
}

export type FieldEntries = [string, PresetField][];

export interface CalculatorFieldsProps {
  idPrefix: string;
  preset: ResolvedPreset;
  fields: FieldEntries;
  values: FieldValues;
  errorFor: (key: string) => string | null;
  onValue: (key: string, value: string) => void;
}

export function CalculatorFields({
  idPrefix,
  preset,
  fields,
  values,
  errorFor,
  onValue,
}: CalculatorFieldsProps) {
  return (
    <div class={styles.fields}>
      {fields.map(([key, field]) => (
        <FieldControl
          key={key}
          id={`${idPrefix}-${key}`}
          name={key}
          field={field}
          preset={preset}
          value={String(values[key] ?? '')}
          error={errorFor(key)}
          onValue={(next) => onValue(key, next)}
        />
      ))}
    </div>
  );
}
