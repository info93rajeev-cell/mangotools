import type { JSX, Ref } from 'preact';
import styles from './form.module.css';

type InputBase = Omit<JSX.InputHTMLAttributes<HTMLInputElement>, 'onInput' | 'value' | 'onChange'>;

export interface TextInputProps extends InputBase {
  value: string;
  onValue: (value: string) => void;
  invalid?: boolean;
  inputRef?: Ref<HTMLInputElement>;
}

export function TextInput({
  value,
  onValue,
  invalid,
  class: className,
  inputRef,
  ...rest
}: TextInputProps) {
  return (
    <input
      {...rest}
      ref={inputRef}
      class={[styles.control, className].filter(Boolean).join(' ')}
      value={value}
      aria-invalid={invalid || undefined}
      onInput={(event) => onValue(event.currentTarget.value)}
    />
  );
}

type TextareaBase = Omit<
  JSX.TextareaHTMLAttributes<HTMLTextAreaElement>,
  'onInput' | 'value' | 'onChange'
>;

export interface TextareaProps extends TextareaBase {
  value: string;
  onValue?: (value: string) => void;
  mono?: boolean;
  invalid?: boolean;
  textareaRef?: Ref<HTMLTextAreaElement>;
}

export function Textarea({
  value,
  onValue,
  mono,
  invalid,
  class: className,
  textareaRef,
  ...rest
}: TextareaProps) {
  const classes = [styles.control, styles.textarea, mono ? styles.mono : '', className]
    .filter(Boolean)
    .join(' ');
  return (
    <textarea
      {...rest}
      ref={textareaRef}
      class={classes}
      value={value}
      aria-invalid={invalid || undefined}
      spellcheck={mono ? false : undefined}
      autocapitalize={mono ? 'off' : undefined}
      autocomplete={mono ? 'off' : undefined}
      onInput={onValue ? (event) => onValue(event.currentTarget.value) : undefined}
    />
  );
}

export interface NumberFieldProps extends Omit<TextInputProps, 'type' | 'inputMode'> {
  prefix?: string | undefined;
  suffix?: string | undefined;
}

/** Decimal text input: keeps exactly what the user types (no float conversion). */
export function NumberField({ prefix, suffix, invalid, ...rest }: NumberFieldProps) {
  return (
    <div class={styles.affixed} data-invalid={invalid || undefined}>
      {prefix ? (
        <span class={styles.affix} aria-hidden="true">
          {prefix}
        </span>
      ) : null}
      <TextInput {...rest} invalid={invalid} type="text" inputMode="decimal" autocomplete="off" />
      {suffix ? (
        <span class={styles.affix} aria-hidden="true">
          {suffix}
        </span>
      ) : null}
    </div>
  );
}

export interface SelectOption {
  value: string;
  label: string;
}

type SelectBase = Omit<
  JSX.SelectHTMLAttributes<HTMLSelectElement>,
  'onInput' | 'value' | 'onChange'
>;

export interface SelectProps extends SelectBase {
  value: string;
  options: SelectOption[];
  onValue: (value: string) => void;
}

export function Select({ value, options, onValue, class: className, ...rest }: SelectProps) {
  return (
    <select
      {...rest}
      class={[styles.control, styles.select, className].filter(Boolean).join(' ')}
      value={value}
      onChange={(event) => onValue(event.currentTarget.value)}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
