import { useState } from 'preact/hooks';
import styles from './imageMetadata.module.css';
import type { UseImageMetadataRemoverReturn } from './useImageMetadataRemover.ts';

export interface ImageMetadataCanvasProps {
  idPrefix: string;
  meta: UseImageMetadataRemoverReturn;
}

export function ImageMetadataCanvas({ idPrefix: _idPrefix, meta }: ImageMetadataCanvasProps) {
  const [zoom, setZoom] = useState<number>(1);
  const hasFile = !!meta.file;

  return (
    <main class={styles.canvasContainer} aria-label="Metadata Image Preview">
      {/* TOP CANVAS TOOLBAR */}
      <div class={styles.canvasToolbar}>
        <div class={styles.toolbarInfo}>
          <span class={styles.dimensionBadge}>
            {meta.sourceDims.width} × {meta.sourceDims.height} px
          </span>
          <span class={styles.formatBadge}>
            Format: {meta.outputFormat === 'same' ? 'Original' : meta.outputFormat.toUpperCase()}
          </span>
        </div>

        <div class={styles.toolbarControls}>
          <div class={styles.zoomGroup}>
            <button
              type="button"
              class={styles.zoomBtn}
              onClick={() => setZoom((z) => Math.max(0.5, Number((z - 0.25).toFixed(2))))}
              title="Zoom Out"
            >
              −
            </button>
            <span class={styles.zoomVal}>{Math.round(zoom * 100)}%</span>
            <button
              type="button"
              class={styles.zoomBtn}
              onClick={() => setZoom((z) => Math.min(3, Number((z + 0.25).toFixed(2))))}
              title="Zoom In"
            >
              +
            </button>
            <button
              type="button"
              class={styles.zoomResetBtn}
              onClick={() => setZoom(1)}
              title="Reset Zoom"
            >
              Fit
            </button>
          </div>
        </div>
      </div>

      {/* STAGE AREA */}
      <div class={styles.stageViewport}>
        {hasFile && (meta.imageSrc || meta.resultUrl) ? (
          <div
            class={styles.imagePreviewBox}
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: 'center center',
            }}
          >
            <img
              src={meta.resultUrl ?? meta.imageSrc ?? ''}
              alt="Metadata cleaner preview"
              class={styles.previewImg}
            />

            {/* Privacy shield badge overlay */}
            <div class={styles.cleanShieldBadge}>
              <span>🛡️</span>
              <span>Metadata Stripped</span>
            </div>
          </div>
        ) : (
          <div class={styles.emptyState}>
            <div class={styles.emptyIcon}>📷</div>
            <p class={styles.emptyTitle}>No Image Loaded</p>
            <p class={styles.emptyHint}>
              Select a photo or click <strong>Sample</strong> to preview metadata stripping.
            </p>
          </div>
        )}
      </div>

      {/* FOOTER BAR */}
      <div class={styles.canvasFooter}>
        <div class={styles.statusIndicator}>
          <span class={styles.statusDot} />
          <span>Canvas Re-encode: Dimensions Preserved & EXIF Purged</span>
        </div>
        <div class={styles.engineNotice}>🔒 100% In-Browser. No Server Uploads.</div>
      </div>
    </main>
  );
}
