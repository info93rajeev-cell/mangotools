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
}: {
  zoom: number;
  hasImage: boolean;
  onZoom: (update: (z: number) => number) => void;
}) {
  return (
    <div class={styles.stageToolbar}>
      <span class={styles.stageTitle}>Visual Stage (Before / After)</span>
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

function StageSplitView({ enlarger, zoom }: { enlarger: UseImageEnlargerReturn; zoom: number }) {
  const enhancedSrc = enlarger.resultUrl ?? enlarger.imageSrc;

  return (
    <div
      style={{
        position: 'relative',
        display: 'inline-block',
        transform: `scale(${zoom / 100})`,
        transformOrigin: 'center center',
        transition: 'transform 0.1s ease',
      }}
    >
      <img
        src={enhancedSrc ?? ''}
        alt="Enhanced view"
        class={styles.stageImage}
        draggable={false}
      />
      {enlarger.resultUrl && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            overflow: 'hidden',
            width: `${enlarger.splitPos}%`,
          }}
        >
          <img
            src={enlarger.imageSrc ?? ''}
            alt="Original view"
            class={styles.stageImage}
            style={{ maxWidth: 'none', height: '100%' }}
            draggable={false}
          />
        </div>
      )}
      {enlarger.resultUrl && (
        <div class={styles.splitBar} style={{ left: `${enlarger.splitPos}%` }}>
          <div class={styles.splitHandle}>↔</div>
        </div>
      )}
    </div>
  );
}

export function ImageEnlargerCanvas({ enlarger }: ImageEnlargerCanvasProps) {
  const [zoom, setZoom] = useState(100);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const hasImage = !!enlarger.imageSrc;

  const handlePointerMove = (e: PointerEvent) => {
    if (!isDragging.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    enlarger.setSplitPos(Math.round((x / rect.width) * 100));
  };

  return (
    <section class={styles.stagePanel} aria-label="Visual Comparison Stage">
      <StageToolbar zoom={zoom} hasImage={hasImage} onZoom={setZoom} />
      <div
        ref={containerRef}
        class={styles.canvasWrapper}
        onPointerDown={() => {
          isDragging.current = true;
        }}
        onPointerUp={() => {
          isDragging.current = false;
        }}
        onPointerLeave={() => {
          isDragging.current = false;
        }}
        onPointerMove={(e) => handlePointerMove(e as unknown as PointerEvent)}
      >
        {!hasImage ? (
          <div style={{ color: '#888', fontSize: '12px' }}>
            Upload a photo or click "Try Sample" to begin
          </div>
        ) : (
          <StageSplitView enlarger={enlarger} zoom={zoom} />
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
