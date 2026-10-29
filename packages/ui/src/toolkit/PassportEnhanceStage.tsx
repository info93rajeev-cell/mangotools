import { useCallback, useRef, useState } from 'preact/hooks';
import { BiometricGuideSvg } from './PassportCropWorkbench.tsx';
import styles from './passportEnhance.module.css';
import type { UsePassportEnhanceStateReturn } from './usePassportEnhanceState.ts';
import type { UsePassportPhotoReturn } from './usePassportPhoto.ts';

export interface PassportEnhanceStageProps {
  idPrefix: string;
  passport: UsePassportPhotoReturn;
  enhance: UsePassportEnhanceStateReturn;
}

// biome-ignore lint/complexity/noExcessiveLinesPerFunction: Center enhancement stage
export function PassportEnhanceStage({
  idPrefix: _idPrefix,
  passport,
  enhance,
}: PassportEnhanceStageProps) {
  const {
    activeTab,
    setActiveTab,
    splitPosition,
    setSplitPosition,
    enhancedBlobUrl,
    zoomLevel,
    setZoomLevel,
    resetView,
    addSpotEdit,
    brushSize,
  } = enhance;

  const stageRef = useRef<HTMLDivElement | null>(null);
  const [isDraggingSplit, setIsDraggingSplit] = useState(false);

  const handleSplitMouseDown = (e: MouseEvent) => {
    e.preventDefault();
    setIsDraggingSplit(true);
  };

  const handleStageMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isDraggingSplit && stageRef.current) {
        const rect = stageRef.current.getBoundingClientRect();
        const rawX = e.clientX - rect.left;
        const pct = Math.max(5, Math.min(95, Math.round((rawX / rect.width) * 100)));
        setSplitPosition(pct);
      }
    },
    [isDraggingSplit, setSplitPosition],
  );

  const handleStageMouseUp = useCallback(() => {
    setIsDraggingSplit(false);
  }, []);

  const handleSpotRetouchClick = useCallback(
    (e: MouseEvent) => {
      if (activeTab !== 'retouch' || !stageRef.current) return;
      const rect = stageRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * (passport.sourceDims.width || 790);
      const y = ((e.clientY - rect.top) / rect.height) * (passport.sourceDims.height || 1024);
      addSpotEdit({ x, y, radius: brushSize, strength: 0.75 });
    },
    [activeTab, passport.sourceDims, addSpotEdit, brushSize],
  );

  const rawImgSrc = passport.imageSrc || '/samples/passport-portrait.jpg';
  const displayEnhancedSrc = enhancedBlobUrl || rawImgSrc;

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: Mouse drag tracking for stage canvas
    <div
      class={styles.enhanceStageCard}
      ref={stageRef}
      onMouseMove={handleStageMouseMove}
      onMouseUp={handleStageMouseUp}
      onMouseLeave={handleStageMouseUp}
    >
      {/* CARD 5 HEADER */}
      <div class={styles.stageCardHeader}>
        <div class={styles.stageCardTitleGroup}>
          <span class={styles.stepBadgeAmber}>5</span>
          <span class={styles.stageCardTitle}>Edit & Enhance Photo</span>
        </div>

        {/* TOP TOOLBAR */}
        <div class={styles.stageTopToolbar}>
          <div class={styles.zoomControlsGroup}>
            <span class={styles.zoomLabel}>Zoom</span>
            <button
              type="button"
              class={styles.miniToolBtn}
              onClick={() => setZoomLevel(Math.max(50, zoomLevel - 25))}
              title="Zoom out"
            >
              −
            </button>
            <span class={styles.zoomPct}>{zoomLevel}%</span>
            <button
              type="button"
              class={styles.miniToolBtn}
              onClick={() => setZoomLevel(Math.min(300, zoomLevel + 25))}
              title="Zoom in"
            >
              +
            </button>
          </div>

          <button
            type="button"
            class={styles.miniToolBtn}
            onClick={() => resetView()}
            title="Pan View"
          >
            ✋ Pan
          </button>
          <button
            type="button"
            class={styles.miniToolBtn}
            onClick={() => resetView()}
            title="Fit to Screen"
          >
            ⛶ Fit
          </button>
          <button
            type="button"
            class={styles.miniToolBtn}
            onClick={() => resetView()}
            title="Reset View"
          >
            ↺ Reset View
          </button>
        </div>
      </div>

      {/* STAGE WORKBENCH WITH RIGHT DOCKED TOOLBAR */}
      <div class={styles.stageWorkbenchArea}>
        {/* INTERACTIVE BEFORE / AFTER STAGE */}
        {/* biome-ignore lint/a11y/noStaticElementInteractions: Stage interaction for split comparison and retouch */}
        {/* biome-ignore lint/a11y/useKeyWithClickEvents: Stage click for spot retouch brush */}
        <div
          class={styles.splitViewerContainer}
          onClick={handleSpotRetouchClick}
          style={{ cursor: activeTab === 'retouch' ? 'crosshair' : 'default' }}
        >
          {/* Enhanced "After" Layer (Base) */}
          <img src={displayEnhancedSrc} alt="Enhanced" class={styles.splitImageLayer} />

          {/* Original "Before" Layer (Clipped to Split Position via CSS Clip-Path) */}
          <div
            class={styles.splitBeforeLayer}
            style={{ clipPath: `inset(0 ${100 - splitPosition}% 0 0)` }}
          >
            <img src={rawImgSrc} alt="Original Before" class={styles.splitImageLayer} />
          </div>

          {/* Dividing Split Line & Drag Handle */}
          {/* biome-ignore lint/a11y/noStaticElementInteractions: Draggable split handle */}
          <div
            class={styles.splitDividerBar}
            style={{ left: `${splitPosition}%` }}
            onMouseDown={handleSplitMouseDown}
          >
            <div class={styles.splitHandleCircle}>
              <span class={styles.splitHandleArrows}>‹ ›</span>
            </div>
          </div>

          {/* "Before" and "After" Floating Badges */}
          <span class={styles.beforeBadge}>Before</span>
          <span class={styles.afterBadge}>After</span>

          {/* Biometric Guide Overlay if in Crop mode */}
          {activeTab === 'crop' && <BiometricGuideSvg />}
        </div>

        {/* RIGHT DOCKED TOOL TABS */}
        <div class={styles.stageRightTabs}>
          <button
            type="button"
            class={`${styles.stageTabIconBtn} ${activeTab === 'crop' ? styles.tabIconActive : ''}`}
            onClick={() => setActiveTab('crop')}
            title="Crop & Biometric Guides"
          >
            <span class={styles.tabIconGlyph}>◰</span>
            <span class={styles.tabIconLabel}>Crop</span>
          </button>

          <button
            type="button"
            class={`${styles.stageTabIconBtn} ${activeTab === 'adjust' ? styles.tabIconActive : ''}`}
            onClick={() => setActiveTab('adjust')}
            title="Manual Adjustments"
          >
            <span class={styles.tabIconGlyph}>🎛️</span>
            <span class={styles.tabIconLabel}>Adjust</span>
          </button>

          <button
            type="button"
            class={`${styles.stageTabIconBtn} ${activeTab === 'filters' ? styles.tabIconActive : ''}`}
            onClick={() => setActiveTab('filters')}
            title="Natural Filters"
          >
            <span class={styles.tabIconGlyph}>🎨</span>
            <span class={styles.tabIconLabel}>Filters</span>
          </button>

          <button
            type="button"
            class={`${styles.stageTabIconBtn} ${activeTab === 'retouch' ? styles.tabIconActive : ''}`}
            onClick={() => setActiveTab('retouch')}
            title="Spot Blemish Retouch"
          >
            <span class={styles.tabIconGlyph}>🩹</span>
            <span class={styles.tabIconLabel}>Retouch</span>
          </button>

          <button
            type="button"
            class={`${styles.stageTabIconBtn} ${activeTab === 'background' ? styles.tabIconActive : ''}`}
            onClick={() => setActiveTab('background')}
            title="Background Color"
          >
            <span class={styles.tabIconGlyph}>🏁</span>
            <span class={styles.tabIconLabel}>Background</span>
          </button>
        </div>
      </div>
    </div>
  );
}
