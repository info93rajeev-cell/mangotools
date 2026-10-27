import { useState } from 'preact/hooks';
import styles from './passportPhoto.module.css';
import type { UsePassportPhotoReturn } from './usePassportPhoto.ts';

export interface PassportPhotoCanvasProps {
  idPrefix: string;
  passport: UsePassportPhotoReturn;
}

export function PassportPhotoCanvas({ idPrefix: _idPrefix, passport }: PassportPhotoCanvasProps) {
  const [zoom, setZoom] = useState(1);
  const hasFile = !!passport.file;

  return (
    <section class={styles.canvasPanel} aria-label="Passport Photo Canvas Stage">
      <div class={styles.canvasHeader}>
        <div class={styles.headerLeft}>
          <span class={styles.canvasTitle}>Biometric Visual Stage</span>
          {hasFile && (
            <span class={styles.canvasDimBadge}>
              {passport.targetWidth} × {passport.targetHeight} px
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
            <span>Biometric Oval Guide</span>
          </label>

          <div class={styles.zoomButtons}>
            <button
              type="button"
              class={styles.zoomBtn}
              onClick={() => setZoom((z) => Math.max(0.5, Number((z - 0.25).toFixed(2))))}
              title="Zoom Out"
            >
              −
            </button>
            <span class={styles.zoomText}>{Math.round(zoom * 100)}%</span>
            <button
              type="button"
              class={styles.zoomBtn}
              onClick={() => setZoom((z) => Math.min(2.5, Number((z + 0.25).toFixed(2))))}
              title="Zoom In"
            >
              +
            </button>
            <button
              type="button"
              class={styles.zoomBtn}
              onClick={() => setZoom(1)}
              title="Reset Zoom"
            >
              Fit
            </button>
          </div>
        </div>
      </div>

      <div class={styles.canvasViewport}>
        {hasFile && passport.imageSrc ? (
          <div
            class={styles.canvasStageWrapper}
            style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
          >
            <img src={passport.imageSrc} alt="Passport photo stage" class={styles.passportImg} />

            {passport.showGuides && (
              <div class={styles.biometricGuideOverlay} aria-hidden="true">
                <svg class={styles.guideSvg} viewBox="0 0 100 100" preserveAspectRatio="none">
                  {/* Outer head height boundary */}
                  <line
                    x1="20"
                    y1="12"
                    x2="80"
                    y2="12"
                    stroke="rgba(245, 158, 11, 0.85)"
                    strokeWidth="0.8"
                    strokeDasharray="2,2"
                  />
                  <text
                    x="50"
                    y="10"
                    fill="rgba(245, 158, 11, 0.9)"
                    fontSize="3.5"
                    textAnchor="middle"
                  >
                    Crown (Top of Head)
                  </text>

                  {/* Eye level guideline */}
                  <line
                    x1="15"
                    y1="45"
                    x2="85"
                    y2="45"
                    stroke="rgba(59, 130, 246, 0.75)"
                    strokeWidth="0.6"
                    strokeDasharray="1.5,1.5"
                  />
                  <text
                    x="50"
                    y="43"
                    fill="rgba(59, 130, 246, 0.85)"
                    fontSize="3"
                    textAnchor="middle"
                  >
                    Eye Line (40-50%)
                  </text>

                  {/* Chin boundary */}
                  <line
                    x1="25"
                    y1="80"
                    x2="75"
                    y2="80"
                    stroke="rgba(245, 158, 11, 0.85)"
                    strokeWidth="0.8"
                    strokeDasharray="2,2"
                  />
                  <text
                    x="50"
                    y="85"
                    fill="rgba(245, 158, 11, 0.9)"
                    fontSize="3.5"
                    textAnchor="middle"
                  >
                    Chin Line (Bottom)
                  </text>

                  {/* Center vertical line */}
                  <line
                    x1="50"
                    y1="5"
                    x2="50"
                    y2="95"
                    stroke="rgba(255, 255, 255, 0.4)"
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
                    stroke="rgba(16, 185, 129, 0.85)"
                    strokeWidth="1"
                    strokeDasharray="3,2"
                  />
                </svg>
              </div>
            )}
          </div>
        ) : (
          <div class={styles.emptyStagePlaceholder}>
            <span>👤</span>
            <span>No photo loaded. Click "Try Sample" or "Upload Photo" to begin.</span>
          </div>
        )}
      </div>
    </section>
  );
}
