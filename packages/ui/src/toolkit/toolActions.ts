import type { ToolSnapshot, ToolStore } from '@mangotools/runtime';
import { encodeTransferHash, pickTransferValues, track } from '@mangotools/runtime';
import type { ResolvedPreset } from '@mangotools/schemas';
import type { CalculatorWorkspaceActions } from '../archetypes/CalculatorLayout.tsx';
import { partsToText, renderTemplate } from '../format/template.ts';
import { t } from '../strings/en.ts';
import type { ActionBarProps } from './ActionBar.tsx';
import { copyText } from './actions.ts';
import { invoiceTransferValues } from './invoiceItems.ts';
import { label, outputRows, presetCurrency } from './presentation.ts';
import type { WorkingStep } from './WorkingSteps.tsx';

interface ConfigureToolActionsProps {
  toolId: string;
  archetype: 'A' | 'B' | 'D';
  preset: ResolvedPreset;
  sampleId: string | null;
  print: boolean;
  snapshot: ToolSnapshot;
  store: ToolStore;
  notify: (message: string) => void;
}

/** Plain-text summary of a calculator result, for the clipboard. */
function resultText(preset: ResolvedPreset, snapshot: ToolSnapshot) {
  if (!snapshot.result) return '';
  const { value } = snapshot.result;
  const lines = outputRows(preset, value, snapshot.values).map(
    (row) => `${row.label}: ${row.value}`,
  );
  const steps = (value.working as WorkingStep[] | undefined) ?? [];
  const currency = presetCurrency(preset);
  for (const step of steps) {
    const template = preset.strings[`work.${step.formulaKey}`];
    if (template)
      lines.push(
        partsToText(
          renderTemplate(template, { ...step.variables, result: step.result }, { currency }),
        ),
      );
  }
  return lines.join('\n');
}

function actionCallbacks(props: ConfigureToolActionsProps) {
  const { toolId, preset, sampleId, snapshot, store, notify } = props;
  const transferTo = preset.ui.transferTo;
  const trySample = async () => {
    if (!sampleId) return;
    await store.loadSample(sampleId);
    track('sample_load', { toolId });
  };
  const copySummary = async () => {
    if (!snapshot.result) return;
    const ok = await copyText(resultText(preset, snapshot));
    notify(ok ? t('toast.copied') : t('toast.copyFailed'));
    if (ok) track('tool_complete', { toolId, method: 'copy' });
  };
  const printResult = () => {
    track('tool_complete', { toolId, method: 'print' });
    window.print();
  };
  const startTransfer = () => {
    if (!transferTo) return;
    const values = invoiceTransferValues(snapshot.values);
    const payload = pickTransferValues(values, transferTo.fields);
    track('tool_complete', { toolId, method: 'transfer' });
    window.location.href = `/${transferTo.targetToolId}${encodeTransferHash(payload)}`;
  };
  return { transferTo, trySample, copySummary, printResult, startTransfer };
}

/** Shared action placement for ordinary calculator panels and the legacy all-in-one action bar. */
export function configureToolActions(props: ConfigureToolActionsProps) {
  const { archetype, preset, sampleId, print, snapshot, store } = props;
  const callbacks = actionCallbacks(props);
  const hasResult = snapshot.result !== null && snapshot.phase !== 'error';
  const transferLabel = callbacks.transferTo
    ? label(preset, callbacks.transferTo.buttonLabelKey)
    : undefined;
  const workspace: CalculatorWorkspaceActions = {
    hasResult,
    onTrySample: sampleId ? () => void callbacks.trySample() : undefined,
    onCopy: () => void callbacks.copySummary(),
    onPrint: print ? callbacks.printResult : undefined,
    onTransfer: transferLabel ? callbacks.startTransfer : undefined,
    transferLabel,
    onReset: () => store.reset(),
  };
  const actionBar: ActionBarProps = {
    hasResult,
    onCopy: archetype === 'B' ? () => void callbacks.copySummary() : undefined,
    onPrint: archetype === 'B' && print ? callbacks.printResult : undefined,
    onTransfer: archetype === 'B' && callbacks.transferTo ? callbacks.startTransfer : undefined,
    transferLabel,
    onReset: () => store.reset(),
  };
  return { workspace, actionBar };
}
