import { useState } from 'preact/hooks';
import styles from './imageCompress.module.css';
import { BINARY_SIZE_NOTE, formatImageBytes } from './imageSizeFormat.ts';
import type { UseImageCompressReturn } from './useImageCompress.ts';

export interface ImageCompressCanvasProps {
  idPrefix: string;
  compress: UseImageCompressReturn;
}

export function ImageCompressCanvas({ idPrefix: _idPrefix, compress }: ImageCompressCanvasProps) {
  const [zoom, setZoom] = useState<number>(1);
  const hasFile = !!compress.file && !!compress.imageSrc;

  const handleZoomIn = () => setZoom((z) => Math.min(3, +(z + 0.25).toFixed(2)));
  const handleZoomOut = () => setZoom((z) => Math.max(0.25, +(z - 0.25).toFixed(2)));
  const handleResetZoom = () => setZoom(1);

  const displaySrc = compress.resultUrl || compress.imageSrc;
  const isResult = !!compress.resultUrl && compress.phase === 'result';

  return (
    <section class={styles.canvasPanel} aria-label="Compression Visual Stage">
      <div class={styles.canvasHeader}>
        <div class={styles.stageTitleGroup}>
          <span class={styles.stageIcon}>📉</span>
          <span class={styles.stageTitle}>
            {isResult ? 'Compressed Image Preview' : 'Image Compress Visual Stage'}
          </span>
        </div>

        <div class={styles.zoomControls}>
          <button
            type="button"
            class={styles.zoomBtn}
            onClick={handleZoomIn}
            disabled={!hasFile || zoom >= 3}
            title="Zoom In"
            aria-label="Zoom in"
          >
            🔍+
          </button>
          <button
            type="button"
            class={styles.zoomBtn}
            onClick={handleZoomOut}
            disabled={!hasFile || zoom <= 0.25}
            title="Zoom Out"
            aria-label="Zoom out"
          >
            🔍-
          </button>
          <span class={styles.zoomIndicator}>{Math.round(zoom * 100)}%</span>
          <button
            type="button"
            class={styles.zoomBtn}
            onClick={handleResetZoom}
            disabled={!hasFile || zoom === 1}
            title="Reset Zoom"
            aria-label="Reset zoom"
          >
            ↺ Reset
          </button>
        </div>
      </div>

      <div class={styles.viewportContainer}>
        {hasFile && displaySrc ? (
          <div class={styles.imageWrapper}>
            <img
              src={displaySrc}
              alt="Compress visual preview"
              class={styles.canvasImage}
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: 'center center',
              }}
            />
          </div>
        ) : (
          <div class={styles.emptyCanvasNotice}>
            <span class={styles.emptyNoticeIcon}>🖼️</span>
            <span class={styles.emptyNoticeTitle}>No image loaded</span>
            <span class={styles.emptyNoticeHint}>
              Upload a JPG, PNG, or WebP image to preview and compress.
            </span>
          </div>
        )}
      </div>

      {hasFile && (
        <div class={styles.canvasFooterBar}>
          <div class={styles.dimensionsBadge} title={BINARY_SIZE_NOTE}>
            <span>
              {compress.sourceDims.width} × {compress.sourceDims.height} px • Original:{' '}
              {formatImageBytes(compress.file?.size ?? 0)}
              {compress.result &&
                ` → Compressed: ${formatImageBytes(compress.result.outputFileSize)}`}
            </span>
          </div>
          <span class={styles.privacyPill}>
            💡 100% In-Browser Compression • Zero Server Uploads
          </span>
        </div>
      )}
    </section>
  );
}
