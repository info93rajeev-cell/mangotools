import { useCallback, useRef, useState } from 'preact/hooks';
import {
  clampRectToBounds,
  defaultSelectionRect,
  type HandlePosition,
  moveRect,
  type PixelRect,
  resizeRect,
} from './imageWorkbenchGeometry.ts';
import { BiometricGuideSvg } from './PassportCropWorkbench.tsx';
import styles from './passportMobileStudio.module.css';
import type { UsePassportPhotoReturn } from './usePassportPhoto.ts';

export interface PassportMobileCropStageProps {
  passport: UsePassportPhotoReturn;
}

// biome-ignore lint/complexity/noExcessiveLinesPerFunction: Mobile crop stage with pointer gesture handlers
export function PassportMobileCropStage({ passport }: PassportMobileCropStageProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [dragMode, setDragMode] = useState<'move' | HandlePosition | null>(null);
  const dragStartRef = useRef<{ clientX: number; clientY: number; startRect: PixelRect }>({
    clientX: 0,
    clientY: 0,
    startRect: { x: 0, y: 0, width: 0, height: 0 },
  });

  const sourceW = passport.sourceDims.width || 1280;
  const sourceH = passport.sourceDims.height || 1280;
  const crop =
    passport.cropRect.width > 0
      ? passport.cropRect
      : defaultSelectionRect({ width: sourceW, height: sourceH }, passport.activeCropRatio);

  const getStageScale = useCallback(() => {
    if (!stageRef.current) return 1;
    const rect = stageRef.current.getBoundingClientRect();
    return rect.width / sourceW;
  }, [sourceW]);

  const handleStart = (e: PointerEvent, mode: 'move' | HandlePosition) => {
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setDragMode(mode);
    dragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      startRect: { ...crop },
    };
  };

  const handlePointerMove = (e: PointerEvent) => {
    if (!dragMode) return;
    const scale = getStageScale();
    if (scale <= 0) return;
    const deltaX = (e.clientX - dragStartRef.current.clientX) / scale;
    const deltaY = (e.clientY - dragStartRef.current.clientY) / scale;
    const bounds = { width: sourceW, height: sourceH };

    if (dragMode === 'move') {
      passport.setCropRect(moveRect(dragStartRef.current.startRect, deltaX, deltaY, bounds));
    } else {
      passport.setCropRect(
        resizeRect(
          dragStartRef.current.startRect,
          dragMode,
          deltaX,
          deltaY,
          bounds,
          passport.activeCropRatio,
          30,
        ),
      );
    }
  };

  const handlePointerUp = (e: PointerEvent) => {
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignored
    }
    setDragMode(null);
  };

  const handleNudge = (dx: number, dy: number) => {
    const step = Math.round(sourceW * 0.03);
    const newRect = moveRect(crop, dx * step, dy * step, { width: sourceW, height: sourceH });
    passport.setCropRect(newRect);
  };

  const handleZoomCrop = (factor: number) => {
    const newW = Math.max(50, Math.min(sourceW, Math.round(crop.width * factor)));
    const newH = Math.max(50, Math.min(sourceH, Math.round(crop.height * factor)));
    const cx = crop.x + crop.width / 2;
    const cy = crop.y + crop.height / 2;
    const newRect = clampRectToBounds(
      {
        x: Math.round(cx - newW / 2),
        y: Math.round(cy - newH / 2),
        width: newW,
        height: newH,
      },
      { width: sourceW, height: sourceH },
    );
    passport.setCropRect(newRect);
  };

  const leftPct = (crop.x / sourceW) * 100;
  const topPct = (crop.y / sourceH) * 100;
  const widthPct = (crop.width / sourceW) * 100;
  const heightPct = (crop.height / sourceH) * 100;
  const rawImgSrc = passport.imageSrc || '/samples/passport-portrait.jpg';

  return (
    <div class={styles.cropStageSection}>
      <div class={styles.cropStageViewport}>
        <div
          class={styles.cropStageInner}
          ref={stageRef}
          style={{ aspectRatio: `${sourceW} / ${sourceH}` }}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <img src={rawImgSrc} alt="Passport source" class={styles.cropSourceImage} />

          {/* Dimmed Overlay with Cutout */}
          <div
            class={styles.cropDimmedMask}
            style={{
              clipPath: `polygon(
                0% 0%, 0% 100%, 100% 100%, 100% 0%, 0% 0%,
                ${leftPct}% ${topPct}%,
                ${leftPct + widthPct}% ${topPct}%,
                ${leftPct + widthPct}% ${topPct + heightPct}%,
                ${leftPct}% ${topPct + heightPct}%,
                ${leftPct}% ${topPct}%
              )`,
            }}
          />

          {/* Interactive Crop Frame Box */}
          <section
            class={styles.cropInteractiveBox}
            style={{
              left: `${leftPct}%`,
              top: `${topPct}%`,
              width: `${widthPct}%`,
              height: `${heightPct}%`,
            }}
            onPointerDown={(e) => handleStart(e, 'move')}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            aria-label="Passport crop frame"
          >
            {/* Biometric Guidelines (Crown, Eye Line, Chin Line) */}
            {passport.showGuides && (
              <div class={styles.cropGuideWrapper}>
                <BiometricGuideSvg />
              </div>
            )}

            {/* Touch-Friendly Corner Handles */}
            <div
              class={`${styles.cropHandle} ${styles.handleNW}`}
              role="slider"
              aria-label="Resize Top-Left"
              aria-valuenow={Math.round(crop.width)}
              tabIndex={0}
              onPointerDown={(e) => handleStart(e, 'nw')}
            />
            <div
              class={`${styles.cropHandle} ${styles.handleNE}`}
              role="slider"
              aria-label="Resize Top-Right"
              aria-valuenow={Math.round(crop.width)}
              tabIndex={0}
              onPointerDown={(e) => handleStart(e, 'ne')}
            />
            <div
              class={`${styles.cropHandle} ${styles.handleSW}`}
              role="slider"
              aria-label="Resize Bottom-Left"
              aria-valuenow={Math.round(crop.width)}
              tabIndex={0}
              onPointerDown={(e) => handleStart(e, 'sw')}
            />
            <div
              class={`${styles.cropHandle} ${styles.handleSE}`}
              role="slider"
              aria-label="Resize Bottom-Right"
              aria-valuenow={Math.round(crop.width)}
              tabIndex={0}
              onPointerDown={(e) => handleStart(e, 'se')}
            />

            {/* Center Drag Hint */}
            <div class={styles.cropCenterGrip}>
              <span>✥ Drag or Pinch to Fit</span>
            </div>
          </section>
        </div>

        {/* Top Controls Overlay */}
        <div class={styles.cropTopToolbar}>
          <button
            type="button"
            class={styles.cropToolBtn}
            onClick={() => passport.setShowGuides(!passport.showGuides)}
            title="Toggle Biometric Oval"
          >
            <span>{passport.showGuides ? '🟢 Oval: ON' : '⚪ Oval: OFF'}</span>
          </button>
          <button
            type="button"
            class={styles.cropToolBtn}
            onClick={() => passport.resetCrop()}
            title="Auto-center face in crop frame"
          >
            <span>↺ Center</span>
          </button>
        </div>

        {/* Floating Bottom Quick Zoom & Nudge Bar */}
        <div class={styles.cropBottomNudgeBar}>
          <div class={styles.nudgeBtnGroup}>
            <button
              type="button"
              class={styles.nudgeBtn}
              onClick={() => handleZoomCrop(0.9)}
              title="Zoom In (tighter face)"
            >
              🔍+
            </button>
            <button
              type="button"
              class={styles.nudgeBtn}
              onClick={() => handleZoomCrop(1.1)}
              title="Zoom Out (wider shoulders)"
            >
              🔍−
            </button>
          </div>

          <div class={styles.nudgeArrowGroup}>
            <button
              type="button"
              class={styles.nudgeBtn}
              onClick={() => handleNudge(0, -1)}
              title="Nudge Up"
            >
              ⬆️
            </button>
            <button
              type="button"
              class={styles.nudgeBtn}
              onClick={() => handleNudge(0, 1)}
              title="Nudge Down"
            >
              ⬇️
            </button>
            <button
              type="button"
              class={styles.nudgeBtn}
              onClick={() => handleNudge(-1, 0)}
              title="Nudge Left"
            >
              ⬅️
            </button>
            <button
              type="button"
              class={styles.nudgeBtn}
              onClick={() => handleNudge(1, 0)}
              title="Nudge Right"
            >
              ➡️
            </button>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div class={styles.previewStatusBar}>
        <span>
          Crop: {Math.round(crop.width)}×{Math.round(crop.height)} px → Target:{' '}
          {passport.targetWidth}×{passport.targetHeight} px
        </span>
        <span style={{ color: '#86efac' }}>
          {passport.showGuides ? 'Biometric Oval' : 'Custom'}
        </span>
      </div>
    </div>
  );
}
