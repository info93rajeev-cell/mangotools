import type { ToolSnapshot, ToolStore } from '@mangotools/runtime';
import type { ResolvedPreset } from '@mangotools/schemas';
import { Button } from '../primitives/Button.tsx';
import { InlineAlert } from '../primitives/feedback.tsx';
import { t } from '../strings/en.ts';
import { applyFieldEdit } from '../toolkit/fieldEffects.ts';
import { OptionControls } from '../toolkit/OptionControls.tsx';
import {
  label,
  messageFor,
  type OutputRow,
  outputRows,
  reconcileOptions,
  visibleEntries,
} from '../toolkit/presentation.ts';
import {
  AssumptionList,
  NoteList,
  partitionNotices,
  WarningAlerts,
} from '../toolkit/ResultNotices.tsx';
import styles from '../toolkit/toolkit.module.css';
import { type WorkingStep, WorkingSteps } from '../toolkit/WorkingSteps.tsx';
import { CalculatorFields } from './CalculatorFields.tsx';

export interface CalculatorLayoutProps {
  idPrefix: string;
  preset: ResolvedPreset;
  snapshot: ToolSnapshot;
  store: ToolStore;
  actions: CalculatorWorkspaceActions;
}

export interface CalculatorWorkspaceActions {
  hasResult: boolean;
  onTrySample?: (() => void) | undefined;
  onCopy: () => void;
  onPrint?: (() => void) | undefined;
  onTransfer?: (() => void) | undefined;
  transferLabel?: string | undefined;
  onReset: () => void;
}

function InputPanelHead({ actions }: { actions: CalculatorWorkspaceActions }) {
  return (
    <div class={`${styles.panelHead} no-print`}>
      <h2 class={styles.panelTitle}>{t('input.label')}</h2>
      <div class={styles.panelTools}>
        {actions.onTrySample ? (
          <Button size="sm" variant="primary" icon="sparkles" onClick={actions.onTrySample}>
            {t('action.trySample')}
          </Button>
        ) : null}
        <Button size="sm" variant="ghost" icon="rotate-ccw" onClick={actions.onReset}>
          {t('action.reset')}
        </Button>
      </div>
    </div>
  );
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
  actions: CalculatorWorkspaceActions;
}

function displayedNotices(preset: ResolvedPreset, warnings: ToolSnapshot['result']) {
  const notices = partitionNotices(warnings?.warnings ?? []);
  if (preset.ui.collapseNotices !== true) return notices;
  return {
    warnings: notices.warnings,
    assumptions: [],
    notes: [...notices.assumptions, ...notices.notes],
  };
}

function ResultPanelHead({ idPrefix, actions }: Pick<ResultSectionProps, 'idPrefix' | 'actions'>) {
  return (
    <div class={`${styles.panelHead} no-print`}>
      <h2 id={`${idPrefix}-result-title`} class={styles.panelTitle}>
        {t('result.title')}
      </h2>
      <div class={styles.panelTools}>
        <Button size="sm" icon="copy" onClick={actions.onCopy} disabled={!actions.hasResult}>
          {t('action.copyResult')}
        </Button>
        {actions.onPrint ? (
          <Button size="sm" icon="printer" onClick={actions.onPrint} disabled={!actions.hasResult}>
            {t('action.print')}
          </Button>
        ) : null}
        {actions.onTransfer && actions.transferLabel ? (
          <Button
            size="sm"
            icon="arrow-right"
            onClick={actions.onTransfer}
            disabled={!actions.hasResult}
          >
            {actions.transferLabel}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function ResultSection({ idPrefix, preset, snapshot, fieldError, actions }: ResultSectionProps) {
  const { values, phase, error, result, missing } = snapshot;
  const rows = result && phase !== 'error' ? outputRows(preset, result.value, values) : [];
  const steps = (result?.value.working as WorkingStep[] | undefined) ?? [];
  const current = result && phase !== 'error' ? result : null;
  const notices = displayedNotices(preset, current);
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
      data-result-panel=""
    >
      <ResultPanelHead idPrefix={idPrefix} actions={actions} />
      {rows.length > 0 ? <ResultRows rows={rows} /> : null}
      {rows.length === 0 && phase !== 'error' ? (
        <p class={styles.placeholder}>{placeholder}</p>
      ) : null}
      {phase === 'error' && error ? (
        <InlineAlert tone="danger" title={t('error.title')} role="alert">
          {fieldError ? null : <p>{messageFor(preset, error)}</p>}
        </InlineAlert>
      ) : null}
      <WarningAlerts preset={preset} notices={notices.warnings} />
      <AssumptionList preset={preset} notices={notices.assumptions} />
      {current ? <WorkingSteps preset={preset} steps={steps} /> : null}
      <NoteList preset={preset} notices={notices.notes} />
    </section>
  );
}

/** Archetype B: fields on the left, the result with its working on the right. */
export function CalculatorLayout({
  idPrefix,
  preset,
  snapshot,
  store,
  actions,
}: CalculatorLayoutProps) {
  const { values, error } = snapshot;
  const fields = visibleEntries(preset.fields, values);
  // A list field's own error path points inside it (e.g. "openings[0].width").
  const fieldError =
    fields
      .map(([key]) => key)
      .find((key) => error?.path === key || error?.path?.startsWith(`${key}[`)) ?? null;
  const errorFor = (key: string) =>
    error && key === fieldError ? messageFor(preset, error) : null;
  return (
    <div class={styles.calculator} data-density={preset.ui.density ?? 'comfortable'}>
      <section class={styles.panel} aria-label={t('input.label')} data-input-panel="">
        <InputPanelHead actions={actions} />
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
          errorPath={error?.path}
          onValue={(key, next) => store.setMany(applyFieldEdit(preset, values, key, next))}
        />
      </section>
      <ResultSection
        idPrefix={idPrefix}
        preset={preset}
        snapshot={snapshot}
        fieldError={fieldError}
        actions={actions}
      />
    </div>
  );
}
