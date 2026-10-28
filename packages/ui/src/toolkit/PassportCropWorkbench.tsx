import { useState } from 'preact/hooks';
import { ImageWorkbench } from './ImageWorkbench.tsx';
import styles from './passportPhoto.module.css';
import type { UsePassportPhotoReturn } from './usePassportPhoto.ts';

export interface PassportCropWorkbenchProps {
  idPrefix: string;
  passport: UsePassportPhotoReturn;
}

export function BiometricGuideSvg() {
  return (
    <div class={styles.biometricGuideOverlay} aria-hidden="true">
      <svg class={styles.guideSvg} viewBox="0 0 100 100" preserveAspectRatio="none">
        <title>Biometric guidelines</title>
        {/* Crown (Top of Head) */}
        <line
          x1="20"
          y1="12"
          x2="80"
          y2="12"
          stroke="rgba(245, 158, 11, 0.9)"
          strokeWidth="0.8"
          strokeDasharray="2,2"
        />
        <text x="50" y="10" fill="rgba(245, 158, 11, 0.95)" fontSize="3.5" textAnchor="middle">
          Crown (Top of Head)
        </text>

        {/* Eye Line (40-50%) */}
        <line
          x1="15"
          y1="45"
          x2="85"
          y2="45"
          stroke="rgba(59, 130, 246, 0.85)"
          strokeWidth="0.6"
          strokeDasharray="1.5,1.5"
        />
        <text x="50" y="43" fill="rgba(59, 130, 246, 0.9)" fontSize="3" textAnchor="middle">
          Eye Line (40-50%)
        </text>

        {/* Chin Line (Bottom) */}
        <line
          x1="25"
          y1="80"
          x2="75"
          y2="80"
          stroke="rgba(245, 158, 11, 0.9)"
          strokeWidth="0.8"
          strokeDasharray="2,2"
        />
        <text x="50" y="85" fill="rgba(245, 158, 11, 0.95)" fontSize="3.5" textAnchor="middle">
          Chin Line (Bottom)
        </text>

        {/* Vertical centerline */}
        <line
          x1="50"
          y1="5"
          x2="50"
          y2="95"
          stroke="rgba(255, 255, 255, 0.45)"
          strokeWidth="0.5"
          strokeDasharray="1,2"
        />

        {/* ICAO Face Oval standard */}
        <ellipse
          cx="50"
          cy="46"
          rx="24"
          ry="34"
          fill="none"
          stroke="rgba(16, 185, 129, 0.9)"
          strokeWidth="1.2"
          strokeDasharray="3,2"
        />
      </svg>
    </div>
  );
}

export function PassportCropWorkbench({ idPrefix, passport }: PassportCropWorkbenchProps) {
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const hasFile = !!passport.file;

  return (
    <div class={styles.cropWorkbenchContainer}>
      {/* TOOLBAR */}
      <div class={styles.canvasToolbarRow}>
        <div class={styles.headerLeft}>
          <span class={styles.canvasDimBadge}>
            Target: {passport.targetWidth} × {passport.targetHeight} px
          </span>
          {passport.cropRect.width > 0 && (
            <span class={styles.cropDimBadge}>
              Crop: {Math.round(passport.cropRect.width)} × {Math.round(passport.cropRect.height)}{' '}
              px
            </span>
          )}
        </div>

        <div class={styles.canvasToolbar}>
          <label class={styles.guideToggleLabel}>
            <input
              type="checkbox"
              checked={passport.showGuides}
              onChange={(e) => passport.setShowGuides((e.target as HTMLInputElement).checked)}
            />
            <span>Biometric Oval</span>
          </label>

          <button
            type="button"
            class={styles.miniGhostBtn}
            onClick={passport.resetCrop}
            title="Reset Crop to Center"
          >
            ↺ Reset
          </button>

          <div class={styles.zoomButtons}>
            <button
              type="button"
              class={styles.zoomBtn}
              onClick={() => setZoomLevel((z) => Math.max(50, z - 25))}
              title="Zoom Out"
            >
              −
            </button>
            <span class={styles.zoomText}>{zoomLevel}%</span>
            <button
              type="button"
              class={styles.zoomBtn}
              onClick={() => setZoomLevel((z) => Math.min(200, z + 25))}
              title="Zoom In"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* STAGE */}
      <div class={styles.canvasViewport}>
        {hasFile && passport.imageSrc && passport.sourceDims.width > 0 ? (
          <div
            class={styles.canvasStageWrapper}
            style={{
              transform: `scale(${zoomLevel / 100})`,
              transformOrigin: 'center center',
            }}
          >
            <ImageWorkbench
              idPrefix={`${idPrefix}-crop`}
              imageSrc={passport.imageSrc}
              imageAlt="Passport portrait crop"
              sourceWidth={passport.sourceDims.width}
              sourceHeight={passport.sourceDims.height}
              value={passport.cropRect}
              onChange={passport.setCropRect}
              aspectRatio={passport.activeCropRatio}
              showAspectRatioControls={false}
              showResetButton={false}
              showCoordinates={false}
              renderSelectionOverlay={() => (passport.showGuides ? <BiometricGuideSvg /> : null)}
            />
          </div>
        ) : (
          <div class={styles.emptyStagePlaceholder}>
            <span>👤</span>
            <span>No photo loaded. Click "Try Sample" or "Upload Photo" to begin.</span>
          </div>
        )}
      </div>

      <div class={styles.cropHintRow}>
        <div class={styles.alignmentCallout}>
          <span>✓</span>
          <span>Align face: Crown to top line, Eyes to blue line, Chin to bottom line</span>
        </div>
      </div>
    </div>
  );
}
