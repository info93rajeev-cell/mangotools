import type { ToolSnapshot, ToolStore } from '@mangotools/runtime';
import {
  createPreferences,
  decodeTransferHash,
  encodeTransferHash,
  filterTransferValues,
  hasTransferHash,
  pickTransferValues,
  track,
} from '@mangotools/runtime';
import type { ResolvedPreset } from '@mangotools/schemas';
import { useEffect, useRef, useState } from 'preact/hooks';
import { CalculatorLayout } from '../archetypes/CalculatorLayout.tsx';
import { FileToolLayout } from '../archetypes/FileToolLayout.tsx';
import { TransformLayout } from '../archetypes/TransformLayout.tsx';
import type { FilePhase } from '../archetypes/useFileTool.ts';
import { partsToText, renderTemplate } from '../format/template.ts';
import { Button } from '../primitives/Button.tsx';
import { InlineAlert, Toast, useToast } from '../primitives/feedback.tsx';
import { Icon } from '../primitives/Icon.tsx';
import { t } from '../strings/en.ts';
import { ActionBar } from './ActionBar.tsx';
import { copyText } from './actions.ts';
import { InvoiceItemsLayout } from './InvoiceItemsLayout.tsx';
import { invoiceTransferValues } from './invoiceItems.ts';
import { PackingListItemsLayout } from './PackingListItemsLayout.tsx';
import { shapeIncomingPackingTransfer } from './packingItems.ts';
import { label, outputRows, presetCurrency } from './presentation.ts';
import styles from './toolkit.module.css';
import { useToolStore } from './useToolStore.ts';
import type { WorkingStep } from './WorkingSteps.tsx';

/**
 * The two tools with per-tool UI logic on the platform: their item rows can't be described by a flat
 * preset field, so each gets its own layout (see `InvoiceItemsLayout.tsx`/`PackingListItemsLayout.tsx`
 * and TASK-009G/TASK-009I's reports for why this is a small, explicit special case rather than a new
 * generic archetype or field kind). Every other tool renders through the ordinary `ArchetypeLayout`
 * switch below, completely unaffected.
 */
const INVOICE_MULTI_ITEM_PRESET_ID = 'export/invoice-commercial';
const PACKING_LIST_MULTI_ITEM_PRESET_ID = 'export/packing-list';

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

/** Shown once, only when this page's fields were just seeded via another tool's transfer button. */
function TransferNotice({
  preset,
  idPrefix,
  visible,
}: {
  preset: ResolvedPreset;
  idPrefix: string;
  visible: boolean;
}) {
  if (!visible || !preset.ui.transferNoticeKey) return null;
  return (
    <InlineAlert tone="info" role="status" id={`${idPrefix}-transfer-notice`}>
      <p data-transfer-notice="">{label(preset, preset.ui.transferNoticeKey)}</p>
    </InlineAlert>
  );
}

/**
 * Consumes a one-shot transfer hash on mount, if this page was opened via another tool's transfer
 * button (see preset `ui.transferTo`). The payload lives only in the URL's hash fragment, which the
 * browser never sends to any server, so it never reaches a log, an analytics call, or MangoTools
 * itself. Consumed once, then the hash is always stripped so a later reload of this same URL never
 * re-applies it. Returns whether a transfer was applied, for a one-time "review these" notice.
 *
 * The Packing List Generator's own flat `itemDescription`/`itemSku`/`itemUnit`/`itemCountryOfOrigin`
 * fields were replaced by its `items` array (TASK-009I); the Invoice's transfer payload still sends
 * those exact flat keys (its `transferTo.fields` list is unchanged), so without shaping them first they
 * would be silently dropped by `filterTransferValues` below and a previously-working single-item
 * transfer would stop populating any item at all. `shapeIncomingPackingTransfer` folds them into one
 * row instead — see its own comment for why this is not a new multi-row transfer.
 */
function useIncomingTransfer(preset: ResolvedPreset, store: ToolStore): boolean {
  const [transferred, setTransferred] = useState(false);
  useEffect(() => {
    if (!hasTransferHash(window.location.hash)) return;
    const payload = decodeTransferHash(window.location.hash);
    const shaped =
      payload && preset.id === PACKING_LIST_MULTI_ITEM_PRESET_ID
        ? shapeIncomingPackingTransfer(payload)
        : payload;
    const filtered = shaped && filterTransferValues(shaped, Object.keys(preset.fields));
    if (filtered && Object.keys(filtered).length > 0) {
      store.setMany(filtered);
      setTransferred(true);
    }
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
  }, [preset, store]);
  return transferred;
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
  if (preset.id === INVOICE_MULTI_ITEM_PRESET_ID) {
    return (
      <InvoiceItemsLayout idPrefix={idPrefix} preset={preset} snapshot={snapshot} store={store} />
    );
  }
  if (preset.id === PACKING_LIST_MULTI_ITEM_PRESET_ID) {
    return (
      <PackingListItemsLayout
        idPrefix={idPrefix}
        preset={preset}
        snapshot={snapshot}
        store={store}
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
  const transferred = useIncomingTransfer(preset, store);
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
  const transferTo = preset.ui.transferTo;
  const startTransfer = () => {
    if (!transferTo) return;
    const payload = pickTransferValues(invoiceTransferValues(snapshot.values), transferTo.fields);
    track('tool_complete', { toolId, method: 'transfer' });
    window.location.href = `/${transferTo.targetToolId}${encodeTransferHash(payload)}`;
  };

  return (
    <div class={styles.island} data-tool-island={toolId} data-phase={displayPhase}>
      <TopBar sampleId={sampleId} howToId={howToId} onTrySample={() => void trySample()} />
      <TransferNotice preset={preset} idPrefix={idPrefix} visible={transferred} />
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
          onTransfer={archetype === 'B' && transferTo ? startTransfer : undefined}
          transferLabel={transferTo ? label(preset, transferTo.buttonLabelKey) : undefined}
          onReset={() => store.reset()}
        />
      )}
      <Toast message={message} />
    </div>
  );
}
