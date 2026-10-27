import type { ResolvedPreset } from '@mangotools/schemas';
import type { RefObject } from 'preact';
import { useRef } from 'preact/hooks';
import type { FilePhase } from '../archetypes/useFileTool.ts';
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

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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

function UploadSection({
  idPrefix,
  fileInputRef,
  isDragging,
  onProcessFiles,
  onLoadSample,
  setIsDragging,
}: {
  idPrefix: string;
  fileInputRef: RefObject<HTMLInputElement>;
  isDragging: boolean;
  onProcessFiles: (files: FileList | File[]) => void;
  onLoadSample: () => void;
  setIsDragging: (d: boolean) => void;
}) {
  return (
    <section class={styles.sectionCard}>
      <div class={styles.sectionHeaderRow}>
        <h2 class={styles.sectionHeading}>1. Upload images</h2>
        <button
          type="button"
          class={styles.trySampleBtn}
          onClick={onLoadSample}
          title="Load 5 scenic sample images to test"
        >
          ✨ Try 5 Samples
        </button>
      </div>

      <input
        id={`${idPrefix}-file-input`}
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,image/jpeg,image/png,image/webp,image/bmp,.jpg,.jpeg,.png,.webp,.bmp"
        style={{ display: 'none' }}
        onChange={(e) => {
          const target = e.target as HTMLInputElement;
          if (target.files) {
            onProcessFiles(target.files);
            target.value = '';
          }
        }}
      />

      <label
        for={`${idPrefix}-file-input`}
        class={styles.dropzone}
        data-dragging={String(isDragging)}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (e.dataTransfer?.files) onProcessFiles(e.dataTransfer.files);
        }}
      >
        <svg
          class={styles.cloudIcon}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
          role="img"
          aria-label="Upload cloud icon"
        >
          <title>Upload icon</title>
          <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
          <path d="M12 12v9" />
          <path d="m8 16 4-4 4 4" />
        </svg>
        <p class={styles.dropHeadline}>Drag and drop images here</p>
        <p class={styles.browseLink}>or click to browse files</p>
        <p class={styles.dropHint}>
          Supports JPG, PNG, WebP, BMP. You can upload multiple images at once.
        </p>
      </label>
    </section>
  );
}

function ImageListRow({
  item,
  index,
  total,
  onMoveUp,
  onMoveDown,
  onRemove,
  onDragStart,
  onDrop,
}: {
  item: PdfImageItem;
  index: number;
  total: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
  onDragStart: () => void;
  onDrop: () => void;
}) {
  return (
    <li
      class={styles.imageRow}
      draggable
      onDragStart={onDragStart}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
    >
      <span class={styles.dragHandle} title="Drag to reorder">
        ⠿
      </span>
      <span class={styles.indexBadge}>{index + 1}</span>
      <img src={item.blobUrl} alt={item.name} class={styles.itemThumb} />
      <div class={styles.itemDetails}>
        <span class={styles.itemName} title={item.name}>
          {item.name}
        </span>
        <span class={styles.itemMeta}>
          {item.width} × {item.height} • {formatBytes(item.size)}
        </span>
      </div>

      <div class={styles.reorderBtnGroup}>
        <button
          type="button"
          class={styles.reorderBtn}
          onClick={onMoveUp}
          disabled={index === 0}
          title="Move Up"
        >
          ▲
        </button>
        <button
          type="button"
          class={styles.reorderBtn}
          onClick={onMoveDown}
          disabled={index === total - 1}
          title="Move Down"
        >
          ▼
        </button>
      </div>

      <button type="button" class={styles.removeItemBtn} onClick={onRemove} title="Remove image">
        ✕
      </button>
    </li>
  );
}

function ImageListSection({
  images,
  onClearAll,
  onMoveUp,
  onMoveDown,
  onRemoveItem,
  onReorder,
}: {
  images: PdfImageItem[];
  onClearAll: () => void;
  onMoveUp: (idx: number) => void;
  onMoveDown: (idx: number) => void;
  onRemoveItem: (id: string) => void;
  onReorder: (from: number, to: number) => void;
}) {
  const dragItemIndex = useRef<number | null>(null);
  if (images.length === 0) return null;

  return (
    <section class={styles.sectionCard}>
      <div class={styles.sectionHeaderRow}>
        <h2 class={styles.sectionHeading}>
          2. Image list ({images.length} {images.length === 1 ? 'image' : 'images'})
        </h2>
        <button type="button" class={styles.clearAllBtn} onClick={onClearAll}>
          🗑 Clear all
        </button>
      </div>

      <ul class={styles.imageListContainer}>
        {images.map((item, index) => (
          <ImageListRow
            key={item.id}
            item={item}
            index={index}
            total={images.length}
            onMoveUp={() => onMoveUp(index)}
            onMoveDown={() => onMoveDown(index)}
            onRemove={() => onRemoveItem(item.id)}
            onDragStart={() => {
              dragItemIndex.current = index;
            }}
            onDrop={() => {
              if (dragItemIndex.current !== null && dragItemIndex.current !== index) {
                onReorder(dragItemIndex.current, index);
                dragItemIndex.current = null;
              }
            }}
          />
        ))}
      </ul>
    </section>
  );
}

