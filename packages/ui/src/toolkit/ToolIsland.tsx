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
import {
  DynamicImageBackgroundRemoverLayout,
  DynamicImageCompressLayout,
  DynamicImageEnlargerLayout,
  DynamicImageFormatConverterLayout,
  DynamicImageMetadataRemoverLayout,
  DynamicImageResizeLayout,
  DynamicImageToPdfLayout,
  DynamicImageWatermarkLayout,
  DynamicPassportPhotoLayout,
  DynamicPhotoSizeReducerLayout,
  DynamicSignatureResizerLayout,
} from './DynamicImageToolLayouts.tsx';
import { DynamicLogisticsLayout } from './DynamicLogisticsLayout.tsx';
import { ImageCropLayout } from './ImageCropLayout.tsx';
import { InvoiceItemsLayout } from './InvoiceItemsLayout.tsx';
import { PackingListItemsLayout } from './PackingListItemsLayout.tsx';
import { shapeIncomingPackingTransfer } from './packingItems.ts';
import { label } from './presentation.ts';
import { configureToolActions } from './toolActions.ts';
import styles from './toolkit.module.css';
import { useToolStore } from './useToolStore.ts';

const INVOICE_MULTI_ITEM_PRESET_ID = 'export/invoice-commercial';
const PACKING_LIST_MULTI_ITEM_PRESET_ID = 'export/packing-list';
const CBM_SHIPMENT_PRESET_ID = 'logistics/cbm-shipment';
const IMAGE_CROP_PRESET_ID = 'image/crop';
const IMAGE_COMPRESS_PRESET_ID = 'image/compress';
const IMAGE_RESIZE_PRESET_ID = 'image/resize';
const IMAGE_ENLARGER_PRESET_ID = 'image/enlarge';
const IMAGE_FORMAT_CONVERTER_PRESET_ID = 'image/convert';
const IMAGE_REMOVE_BACKGROUND_PRESET_ID = 'image/remove-background';
const PHOTO_SIZE_REDUCER_PRESET_ID = 'image/photo-size';
const PASSPORT_PHOTO_PRESET_ID = 'image/passport-photo';
const SIGNATURE_RESIZER_PRESET_ID = 'image/signature';
const IMAGE_METADATA_REMOVER_PRESET_ID = 'image/metadata-remove';
const IMAGE_WATERMARK_PRESET_ID = 'image/watermark';
const JPG_TO_PDF_PRESET_ID = 'pdf/jpg-to-pdf';
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
const isStandardCalculator = (archetype: ToolIslandProps['archetype'], presetId: string) =>
  archetype === 'B' &&
  presetId !== INVOICE_MULTI_ITEM_PRESET_ID &&
  presetId !== PACKING_LIST_MULTI_ITEM_PRESET_ID;
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
  return (
    <div class={styles.island} data-tool-island={toolId} data-phase={displayPhase}>
      {standardCalculator ? null : (
        <TopBar sampleId={sampleId} onTrySample={() => props.calculatorActions.onTrySample?.()} />
      )}
      <TransferNotice preset={preset} idPrefix={props.idPrefix} visible={transferred} />
      <ArchetypeLayout {...layoutProps} preset={preset} toolId={toolId} archetype={archetype} />
      {archetype === 'D' || standardCalculator ? null : <ActionBar {...actionBar} />}
      <Toast message={message} />
    </div>
  );
}

function renderBasicImageStudio({ idPrefix, toolId, preset, notify, onFilePhase }: ArchetypeProps) {
  if (preset.id === IMAGE_CROP_PRESET_ID) {
    return (
      <ImageCropLayout
        idPrefix={idPrefix}
        toolId={toolId}
        preset={preset}
        notify={notify}
        onPhase={onFilePhase}
      />
    );
  }
  if (preset.id === IMAGE_COMPRESS_PRESET_ID) {
    return (
      <DynamicImageCompressLayout
        idPrefix={idPrefix}
        toolId={toolId}
        preset={preset}
        notify={notify}
        onPhase={onFilePhase}
      />
    );
  }
  if (preset.id === IMAGE_RESIZE_PRESET_ID) {
    return (
      <DynamicImageResizeLayout
        idPrefix={idPrefix}
        toolId={toolId}
        preset={preset}
        notify={notify}
        onPhase={onFilePhase}
      />
    );
  }
  return null;
}

