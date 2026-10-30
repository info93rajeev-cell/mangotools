import type { ToolSnapshot, ToolStore } from '@mangotools/runtime';
import {
  createPreferences,
  decodeTransferHash,
  filterTransferValues,
  hasTransferHash,
  track,
} from '@mangotools/runtime';
import type { ResolvedPreset } from '@mangotools/schemas';
import { useEffect, useRef, useState } from 'preact/hooks';
import {
  CalculatorLayout,
  type CalculatorWorkspaceActions,
} from '../archetypes/CalculatorLayout.tsx';
import { FileToolLayout } from '../archetypes/FileToolLayout.tsx';
import { TransformLayout } from '../archetypes/TransformLayout.tsx';
import type { FilePhase } from '../archetypes/useFileTool.ts';
import { Button } from '../primitives/Button.tsx';
import { InlineAlert, Toast, useToast } from '../primitives/feedback.tsx';
import { t } from '../strings/en.ts';
import { ActionBar, type ActionBarProps } from './ActionBar.tsx';
import { amazonManualProfitabilityInput } from './amazonManualProfitabilityInput.ts';
import { DynamicAmazonFeeLayout } from './DynamicAmazonFeeLayout.tsx';
import { DynamicLogisticsLayout } from './DynamicLogisticsLayout.tsx';
import { DynamicMarkupCalculatorLayout } from './DynamicMarkupCalculatorLayout.tsx';
import { DynamicPdfDocumentLayout } from './DynamicPdfDocumentLayout.tsx';
import { DynamicSellerProfitabilityLayout } from './DynamicSellerProfitabilityLayout.tsx';
import { DynamicUniversalTaxLayout } from './DynamicUniversalTaxLayout.tsx';
import { renderDataStudioLayout } from './data-studio/dataStudioDispatch.tsx';
import { InvoiceItemsLayout } from './InvoiceItemsLayout.tsx';
import { renderImageStudioLayout } from './imageStudioDispatch.tsx';
import { PackingListItemsLayout } from './PackingListItemsLayout.tsx';
import { shapeIncomingPackingTransfer } from './packingItems.ts';
import { label } from './presentation.ts';
import { configureToolActions } from './toolActions.ts';
import styles from './toolkit.module.css';
import { useToolStore } from './useToolStore.ts';