function SettingsSection({
  idPrefix,
  pageSize,
  orientation,
  fitMode,
  margins,
  outputFileName,
  onSetPageSize,
  onSetOrientation,
  onSetFitMode,
  onSetMargins,
  onSetOutputFileName,
}: {
  idPrefix: string;
  pageSize: PageSizeOption;
  orientation: OrientationOption;
  fitMode: FitModeOption;
  margins: MarginsOption;
  outputFileName: string;
  onSetPageSize: (v: PageSizeOption) => void;
  onSetOrientation: (v: OrientationOption) => void;
  onSetFitMode: (v: FitModeOption) => void;
  onSetMargins: (v: MarginsOption) => void;
  onSetOutputFileName: (v: string) => void;
}) {
  return (
    <section class={styles.sectionCard}>
      <h2 class={styles.sectionHeading}>3. PDF settings</h2>
      <div class={styles.settingsGridRow1}>
        <div class={styles.formField}>
          <label for={`${idPrefix}-page-size`} class={styles.fieldLabel}>
            <span>Page size</span>
            <span class={styles.helpIcon} title="Dimensions of pages in the generated PDF">
              ❓
            </span>
          </label>
          <select
            id={`${idPrefix}-page-size`}
            class={styles.fieldSelect}
            value={pageSize}
            onChange={(e) => onSetPageSize((e.target as HTMLSelectElement).value as PageSizeOption)}
          >
            <option value="a4">A4 (210 × 297 mm)</option>
            <option value="letter">US Letter (8.5 × 11 in)</option>
            <option value="fit">Fit to image</option>
          </select>
        </div>

        <div class={styles.formField}>
          <label for={`${idPrefix}-orientation`} class={styles.fieldLabel}>
            <span>Orientation</span>
            <span class={styles.helpIcon} title="Page orientation mode">
              ❓
            </span>
          </label>
          <select
            id={`${idPrefix}-orientation`}
            class={styles.fieldSelect}
            value={orientation}
            onChange={(e) =>
              onSetOrientation((e.target as HTMLSelectElement).value as OrientationOption)
            }
          >
            <option value="portrait">▯ Portrait</option>
            <option value="landscape">▭ Landscape</option>
            <option value="auto">Auto</option>
          </select>
        </div>

        <div class={styles.formField}>
          <label for={`${idPrefix}-fit-mode`} class={styles.fieldLabel}>
            <span>Fit mode</span>
            <span class={styles.helpIcon} title="How the image scales onto each page">
              ❓
            </span>
          </label>
          <select
            id={`${idPrefix}-fit-mode`}
            class={styles.fieldSelect}
            value={fitMode}
            onChange={(e) => onSetFitMode((e.target as HTMLSelectElement).value as FitModeOption)}
          >
            <option value="fit">⛶ Fit to page</option>
            <option value="fill">Fill page</option>
            <option value="original">Original size</option>
          </select>
        </div>
      </div>

      <div class={styles.settingsGridRow2}>
        <div class={styles.formField}>
          <label for={`${idPrefix}-margins`} class={styles.fieldLabel}>
            <span>Margins</span>
            <span class={styles.helpIcon} title="Margin spacing around each page">
              ❓
            </span>
          </label>
          <select
            id={`${idPrefix}-margins`}
            class={styles.fieldSelect}
            value={margins}
            onChange={(e) => onSetMargins((e.target as HTMLSelectElement).value as MarginsOption)}
          >
            <option value="normal">Normal (1 inch)</option>
            <option value="small">Small (0.5 inch)</option>
            <option value="none">None (0)</option>
          </select>
        </div>

        <div class={styles.formField}>
          <label for={`${idPrefix}-filename`} class={styles.fieldLabel}>
            <span>Output file name</span>
          </label>
          <input
            id={`${idPrefix}-filename`}
            type="text"
            class={styles.fieldInput}
            value={outputFileName}
            onInput={(e) => onSetOutputFileName((e.target as HTMLInputElement).value)}
            placeholder="images.pdf"
          />
        </div>
      </div>
    </section>
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
