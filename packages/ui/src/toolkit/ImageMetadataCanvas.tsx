import styles from './imageMetadata.module.css';
import { UniversalUploadDropzone } from './UniversalUploadDropzone.tsx';
import type { UseImageMetadataRemoverReturn } from './useImageMetadataRemover.ts';

export interface ImageMetadataCanvasProps {
  idPrefix: string;
  meta: UseImageMetadataRemoverReturn;
  onSelectFile: (file: File) => void;
  onTrySample: () => void;
}

export function ImageMetadataCanvas({
  idPrefix,
  meta,
  onSelectFile,
  onTrySample,
}: ImageMetadataCanvasProps) {
  const isExecuting = meta.phase === 'running';

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
    </section>
  );
}
