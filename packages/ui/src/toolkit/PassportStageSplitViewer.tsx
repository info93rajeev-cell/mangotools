import { useState } from 'preact/hooks';
import styles from './passportEnhance.module.css';
import type { EnhanceToolTab } from './usePassportEnhanceState.ts';

export interface PassportStageSplitViewerProps {
  displayEnhancedSrc: string;
  basePortraitSrc: string;
  splitPosition: number;
  setSplitPosition: (pos: number) => void;
  zoomLevel: number;
  panOffset: { x: number; y: number };
  activeTab: EnhanceToolTab;
  isPanActive: boolean;
  isPanning: boolean;
  onStagePointerDown: (e: PointerEvent) => void;
  onSpotClick: (e: MouseEvent) => void;
  stageRef: { current: HTMLDivElement | null };
}

export function PassportStageSplitViewer({
  displayEnhancedSrc,
  basePortraitSrc,
  splitPosition,
  setSplitPosition,
  zoomLevel,
  panOffset,
  activeTab,
  isPanActive,
  isPanning,
  onStagePointerDown,
  onSpotClick,
  stageRef,
}: PassportStageSplitViewerProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handlePointerDown = (e: PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setIsDragging(true);
  };

  const handlePointerMove = (e: PointerEvent) => {
    if (isDragging && stageRef.current) {
      const rect = stageRef.current.getBoundingClientRect();
      const rawX = e.clientX - rect.left;
      const pct = Math.max(5, Math.min(95, Math.round((rawX / rect.width) * 100)));
      setSplitPosition(pct);
    }
  };

  const handlePointerUp = (e: PointerEvent) => {
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignored
    }
    setIsDragging(false);
  };

  const cursorStyle =
    activeTab === 'retouch'
      ? 'crosshair'
      : isPanActive || zoomLevel > 100
        ? isPanning
          ? 'grabbing'
          : 'grab'
        : 'default';

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: Split viewer container
    // biome-ignore lint/a11y/useKeyWithClickEvents: Click handler for spot retouch
    <div
      class={styles.splitViewerContainer}
      ref={stageRef}
      onClick={onSpotClick}
      onPointerDown={onStagePointerDown}
      style={{ cursor: cursorStyle }}
    >
      <div
        class={styles.splitImageTransformWrapper}
        style={{
          transform: `scale(${zoomLevel / 100}) translate(${panOffset.x}px, ${panOffset.y}px)`,
          transformOrigin: 'center center',
          transition: isPanning ? 'none' : 'transform 0.12s ease-out',
        }}
      >
        <img src={displayEnhancedSrc} alt="Enhanced" class={styles.splitImageLayer} />
        <div
          class={styles.splitBeforeLayer}
          style={{ clipPath: `inset(0 ${100 - splitPosition}% 0 0)` }}
        >
          <img src={basePortraitSrc} alt="Original Before" class={styles.splitImageLayer} />
        </div>
      </div>

      <div
        class={styles.splitDividerBar}
        style={{ left: `${splitPosition}%`, touchAction: 'none' }}
        role="slider"
        aria-label="Before and after split slider"
        aria-valuenow={splitPosition}
        aria-valuemin={5}
        aria-valuemax={95}
        tabIndex={0}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div class={styles.splitHandleCircle}>
          <span class={styles.splitHandleArrows}>‹ ›</span>
        </div>
      </div>

      <span class={styles.beforeBadge}>Before</span>
      <span class={styles.afterBadge}>After</span>
    </div>
  );
}
