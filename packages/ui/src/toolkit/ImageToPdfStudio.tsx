import type { ResolvedPreset } from '@mangotools/schemas';
import type { FilePhase } from '../archetypes/useFileTool.ts';
import { ImageListSection, SettingsSection, UploadSection } from './ImageToPdfLeftSections.tsx';
import styles from './imageToPdfStudio.module.css';
import type { UseImageFormatConverterReturn } from './useImageFormatConverter.ts';
import {
  type FitModeOption,
  type MarginsOption,
  type OrientationOption,
  type PageSizeOption,
  type PdfImageItem,
  usePdfStudioState,
} from './usePdfStudioState.ts';

export type { FitModeOption, MarginsOption, OrientationOption, PageSizeOption, PdfImageItem };

export interface ImageToPdfStudioProps {
  idPrefix: string;
  toolId: string;
  preset: ResolvedPreset;
  converter?: UseImageFormatConverterReturn;
  notify?: (message: string) => void;
  onPhase?: (phase: FilePhase) => void;
}

function FormatSwitcher({ converter }: { converter: UseImageFormatConverterReturn }) {
  return (
    <div class={styles.formatSwitcherBar}>
      <div class={styles.formatTabs} role="tablist" aria-label="Target format">
        <button
          type="button"
          class={styles.formatTab}
          data-active={String(converter.targetFormat === 'jpg')}
          onClick={() => converter.setTargetFormat('jpg')}
        >
          JPG
        </button>
        <button
          type="button"
          class={styles.formatTab}
          data-active={String(converter.targetFormat === 'png')}
          onClick={() => converter.setTargetFormat('png')}
        >
          PNG
        </button>
        <button
          type="button"
          class={styles.formatTab}
          data-active={String(converter.targetFormat === 'webp')}
          onClick={() => converter.setTargetFormat('webp')}
        >
          WebP
        </button>
        <button
          type="button"
          class={styles.formatTab}
          data-active="true"
          onClick={() => converter.setTargetFormat('pdf')}
        >
          PDF
        </button>
      </div>
      <span class={styles.modeDescription}>
        Multi-Image PDF Studio mode active • Combine multiple images into a single document
      </span>
    </div>
  );
}

