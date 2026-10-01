import type { ComponentChildren } from 'preact';
import { t } from '../strings/en.ts';
import styles from './form.module.css';
import { Icon } from './Icon.tsx';

export type HelpMode = 'inline' | 'disclosure';

export interface FieldProps {
  id: string;
  label: string;
  help?: string | undefined;
  helpMode?: HelpMode | undefined;
  error?: string | null | undefined;
  /** Render the label visually hidden (the control still has an accessible name). */
  hideLabel?: boolean;
  /** Use a <span> label for groups (segmented controls label themselves via aria-labelledby). */
  group?: boolean;
  children: ComponentChildren;
}

export const helpId = (id: string) => `${id}-help`;
export const errorId = (id: string) => `${id}-error`;

/** IDs a control should reference in aria-describedby. */
export function describedBy(
  id: string,
  help?: string,
  error?: string | null,
  helpMode: HelpMode = 'inline',
): string | undefined {
  const ids = [help && helpMode === 'inline' ? helpId(id) : '', error ? errorId(id) : ''].filter(
    Boolean,
  );
  return ids.length > 0 ? ids.join(' ') : undefined;
}

export function FieldHelp({
  id,
  help,
  mode = 'inline',
}: {
  id: string;
  help?: string;
  mode?: HelpMode;
}) {
  if (!help) return null;
  if (mode === 'disclosure') {
    return (
      <details class={styles.helpDisclosure} data-field-help="">
        <summary>{t('field.help')}</summary>
        <p id={helpId(id)} class={styles.help}>
          {help}
        </p>
      </details>
    );
  }
  return (
    <p id={helpId(id)} class={styles.help}>
      {help}
    </p>
  );
}

/** Label, control, help text and error message, wired together for assistive technology. */
export function Field({
  id,
  label,
  help,
  helpMode,
  error,
  hideLabel,
  group,
  children,
}: FieldProps) {
  const labelClass = hideLabel ? 'visually-hidden' : styles.label;
  return (
    <div class={styles.field}>
      {group ? (
        <span id={`${id}-label`} class={labelClass}>
          {label}
        </span>
      ) : (
        <label for={id} class={labelClass}>
          {label}
        </label>
      )}
      {children}
      <FieldHelp id={id} help={help} mode={helpMode} />
      {error ? (
        <p id={errorId(id)} class={styles.error}>
          <Icon name="circle-alert" />
          <span>{error}</span>
        </p>
      ) : null}
    </div>
  );
}
