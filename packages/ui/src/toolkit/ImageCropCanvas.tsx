import { useState } from 'preact/hooks';
import { ImageWorkbench } from './ImageWorkbench.tsx';
import styles from './imageCrop.module.css';
import type { AspectRatioPreset, PixelRect } from './imageWorkbenchGeometry.ts';

export interface ImageCropCanvasProps {
  idPrefix: string;
  imageSrc: string;
  imageAlt: string;
  sourceWidth: number;
  sourceHeight: number;
  cropRect: PixelRect;
  onChangeCropRect: (rect: PixelRect) => void;
  ratio: AspectRatioPreset;
  onChangeRatio: (ratio: AspectRatioPreset) => void;
  onReset: () => void;
}

export function ImageCropCanvas({
  idPrefix,
  imageSrc,
  imageAlt,
  sourceWidth,
  sourceHeight,
  cropRect,
  onChangeCropRect,
  ratio,
  onChangeRatio,
  onReset,
}: ImageCropCanvasProps) {
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [rotation, setRotation] = useState<number>(0);

  const handleZoomIn = () => setZoomLevel((z) => Math.min(250, z + 25));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(50, z - 25));
  const handleZoomReset = () => setZoomLevel(100);
  const handleRotate = () => setRotation((r) => (r + 90) % 360);

  return (
    <section class={styles.canvasPanel} aria-label="Visual Crop Canvas">
      {/* CANVAS TOOLBAR */}
      <div class={styles.canvasToolbar}>
        <div class={styles.canvasToolbarTitle}>
          <span class={styles.canvasToolbarIcon} aria-hidden="true">
            ✂️
          </span>
          <span class={styles.canvasToolbarText}>Crop Visual Workbench</span>
        </div>

        <div class={styles.canvasToolbarControls}>
          <button
            type="button"
            class={styles.canvasToolBtn}
            onClick={handleZoomIn}
            title="Zoom In"
            aria-label="Zoom In"
          >
            🔍+
          </button>
          <button
            type="button"
            class={styles.canvasToolBtn}
            onClick={handleZoomOut}
            title="Zoom Out"
            aria-label="Zoom Out"
          >
            🔍-
          </button>
          <button
            type="button"
            class={styles.canvasToolBtn}
            onClick={handleZoomReset}
            title="Reset Zoom to 100%"
          >
            {zoomLevel}%
          </button>
          <button
            type="button"
            class={styles.canvasToolBtn}
            onClick={handleRotate}
            title="Rotate 90 degrees clockwise"
            aria-label="Rotate 90 degrees"
          >
            🔄 90°
          </button>
          <button
            type="button"
            class={styles.canvasToolBtn}
            onClick={onReset}
            title="Reset Selection"
            aria-label="Reset selection"
          >
            ↺ Reset
          </button>
        </div>
      </div>

      {/* CANVAS STAGE */}
      <div
        class={styles.canvasStageWrapper}
        style={{
          transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg)`,
          transformOrigin: 'center center',
          transition: 'transform 0.15s ease-out',
        }}
      >
        <ImageWorkbench
          idPrefix={idPrefix}
          imageSrc={imageSrc}
          imageAlt={imageAlt}
          sourceWidth={sourceWidth}
          sourceHeight={sourceHeight}
          value={cropRect}
          onChange={onChangeCropRect}
          aspectRatio={ratio}
          onAspectRatioChange={onChangeRatio}
          showAspectRatioControls={false}
          showResetButton={false}
          showCoordinates={false}
        />
      </div>

      {/* CANVAS FOOTER HINT & DIMENSION PILL */}
      <div class={styles.canvasFooter}>
        <div class={styles.dimensionPill}>
          Selection: {Math.round(cropRect.width)} × {Math.round(cropRect.height)} px (
          {ratio === 'free' ? 'Custom' : ratio})
        </div>
        <div class={styles.canvasHint}>
          💡 Drag handles to crop • Drag frame to move • Arrow keys for 1 px precision
        </div>
      </div>
    </section>
  );
}
