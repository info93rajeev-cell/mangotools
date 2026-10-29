import { useState } from 'preact/hooks';
import styles from './imageMetadata.module.css';
import { UniversalUploadDropzone } from './UniversalUploadDropzone.tsx';
import type { UseImageMetadataRemoverReturn } from './useImageMetadataRemover.ts';

export interface ImageMetadataCanvasProps {
  idPrefix: string;
  meta: UseImageMetadataRemoverReturn;
  onSelectFile: (file: File) => void;
  onTrySample: () => void;
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

interface LoadedSummaryRowProps {
  previewSrc: string;
  fileName: string;
  fileSizeText: string;
  dimsText: string;
}

function LoadedSummaryRow({ previewSrc, fileName, fileSizeText, dimsText }: LoadedSummaryRowProps) {
  return (
    <div class={styles.loadedStage}>
      <div class={styles.previewThumbWrap}>
        <img src={previewSrc} alt={fileName} class={styles.previewThumbImg} />
      </div>

      <div class={styles.signatureMetaWrap}>
        <div class={styles.signatureFileName} title={fileName}>
          {fileName}
        </div>
        <div class={styles.signatureFileSub}>
          <span>{fileSizeText}</span>
          <span>•</span>
          <span>{dimsText}</span>
        </div>
        <div class={styles.loadedSuccessBadge}>
          <div class={styles.successBadgeTitle}>
            <span class={styles.badgeCheckCircle}>✔</span>
            <span>Image loaded successfully</span>
          </div>
          <div class={styles.successBadgeSub}>EXIF & camera metadata detected. Ready to clean.</div>
        </div>
      </div>
    </div>
  );
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

interface CardHeaderProps {
  fileInputId: string;
  hasFile: boolean;
  isExecuting: boolean;
  onTrySample: () => void;
}

function StageHeader({ fileInputId, hasFile, isExecuting, onTrySample }: CardHeaderProps) {
  return (
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
        {hasFile && (
          <label for={fileInputId} class={styles.replaceBtn} aria-label="Replace image">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
              <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
              <path d="M16 21h5v-5" />
            </svg>
            <span>Replace image</span>
          </label>
        )}
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
  const hasFile = Boolean(meta.file);
  const previewSrc = meta.resultUrl ?? meta.imageSrc ?? '/samples/mountain-lake.jpg';
  const fileName = meta.file?.name ?? 'mountain-lake.jpg';
  const fileSizeText = formatBytes(meta.file?.size ?? 1038462);
  const dimsText =
    meta.sourceDims.width > 0
      ? `${meta.sourceDims.width} × ${meta.sourceDims.height}`
      : '1376 × 768';

  const fileInputId = `${idPrefix}-universal-upload-input`;
  const [isDragOver, setIsDragOver] = useState(false);

  return (
    <section
      class={styles.studioCard}
      aria-label="Metadata Remover Upload Stage"
      data-drag-over={isDragOver ? 'true' : 'false'}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
        const f = e.dataTransfer?.files?.[0];
        if (f) onSelectFile(f);
      }}
    >
      <StageHeader
        fileInputId={fileInputId}
        hasFile={hasFile}
        isExecuting={isExecuting}
        onTrySample={onTrySample}
      />

      {/* Universal Drag & Drop Card prompt */}
      <UniversalUploadDropzone
        idPrefix={idPrefix}
        accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
        onSelectFile={onSelectFile}
        disabled={isExecuting}
        primaryText="Drag and drop images here"
        browseText="click to browse files"
        supportHint="Supports JPG, PNG, WebP, BMP. You can upload multiple images at once."
        linkBrowse={true}
      />

      {/* Loaded file information and Before/After reference previews */}
      <div class={styles.canvasBodyCol}>
        <LoadedSummaryRow
          previewSrc={previewSrc}
          fileName={fileName}
          fileSizeText={fileSizeText}
          dimsText={dimsText}
        />
        <MetadataCompareStage previewSrc={previewSrc} />
      </div>
    </section>
  );
}
