import styles from './imageWatermark.module.css';
import type { UseImageWatermarkReturn } from './useImageWatermark.ts';

export interface WatermarkTiledControlsProps {
  idPrefix: string;
  watermark: UseImageWatermarkReturn;
}

const ANGLE_PRESETS = [
  { label: 'Horizontal (0°)', value: 0 },
  { label: 'Angular (-30°)', value: -30 },
  { label: 'Diagonal (-45°)', value: -45 },
  { label: 'Vertical (-90°)', value: -90 },
];

const DENSITY_PRESETS = [
  { label: 'Sparse (25%)', value: 25 },
  { label: 'Normal (50%)', value: 50 },
  { label: 'Dense (75%)', value: 75 },
  { label: 'Ultra (100%)', value: 100 },
];

function getDensityLabel(density: number): string {
  if (density < 35) return 'Sparse';
  if (density <= 65) return 'Normal';
  if (density <= 85) return 'Dense';
  return 'Ultra';
}

function getAngleLabel(angle: number): string {
  if (angle === 0) return 'Horizontal';
  if (angle === 90 || angle === -90) return 'Vertical';
  return `${angle}°`;
}

export function WatermarkTiledControls({ idPrefix, watermark }: WatermarkTiledControlsProps) {
  return (
    <div class={styles.tiledControlsBox}>
      {/* 1. Angle section */}
      <div class={styles.sliderGroup}>
        <div class={styles.tiledSectionHeader}>
          <span class={styles.tiledSectionTitle}>
            <span>🔄</span>
            <span>Pattern angle</span>
          </span>
          <span class={styles.tiledValBadge}>{getAngleLabel(watermark.angle)}</span>
        </div>
        <div class={styles.tiledChipsRow}>
          {ANGLE_PRESETS.map((p) => {
            const isActive = watermark.angle === p.value;
            return (
              <button
                key={p.value}
                type="button"
                class={styles.tiledChipBtn}
                data-active={isActive ? 'true' : 'false'}
                onClick={() => watermark.setAngle(p.value)}
              >
                {p.label}
              </button>
            );
          })}
        </div>
        <input
          id={`${idPrefix}-angle-range`}
          aria-label="Watermark angle"
          type="range"
          min="-90"
          max="90"
          step="1"
          value={watermark.angle}
          class={styles.rangeSlider}
          onInput={(e) => watermark.setAngle(Number((e.target as HTMLInputElement).value))}
        />
      </div>

      {/* 2. Density section */}
      <div class={styles.sliderGroup}>
        <div class={styles.tiledSectionHeader}>
          <span class={styles.tiledSectionTitle}>
            <span>⊞</span>
            <span>Pattern density (spacing)</span>
          </span>
          <span class={styles.tiledValBadge}>
            {watermark.density}% ({getDensityLabel(watermark.density)})
          </span>
        </div>
        <div class={styles.tiledChipsRow}>
          {DENSITY_PRESETS.map((p) => {
            const isActive = watermark.density === p.value;
            return (
              <button
                key={p.value}
                type="button"
                class={styles.tiledChipBtn}
                data-active={isActive ? 'true' : 'false'}
                onClick={() => watermark.setDensity(p.value)}
              >
                {p.label}
              </button>
            );
          })}
        </div>
        <input
          id={`${idPrefix}-density-range`}
          aria-label="Watermark density"
          type="range"
          min="10"
          max="100"
          step="5"
          value={watermark.density}
          class={styles.rangeSlider}
          onInput={(e) => watermark.setDensity(Number((e.target as HTMLInputElement).value))}
        />
      </div>
    </div>
  );
}
