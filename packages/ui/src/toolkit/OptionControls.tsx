import type { FieldValues } from '@mangotools/runtime';
import type { ResolvedPreset } from '@mangotools/schemas';
import { SegmentedControl, Switch } from '../primitives/choices.tsx';
import { Field } from '../primitives/Field.tsx';
import { Select } from '../primitives/inputs.tsx';
import { label, visibleEntries, visibleOptionValues } from './presentation.ts';
import styles from './toolkit.module.css';

export interface OptionControlsProps {
  idPrefix: string;
  preset: ResolvedPreset;
  values: FieldValues;
  onChange: (key: string, value: string | boolean) => void;
}

/** The preset's user options (segmented, select or switch), in order, hidden when not relevant. */
export function OptionControls({ idPrefix, preset, values, onChange }: OptionControlsProps) {
  const options = visibleEntries(preset.userOptions, values).filter(
    ([key]) => !preset.locked.includes(key),
  );
  if (options.length === 0) return null;
  return (
    <div class={styles.options}>
      {options.map(([key, option]) => {
        const id = `${idPrefix}-${key}`;
        const text = label(preset, option.labelKey);
        if (option.control === 'switch') {
          return (
            <div key={key} class={styles.optionSwitch}>
              <Switch
                id={id}
                label={text}
                checked={values[key] === true}
                onValue={(v) => onChange(key, v)}
              />
            </div>
          );
        }
        const choices = visibleOptionValues(preset, key, values).map(([value, name]) => ({
          value,
          label: name,
        }));
        if (option.control === 'segmented') {
          return (
            <SegmentedControl
              key={key}
              id={id}
              label={text}
              value={String(values[key])}
              options={choices}
              onValue={(v) => onChange(key, v)}
            />
          );
        }
        return (
          <Field key={key} id={id} label={text}>
            <Select
              id={id}
              value={String(values[key])}
              options={choices}
              onValue={(v) => onChange(key, v)}
            />
          </Field>
        );
      })}
    </div>
  );
}