function PreviewSection({
  images,
  orientation,
  margins,
  fitMode,
}: {
  images: PdfImageItem[];
  orientation: OrientationOption;
  margins: MarginsOption;
  fitMode: FitModeOption;
}) {
  return (
    <section class={styles.previewContainer}>
      <h2 class={styles.sectionHeading}>
        4. PDF preview ({images.length} {images.length === 1 ? 'page' : 'pages'})
      </h2>

      {images.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '36px 16px', color: '#64748b' }}>
          <p style={{ margin: '0 0 8px 0', fontSize: '14px' }}>No pages yet</p>
          <p style={{ margin: 0, fontSize: '12px' }}>
            Upload images on the left to see page previews.
          </p>
        </div>
      ) : (
        <div class={styles.previewGrid}>
          {images.map((item, index) => {
            const itemOrient =
              orientation === 'auto'
                ? item.width >= item.height
                  ? 'landscape'
                  : 'portrait'
                : orientation;

            return (
              <div key={item.id} class={styles.pageCard}>
                <div class={styles.paperSheet} data-orientation={itemOrient} data-margin={margins}>
                  <img
                    src={item.blobUrl}
                    alt={`Page ${index + 1}`}
                    class={styles.previewImage}
                    data-fit={fitMode}
                  />
                </div>
                <span class={styles.pageNumber}>{index + 1}</span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function ResultSection({
  imagesCount,
  outputFileName,
  isCompiling,
  onDownload,
}: {
  imagesCount: number;
  outputFileName: string;
  isCompiling: boolean;
  onDownload: () => void;
}) {
  return (
    <section class={styles.resultSection}>
      <h2 class={styles.sectionHeading}>5. Conversion result</h2>
      <div class={styles.successBanner}>
        <div class={styles.successLeft}>
          <svg
            class={styles.checkCircle}
            viewBox="0 0 24 24"
            fill="#16a34a"
            role="img"
            aria-label="Success checkmark"
          >
            <title>Success checkmark</title>
            <circle cx="12" cy="12" r="10" fill="#16a34a" />
            <path
              d="m9 12 2 2 4-4"
              stroke="#ffffff"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          <div class={styles.successText}>
            <p class={styles.successTitle}>{imagesCount > 0 ? 'PDF ready!' : 'Ready to convert'}</p>
            <p class={styles.successSubtitle}>
              {imagesCount > 0
                ? `${imagesCount} images have been combined into one PDF file.`
                : 'Add your images to combine them into a PDF.'}
            </p>
          </div>
        </div>

        {imagesCount > 0 && (
          <div class={styles.successStats}>
            <div class={styles.statItem}>
              <span class={styles.statLabel}>Total pages</span>
              <span class={styles.statValue}>{imagesCount}</span>
            </div>
            <div class={styles.statItem}>
              <span class={styles.statLabel}>Output file name</span>
              <span class={styles.statValue}>{outputFileName}</span>
            </div>
          </div>
        )}
      </div>

      <button
        type="button"
        class={styles.downloadPdfBtn}
        onClick={onDownload}
        disabled={imagesCount === 0 || isCompiling}
      >
        <span>📥</span>
        <span>{isCompiling ? 'Compiling PDF...' : 'Download PDF'}</span>
      </button>

      <p class={styles.privacyFootnote}>
        Your PDF is processed in your browser. No data is uploaded to our servers.
      </p>
    </section>
  );
}

function RelatedActionCard() {
  return (
    <a href="/pdf-to-jpg" class={styles.relatedActionCard}>
      <div class={styles.relatedLeft}>
        <span class={styles.relatedIcon}>📄</span>
        <span>
          Need PDF to image? <span class={styles.relatedLinkText}>See upcoming tools &gt;</span>
        </span>
      </div>
      <span class={styles.relatedArrow}>&gt;</span>
    </a>
  );
}

function LeftWorkbenchColumn({
  idPrefix,
  s,
}: {
  idPrefix: string;
  s: ReturnType<typeof usePdfStudioState>;
}) {
  return (
    <div class={styles.leftColumn}>
      <UploadSection
        idPrefix={idPrefix}
        fileInputRef={s.fileInputRef}
        isDragging={s.isDragging}
        onProcessFiles={(files) => void s.processFiles(files)}
        onLoadSample={() => void s.loadSamples()}
        setIsDragging={s.setIsDragging}
      />

      <ImageListSection
        images={s.images}
        onClearAll={s.clearAll}
        onMoveUp={(index) => {
          if (index <= 0) return;
          s.setImages((prev) => {
            const next = [...prev];
            const temp = next[index - 1];
            next[index - 1] = next[index];
            next[index] = temp;
            return next;
          });
        }}
        onMoveDown={(index) => {
          if (index >= s.images.length - 1) return;
          s.setImages((prev) => {
            const next = [...prev];
            const temp = next[index + 1];
            next[index + 1] = next[index];
            next[index] = temp;
            return next;
          });
        }}
        onRemoveItem={(id) => {
          s.setImages((prev) => {
            const target = prev.find((item) => item.id === id);
            if (target?.blobUrl.startsWith('blob:')) URL.revokeObjectURL(target.blobUrl);
            return prev.filter((item) => item.id !== id);
          });
        }}
        onReorder={(from, to) => {
          s.setImages((prev) => {
            const next = [...prev];
            const [removed] = next.splice(from, 1);
            next.splice(to, 0, removed);
            return next;
          });
        }}
      />

      <SettingsSection
        idPrefix={idPrefix}
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
  );
}

function RightWorkbenchColumn({
  s,
  cleanName,
}: {
  s: ReturnType<typeof usePdfStudioState>;
  cleanName: string;
}) {
  return (
    <div class={styles.rightColumn}>
      <PreviewSection
        images={s.images}
        orientation={s.orientation}
        margins={s.margins}
        fitMode={s.fitMode}
      />

      <ResultSection
        imagesCount={s.images.length}
        outputFileName={cleanName}
        isCompiling={s.isCompiling}
        onDownload={() => void s.downloadPdf()}
      />

      <RelatedActionCard />
    </div>
  );
}

export function ImageToPdfStudio(props: ImageToPdfStudioProps) {
  const s = usePdfStudioState(props.converter, props.notify, props.onPhase);
  const cleanName = s.outputFileName.trim().endsWith('.pdf')
    ? s.outputFileName.trim()
    : `${s.outputFileName.trim() || 'images'}.pdf`;

  return (
    <div class={styles.studioContainer} data-image-to-pdf-studio="">
      {props.converter && <FormatSwitcher converter={props.converter} />}

      <div class={styles.workbenchGrid}>
        <LeftWorkbenchColumn idPrefix={props.idPrefix} s={s} />
        <RightWorkbenchColumn s={s} cleanName={cleanName} />
      </div>
    </div>
  );
}
