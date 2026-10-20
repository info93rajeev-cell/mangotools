import { useState } from 'preact/hooks';
import { formatFileSize, type QueuedFile } from '../archetypes/FileQueue.tsx';
import styles from './imageCompress.module.css';

export interface StageOneCardProps {
  file: QueuedFile;
  previewUrl: string | null;
  onClear: () => void;
}

export function StageOneCard({ file, previewUrl, onClear }: StageOneCardProps) {
  const [naturalDims, setNaturalDims] = useState<{
    width: number;
    height: number;
  } | null>(null);

  return (
    <div class={styles.stage1Column}>
      <div class={styles.stageCard} data-stage="1">
        <div class={styles.stepHeader}>
          <div class={styles.stepTitleGroup}>
            <span class={styles.stepBadge}>1</span>
            <h3 class={styles.stepTitle}>Uploaded image</h3>
          </div>
          <button type="button" class={styles.textAction} onClick={onClear}>
            Replace image
          </button>
        </div>

        <div class={styles.previewWrap}>
          {previewUrl ? (
            <img
              src={previewUrl}
              alt={file.name}
              class={styles.previewImg}
              onLoad={(e) => {
                const img = e.currentTarget;
                setNaturalDims({
                  width: img.naturalWidth,
                  height: img.naturalHeight,
                });
              }}
            />
          ) : null}
        </div>

        <div class={styles.fileInfo}>
          <div class={styles.fileName}>{file.name}</div>
          <div class={styles.fileMeta}>
            {formatFileSize(file.size)}
            {naturalDims ? ` · ${naturalDims.width} × ${naturalDims.height} px` : ''}
          </div>
        </div>

        <div class={styles.statusBadge}>
          <span class={styles.statusCheck} aria-hidden="true">
            ✓
          </span>
          <div>
            <strong class={styles.statusTitle}>Image loaded successfully</strong>
            <div class={styles.statusSub}>Ready to compress. Adjust settings on the right.</div>
          </div>
        </div>
      </div>

      <div class={styles.relatedCard}>
        <div class={styles.relatedLeft}>
          <span class={styles.relatedIcon} aria-hidden="true">
            PDF
          </span>
          <div class={styles.relatedText}>
            <span class={styles.relatedTitle}>Need a smaller PDF instead?</span>
            <span class={styles.relatedSub}>Convert images directly to compressed PDF.</span>
          </div>
        </div>
        <a href="/jpg-to-pdf" class={styles.relatedLink}>
          Open JPG to PDF →
        </a>
      </div>
    </div>
  );
}
