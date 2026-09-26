import type { ToolSnapshot, ToolStore } from '@mangotools/runtime';
import { createPreferences, track } from '@mangotools/runtime';
import type { ResolvedPreset } from '@mangotools/schemas';
import { useEffect, useRef, useState } from 'preact/hooks';
import { CalculatorLayout } from '../archetypes/CalculatorLayout.tsx';
import { FileToolLayout } from '../archetypes/FileToolLayout.tsx';
import { TransformLayout } from '../archetypes/TransformLayout.tsx';
import type { FilePhase } from '../archetypes/useFileTool.ts';
import { partsToText, renderTemplate } from '../format/template.ts';
import { Button } from '../primitives/Button.tsx';
import { Toast, useToast } from '../primitives/feedback.tsx';
import { Icon } from '../primitives/Icon.tsx';
import { t } from '../strings/en.ts';
import { ActionBar } from './ActionBar.tsx';
import { copyText } from './actions.ts';
import { outputRows, presetCurrency } from './presentation.ts';
import styles from './toolkit.module.css';
import { useToolStore } from './useToolStore.ts';
import type { WorkingStep } from './WorkingSteps.tsx';

export interface ToolIslandProps {
  toolId: string;
  archetype: 'A' | 'B' | 'D';
  preset: ResolvedPreset;
  sampleId: string | null;
  /** Offer Print (calculators with capabilities.print). */
  print: boolean;
  /** Id of the "How to use" section, when the page has one. */
  howToId: string | null;
}

/** Plain-text summary of a calculator result, for the clipboard. */
function resultText(
  preset: ResolvedPreset,
  value: Record<string, unknown>,
  state: Record<string, string | boolean>,
) {
  const lines = outputRows(preset, value, state).map((row) => `${row.label}: ${row.value}`);
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

interface TopBarProps {
  sampleId: string | null;
  howToId: string | null;
  onTrySample: () => void;
}

function TopBar({ sampleId, howToId, onTrySample }: TopBarProps) {
  return (
    <div class={`${styles.topRow} no-print`}>
      <div class={styles.topActions}>
        {sampleId ? (
          <Button variant="primary" icon="sparkles" onClick={onTrySample} data-try-sample="">
            {t('action.trySample')}
          </Button>
        ) : null}
      </div>
      {howToId ? (
        <a class={styles.howTo} href={`#${howToId}`}>
          <Icon name="info" />
          {t('action.howToUse')}
        </a>
      ) : null}
    </div>
  );
}

interface ArchetypeProps {
  archetype: ToolIslandProps['archetype'];
  idPrefix: string;
  toolId: string;
  preset: ResolvedPreset;
  snapshot: ToolSnapshot;
  store: ToolStore;
  notify: (message: string) => void;
  onFilePhase: (phase: FilePhase) => void;
}

/** The one layout matching this tool's archetype. */
function ArchetypeLayout({
  archetype,
  idPrefix,
  toolId,
  preset,
  snapshot,
  store,
  notify,
  onFilePhase,
}: ArchetypeProps) {
  if (archetype === 'A') {
    return (
      <TransformLayout
        idPrefix={idPrefix}
        toolId={toolId}
        preset={preset}
        snapshot={snapshot}
        store={store}
        notify={notify}
      />
    );
  }
  if (archetype === 'D') {
    return (
      <FileToolLayout
        idPrefix={idPrefix}
        toolId={toolId}
        preset={preset}
        notify={notify}
        onPhase={onFilePhase}
      />
    );
  }
  return <CalculatorLayout idPrefix={idPrefix} preset={preset} snapshot={snapshot} store={store} />;
}

/** The interactive part of a tool page: sample, archetype layout, actions and notifications. */
export function ToolIsland({
  toolId,
  archetype,
  preset,
  sampleId,
  print,
  howToId,
}: ToolIslandProps) {
  const [snapshot, store] = useToolStore(preset);
  const [message, notify] = useToast();
  const ran = useRef(false);
  const idPrefix = `tool-${toolId}`;
  const [filePhase, setFilePhase] = useState<FilePhase>('idle');
  const displayPhase = archetype === 'D' ? filePhase : snapshot.phase;

  useEffect(() => {
    createPreferences().addRecentTool(toolId);
    track('tool_view', { toolId });
  }, [toolId]);

  useEffect(() => {
    if (snapshot.phase !== 'result' || ran.current) return;
    ran.current = true;
    track('tool_run', { toolId });
  }, [snapshot.phase, toolId]);

  const trySample = async () => {
    if (!sampleId) return;
    await store.loadSample(sampleId);
    track('sample_load', { toolId });
  };
  const copySummary = async () => {
    if (!snapshot.result) return;
    const ok = await copyText(resultText(preset, snapshot.result.value, snapshot.values));
    notify(ok ? t('toast.copied') : t('toast.copyFailed'));
    if (ok) track('tool_complete', { toolId, method: 'copy' });
  };
  const printResult = () => {
    track('tool_complete', { toolId, method: 'print' });
    window.print();
  };
  const hasResult = snapshot.result !== null && snapshot.phase !== 'error';

  return (
    <div class={styles.island} data-tool-island={toolId} data-phase={displayPhase}>
      <TopBar sampleId={sampleId} howToId={howToId} onTrySample={() => void trySample()} />
      <ArchetypeLayout
        archetype={archetype}
        idPrefix={idPrefix}
        toolId={toolId}
        preset={preset}
        snapshot={snapshot}
        store={store}
        notify={notify}
        onFilePhase={setFilePhase}
      />
      {archetype === 'D' ? null : (
        <ActionBar
          hasResult={hasResult}
          onCopy={archetype === 'B' ? () => void copySummary() : undefined}
          onPrint={archetype === 'B' && print ? printResult : undefined}
          onReset={() => store.reset()}
        />
      )}
      <Toast message={message} />
    </div>
  );
}
