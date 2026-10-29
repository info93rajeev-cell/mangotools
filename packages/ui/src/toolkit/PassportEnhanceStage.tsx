import { useCallback, useRef, useState } from 'preact/hooks';
import { PassportMobileCropStage } from './PassportMobileCropStage.tsx';
import { PassportStageSplitViewer } from './PassportStageSplitViewer.tsx';
import styles from './passportEnhance.module.css';
import type { EnhanceToolTab, UsePassportEnhanceStateReturn } from './usePassportEnhanceState.ts';
import type { UsePassportPhotoReturn } from './usePassportPhoto.ts';

export interface PassportEnhanceStageProps {
  idPrefix: string;
  passport: UsePassportPhotoReturn;
  enhance: UsePassportEnhanceStateReturn;
}

interface StageToolbarProps {
  activeTab: EnhanceToolTab;
  zoomLevel: number;
  isPanActive: boolean;
  onZoomChange: (delta: number) => void;
  onTogglePan: () => void;
  onFit: () => void;
  onResetView: () => void;
  onResetCrop: () => void;
  onDoneCrop: () => void;
}

function StageToolbar({
  activeTab,
  zoomLevel,
  isPanActive,
  onZoomChange,
  onTogglePan,
  onFit,
  onResetView,
  onResetCrop,
  onDoneCrop,
}: StageToolbarProps) {
  if (activeTab === 'crop') {
    return (
      <div class={styles.stageTopToolbar}>
        <button
          type="button"
          class={styles.miniToolBtn}
          onClick={onResetCrop}
          title="Reset crop frame to center"
        >
          ↺ Center Crop
        </button>
        <button
          type="button"
          class={`${styles.miniToolBtn} ${styles.miniToolBtnActive}`}
          onClick={onDoneCrop}
          title="Done cropping, go to adjustments"
        >
          ✓ Done Crop
        </button>
      </div>
    );
  }

  return (
    <div class={styles.stageTopToolbar}>
      <div class={styles.zoomControlsGroup}>
        <span class={styles.zoomLabel}>Zoom</span>
        <button
          type="button"
          class={styles.miniToolBtn}
          onClick={() => onZoomChange(-25)}
          title="Zoom out"
        >
          −
        </button>
        <span class={styles.zoomPct}>{zoomLevel}%</span>
        <button
          type="button"
          class={styles.miniToolBtn}
          onClick={() => onZoomChange(25)}
          title="Zoom in"
        >
          +
        </button>
      </div>

      <button
        type="button"
        class={`${styles.miniToolBtn} ${isPanActive ? styles.miniToolBtnActive : ''}`}
        onClick={onTogglePan}
        title="Pan View (drag to navigate)"
      >
        ✋ Pan
      </button>
      <button type="button" class={styles.miniToolBtn} onClick={onFit} title="Fit to Screen">
        ⛶ Fit
      </button>
      <button
        type="button"
        class={styles.miniToolBtn}
        onClick={onResetView}
        title="Reset Zoom & Pan"
      >
        ↺ Reset View
      </button>
    </div>
  );
}

function StageRightTabs({
  activeTab,
  onSelectTab,
}: {
  activeTab: EnhanceToolTab;
  onSelectTab: (tab: EnhanceToolTab) => void;
}) {
  const tabs: { id: EnhanceToolTab; glyph: string; label: string; title: string }[] = [
    { id: 'crop', glyph: '◰', label: 'Crop', title: 'Crop & Biometric Guides' },
    { id: 'adjust', glyph: '🎛️', label: 'Adjust', title: 'Manual Adjustments' },
    { id: 'filters', glyph: '🎨', label: 'Filters', title: 'Natural Filters' },
    { id: 'retouch', glyph: '🩹', label: 'Retouch', title: 'Spot Blemish Retouch' },
    { id: 'background', glyph: '🏁', label: 'Background', title: 'Background Color' },
  ];

  return (
    <div class={styles.stageRightTabs}>
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          class={`${styles.stageTabIconBtn} ${activeTab === t.id ? styles.tabIconActive : ''}`}
          onClick={() => onSelectTab(t.id)}
          title={t.title}
        >
          <span class={styles.tabIconGlyph}>{t.glyph}</span>
          <span class={styles.tabIconLabel}>{t.label}</span>
        </button>
      ))}
    </div>
  );
}

