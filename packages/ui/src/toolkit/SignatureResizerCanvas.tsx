import { useState } from 'preact/hooks';
import styles from './signatureResizer.module.css';
import { UniversalUploadDropzone } from './UniversalUploadDropzone.tsx';
import type { UseSignatureResizerReturn } from './useSignatureResizer.ts';

export interface SignatureResizerCanvasProps {
  idPrefix: string;
  signature: UseSignatureResizerReturn;
  onSelectFile: (file: File) => void;
}

function formatBytes(bytes?: number): string {
  if (!bytes) return '92 KB';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// biome-ignore lint/complexity/noExcessiveLinesPerFunction: Studio canvas view
export function SignatureResizerCanvas({
  idPrefix,
  signature,
  onSelectFile,
}: SignatureResizerCanvasProps) {
  const [isReplacing, setIsReplacing] = useState(false);
  const hasFile = !!signature.file;
  const previewSrc = signature.resultUrl ?? signature.imageSrc ?? '/samples/signature.jpg';
  const fileName = signature.file?.name ?? 'signature.jpg';
  const fileSizeText = formatBytes(signature.file?.size);
  const dimsText = signature.sourceDims.width
    ? `${signature.sourceDims.width} × ${signature.sourceDims.height}`
    : '1200 × 900';

  const showDropzone = !hasFile || isReplacing;

  return (
    <main class={styles.canvasContainer} aria-label="Signature Upload Stage">
      <div class={styles.panelCard}>
        {/* Card Header */}
        <div class={styles.cardHeader}>
          <span class={styles.cardTitle}>1. Upload signature image</span>
          {hasFile && (
            <button
              type="button"
              class={styles.replaceBtn}
              onClick={() => setIsReplacing(!isReplacing)}
              aria-label="Replace image"
            >
              <svg
                width="13"
                height="13"
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
              <span>{isReplacing ? 'Cancel' : 'Replace image'}</span>
            </button>
          )}
        </div>

        {/* Dedicated single file input */}
        <input
          id={`${idPrefix}-signature-upload-input`}
          type="file"
          accept="image/*,image/jpeg,image/png,image/webp"
          style={{ display: 'none' }}
          onChange={(e) => {
            const f = (e.currentTarget as HTMLInputElement).files?.[0];
            if (f) {
              setIsReplacing(false);
              onSelectFile(f);
            }
          }}
        />

        {/* Loaded Image Stage or Dropzone */}
        {showDropzone ? (
          <UniversalUploadDropzone
            idPrefix={idPrefix}
            accept="image/*,image/jpeg,image/png,image/webp"
            file={signature.file}
            thumbnailUrl={signature.imageSrc}
            dimensions={signature.sourceDims.width > 0 ? signature.sourceDims : null}
            onSelectFile={(f) => {
              setIsReplacing(false);
              onSelectFile(f);
            }}
            onClear={() => {
              setIsReplacing(false);
              signature.clearAll();
            }}
            disabled={signature.phase === 'running'}
            primaryText="Drag and drop images here"
            browseText="click to browse files"
            supportHint="Supports JPG, PNG, WebP, BMP. You can upload multiple images at once."
            linkBrowse={true}
            renderImgThumbnail={true}
          />
        ) : (
          <div class={styles.loadedStage}>
            {/* Left large thumbnail matching reference */}
            <div class={styles.signatureThumbWrap}>
              <img src={previewSrc} alt={fileName} class={styles.signatureThumb} />
            </div>

            {/* Right metadata & green status badge */}
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
                <div class={styles.successBadgeSub}>
                  Signature detected. It will be trimmed and resized.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Preview & auto-detect Section */}
        <div class={styles.autoDetectSection}>
          <div class={styles.autoDetectHeading}>Preview & auto-detect</div>
          <div class={styles.detectionBoxesRow}>
            {/* Before Box */}
            <div class={styles.detectionBoxItem}>
              <span class={styles.detectionLabel}>Before (Original image)</span>
              <div class={styles.beforePreviewBox}>
                <div class={styles.dashedRedBound}>
                  <img
                    src={previewSrc}
                    alt="Original signature before trim"
                    class={styles.signatureBeforeImg}
                  />
                </div>
              </div>
            </div>

            {/* Arrow */}
            <div class={styles.detectionArrow}>→</div>

            {/* After Box */}
            <div class={styles.detectionBoxItem}>
              <span class={styles.detectionLabel}>After (Detected & trimmed)</span>
              <div class={styles.afterPreviewBox}>
                <div class={styles.dashedBlueBound}>
                  <img
                    src={previewSrc}
                    alt="Detected and trimmed signature"
                    class={styles.signatureAfterImg}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
