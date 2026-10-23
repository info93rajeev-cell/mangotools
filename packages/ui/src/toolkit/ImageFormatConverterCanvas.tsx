import { useState } from 'preact/hooks';
import styles from './imageFormatConverter.module.css';
import type { UseImageFormatConverterReturn } from './useImageFormatConverter.ts';

export interface ImageFormatConverterCanvasProps {
  idPrefix: string;
  converter: UseImageFormatConverterReturn;
}

export function ImageFormatConverterCanvas({
  idPrefix: _idPrefix,
  converter,
}: ImageFormatConverterCanvasProps) {
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  const handleZoomIn = () => setZoomLevel((z) => Math.min(250, z + 25));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(50, z - 25));
  const handleZoomReset = () => setZoomLevel(100);

  const hasFile = !!converter.file && !!converter.imageSrc;

  return (
    <section class={styles.canvasPanel} aria-label="Visual Format Converter Canvas">
      {/* CANVAS TOOLBAR */}
      <div class={styles.canvasToolbar}>
        <div class={styles.canvasToolbarTitle}>
          <span aria-hidden="true">🔄</span>
          <span>Format Converter Visual Stage</span>
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
                src={converter.imageSrc ?? ''}
                alt={converter.file?.name ?? 'Image to convert'}
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
                Upload an image or click "Try Sample" to begin format conversion
              </p>
            </div>
          )}
        </div>
      </div>

      {/* CANVAS FOOTER HINT & DIMENSION PILL */}
      <div class={styles.canvasFooter}>
        <div class={styles.dimensionPill}>
          {hasFile
            ? `${converter.sourceDims.width} × ${converter.sourceDims.height} px • ${(converter.sourceFormat ?? 'jpg').toUpperCase()} → ${converter.targetFormat.toUpperCase()} (Preserves Dimensions)`
            : 'Select an image to inspect source specifications'}
        </div>
        <div class={styles.canvasHint}>
          💡 Lossless conversion to PNG • Bicubic resampling • 100% in-browser privacy
        </div>
      </div>
    </section>
  );
}
