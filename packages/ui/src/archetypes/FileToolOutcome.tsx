import type { OpError } from '@mangotools/core';
import type { ResolvedPreset } from '@mangotools/schemas';
import { InlineAlert } from '../primitives/feedback.tsx';
import { messageFor, outputRows } from '../toolkit/presentation.ts';
import styles from '../toolkit/toolkit.module.css';
import type { FilePhase, FileToolResult } from './useFileTool.ts';

export interface FileToolOutcomeProps {
  preset: ResolvedPreset;
  phase: FilePhase;
  result: FileToolResult | null;
  error: OpError | null;
}

/**
 * The error alert or the result summary: a large primary count (files merged, images converted,
 * ...) plus any other output fields, all driven by the preset's own `outputs` map — the same
 * mechanism archetypes A and B use — so a new file tool needs no new rendering code, only a
 * preset with the right `outputs` and `strings`.
 */
export function FileToolOutcome({ preset, phase, result, error }: FileToolOutcomeProps) {
  if (phase === 'error' && error) {
    return (
      <InlineAlert tone="danger" role="alert">
        {messageFor(preset, error)}
      </InlineAlert>
    );
  }
  if (phase !== 'result' || !result) return null;
  const rows = outputRows(preset, result, {});
  const [primary, ...secondary] = rows;
  return (
    <div class={styles.result}>
      {primary ? (
        <div class={styles.primary} aria-live="polite" aria-atomic="true" data-primary-result="">
          <span class={styles.primaryLabel}>{primary.label}</span>
          <output class={styles.primaryValue}>{primary.value}</output>
        </div>
      ) : null}
      <dl class={styles.rows}>
        {secondary.map((row) => (
          <div class={styles.row} key={row.key} data-output={row.key}>
            <dt>{row.label}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>
      {result.warnings.map((w) => (
        <InlineAlert key={w.code} tone="warning">
          {messageFor(preset, w)}
        </InlineAlert>
      ))}
    </div>
  );
}
