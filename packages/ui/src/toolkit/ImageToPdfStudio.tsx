import type { ResolvedPreset } from '@mangotools/schemas';
import { useEffect, useState } from 'preact/hooks';
import type { FilePhase } from '../archetypes/useFileTool.ts';
import { JpgToPdfArrangeCard, JpgToPdfUploadCard } from './JpgToPdfLeftCards.tsx';
import { JpgToPdfPreviewCard } from './JpgToPdfRightCards.tsx';
import { JpgToPdfSettingsCard } from './JpgToPdfSettingsCard.tsx';
import styles from './jpgToPdfStudio.module.css';
import {
  RefActions,
  RefCardHead,
  RefPrivacy,
  RefStatus,
  RefTile,
  RefTopBar,
} from './PdfRefParts.tsx';
import { fileMeta } from './pdfFileMeta.ts';
import refStyles from './pdfRef.module.css';
import { ToolOnboardingTour, type TourStep } from './ToolOnboardingTour.tsx';
import type { UseImageFormatConverterReturn } from './useImageFormatConverter.ts';
import { type PdfImageItem, usePdfStudioState } from './usePdfStudioState.ts';

export interface ImageToPdfStudioProps {
  idPrefix: string;
  toolId: string;
  preset: ResolvedPreset;
  converter?: UseImageFormatConverterReturn;
  notify?: (message: string) => void;
  onPhase?: (phase: FilePhase) => void;
}

const JPG_TO_PDF_TOUR_STEPS: TourStep[] = [
  {
    id: 'step-upload',
    targetSelector: '[data-tour="upload"]',
    stepNumber: 1,
    title: '1. Add JPG Images',
    description:
      'Drag & drop image files (JPG, PNG, WebP) or click "Load Sample" in the header to test.',
    hint: 'Multi-image upload supported — 100% in-browser processing.',
  },
  {
    id: 'step-arrange',
    targetSelector: '[data-tour="arrange"]',
    stepNumber: 2,
    title: '2. Arrange & Rotate Pages',
    description:
      'Use the up/down arrows or drag handles to set page order, and rotate images 90° if needed.',
  },
  {
    id: 'step-settings',
    targetSelector: '[data-tour="settings"]',
    stepNumber: 3,
    title: '3. Configure Page & Fit Settings',
    description:
      'Set page size (A4, Letter), orientation (Portrait/Landscape), fit mode, and output file name.',
  },
  {
    id: 'step-action',
    targetSelector: '[data-tour="action"]',
    stepNumber: 4,
    title: '4. Instant Summary & Create PDF',
    description:
      'Review page counts and previews, then click the golden "Create PDF" button to download.',
    hint: 'Zero server uploads — guaranteed 100% private to your device.',
  },
];

function swap<T>(arr: T[], i: number, j: number): T[] {
  if (i < 0 || j < 0 || i >= arr.length || j >= arr.length) return arr;
  const next = [...arr];
  const t = next[i];
  next[i] = next[j];
  next[j] = t;
  return next;
}

function removeItem(arr: PdfImageItem[], id: string): PdfImageItem[] {
  const target = arr.find((item) => item.id === id);
  if (target?.blobUrl.startsWith('blob:')) URL.revokeObjectURL(target.blobUrl);
  return arr.filter((item) => item.id !== id);
}

function reorder<T>(arr: T[], from: number, to: number): T[] {
  const next = [...arr];
  const [removed] = next.splice(from, 1);
  next.splice(to, 0, removed);
  return next;
}

function JpgSummary({ s }: { s: ReturnType<typeof usePdfStudioState> }) {
  const totalBytes = s.images.reduce((acc, img) => acc + img.size, 0);
  const sizeText = totalBytes > 0 ? (fileMeta(0, totalBytes).split(' • ')[1] ?? '—') : '—';
  const ready = s.images.length > 0;
  return (
    <section class={refStyles.card} aria-label="PDF Summary">
      <RefCardHead
        icon="files"
        title="PDF Summary"
        aside={<RefStatus text={ready ? 'Ready to convert' : 'Add images'} done={ready} />}
      />
      <div class={refStyles.tiles}>
        <RefTile
          tone="blue"
          icon="image"
          label="Images"
          value={String(s.images.length)}
          sub="Selected"
        />
        <RefTile
          tone="purple"
          icon="file-text"
          label="PDF pages"
          value={String(s.images.length)}
          sub="Will be created"
        />
        <RefTile
          tone="green"
          icon="database"
          label="Est. size"
          value={sizeText}
          sub="After conversion"
        />
        <RefTile
          tone="amber"
          icon="star"
          label="Page size"
          value={s.pageSize.toUpperCase()}
          sub={s.orientation === 'landscape' ? 'Landscape' : 'Portrait'}
        />
      </div>
    </section>
  );
}

