import type { ComponentChildren } from 'preact';
import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import styles from './feedback.module.css';
import { Icon } from './Icon.tsx';

export type Tone = 'info' | 'success' | 'warning' | 'danger';

const TONE_ICON: Record<Tone, string> = {
  info: 'info',
  success: 'circle-check',
  warning: 'triangle-alert',
  danger: 'circle-alert',
};

export interface BadgeProps {
  tone?: 'neutral' | 'accent' | 'success';
  icon?: string;
  children: ComponentChildren;
}

export function Badge({ tone = 'neutral', icon, children }: BadgeProps) {
  return (
    <span class={styles.badge} data-tone={tone}>
      {icon ? <Icon name={icon} /> : null}
      {children}
    </span>
  );
}

export function Kbd({ children }: { children: ComponentChildren }) {
  return <kbd class={styles.kbd}>{children}</kbd>;
}

export interface InlineAlertProps {
  tone: Tone;
  title?: string | undefined;
  children?: ComponentChildren;
  id?: string;
  /** Use "alert" for errors that appear after an action; defaults to a passive note. */
  role?: 'alert' | 'status' | 'note';
}

/** Tone is always conveyed by icon and text, never colour alone. */
export function InlineAlert({ tone, title, children, id, role = 'note' }: InlineAlertProps) {
  return (
    <div id={id} class={styles.alert} data-tone={tone} role={role}>
      <Icon name={TONE_ICON[tone]} />
      <div class={styles.alertBody}>
        {title ? <p class={styles.alertTitle}>{title}</p> : null}
        {children}
      </div>
    </div>
  );
}

/** A transient message announced politely by screen readers. */
export function useToast(durationMs = 3000): [string, (message: string) => void] {
  const [message, setMessage] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const show = useCallback(
    (next: string) => {
      if (timer.current) clearTimeout(timer.current);
      setMessage(next);
      timer.current = setTimeout(() => setMessage(''), durationMs);
    },
    [durationMs],
  );
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  return [message, show];
}

export function Toast({ message }: { message: string }) {
  return (
    <div class={`${styles.toast} no-print`} role="status" aria-live="polite">
      {message}
    </div>
  );
}
