import { useMemo, useState } from 'preact/hooks';
import styles from './imageWatermark.module.css';
import type { useImageWatermark } from './useImageWatermark.ts';

export interface ImageWatermarkCanvasProps {
  watermark: ReturnType<typeof useImageWatermark>;
}

export function ImageWatermarkCanvas({ watermark }: ImageWatermarkCanvasProps) {
  const [zoom, setZoom] = useState(1);

  const zoomIn = () => setZoom((z) => Math.min(3, +(z + 0.25).toFixed(2)));
  const zoomOut = () => setZoom((z) => Math.max(0.5, +(z - 0.25).toFixed(2)));
  const zoomReset = () => setZoom(1);

  const overlayStyle = useMemo(() => {
    const p = watermark.position;
    const base: Record<string, string | number> = {
      opacity: watermark.opacity / 100,
      fontSize: `${Math.max(12, Math.round(watermark.fontSize * 0.75))}px`,
      color: watermark.color,
    };

    switch (p) {
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
  }, [watermark.position, watermark.opacity, watermark.fontSize, watermark.color]);

  return (
    <section class={styles.canvasPanel}>
      <div class={styles.canvasHeader}>
        <span class={styles.canvasTitle}>Live Watermark Stage</span>
        <div class={styles.canvasControls}>
          <button type="button" class={styles.canvasBtn} onClick={zoomOut} title="Zoom out">
            -
          </button>
          <button type="button" class={styles.canvasBtn} onClick={zoomReset} title="Reset zoom">
            {Math.round(zoom * 100)}%
          </button>
          <button type="button" class={styles.canvasBtn} onClick={zoomIn} title="Zoom in">
            +
          </button>
        </div>
      </div>

      <div class={styles.canvasViewport}>
        {watermark.imageSrc ? (
          <div
            class={styles.previewContainer}
            style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
          >
            <img src={watermark.imageSrc} alt="Source preview" class={styles.previewImage} />
            {watermark.text.trim() && (
              <span class={styles.watermarkOverlay} style={overlayStyle}>
                {watermark.text}
              </span>
            )}
          </div>
        ) : (
          <div style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>
            No image loaded. Upload an image or click "Try Sample".
          </div>
        )}
      </div>

      <div class={styles.canvasFooter}>
        <span>
          {watermark.sourceDims
            ? `${watermark.sourceDims.width} × ${watermark.sourceDims.height} px`
            : 'No image'}
        </span>
        <span>Live interactive positioning</span>
      </div>
    </section>
  );
}
