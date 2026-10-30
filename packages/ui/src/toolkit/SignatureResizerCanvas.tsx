import styles from './signatureResizer.module.css';
import { UniversalUploadDropzone } from './UniversalUploadDropzone.tsx';
import type { UseSignatureResizerReturn } from './useSignatureResizer.ts';

export interface SignatureResizerCanvasProps {
  idPrefix: string;
  signature: UseSignatureResizerReturn;
  onSelectFile: (file: File) => void;
}

export function SignatureResizerCanvas({
  idPrefix,
  signature,
  onSelectFile,
}: SignatureResizerCanvasProps) {
  const hasFile = !!signature.file;
  const previewSrc = signature.resultUrl ?? signature.imageSrc ?? '/samples/signature.jpg';

  return (
    <main class={styles.canvasContainer} aria-label="Signature Upload Stage">
      <div class={styles.panelCard}>
        {/* Card Header */}
        <div class={styles.cardHeader}>
          <span class={styles.cardTitle}>1. Upload signature image</span>
        </div>

        {/* Universal Upload Dropzone */}
        <UniversalUploadDropzone
          idPrefix={idPrefix}
          accept="image/*,image/jpeg,image/png,image/webp"
          file={signature.file}
          thumbnailUrl={signature.imageSrc}
          dimensions={
            signature.file && signature.sourceDims.width > 0 ? signature.sourceDims : null
          }
          onSelectFile={onSelectFile}
          onClear={signature.clearAll}
          disabled={signature.phase === 'running'}
          primaryText="Drag and drop images here"
          browseText="click to browse files"
          supportHint="Supports JPG, PNG, WebP, BMP. You can upload multiple images at once."
          linkBrowse={true}
          renderImgThumbnail={true}
        />

        {/* Preview & auto-detect Section */}
        {hasFile && (
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
        )}
      </div>
    </main>
  );
}
