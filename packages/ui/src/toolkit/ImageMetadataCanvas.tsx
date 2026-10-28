import styles from './imageMetadata.module.css';
import { UniversalUploadDropzone } from './UniversalUploadDropzone.tsx';
import type { UseImageMetadataRemoverReturn } from './useImageMetadataRemover.ts';

export interface ImageMetadataCanvasProps {
  idPrefix: string;
  meta: UseImageMetadataRemoverReturn;
  onSelectFile: (file: File) => void;
  onTrySample: () => void;
}

function MetadataCompareStage({ previewSrc }: { previewSrc: string }) {
  return (
    <div class={styles.compareSection}>
      <div class={styles.compareHeading}>Preview & metadata status</div>
      <div class={styles.compareGrid}>
        <div class={styles.compareItem}>
          <span class={styles.compareLabel}>Before (With Metadata)</span>
          <div class={styles.compareBoxBefore}>
            <img src={previewSrc} alt="Original state with metadata" class={styles.compareImg} />
            <div class={styles.compareTagBefore}>⚠️ 8 Metadata fields (GPS, Camera, Date, EXIF)</div>
          </div>
        </div>

        <div class={styles.compareArrow}>→</div>

        <div class={styles.compareItem}>
          <span class={styles.compareLabel}>After (Cleaned State)</span>
          <div class={styles.compareBoxAfter}>
            <img
              src={previewSrc}
              alt="Cleaned state with metadata removed"
              class={styles.compareImg}
            />
            <div class={styles.compareTagAfter}>🛡️ 100% Cleaned • Metadata stripped</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ImageMetadataCanvas({
  idPrefix,
  meta,
  onSelectFile,
  onTrySample,
}: ImageMetadataCanvasProps) {
  const isExecuting = meta.phase === 'running';
  const previewSrc = meta.resultUrl ?? meta.imageSrc ?? '/samples/mountain-lake.jpg';

  return (
    <section class={styles.studioCard} aria-label="Metadata Remover Upload Stage">
      <div class={styles.cardHeader}>
        <span class={styles.cardTitle}>1. Upload images</span>
        <button
          type="button"
          class={styles.sampleMiniBtn}
          onClick={onTrySample}
          disabled={isExecuting}
          title="Load sample photo"
        >
          ✨ Try Sample
        </button>
      </div>

      <UniversalUploadDropzone
        idPrefix={idPrefix}
        accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
        file={meta.file}
        thumbnailUrl={meta.imageSrc}
        dimensions={meta.sourceDims.width > 0 ? meta.sourceDims : null}
        onSelectFile={onSelectFile}
        onClear={meta.clearAll}
        disabled={isExecuting}
        primaryText="Drag and drop images here"
        browseText="click to browse files"
        supportHint="Supports JPG, PNG, WebP, BMP. You can upload multiple images at once."
        linkBrowse={true}
        renderImgThumbnail={true}
      />

      {meta.file && <MetadataCompareStage previewSrc={previewSrc} />}
    </section>
  );
}
