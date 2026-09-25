import styles from './form.module.css';

export interface Choice {
  value: string;
  label: string;
}

export interface SegmentedControlProps {
  /** Used for the radio group name and option ids. */
  id: string;
  label: string;
  value: string;
  options: Choice[];
  onValue: (value: string) => void;
  describedBy?: string | undefined;
  hideLabel?: boolean;
}

/**
 * Native radio buttons styled as a segmented control: one tab stop, arrow keys move the
 * selection, and the group is announced with its legend.
 */
export function SegmentedControl({
  id,
  label,
  value,
  options,
  onValue,
  describedBy,
  hideLabel,
}: SegmentedControlProps) {
  return (
    <fieldset class={styles.fieldset} aria-describedby={describedBy}>
      <legend class={hideLabel ? 'visually-hidden' : styles.label}>{label}</legend>
      <div class={styles.segmented}>
        {options.map((option) => {
          const optionId = `${id}-${option.value}`;
          return (
            <span key={option.value} class={styles.segmentItem}>
              <input
                id={optionId}
                class={styles.segmentInput}
                type="radio"
                name={id}
                value={option.value}
                checked={option.value === value}
                onChange={() => onValue(option.value)}
              />
              <label for={optionId} class={styles.segment}>
                {option.label}
              </label>
            </span>
          );
        })}
      </div>
    </fieldset>
  );
}

export interface SwitchProps {
  id: string;
  label: string;
  checked: boolean;
  onValue: (checked: boolean) => void;
}

export function Switch({ id, label, checked, onValue }: SwitchProps) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      class={styles.switchRow}
      onClick={() => onValue(!checked)}
    >
      <span class={styles.track} aria-hidden="true">
        <span class={styles.thumb} />
      </span>
      <span>{label}</span>
    </button>
  );
}
