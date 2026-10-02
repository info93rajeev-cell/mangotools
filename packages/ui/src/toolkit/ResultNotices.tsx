import type { OpWarning } from '@mangotools/core';
import type { ResolvedPreset } from '@mangotools/schemas';
import { InlineAlert } from '../primitives/feedback.tsx';
import { t } from '../strings/en.ts';
import { messageFor } from './presentation.ts';
import styles from './toolkit.module.css';

/**
 * Splits a result's notices by the engine's `severity` detail:
 * - `assumption` — estimating/product assumptions that shaped this result, listed right under it;
 * - `info` — standing explanations, as compact notes (never alarming banners);
 * - anything else — a real warning about an unusual value.
 */
export function partitionNotices(notices: readonly OpWarning[]) {
  const assumptions = notices.filter((n) => n.details?.severity === 'assumption');
  const notes = notices.filter((n) => n.details?.severity === 'info');
  const warnings = notices.filter((n) => !n.details?.severity);
  return { assumptions, notes, warnings };
}

export function AssumptionList({
  preset,
  notices,
}: {
  preset: ResolvedPreset;
  notices: OpWarning[];
}) {
  if (notices.length === 0) return null;
  return (
    <section class={styles.activeAssumptions} data-assumptions="">
      <h3 class={styles.notesTitle}>{t('notes.assumptions')}</h3>
      <ul class={styles.noteList}>
        {notices.map((n) => (
          <li key={n.code}>{messageFor(preset, n)}</li>
        ))}
      </ul>
    </section>
  );
}

export function WarningAlerts({
  preset,
  notices,
}: {
  preset: ResolvedPreset;
  notices: OpWarning[];
}) {
  return (
    <>
      {notices.map((w) => (
        <InlineAlert key={w.code} tone="warning">
          {messageFor(preset, w)}
        </InlineAlert>
      ))}
    </>
  );
}

export function NoteList({ preset, notices }: { preset: ResolvedPreset; notices: OpWarning[] }) {
  if (notices.length === 0) return null;
  return (
    <details class={`${styles.notes} ${styles.noticeDisclosure}`} data-notes="">
      <summary>{t('notes.important')}</summary>
      <ul class={styles.noteList}>
        {notices.map((n) => (
          <li key={n.code}>{messageFor(preset, n)}</li>
        ))}
      </ul>
    </details>
  );
}
