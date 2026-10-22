import { useState } from 'preact/hooks';
import styles from './imageResize.module.css';
import type { UseImageResizeReturn } from './useImageResize.ts';

export interface ImageResizeCanvasProps {
  idPrefix: string;
  resize: UseImageResizeReturn;
}

export function ImageResizeCanvas({ idPrefix: _idPrefix, resize }: ImageResizeCanvasProps) {
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  const handleZoomIn = () => setZoomLevel((z) => Math.min(250, z + 25));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(50, z - 25));
  const handleZoomReset = () => setZoomLevel(100);

  const hasFile = !!resize.file && !!resize.imageSrc;

  return (
    <section class={styles.canvasPanel} aria-label="Visual Resize Canvas">
      {/* CANVAS TOOLBAR */}
      <div class={styles.canvasToolbar}>
        <div class={styles.canvasToolbarTitle}>
          <span aria-hidden="true">📐</span>
          <span>Resize Visual Workbench</span>
        </div>

        <div class={styles.canvasToolbarControls}>
          <button
            type="button"
            class={styles.canvasToolBtn}
            onClick={handleZoomIn}
            title="Zoom In"
            aria-label="Zoom In"
            disabled={!hasFile}
          >
            🔍+
          </button>
          <button
            type="button"
            class={styles.canvasToolBtn}
            onClick={handleZoomOut}
            title="Zoom Out"
            aria-label="Zoom Out"
            disabled={!hasFile}
          >
            🔍-
          </button>
          <button
            type="button"
            class={styles.canvasToolBtn}
            onClick={handleZoomReset}
            title="Reset Zoom to 100%"
            disabled={!hasFile}
          >
            {zoomLevel}%
          </button>
          <button
            type="button"
            class={styles.canvasToolBtn}
            onClick={resize.reset}
            title="Reset Dimensions"
            aria-label="Reset dimensions"
            disabled={!hasFile}
          >
            ↺ Reset
          </button>
        </div>
      </div>

      {/* CANVAS STAGE */}
      <div
        class={styles.canvasStageWrapper}
        style={{
          transform: `scale(${zoomLevel / 100})`,
          transformOrigin: 'center center',
          transition: 'transform 0.15s ease-out',
        }}
      >
        <div class={styles.viewport}>
          {hasFile ? (
            <div class={styles.stage}>
              <img
                class={styles.image}
                src={resize.imageSrc ?? ''}
                alt={resize.file?.name ?? 'Image to resize'}
              />
            </div>
          ) : (
            <div
              style={{
                padding: '40px 20px',
                textAlign: 'center',
                color: 'var(--color-text-muted)',
              }}
            >
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>🖼️</div>
              <p style={{ margin: 0, fontSize: '13px', fontWeight: 'bold' }}>No Image Loaded</p>
              <p style={{ margin: '4px 0 0', fontSize: '11px' }}>
                Upload an image or click "Try Sample" to open the interactive resize studio
              </p>
            </div>
          )}
        </div>
      </div>

      {/* CANVAS FOOTER HINT & DIMENSION PILL */}
      <div class={styles.canvasFooter}>
        <div class={styles.dimensionPill}>
          {hasFile
            ? `Target: ${Math.round(resize.targetWidth)} × ${Math.round(resize.targetHeight)} px (${resize.scalePercent}% scale)`
            : 'Select an image to preview target resolution'}
        </div>
        <div class={styles.canvasHint}>
          💡 Aspect ratio {resize.lockAspectRatio ? 'locked' : 'free'} • High-fidelity bicubic
          interpolation • 100% in-browser
        </div>
      </div>
    </section>
  );
}