function useStagePan(
  isPanActive: boolean,
  zoomLevel: number,
  activeTab: EnhanceToolTab,
  panOffset: { x: number; y: number },
  setPanOffset: (offset: { x: number; y: number }) => void,
) {
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef<{
    clientX: number;
    clientY: number;
    startPan: { x: number; y: number };
  }>({
    clientX: 0,
    clientY: 0,
    startPan: { x: 0, y: 0 },
  });

  const handleStagePointerDown = (e: PointerEvent) => {
    if ((isPanActive || zoomLevel > 100) && activeTab !== 'retouch') {
      if ((e.target as HTMLElement).closest(`.${styles.splitDividerBar}`)) return;
      e.preventDefault();
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      setIsPanning(true);
      panStartRef.current = {
        clientX: e.clientX,
        clientY: e.clientY,
        startPan: { ...panOffset },
      };
    }
  };

  const handleStagePointerMove = (e: PointerEvent) => {
    if (isPanning) {
      const dx = e.clientX - panStartRef.current.clientX;
      const dy = e.clientY - panStartRef.current.clientY;
      setPanOffset({
        x: Math.round(panStartRef.current.startPan.x + dx),
        y: Math.round(panStartRef.current.startPan.y + dy),
      });
    }
  };

  const handleStagePointerUp = (e: PointerEvent) => {
    if (isPanning) {
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // Ignored
      }
      setIsPanning(false);
    }
  };

  return { isPanning, handleStagePointerDown, handleStagePointerMove, handleStagePointerUp };
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
    panOffset,
    setPanOffset,
    resetView,
    addSpotEdit,
    brushSize,
  } = enhance;

  const stageRef = useRef<HTMLDivElement | null>(null);
  const [isPanActive, setIsPanActive] = useState(false);
  const { isPanning, handleStagePointerDown, handleStagePointerMove, handleStagePointerUp } =
    useStagePan(isPanActive, zoomLevel, activeTab, panOffset, setPanOffset);

  const handleSpotClick = useCallback(
    (e: MouseEvent) => {
      if (activeTab !== 'retouch' || !stageRef.current || isPanning) return;
      const rect = stageRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * (passport.sourceDims.width || 790);
      const y = ((e.clientY - rect.top) / rect.height) * (passport.sourceDims.height || 1024);
      addSpotEdit({ x, y, radius: brushSize, strength: 0.75 });
    },
    [activeTab, isPanning, passport.sourceDims, addSpotEdit, brushSize],
  );

  const basePortraitSrc =
    passport.croppedImageSrc || passport.imageSrc || '/samples/passport-portrait.jpg';
  const displayEnhancedSrc = enhancedBlobUrl || basePortraitSrc;

  return (
    <div
      class={styles.enhanceStageCard}
      onPointerMove={handleStagePointerMove}
      onPointerUp={handleStagePointerUp}
      onPointerCancel={handleStagePointerUp}
    >
      <div class={styles.stageCardHeader}>
        <div class={styles.stageCardTitleGroup}>
          <span class={styles.stepBadgeAmber}>5</span>
          <span class={styles.stageCardTitle}>
            {activeTab === 'crop' ? 'Crop & Biometric Frame' : 'Edit & Enhance Photo'}
          </span>
        </div>

        <StageToolbar
          activeTab={activeTab}
          zoomLevel={zoomLevel}
          isPanActive={isPanActive}
          onZoomChange={(delta) => setZoomLevel(Math.max(50, Math.min(300, zoomLevel + delta)))}
          onTogglePan={() => setIsPanActive(!isPanActive)}
          onFit={() => {
            setZoomLevel(100);
            setPanOffset({ x: 0, y: 0 });
            setIsPanActive(false);
          }}
          onResetView={() => {
            resetView();
            setIsPanActive(false);
          }}
          onResetCrop={passport.resetCrop}
          onDoneCrop={() => setActiveTab('adjust')}
        />
      </div>

      <div class={styles.stageWorkbenchArea}>
        {activeTab === 'crop' ? (
          <div class={styles.cropWorkbenchWrapper}>
            <PassportMobileCropStage passport={passport} />
          </div>
        ) : (
          <PassportStageSplitViewer
            displayEnhancedSrc={displayEnhancedSrc}
            basePortraitSrc={basePortraitSrc}
            splitPosition={splitPosition}
            setSplitPosition={setSplitPosition}
            zoomLevel={zoomLevel}
            panOffset={panOffset}
            activeTab={activeTab}
            isPanActive={isPanActive}
            isPanning={isPanning}
            onStagePointerDown={handleStagePointerDown}
            onSpotClick={handleSpotClick}
            stageRef={stageRef}
          />
        )}

        <StageRightTabs activeTab={activeTab} onSelectTab={setActiveTab} />
      </div>
    </div>
  );
}
