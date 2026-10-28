import type { RefObject } from 'preact';
import { useRef } from 'preact/hooks';
import styles from './imageToPdfStudio.module.css';
import type {
  FitModeOption,
  MarginsOption,
  OrientationOption,
  PageSizeOption,
  PdfImageItem,
} from './usePdfStudioState.ts';

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function UploadSection({
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

export function ImageListRow({
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

export function ImageListSection({
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

export function SettingsSection({
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
