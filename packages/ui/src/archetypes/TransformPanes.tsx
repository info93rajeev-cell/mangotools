import type { OpError, OpWarning } from '@mangotools/core';
import type { ToolPhase } from '@mangotools/runtime';
import type { ResolvedPreset } from '@mangotools/schemas';
import type { ComponentChildren, Ref } from 'preact';
import { useMemo, useRef } from 'preact/hooks';
import { formatBytes, formatDecimal } from '../format/numbers.ts';
import { Button, IconButton } from '../primitives/Button.tsx';
import { InlineAlert } from '../primitives/feedback.tsx';
import { Icon } from '../primitives/Icon.tsx';
import { Textarea } from '../primitives/inputs.tsx';
import { t } from '../strings/en.ts';
import { lineColumn, messageFor, type OutputRow } from '../toolkit/presentation.ts';
import { textStats } from '../toolkit/textStats.ts';
import styles from '../toolkit/toolkit.module.css';

export interface InputPaneProps {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  invalid: boolean;
  textareaRef: Ref<HTMLTextAreaElement>;
  onValue: (value: string) => void;
  onPaste: () => void;
  onClear: () => void;
  onFile: (file: File) => void;
}

export function InputPane(p: InputPaneProps) {
  const fileInput = useRef<HTMLInputElement>(null);
  const stats = useMemo(() => textStats(p.value), [p.value]);
  return (
    <section class={styles.panel} aria-labelledby={`${p.id}-title`}>
      <div class={styles.panelHead}>
        <label id={`${p.id}-title`} for={p.id} class={styles.panelTitle}>
          {p.label}
        </label>
        <div class={styles.panelTools}>
          <Button size="sm" variant="ghost" icon="clipboard-paste" onClick={p.onPaste}>
            {t('action.paste')}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            icon="file-up"
            onClick={() => fileInput.current?.click()}
          >
            {t('action.openFile')}
          </Button>
          <Button size="sm" variant="ghost" icon="x" onClick={p.onClear} disabled={p.value === ''}>
            {t('action.clear')}
          </Button>
          <input
            ref={fileInput}
            type="file"
            hidden
            tabIndex={-1}
            aria-hidden="true"
            onChange={(event) => {
              const file = event.currentTarget.files?.[0];
              if (file) p.onFile(file);
              event.currentTarget.value = '';
            }}
          />
        </div>
      </div>
      <Textarea
        id={p.id}
        mono
        class={styles.code}
        value={p.value}
        placeholder={p.placeholder}
        invalid={p.invalid}
        textareaRef={p.textareaRef}
        onValue={p.onValue}
        wrap="off"
      />
      <p class={styles.meta}>
        <span>
          {t('input.stats', {
            chars: formatDecimal(String(stats.chars), 'international'),
            bytes: formatBytes(stats.bytes),
          })}
        </span>
      </p>
    </section>
  );
}

export interface OutputPaneProps {
  id: string;
  label: string;
  primary: string;
  secondary: OutputRow[];
  hasResult: boolean;
  stale: boolean;
  onCopy: () => void;
  onDownload: () => void;
  children?: ComponentChildren;
}

export function OutputPane(p: OutputPaneProps) {
  return (
    <section class={styles.panel} aria-labelledby={`${p.id}-title`}>
      <div class={styles.panelHead}>
        <label id={`${p.id}-title`} for={p.id} class={styles.panelTitle}>
          {p.label}
        </label>
        <div class={styles.panelTools}>
          <IconButton
            size="sm"
            variant="ghost"
            icon="copy"
            label={t('action.copyResult')}
            onClick={p.onCopy}
            disabled={!p.hasResult}
          />
          <IconButton
            size="sm"
            variant="ghost"
            icon="download"
            label={t('action.download')}
            onClick={p.onDownload}
            disabled={!p.hasResult}
          />
        </div>
      </div>
      <Textarea
        id={p.id}
        mono
        readOnly
        class={[styles.code, p.stale ? styles.stale : ''].join(' ')}
        value={p.primary}
        placeholder={t('output.empty')}
        wrap="off"
      />
      {p.secondary.map((row) => (
        <div key={row.key} class={styles.secondary}>
          <span class={styles.panelTitle}>{row.label}</span>
          <pre>{row.value}</pre>
        </div>
      ))}
      {p.children}
    </section>
  );
}

export interface StatusLineProps {
  preset: ResolvedPreset;
  phase: ToolPhase;
  error: OpError | null;
  warnings: OpWarning[];
  input: string;
  onGoTo: (offset: number) => void;
}

/** Valid / working / error status under the output, with "Go to" for positioned errors. */
export function StatusLine({ preset, phase, error, warnings, input, onGoTo }: StatusLineProps) {
  const offset = typeof error?.details?.offset === 'number' ? error.details.offset : null;
  const where = offset === null ? null : lineColumn(input, offset);
  return (
    <div class={styles.secondary}>
      <p
        class={styles.status}
        data-tone={phase === 'error' ? 'danger' : phase === 'result' ? 'success' : undefined}
        role="status"
      >
        {phase === 'error' && error ? (
          <>
            <Icon name="circle-alert" />
            <span>{messageFor(preset, error)}</span>
          </>
        ) : phase === 'result' ? (
          <>
            <Icon name="circle-check" />
            <span>{t('status.valid')}</span>
          </>
        ) : phase === 'running' ? (
          <span>{t('status.working')}</span>
        ) : null}
      </p>
      {offset !== null && where ? (
        <Button size="sm" onClick={() => onGoTo(offset)}>
          {t('action.goTo', where)}
        </Button>
      ) : null}
      {phase !== 'error'
        ? warnings.map((w) => (
            <InlineAlert key={w.code} tone="warning">
              {messageFor(preset, w)}
            </InlineAlert>
          ))
        : null}
    </div>
  );
}
