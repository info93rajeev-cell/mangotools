import type { OpError } from '@mangotools/core';
import type { ResolvedPreset } from '@mangotools/schemas';
import { InlineAlert } from '../primitives/feedback.tsx';
import { t } from '../strings/en.ts';
import { messageFor } from '../toolkit/presentation.ts';
import styles from '../toolkit/toolkit.module.css';
import type { FilePhase, MergeResult } from './useFileTool.ts';

export interface MergeOutcomeProps {
  preset: ResolvedPreset;
  phase: FilePhase;
  result: MergeResult | null;
  error: OpError | null;
}

/** The error alert or the result summary (files merged, pages, output name, warnings). */
export function MergeOutcome({ preset, phase, result, error }: MergeOutcomeProps) {
  if (phase === 'error' && error) {
    return (
      <InlineAlert tone="danger" role="alert">
        {messageFor(preset, error)}
      </InlineAlert>
    );
  }
  if (phase !== 'result' || !result) return null;
  return (
    <div class={styles.result}>
      <div class={styles.primary} aria-live="polite" aria-atomic="true" data-primary-result="">
        <span class={styles.primaryLabel}>{t('fileTool.filesMerged')}</span>
        <output class={styles.primaryValue}>{result.fileCount}</output>
      </div>
      <dl class={styles.rows}>
        <div class={styles.row} data-output="totalPageCount">
          <dt>{t('fileTool.totalPages')}</dt>
          <dd>{result.totalPageCount}</dd>
        </div>
        <div class={styles.row} data-output="fileName">
          <dt>{t('fileTool.outputFile')}</dt>
          <dd>{result.fileName}</dd>
        </div>
      </dl>
      {result.warnings.map((w) => (
        <InlineAlert key={w.code} tone="warning">
          {messageFor(preset, w)}
        </InlineAlert>
      ))}
    </div>
  );
}