function JpgToPdfWorkbench({
  props,
  s,
  onCopySummary,
}: {
  props: ImageToPdfStudioProps;
  s: ReturnType<typeof usePdfStudioState>;
  onCopySummary: () => void;
}) {
  return (
    <div class={refStyles.layout}>
      <div class={refStyles.column}>
        <JpgToPdfUploadCard
          idPrefix={props.idPrefix}
          fileInputRef={s.fileInputRef}
          isDragging={s.isDragging}
          setIsDragging={s.setIsDragging}
          onProcessFiles={(files) => void s.processFiles(files)}
        />
        <JpgToPdfArrangeCard
          images={s.images}
          onMoveUp={(index) => s.setImages((prev) => swap(prev, index, index - 1))}
          onMoveDown={(index) => s.setImages((prev) => swap(prev, index, index + 1))}
          onRotate={s.rotateImage}
          onRemoveItem={(id) => s.setImages((prev) => removeItem(prev, id))}
          onReorder={(from, to) => s.setImages((prev) => reorder(prev, from, to))}
        />
        <JpgToPdfSettingsCard
          idPrefix={props.idPrefix}
          pageSize={s.pageSize}
          orientation={s.orientation}
          fitMode={s.fitMode}
          margins={s.margins}
          outputFileName={s.outputFileName}
          extras={s.extras}
          onSetExtras={s.setExtras}
          onSetPageSize={s.setPageSize}
          onSetOrientation={s.setOrientation}
          onSetFitMode={s.setFitMode}
          onSetMargins={s.setMargins}
          onSetOutputFileName={s.setOutputFileName}
        />
      </div>

      <div class={refStyles.column}>
        <JpgSummary s={s} />
        <div class={refStyles.subcard}>
          <JpgToPdfPreviewCard images={s.images} />
        </div>
        <RefPrivacy />
        <RefActions
          icon="file-text"
          label="Create PDF"
          busyLabel="Creating PDF…"
          busy={s.isCompiling}
          disabled={s.images.length === 0}
          onRun={() => void s.downloadPdf()}
          downloadLabel="Download PDF"
          downloadDisabled={s.images.length === 0 || s.isCompiling}
          onDownload={() => void s.downloadPdf()}
          onCopy={onCopySummary}
          onReset={s.clearAll}
        />
      </div>
    </div>
  );
}

export function ImageToPdfStudio(props: ImageToPdfStudioProps) {
  const s = usePdfStudioState(props.converter, props.notify, props.onPhase);
  const [isTourOpen, setIsTourOpen] = useState(false);

  // Open with the sample images, so the page shows the approved full design straight away; the
  // user's own images replace them. An image handed over from another tool is kept instead.
  useEffect(() => {
    if (!props.converter?.file) void s.loadSamples();
  }, []);

  useEffect(() => {
    const handleOpen = () => setIsTourOpen(true);
    window.addEventListener('mangotools:open-tour', handleOpen);
    return () => window.removeEventListener('mangotools:open-tour', handleOpen);
  }, []);

  const handleCopySummary = async () => {
    const text = `JPG to PDF: ${s.images.length} images, ${s.pageSize.toUpperCase()} (${s.orientation}), ${s.outputFileName}`;
    try {
      await navigator.clipboard.writeText(text);
      props.notify?.('Summary copied to clipboard');
    } catch {
      props.notify?.('Failed to copy');
    }
  };

  return (
    <div class={styles.studioContainer} data-image-to-pdf-studio="" data-ref-look="">
      <RefTopBar
        badge3="No Sign-Up Needed"
        openLabel="Open Images"
        onOpen={() => s.fileInputRef.current?.click()}
        onLoadSample={() => void s.loadSamples()}
        onClear={s.clearAll}
      />

      <JpgToPdfWorkbench props={props} s={s} onCopySummary={handleCopySummary} />

      <ToolOnboardingTour
        toolId="jpg-to-pdf"
        steps={JPG_TO_PDF_TOUR_STEPS}
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
      />
    </div>
  );
}
