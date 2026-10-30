import type { ResolvedPreset } from '@mangotools/schemas';
import { useEffect, useState } from 'preact/hooks';
import type { FilePhase } from '../archetypes/useFileTool.ts';
import { JpgToPdfArrangeCard, JpgToPdfUploadCard } from './JpgToPdfLeftCards.tsx';
import {
  JpgToPdfActionCard,
  JpgToPdfPreviewCard,
  JpgToPdfSummaryCard,
} from './JpgToPdfRightCards.tsx';
import { JpgToPdfSettingsCard } from './JpgToPdfSettingsCard.tsx';
import styles from './jpgToPdfStudio.module.css';
import { JpgToPdfIcon } from './PdfToolIcons.tsx';
import {
  isTourCompleted,
  ToolOnboardingTour,
  TourLauncherButton,
  type TourStep,
} from './ToolOnboardingTour.tsx';
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

function JpgToPdfTopBar({
  onOpenImages,
  onLoadSamples,
  onClearAll,
  onLaunchTour,
}: {
  onOpenImages: () => void;
  onLoadSamples: () => void;
  onClearAll: () => void;
  onLaunchTour: () => void;
}) {
  return (
    <div class={styles.topBar}>
      <div class={styles.toolHeading}>
        <div class={styles.toolIconBox}>
          <JpgToPdfIcon />
        </div>
        <div class={styles.titleMeta}>
          <div class={styles.titleRow}>
            <h1 class={styles.titleText}>JPG to PDF</h1>
            <div class={styles.badgePills}>
              <span class={`${styles.badgePill} ${styles.badgePillAmber}`}>
                ⚡ Instant In-Browser
              </span>
              <span class={styles.badgePill}>🔒 100% Private</span>
              <span class={`${styles.badgePill} ${styles.badgePillBlue}`}>🛡️ No Sign-Up Needed</span>
            </div>
          </div>
          <p class={styles.subtitleText}>
            Convert one or more JPG images into a single PDF, in the order you choose. Fast, private
            and easy to use in your browser.
          </p>
        </div>
      </div>

      <div class={styles.topActions}>
        <button type="button" class={styles.actionBtnGhost} onClick={onOpenImages}>
          📁 Open Images
        </button>
        <button type="button" class={styles.actionBtnGhost} onClick={onLoadSamples}>
          📑 Load Sample
        </button>
        <button
          type="button"
          class={`${styles.actionBtnGhost} ${styles.actionBtnDanger}`}
          onClick={onClearAll}
        >
          🗑️ Clear All
        </button>
        <TourLauncherButton onClick={onLaunchTour} />
      </div>
    </div>
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
    <div class={styles.workbenchGrid}>
      <div class={styles.column}>
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
          onSetPageSize={s.setPageSize}
          onSetOrientation={s.setOrientation}
          onSetFitMode={s.setFitMode}
          onSetMargins={s.setMargins}
          onSetOutputFileName={s.setOutputFileName}
        />
      </div>

      <div class={styles.column}>
        <JpgToPdfSummaryCard
          images={s.images}
          pageSize={s.pageSize}
          orientation={s.orientation}
          outputFileName={s.outputFileName}
        />
        <JpgToPdfPreviewCard images={s.images} />
        <JpgToPdfActionCard
          imagesCount={s.images.length}
          isCompiling={s.isCompiling}
          onDownload={() => void s.downloadPdf()}
          onCopySummary={onCopySummary}
          onReset={s.clearAll}
        />
      </div>
    </div>
  );
}

export function ImageToPdfStudio(props: ImageToPdfStudioProps) {
  const s = usePdfStudioState(props.converter, props.notify, props.onPhase);
  const [isTourOpen, setIsTourOpen] = useState(false);

  useEffect(() => {
    if (!isTourCompleted('jpg-to-pdf')) {
      const timer = setTimeout(() => setIsTourOpen(true), 600);
      return () => clearTimeout(timer);
    }
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
    <div class={styles.studioContainer} data-image-to-pdf-studio="">
      <JpgToPdfTopBar
        onOpenImages={() => s.fileInputRef.current?.click()}
        onLoadSamples={() => void s.loadSamples()}
        onClearAll={s.clearAll}
        onLaunchTour={() => setIsTourOpen(true)}
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
