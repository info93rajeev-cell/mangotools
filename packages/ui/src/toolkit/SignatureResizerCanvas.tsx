import styles from './signatureResizer.module.css';
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
  const hasFile = !!signature.file;
  const previewSrc = signature.resultUrl ?? signature.imageSrc ?? '/samples/signature.jpg';
  const fileName = signature.file?.name ?? 'signature.jpg';
  const fileSizeText = formatBytes(signature.file?.size);
  const dimsText = signature.sourceDims.width
    ? `${signature.sourceDims.width} × ${signature.sourceDims.height}`
    : '1200 × 900';

  return (
    <main class={styles.canvasContainer} aria-label="Signature Upload Stage">
      <div class={styles.panelCard}>
        {/* Card Header */}
        <div class={styles.cardHeader}>
          <span class={styles.cardTitle}>1. Upload signature image</span>
          {hasFile && (
            <label
              for={`${idPrefix}-signature-upload-input`}
              class={styles.replaceBtn}
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
              <span>Replace image</span>
            </label>
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
            if (f) onSelectFile(f);
          }}
        />

        {/* Loaded Image Stage or Dropzone */}
        {hasFile ? (
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
        ) : (
          <div class={styles.dropzoneWrap}>
            <label
              for={`${idPrefix}-signature-upload-input`}
              class={styles.dropzoneBox}
              data-upload-button=""
              style={{
                border: '1.5px dashed #cbd5e1',
                borderRadius: '6px',
                padding: '6px 8px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <div class={styles.cloudIcon}>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
                  <path d="M12 12v9" />
                  <path d="m8 16 4-4 4 4" />
                </svg>
              </div>
              <span style={{ fontSize: '10.5px', fontWeight: 'bold', color: '#0f172a' }}>
                Drag & drop signature file
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', margin: '2px 0' }}>
                <span style={{ fontSize: '9.5px', color: '#64748b' }}>or</span>
                <span class={styles.replaceBtn}>
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
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  <span>Upload Signature</span>
                </span>
              </div>
              <span style={{ fontSize: '8.5px', color: '#64748b' }}>
                Supports JPG, PNG, WebP (Scanned doc or photo)
              </span>
            </label>
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
