import { useState } from 'preact/hooks';
import styles from './photoSizeReducer.module.css';
import type { UsePhotoSizeReducerReturn } from './usePhotoSizeReducer.ts';

export interface PhotoSizeReducerCanvasProps {
  idPrefix: string;
  photoSize: UsePhotoSizeReducerReturn;
}

export function PhotoSizeReducerCanvas({
  idPrefix: _idPrefix,
  photoSize,
}: PhotoSizeReducerCanvasProps) {
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  const handleZoomIn = () => setZoomLevel((z) => Math.min(250, z + 25));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(50, z - 25));
  const handleZoomReset = () => setZoomLevel(100);

  const hasFile = !!photoSize.file && !!photoSize.imageSrc;

  return (
    <section class={styles.canvasPanel} aria-label="Visual Photo Stage">
      <div class={styles.canvasToolbar}>
        <div class={styles.canvasToolbarTitle}>
          <span aria-hidden="true">🖼️</span>
          <span>Photo Reduction Studio</span>
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
            onClick={photoSize.reset}
            title="Reset Settings"
            aria-label="Reset settings"
            disabled={!hasFile}
          >
            ↺ Reset
          </button>
        </div>
      </div>

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
                src={photoSize.resultUrl ?? photoSize.imageSrc ?? ''}
                alt={photoSize.file?.name ?? 'Photo to reduce'}
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
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>📸</div>
              <p style={{ margin: 0, fontSize: '13px', fontWeight: 'bold' }}>No Photo Loaded</p>
              <p style={{ margin: '4px 0 0', fontSize: '11px' }}>
                Upload a photo or click "Try Sample" to start reduction
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
