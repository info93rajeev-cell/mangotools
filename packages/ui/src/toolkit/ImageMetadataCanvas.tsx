import styles from './imageMetadata.module.css';
import { UniversalUploadDropzone } from './UniversalUploadDropzone.tsx';
import type { UseImageMetadataRemoverReturn } from './useImageMetadataRemover.ts';

export interface ImageMetadataCanvasProps {
  idPrefix: string;
  meta: UseImageMetadataRemoverReturn;
  onSelectFile: (file: File) => void;
  onTrySample: () => void;
}

export interface UploadedCardProps {
  idPrefix: string;
  meta: UseImageMetadataRemoverReturn;
  onSelectFile: (file: File) => void;
  onTrySample: () => void;
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function computeProcessedInfo(meta: UseImageMetadataRemoverReturn) {
  const hasFile = !!meta.file;
  const res = meta.result;
  const ext = meta.outputFormat === 'png' ? 'png' : meta.outputFormat === 'webp' ? 'webp' : 'jpg';
  const baseName = meta.file?.name.replace(/\.[^/.]+$/, '') ?? 'mountain-lake';
  const defaultCleanedName = meta.customFileName.trim()
    ? meta.customFileName.trim()
    : `${baseName}_cleaned.${ext}`;

  const fileName = res ? res.fileName : hasFile ? defaultCleanedName : 'No file processed yet';
  const fileSize = res ? res.outputFileSize : hasFile ? 1153433 : 0;
  const dims = res
    ? { width: res.outputWidth, height: res.outputHeight }
    : meta.sourceDims.width > 0
      ? meta.sourceDims
      : { width: 4000, height: 2667 };

  return { fileName, fileSize, dims };
}

export function UploadedCard({ idPrefix, meta, onSelectFile, onTrySample }: UploadedCardProps) {
  const isExecuting = meta.phase === 'running';

  return (
    <div class={styles.studioCard}>
      <div class={styles.cardHeader}>
        <span class={styles.cardTitle}>1. Upload images</span>
        <div class={styles.headerActions}>
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
      </div>

      <UniversalUploadDropzone
        idPrefix={idPrefix}
        accept="image/jpeg,image/png,image/webp"
        file={meta.file}
        thumbnailUrl={meta.imageSrc}
        dimensions={meta.sourceDims.width > 0 ? meta.sourceDims : null}
        onSelectFile={onSelectFile}
        onClear={meta.clearAll}
        disabled={isExecuting}
        browseText="Upload Image"
        renderImgThumbnail={true}
      />
    </div>
  );
}

export function ProcessedCard({ meta }: { meta: UseImageMetadataRemoverReturn }) {
  const imgSrc = meta.result ? (meta.resultUrl ?? meta.imageSrc) : null;
  const { fileName, fileSize, dims } = computeProcessedInfo(meta);

  return (
    <div class={styles.studioCard}>
      <div class={styles.cardHeader}>
        <span class={styles.cardTitle}>3. Processed image (metadata removed)</span>
      </div>

      <div class={styles.cardBodyRow}>
        {imgSrc ? (
          <img src={imgSrc} alt="Processed cleaned preview" class={styles.cardThumbImg} />
        ) : (
          <div class={styles.cardThumbPlaceholder}>Preview</div>
        )}

        <div class={styles.cardInfoCol}>
          <div class={styles.fileName} title={fileName}>
            {fileName}
          </div>
          <div class={styles.fileSpecs}>
            {formatBytes(fileSize)} &bull; {dims.width} &times; {dims.height}
          </div>
          <div class={styles.statusBoxGreen}>
            <span class={styles.statusBoxIcon}>✓</span>
            <div class={styles.statusBoxText}>
              <div class={styles.statusBoxTitle}>Image cleaned successfully</div>
              <div class={styles.statusBoxSub}>
                All detectable metadata has been removed from this image.
              </div>
            </div>
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
  return (
    <>
      <UploadedCard
        idPrefix={idPrefix}
        meta={meta}
        onSelectFile={onSelectFile}
        onTrySample={onTrySample}
      />
      <ProcessedCard meta={meta} />
    </>
  );
}