const INVOICE_MULTI_ITEM_PRESET_ID = 'export/invoice-commercial';
const PACKING_LIST_MULTI_ITEM_PRESET_ID = 'export/packing-list';
const CBM_SHIPMENT_PRESET_ID = 'logistics/cbm-shipment';
const DATA_STUDIO_TOOL_IDS = new Set([
  'json-formatter',
  'base64-encode-decode',
  'url-encode-decode',
  'csv-to-json',
  'json-to-csv',
  'timestamp-converter',
]);
const BUSINESS_STUDIO_TOOL_IDS = new Set([
  'gst-calculator',
  'profit-margin-calculator',
  'amazon-india-seller-fee-profit-estimator',
  'markup-calculator',
]);
const PDF_STUDIO_TOOL_IDS = new Set([
  'pdf-merge',
  'pdf-split',
  'compress-pdf',
  'pdf-to-word',
  'word-to-pdf',
]);
export interface ToolIslandProps {
  toolId: string;
  archetype: 'A' | 'B' | 'D';
  preset: ResolvedPreset;
  sampleId: string | null;
  /** Offer Print (calculators with capabilities.print). */
  print: boolean;
  /** Shows browser-local saved-preset manager on standard calculator. */
  enableUserPresets?: boolean;
}
interface TopBarProps {
  sampleId: string | null;
  onTrySample: () => void;
}
function TopBar({ sampleId, onTrySample }: TopBarProps) {
  if (!sampleId) return null;
  return (
    <div class={`${styles.topRow} no-print`}>
      <div class={styles.topActions}>
        <Button variant="primary" icon="sparkles" onClick={onTrySample} data-try-sample="">
          {t('action.trySample')}
        </Button>
      </div>
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
 * Consumes a one-shot transfer hash on mount without server round-trip. Strips hash once consumed.
 * Shapes flat items for packing list transfers if necessary.
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
  calculatorActions: CalculatorWorkspaceActions;
  enableUserPresets?: boolean | undefined;
}
const isStandardCalculator = (
  archetype: ToolIslandProps['archetype'],
  presetId: string,
  toolId?: string,
) =>
  archetype === 'B' &&
  presetId !== INVOICE_MULTI_ITEM_PRESET_ID &&
  presetId !== PACKING_LIST_MULTI_ITEM_PRESET_ID &&
  !BUSINESS_STUDIO_TOOL_IDS.has(toolId ?? '');
interface ToolIslandViewProps extends ArchetypeProps {
  sampleId: string | null;
  displayPhase: FilePhase | ToolSnapshot['phase'];
  standardCalculator: boolean;
  transferred: boolean;
  actionBar: ActionBarProps;
  message: string;
}

function ToolIslandView(props: ToolIslandViewProps) {
  const {
    toolId,
    archetype,
    preset,
    sampleId,
    displayPhase,
    standardCalculator,
    transferred,
    actionBar,
    message,
    ...layoutProps
  } = props;
  const isDataStudio = DATA_STUDIO_TOOL_IDS.has(toolId);
  const isPdfStudio = PDF_STUDIO_TOOL_IDS.has(toolId);
  const isCustomStudio = isDataStudio || BUSINESS_STUDIO_TOOL_IDS.has(toolId) || isPdfStudio;
  return (
    <div class={styles.island} data-tool-island={toolId} data-phase={displayPhase}>
      {standardCalculator || isCustomStudio ? null : (
        <TopBar sampleId={sampleId} onTrySample={() => props.calculatorActions.onTrySample?.()} />
      )}
      <TransferNotice preset={preset} idPrefix={props.idPrefix} visible={transferred} />
      <ArchetypeLayout {...layoutProps} preset={preset} toolId={toolId} archetype={archetype} />
      {archetype === 'D' || standardCalculator || isCustomStudio ? null : (
        <ActionBar {...actionBar} />
      )}
      <Toast message={message} />
    </div>
  );
}

function renderSpecialCalculators(props: ArchetypeProps) {
  const { toolId, preset, idPrefix, snapshot, store, notify } = props;
  if (toolId === 'gst-calculator') {
    return <DynamicUniversalTaxLayout notify={notify} />;
  }
  if (toolId === 'profit-margin-calculator') {
    return <DynamicSellerProfitabilityLayout notify={notify} />;
  }
  if (toolId === 'amazon-india-seller-fee-profit-estimator') {
    return <DynamicAmazonFeeLayout notify={notify} />;
  }
  if (toolId === 'markup-calculator') {
    return <DynamicMarkupCalculatorLayout notify={notify} />;
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
  return null;
}

/** The one layout matching this tool's archetype. */
function ArchetypeLayout(props: ArchetypeProps) {
  const {
    archetype,
    idPrefix,
    toolId,
    preset,
    snapshot,
    store,
    notify,
    onFilePhase,
    calculatorActions,
    enableUserPresets,
  } = props;

  const studio = renderImageStudioLayout(props);
  if (studio) return studio;

  const dataStudio = renderDataStudioLayout(props);
  if (dataStudio) return dataStudio;

  const special = renderSpecialCalculators(props);
  if (special) return special;

  if (PDF_STUDIO_TOOL_IDS.has(toolId)) {
    return <DynamicPdfDocumentLayout toolId={toolId} notify={notify} />;
  }

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
  return (
    <CalculatorLayout
      idPrefix={idPrefix}
      preset={preset}
      snapshot={snapshot}
      store={store}
      actions={calculatorActions}
      userPresets={enableUserPresets ? { toolId } : undefined}
    />
  );
}

/** The interactive part of a tool page: sample, archetype layout, actions and notifications. */
function StandardToolIsland({
  toolId,
  archetype,
  preset,
  sampleId,
  print,
  enableUserPresets,
}: ToolIslandProps) {
  const [snapshot, store] = useToolStore(
    preset,
    undefined,
    preset.id === 'estimate/amazon.manual-profitability'
      ? amazonManualProfitabilityInput
      : undefined,
  );
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
  const standardCalculator = isStandardCalculator(archetype, preset.id);
  const { workspace, actionBar } = configureToolActions({
    toolId,
    archetype,
    preset,
    sampleId,
    print,
    snapshot,
    store,
    notify,
  });
  return (
    <ToolIslandView
      archetype={archetype}
      idPrefix={idPrefix}
      toolId={toolId}
      preset={preset}
      snapshot={snapshot}
      store={store}
      notify={notify}
      onFilePhase={setFilePhase}
      calculatorActions={workspace}
      sampleId={sampleId}
      displayPhase={displayPhase}
      standardCalculator={standardCalculator}
      transferred={transferred}
      actionBar={actionBar}
      message={message}
      enableUserPresets={enableUserPresets === true && standardCalculator}
    />
  );
}

export function ToolIsland(props: ToolIslandProps) {
  const { id } = props.preset;
  if (
    id === 'logistics/container-load' ||
    id === CBM_SHIPMENT_PRESET_ID ||
    id === 'logistics/pallet' ||
    id === 'logistics/volumetric' ||
    props.toolId === 'container-loading-calculator' ||
    props.toolId === 'cbm-calculator' ||
    props.toolId === 'pallet-loading-calculator' ||
    props.toolId === 'volumetric-weight-calculator'
  ) {
    return <DynamicLogisticsLayout {...props} />;
  }
  return <StandardToolIsland {...props} />;
}
