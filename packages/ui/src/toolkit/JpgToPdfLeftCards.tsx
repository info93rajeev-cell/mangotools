import type { RefObject } from 'preact';
import { useRef } from 'preact/hooks';
import styles from './jpgToPdfStudio.module.css';
import type { PdfImageItem } from './usePdfStudioState.ts';

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function JpgToPdfUploadCard({
  idPrefix,
  fileInputRef,
  isDragging,
  setIsDragging,
  onProcessFiles,
}: {
  idPrefix: string;
  fileInputRef: RefObject<HTMLInputElement>;
  isDragging: boolean;
  setIsDragging: (d: boolean) => void;
  onProcessFiles: (files: FileList | File[]) => void;
}) {
  return (
    <div class={styles.card} data-tour="upload">
      <div class={styles.cardHeader}>
        <div class={styles.cardHeaderLeft}>
          <span class={styles.stepBadgeCircle}>1</span>
          <h2 class={styles.cardTitle}>Add JPG images</h2>
        </div>
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
          class={styles.dropzoneIcon}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          role="img"
          aria-label="Upload icon"
        >
          <title>Upload icon</title>
          <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
          <path d="M12 12v9" />
          <path d="m8 16 4-4 4 4" />
        </svg>
        <p class={styles.dropHeadline}>Drag & drop JPG images here or click to browse files</p>
        <p class={styles.dropSub}>
          Supports JPG, JPEG, PNG, WebP, BMP. You can upload multiple images at once.
        </p>
        <button
          type="button"
          class={styles.chooseFilesBtn}
          onClick={() => fileInputRef.current?.click()}
        >
          Choose JPG Files
        </button>
      </label>
    </div>
  );
}

function ImageRowItem({
  item,
  index,
  total,
  onMoveUp,
  onMoveDown,
  onRotate,
  onRemove,
  onDragStart,
  onDrop,
}: {
  item: PdfImageItem;
  index: number;
  total: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRotate: () => void;
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
      <span class={styles.itemIndex}>{index + 1}</span>
      <img
        src={item.blobUrl}
        alt={item.name}
        class={styles.itemThumb}
        style={{ transform: `rotate(${item.rotation ?? 0}deg)` }}
      />
      <div class={styles.itemInfo}>
        <span class={styles.itemName} title={item.name}>
          {item.name}
        </span>
        <span class={styles.itemMeta}>
          {item.width} × {item.height} • {formatBytes(item.size)}
        </span>
      </div>
      <div class={styles.rowActions}>
        <button
          type="button"
          class={styles.miniBtn}
          onClick={onMoveUp}
          disabled={index === 0}
          aria-label={`Move ${item.name} up`}
          title={`Move ${item.name} up`}
        >
          ↑
        </button>
        <button
          type="button"
          class={styles.miniBtn}
          onClick={onMoveDown}
          disabled={index === total - 1}
          aria-label={`Move ${item.name} down`}
          title={`Move ${item.name} down`}
        >
          ↓
        </button>
        <button
          type="button"
          class={styles.miniBtn}
          onClick={onRotate}
          aria-label={`Rotate ${item.name}`}
          title={`Rotate ${item.name} 90°`}
        >
          🔄
        </button>
        <button
          type="button"
          class={`${styles.miniBtn} ${styles.miniBtnDanger}`}
          onClick={onRemove}
          aria-label={`Remove ${item.name}`}
          title={`Remove ${item.name}`}
        >
          🗑️
        </button>
      </div>
    </li>
  );
}

export function JpgToPdfArrangeCard({
  images,
  onMoveUp,
  onMoveDown,
  onRotate,
  onRemoveItem,
  onReorder,
}: {
  images: PdfImageItem[];
  onMoveUp: (idx: number) => void;
  onMoveDown: (idx: number) => void;
  onRotate: (id: string) => void;
  onRemoveItem: (id: string) => void;
  onReorder: (from: number, to: number) => void;
}) {
  const dragIdx = useRef<number | null>(null);
  const totalBytes = images.reduce((acc, img) => acc + img.size, 0);

  return (
    <div class={styles.card} data-tour="arrange">
      <div class={styles.cardHeader}>
        <div class={styles.cardHeaderLeft}>
          <span class={styles.stepBadgeCircle}>2</span>
          <h2 class={styles.cardTitle}>Arrange pages in the order you want in the PDF</h2>
        </div>
        <span class={styles.headerPill}>
          {images.length} {images.length === 1 ? 'image' : 'images'} • {images.length} pages •{' '}
          {formatBytes(totalBytes)}
        </span>
      </div>

      {images.length === 0 ? (
        <div
          style={{ padding: '24px 12px', textAlign: 'center', color: '#64748b', fontSize: '12px' }}
        >
          No images uploaded yet. Choose files above or click <strong>Load Sample</strong> in the
          header.
        </div>
      ) : (
        <ul class={styles.imageListScroll}>
          {images.map((item, idx) => (
            <ImageRowItem
              key={item.id}
              item={item}
              index={idx}
              total={images.length}
              onMoveUp={() => onMoveUp(idx)}
              onMoveDown={() => onMoveDown(idx)}
              onRotate={() => onRotate(item.id)}
              onRemove={() => onRemoveItem(item.id)}
              onDragStart={() => {
                dragIdx.current = idx;
              }}
              onDrop={() => {
                if (dragIdx.current !== null && dragIdx.current !== idx) {
                  onReorder(dragIdx.current, idx);
                  dragIdx.current = null;
                }
              }}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
