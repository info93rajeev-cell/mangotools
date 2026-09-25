import type { ToolSnapshot, ToolStore } from '@mangotools/runtime';
import type { ResolvedPreset } from '@mangotools/schemas';
import { InlineAlert } from '../primitives/feedback.tsx';
import { t } from '../strings/en.ts';
import { OptionControls } from '../toolkit/OptionControls.tsx';
import {
  label,
  messageFor,
  type OutputRow,
  outputRows,
  reconcileOptions,
  visibleEntries,
} from '../toolkit/presentation.ts';
import styles from '../toolkit/toolkit.module.css';
import { type WorkingStep, WorkingSteps } from '../toolkit/WorkingSteps.tsx';
import { CalculatorFields } from './CalculatorFields.tsx';

export interface CalculatorLayoutProps {
  idPrefix: string;
  preset: ResolvedPreset;
  snapshot: ToolSnapshot;
  store: ToolStore;
}

function ResultRows({ rows }: { rows: OutputRow[] }) {
  const [primary, ...rest] = rows;
  if (!primary) return null;
  return (
    <div>
      <div class={styles.primary} aria-live="polite" aria-atomic="true" data-primary-result="">
        <span class={styles.primaryLabel}>{primary.label}</span>
        <output class={styles.primaryValue}>{primary.value}</output>
      </div>
      {rest.length > 0 ? (
        <dl class={styles.rows}>
          {rest.map((row) => (
            <div key={row.key} class={styles.row} data-output={row.key}>
              <dt>{row.label}</dt>
              <dd>{row.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </div>
  );
}

interface ResultSectionProps {
  idPrefix: string;
  preset: ResolvedPreset;
  snapshot: ToolSnapshot;
  /** Set when the error is already shown next to its field. */
  fieldError: string | null;
}

function ResultSection({ idPrefix, preset, snapshot, fieldError }: ResultSectionProps) {
  const { values, phase, error, result, missing } = snapshot;
  const rows = result && phase !== 'error' ? outputRows(preset, result.value, values) : [];
  const steps = (result?.value.working as WorkingStep[] | undefined) ?? [];
  const current = result && phase !== 'error' ? result : null;
  const missingNames = missing.map((key) =>
    label(preset, preset.fields[key]?.labelKey).toLowerCase(),
  );
  const placeholder =
    missingNames.length > 0
      ? t('result.missing', { fields: missingNames.join(', ') })
      : t('result.empty');
  return (
    <section
      class={`${styles.panel} ${styles.result}`}
      aria-labelledby={`${idPrefix}-result-title`}
    >
      <h2 id={`${idPrefix}-result-title`} class={styles.panelTitle}>
        {t('result.title')}
      </h2>
      {rows.length > 0 ? <ResultRows rows={rows} /> : null}
      {rows.length === 0 && phase !== 'error' ? (
        <p class={styles.placeholder}>{placeholder}</p>
      ) : null}
      {phase === 'error' && error ? (
        <InlineAlert tone="danger" title={t('error.title')} role="alert">
          {fieldError ? null : <p>{messageFor(preset, error)}</p>}
        </InlineAlert>
      ) : null}
      {current?.warnings.map((w) => (
        <InlineAlert key={w.code} tone="warning">
          {messageFor(preset, w)}
        </InlineAlert>
      ))}
      {current ? <WorkingSteps preset={preset} steps={steps} /> : null}
    </section>
  );
}

/** Archetype B: fields on the left, the result with its working on the right. */
export function CalculatorLayout({ idPrefix, preset, snapshot, store }: CalculatorLayoutProps) {
  const { values, error } = snapshot;
  const fields = visibleEntries(preset.fields, values);
  const fieldError = error?.path && fields.some(([key]) => key === error.path) ? error.path : null;
  const errorFor = (key: string) =>
    error && key === fieldError ? messageFor(preset, error) : null;
  return (
    <div class={styles.calculator}>
      <section class={styles.panel} aria-label={t('input.label')}>
        <OptionControls
          idPrefix={idPrefix}
          preset={preset}
          values={values}
          onChange={(key, next) =>
            store.setMany(reconcileOptions(preset, { ...values, [key]: next }))
          }
        />
        <CalculatorFields
          idPrefix={idPrefix}
          preset={preset}
          fields={fields}
          values={values}
          errorFor={errorFor}
          onValue={(key, next) => store.set(key, next)}
        />
      </section>
      <ResultSection
        idPrefix={idPrefix}
        preset={preset}
        snapshot={snapshot}
        fieldError={fieldError}
      />
    </div>
  );
}
