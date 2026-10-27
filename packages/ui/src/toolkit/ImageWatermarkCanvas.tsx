import { useState } from 'preact/hooks';
import styles from './imageWatermark.module.css';
import type { UseImageWatermarkReturn, WatermarkPosition } from './useImageWatermark.ts';

export interface ImageWatermarkCanvasProps {
  idPrefix: string;
  watermark: UseImageWatermarkReturn;
}

function getWatermarkOverlayStyle(
  pos: WatermarkPosition,
  opacity: number,
  fontSize: number,
  color: string,
) {
  const base: Record<string, string | number> = {
    position: 'absolute',
    opacity: opacity / 100,
    fontSize: `${fontSize}px`,
    color,
    fontFamily: 'sans-serif',
    fontWeight: 'bold',
    textShadow: '0 1px 3px rgba(0, 0, 0, 0.6)',
    pointerEvents: 'none',
    whiteSpace: 'nowrap',
    userSelect: 'none',
  };

  switch (pos) {
    case 'top-left':
      return { ...base, top: '16px', left: '16px' };
    case 'top-right':
      return { ...base, top: '16px', right: '16px' };
    case 'center':
      return {
        ...base,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      };
    case 'bottom-left':
      return { ...base, bottom: '16px', left: '16px' };
    default:
      return { ...base, bottom: '16px', right: '16px' };
  }
}

export function ImageWatermarkCanvas({
  idPrefix: _idPrefix,
  watermark,
}: ImageWatermarkCanvasProps) {
  const [zoom, setZoom] = useState<number>(1);
  const hasFile = !!watermark.file;

  return (
    <main class={styles.canvasContainer} aria-label="Watermark Image Preview">
      {/* TOP CANVAS TOOLBAR */}
      <div class={styles.canvasToolbar}>
        <div class={styles.toolbarInfo}>
          <span class={styles.dimensionBadge}>
            {watermark.sourceDims.width} × {watermark.sourceDims.height} px
          </span>
          <span class={styles.formatBadge}>
            Format:{' '}
            {watermark.outputFormat === 'same' ? 'Original' : watermark.outputFormat.toUpperCase()}
          </span>
          <span class={styles.posBadge}>Pos: {watermark.position}</span>
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
        {hasFile && (watermark.imageSrc || watermark.resultUrl) ? (
          <div
            class={styles.imagePreviewBox}
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: 'center center',
            }}
          >
            <img
              src={watermark.resultUrl ?? watermark.imageSrc ?? ''}
              alt="Watermark preview"
              class={styles.previewImg}
            />

            {/* Live watermark text overlay preview (when user entered text and no final baked result) */}
            {!watermark.result && watermark.text.trim() && (
              <div
                style={getWatermarkOverlayStyle(
                  watermark.position,
                  watermark.opacity,
                  watermark.fontSize,
                  watermark.color,
                )}
              >
                {watermark.text}
              </div>
            )}
          </div>
        ) : (
          <div class={styles.emptyState}>
            <div class={styles.emptyIcon}>💧</div>
            <p class={styles.emptyTitle}>No Image Loaded</p>
            <p class={styles.emptyHint}>
              Select a photo or click <strong>Sample</strong> to preview watermarking.
            </p>
          </div>
        )}
      </div>

      {/* FOOTER BAR */}
      <div class={styles.canvasFooter}>
        <div class={styles.statusIndicator}>
          <span class={styles.statusDot} />
          <span>Interactive Watermark Placement Studio</span>
        </div>
        <div class={styles.engineNotice}>🔒 100% In-Browser. No Server Uploads.</div>
      </div>
    </main>
  );
}