function renderAdvancedImageStudio(props: ArchetypeProps) {
  const { idPrefix, toolId, preset, notify, onFilePhase } = props;
  if (preset.id === IMAGE_FORMAT_CONVERTER_PRESET_ID) {
    return (
      <DynamicImageFormatConverterLayout
        idPrefix={idPrefix}
        toolId={toolId}
        preset={preset}
        notify={notify}
        onPhase={onFilePhase}
      />
    );
  }
  if (preset.id === IMAGE_REMOVE_BACKGROUND_PRESET_ID) {
    return (
      <DynamicImageBackgroundRemoverLayout
        idPrefix={idPrefix}
        toolId={toolId}
        preset={preset}
        notify={notify}
        onPhase={onFilePhase}
      />
    );
  }
  if (preset.id === IMAGE_ENLARGER_PRESET_ID) {
    return (
      <DynamicImageEnlargerLayout
        idPrefix={idPrefix}
        toolId={toolId}
        preset={preset}
        notify={notify}
        onPhase={onFilePhase}
      />
    );
  }
  if (preset.id === PHOTO_SIZE_REDUCER_PRESET_ID || toolId === 'photo-size-reducer') {
    return (
      <DynamicPhotoSizeReducerLayout
        idPrefix={idPrefix}
        toolId={toolId}
        preset={preset}
        notify={notify}
        onPhase={onFilePhase}
      />
    );
  }
  return renderDocumentAndWatermarkStudio(props);
}

function renderDocumentAndWatermarkStudio(props: ArchetypeProps) {
  const { idPrefix, toolId, preset, notify, onFilePhase } = props;
  if (preset.id === PASSPORT_PHOTO_PRESET_ID || toolId === 'passport-photo-resizer') {
    return (
      <DynamicPassportPhotoLayout
        idPrefix={idPrefix}
        toolId={toolId}
        preset={preset}
        notify={notify}
        onPhase={onFilePhase}
      />
    );
  }
  if (preset.id === SIGNATURE_RESIZER_PRESET_ID || toolId === 'signature-resizer') {
    return (
      <DynamicSignatureResizerLayout
        idPrefix={idPrefix}
        toolId={toolId}
        preset={preset}
        notify={notify}
        onPhase={onFilePhase}
      />
    );
  }
  if (preset.id === IMAGE_METADATA_REMOVER_PRESET_ID || toolId === 'image-metadata-remover') {
    return (
      <DynamicImageMetadataRemoverLayout
        idPrefix={idPrefix}
        toolId={toolId}
        preset={preset}
        notify={notify}
        onPhase={onFilePhase}
      />
    );
  }
  if (preset.id === IMAGE_WATERMARK_PRESET_ID || toolId === 'image-watermark') {
    return (
      <DynamicImageWatermarkLayout
        idPrefix={idPrefix}
        toolId={toolId}
        preset={preset}
        notify={notify}
        onPhase={onFilePhase}
      />
    );
  }
  if (preset.id === JPG_TO_PDF_PRESET_ID || toolId === 'jpg-to-pdf') {
    return (
      <DynamicImageToPdfLayout
        idPrefix={idPrefix}
        toolId={toolId}
        preset={preset}
        notify={notify}
        onPhase={onFilePhase}
      />
    );
  }
  return null;
}

function renderImageStudioLayout(props: ArchetypeProps) {
  return renderBasicImageStudio(props) ?? renderAdvancedImageStudio(props);
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
