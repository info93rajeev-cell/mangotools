import type { ResolvedPreset } from '@mangotools/schemas';
import styles from './imageWatermark.module.css';
import type {
  UseImageWatermarkReturn,
  WatermarkOutputFormat,
  WatermarkPosition,
} from './useImageWatermark.ts';

export interface ImageWatermarkControlsProps {
  idPrefix: string;
  preset: ResolvedPreset;
  watermark: UseImageWatermarkReturn;
  onSelectFile: (file: File) => void;
  onTrySample: () => void;
}

const WATERMARK_PRESETS = ['© Copyright', 'CONFIDENTIAL', 'DRAFT', 'DO NOT COPY', 'SAMPLE'];

export function ImageWatermarkControls({
  idPrefix,
  preset: _preset,
  watermark,
  onSelectFile,
  onTrySample,
}: ImageWatermarkControlsProps) {
  const fileInputId = `${idPrefix}-file-input`;
  const isExecuting = watermark.phase === 'running';
  const hasFile = !!watermark.file;

  return (
    <aside class={styles.controlPanel} aria-label="Watermark Controls">
      <div class={styles.panelCard}>
        {/* SECTION 1: SOURCE PHOTO */}
        <section class={styles.controlSection}>
          <div class={styles.sectionHeader}>
            <span class={styles.sectionTitle}>1. Source Photo</span>
            <div class={styles.headerActions}>
              <button
                type="button"
                class={styles.miniGhostBtn}
                onClick={onTrySample}
                disabled={isExecuting}
              >
                ✨ Sample
              </button>
              <button
                type="button"
                class={styles.miniGhostBtn}
                onClick={watermark.clearAll}
                disabled={isExecuting}
              >
                Clear all
              </button>
            </div>
          </div>

          <input
            id={fileInputId}
            type="file"
            accept="image/*,image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
            style={{ display: 'none' }}
            onChange={(e) => {
              const target = e.target as HTMLInputElement;
              const f = target.files?.[0];
              target.value = '';
              if (f) onSelectFile(f);
            }}
          />

          <div class={styles.uploadRow}>
            <label for={fileInputId} class={styles.uploadMainBtn}>
              📁 Choose Image
            </label>
            {hasFile && (
              <span class={styles.fileNameBadge} title={watermark.file?.name}>
                {watermark.file?.name}
              </span>
            )}
          </div>
        </section>

        {/* SECTION 2: WATERMARK TEXT & PRESETS */}
        <section class={styles.controlSection}>
          <div class={styles.sectionHeader}>
            <span class={styles.sectionTitle}>2. Watermark Text</span>
          </div>

          <div class={styles.fieldItem}>
            <label for={`${idPrefix}-text`} class={styles.fieldLabel}>
              Watermark text
            </label>
            <input
              id={`${idPrefix}-text`}
              type="text"
              placeholder="© Your Name"
              class={styles.textInput}
              value={watermark.text}
              onInput={(e) => watermark.setText((e.target as HTMLInputElement).value)}
            />
          </div>

          <div class={styles.presetTags}>
            {WATERMARK_PRESETS.map((tag) => (
              <button
                key={tag}
                type="button"
                class={styles.presetTagBtn}
                onClick={() => watermark.setText(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        </section>

        {/* SECTION 3: POSITION, OPACITY, FONT SIZE & COLOR */}
        <section class={styles.controlSection}>
          <div class={styles.sectionHeader}>
            <span class={styles.sectionTitle}>3. Styling & Position</span>
          </div>

          <div class={styles.fieldGrid}>
            <div class={styles.fieldItem}>
              <label for={`${idPrefix}-position`} class={styles.fieldLabel}>
                Position
              </label>
              <select
                id={`${idPrefix}-position`}
                class={styles.selectInput}
                value={watermark.position}
                onChange={(e) =>
                  watermark.setPosition((e.target as HTMLSelectElement).value as WatermarkPosition)
                }
              >
                <option value="top-left">Top left</option>
                <option value="top-right">Top right</option>
                <option value="center">Center</option>
                <option value="bottom-left">Bottom left</option>
                <option value="bottom-right">Bottom right</option>
              </select>
            </div>

            <div class={styles.fieldItem}>
              <label for={`${idPrefix}-opacity`} class={styles.fieldLabel}>
                Opacity
              </label>
              <input
                id={`${idPrefix}-opacity`}
                type="number"
                min="1"
                max="100"
                class={styles.textInput}
                value={String(watermark.opacity)}
                onInput={(e) => {
                  const val = (e.target as HTMLInputElement).value.trim();
                  watermark.setOpacity(val ? Number(val) : 50);
                }}
              />
            </div>
          </div>

          <div class={styles.fieldGrid} style={{ marginTop: '4px' }}>
            <div class={styles.fieldItem}>
              <label for={`${idPrefix}-font-size`} class={styles.fieldLabel}>
                Font size
              </label>
              <input
                id={`${idPrefix}-font-size`}
                type="number"
                min="8"
                max="256"
                class={styles.textInput}
                value={String(watermark.fontSize)}
                onInput={(e) => {
                  const val = (e.target as HTMLInputElement).value.trim();
                  watermark.setFontSize(val ? Number(val) : 32);
                }}
              />
            </div>

            <div class={styles.fieldItem}>
              <label for={`${idPrefix}-color`} class={styles.fieldLabel}>
                Text color
              </label>
              <div class={styles.colorInputRow}>
                <input
                  id={`${idPrefix}-color`}
                  type="text"
                  placeholder="#ffffff"
                  class={styles.textInput}
                  value={watermark.color}
                  onInput={(e) => watermark.setColor((e.target as HTMLInputElement).value)}
                />
                <input
                  type="color"
                  aria-label="Color Picker"
                  class={styles.colorPickerSwatch}
                  value={
                    watermark.color.startsWith('#') && watermark.color.length === 7
                      ? watermark.color
                      : '#ffffff'
                  }
                  onInput={(e) => watermark.setColor((e.target as HTMLInputElement).value)}
                />
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 4: OUTPUT FORMAT & CUSTOM FILE NAME */}
        <section class={styles.controlSection}>
          <div class={styles.sectionHeader}>
            <span class={styles.sectionTitle}>4. Output Settings</span>
          </div>

          <div class={styles.fieldGrid}>
            <div class={styles.fieldItem}>
              <label for={`${idPrefix}-format`} class={styles.fieldLabel}>
                Output format
              </label>
              <select
                id={`${idPrefix}-format`}
                class={styles.selectInput}
                value={watermark.outputFormat}
                onChange={(e) =>
                  watermark.setOutputFormat(
                    (e.target as HTMLSelectElement).value as WatermarkOutputFormat,
                  )
                }
              >
                <option value="same">Same as input</option>
                <option value="jpg">JPG</option>
                <option value="png">PNG</option>
                <option value="webp">WebP</option>
              </select>
            </div>

            <div class={styles.fieldItem}>
              <label for={`${idPrefix}-custom-name`} class={styles.fieldLabel}>
                Output file name
              </label>
              <input
                id={`${idPrefix}-custom-name`}
                type="text"
                placeholder="e.g. image-watermarked.jpg"
                class={styles.textInput}
                value={watermark.customFileName}
                onInput={(e) => watermark.setCustomFileName((e.target as HTMLInputElement).value)}
              />
            </div>
          </div>

          {(watermark.outputFormat === 'jpg' || watermark.outputFormat === 'webp') && (
            <div class={styles.sliderRow} style={{ marginTop: '4px' }}>
              <div class={styles.sliderHeader}>
                <label for={`${idPrefix}-quality`} class={styles.fieldLabel}>
                  Quality
                </label>
                <span class={styles.sliderVal}>{watermark.quality}%</span>
              </div>
              <input
                id={`${idPrefix}-quality`}
                type="range"
                min="50"
                max="100"
                aria-label="Quality"
                value={watermark.quality}
                class={styles.rangeSlider}
                onInput={(e) => watermark.setQuality(Number((e.target as HTMLInputElement).value))}
              />
            </div>
          )}
        </section>
      </div>
    </aside>
  );
}
