import type { ComponentChildren, JSX } from 'preact';
import styles from './button.module.css';
import { Icon } from './Icon.tsx';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

type NativeButton = Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, 'size' | 'icon' | 'loading'>;

export interface ButtonProps extends NativeButton {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: string;
  loading?: boolean;
  /** Renders a link styled as a button. */
  href?: string;
  children?: ComponentChildren;
}

export function Button({
  variant = 'secondary',
  size = 'md',
  icon,
  loading = false,
  href,
  children,
  class: className,
  type = 'button',
  disabled,
  ...rest
}: ButtonProps) {
  const classes = [styles.button, className].filter(Boolean).join(' ');
  const content = (
    <>
      {loading ? (
        <span class={styles.spinner} aria-hidden="true" />
      ) : icon ? (
        <Icon name={icon} />
      ) : null}
      {children}
    </>
  );
  if (href) {
    return (
      <a class={classes} href={href} data-variant={variant} data-size={size}>
        {content}
      </a>
    );
  }
  return (
    <button
      {...rest}
      type={type}
      class={classes}
      data-variant={variant}
      data-size={size}
      disabled={disabled}
      aria-busy={loading || undefined}
    >
      {content}
    </button>
  );
}

export interface IconButtonProps extends Omit<ButtonProps, 'children' | 'icon'> {
  icon: string;
  /** Required accessible name; also shown as a tooltip. */
  label: string;
}

export function IconButton({ icon, label, class: className, ...rest }: IconButtonProps) {
  return (
    <Button
      {...rest}
      icon={icon}
      aria-label={label}
      title={label}
      class={[styles.iconOnly, className].filter(Boolean).join(' ')}
    />
  );
}
