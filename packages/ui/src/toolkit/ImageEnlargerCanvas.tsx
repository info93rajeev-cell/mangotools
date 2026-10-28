import { useRef, useState } from 'preact/hooks';
import styles from './imageEnlarger.module.css';
import type { UseImageEnlargerReturn } from './useImageEnlarger.ts';

export interface ImageEnlargerCanvasProps {
  idPrefix: string;
  enlarger: UseImageEnlargerReturn;
}

function StageToolbar({
  zoom,
  hasImage,
  onZoom,
  onResetSplit,
  onHoldOriginalStart,
  onHoldOriginalEnd,
}: {
  zoom: number;
  hasImage: boolean;
  onZoom: (update: (z: number) => number) => void;
  onResetSplit: () => void;
  onHoldOriginalStart: () => void;
  onHoldOriginalEnd: () => void;
}) {
  return (
    <div class={styles.stageToolbar}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
        <span class={styles.stageTitle}>Visual Stage (Before / After)</span>
        {hasImage && (
          <button
            type="button"
            class={styles.compareBtn}
            onMouseDown={onHoldOriginalStart}
            onMouseUp={onHoldOriginalEnd}
            onTouchStart={onHoldOriginalStart}
            onTouchEnd={onHoldOriginalEnd}
            title="Click and hold to compare with original image"
          >
            👁️ Hold: View Before
          </button>
        )}
        {hasImage && (
          <button
            type="button"
            class={styles.miniStageBtn}
            onClick={onResetSplit}
            title="Reset split position to 50%"
          >
            50% Split
          </button>
        )}
      </div>

      <div class={styles.stageControls}>
        <button
          type="button"
          class={styles.stageBtn}
          onClick={() => onZoom((z) => Math.max(25, z - 25))}
          disabled={!hasImage}
          title="Zoom out"
        >
          −
        </button>
        <span style={{ fontSize: '10px', minWidth: '35px', textAlign: 'center' }}>{zoom}%</span>
        <button
          type="button"
          class={styles.stageBtn}
          onClick={() => onZoom((z) => Math.min(300, z + 25))}
          disabled={!hasImage}
          title="Zoom in"
        >
          +
        </button>
        <button
          type="button"
          class={styles.stageBtn}
          onClick={() => onZoom(() => 100)}
          disabled={!hasImage}
          title="Reset Zoom"
        >
          Fit
        </button>
      </div>
    </div>
  );
}

function StageSplitView({
  enlarger,
  zoom,
  containerRef,
}: {
  enlarger: UseImageEnlargerReturn;
  zoom: number;
  containerRef: { current: HTMLDivElement | null };
}) {
  const enhancedSrc = enlarger.previewUrl ?? enlarger.resultUrl ?? enlarger.imageSrc;
  const originalSrc = enlarger.imageSrc;
  const splitPos = enlarger.isShowingOriginal ? 100 : enlarger.splitPos;

  return (
    <div
      ref={containerRef}
      class={styles.stageSplitContainer}
      style={{
        transform: `scale(${zoom / 100})`,
        transformOrigin: 'center center',
        transition: 'transform 0.1s ease',
      }}
    >
      {/* Enhanced Image (Underneath) */}
      <img
        src={enhancedSrc ?? ''}
        alt="Enhanced view"
        class={styles.stageImage}
        draggable={false}
      />

      {/* Original Image (Clipped overlay) */}
      <div class={styles.splitClipLayer} style={{ width: `${splitPos}%` }}>
        <img
          src={originalSrc ?? ''}
          alt="Original view"
          class={styles.stageImage}
          style={{ maxWidth: 'none', height: '100%' }}
          draggable={false}
        />
      </div>

      {/* Draggable Divider Line */}
      {!enlarger.isShowingOriginal && (
        <div class={styles.splitBar} style={{ left: `${splitPos}%` }}>
          <div class={styles.splitHandle} title="Drag left/right to compare Before and After">
            ↔
          </div>
        </div>
      )}

      {/* Floating Badges */}
      <div class={styles.beforeBadge} style={{ opacity: splitPos > 12 ? 1 : 0 }}>
        Before (Original)
      </div>
      <div class={styles.afterBadge} style={{ opacity: splitPos < 88 ? 1 : 0 }}>
        After (Enhanced)
      </div>
    </div>
  );
}

export function ImageEnlargerCanvas({ enlarger }: ImageEnlargerCanvasProps) {
  const [zoom, setZoom] = useState(100);
  const imageBoxRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const hasImage = !!enlarger.imageSrc;

  const updateSplit = (clientX: number) => {
    if (!imageBoxRef.current) return;
    const rect = imageBoxRef.current.getBoundingClientRect();
    if (rect.width <= 0) return;
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    enlarger.setSplitPos(Math.round((x / rect.width) * 100));
  };

  const handlePointerDown = (e: PointerEvent) => {
    isDragging.current = true;
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    updateSplit(e.clientX);
  };

  const handlePointerMove = (e: PointerEvent) => {
    if (!isDragging.current) return;
    updateSplit(e.clientX);
  };

  const handlePointerUp = () => {
    isDragging.current = false;
  };

  return (
    <section class={styles.stagePanel} aria-label="Visual Comparison Stage">
      <StageToolbar
        zoom={zoom}
        hasImage={hasImage}
        onZoom={setZoom}
        onResetSplit={() => enlarger.setSplitPos(50)}
        onHoldOriginalStart={() => enlarger.setIsShowingOriginal(true)}
        onHoldOriginalEnd={() => enlarger.setIsShowingOriginal(false)}
      />

      <div
        class={styles.canvasWrapper}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        style={{ cursor: hasImage ? 'ew-resize' : 'default' }}
      >
        {!hasImage ? (
          <div style={{ color: '#888', fontSize: '12px' }}>
            Upload a photo or click "Try Sample" to begin
          </div>
        ) : (
          <StageSplitView enlarger={enlarger} zoom={zoom} containerRef={imageBoxRef} />
        )}

        {hasImage && (
          <div class={styles.stagePill}>
            {enlarger.sourceDims.width} × {enlarger.sourceDims.height} ➔{' '}
            {enlarger.sourceDims.width * enlarger.settings.scale} ×{' '}
            {enlarger.sourceDims.height * enlarger.settings.scale} px ({enlarger.settings.scale}×)
          </div>
        )}
      </div>
    </section>
  );
}
