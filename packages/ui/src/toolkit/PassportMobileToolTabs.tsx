import styles from './passportMobileStudio.module.css';
import type { UsePassportEnhanceStateReturn } from './usePassportEnhanceState.ts';
import {
  PASSPORT_PRESETS,
  type PassportOutputFormat,
  type UsePassportPhotoReturn,
} from './usePassportPhoto.ts';

export type MobileToolTab =
  | 'crop'
  | 'presets'
  | 'adjust'
  | 'filters'
  | 'retouch'
  | 'background'
  | 'sheet';

const FILTER_ITEMS = [
  { id: 'none', label: 'None' },
  { id: 'auto', label: 'Auto' },
  { id: 'natural', label: 'Natural' },
  { id: 'bright', label: 'Bright' },
  { id: 'soft', label: 'Soft' },
  { id: 'clear', label: 'Clear' },
  { id: 'warm', label: 'Warm' },
  { id: 'cool', label: 'Cool' },
] as const;

export interface PassportMobileToolTabsProps {
  activeTab: MobileToolTab;
  passport: UsePassportPhotoReturn;
  enhance: UsePassportEnhanceStateReturn;
}

function CropTabContent({ passport }: { passport: UsePassportPhotoReturn }) {
  return (
    <div class={styles.tabContentStack}>
      {/* Alignment guidelines callout */}
      <div class={styles.cropHintRow}>
        <div class={styles.alignmentCallout}>
          <span>✓</span>
          <span>Align face: Crown to top line, Eyes to blue line, Chin to bottom line</span>
        </div>
      </div>

      {/* Quick Presets for Ratio */}
      <div class={styles.quickPresetsSection}>
        <span class={styles.sectionMiniTitle}>Official Visa & Passport Presets:</span>
        <div class={styles.presetGrid}>
          {PASSPORT_PRESETS.slice(0, 5).map((p) => {
            const isActive = passport.activePresetId === p.id;
            return (
              <button
                key={p.id}
                type="button"
                class={styles.presetCardBtn}
                data-active={String(isActive)}
                onClick={() => passport.applyPreset(p)}
              >
                <span class={styles.presetCardName}>
                  {isActive ? '✓ ' : ''}
                  {p.name}
                </span>
                <span class={styles.presetCardDim}>
                  {p.unit} • {p.width}×{p.height} px
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Target Pixel Dimensions & Ratio Lock */}
      <div class={styles.dimsConfigCard}>
        <div class={styles.dimsHeaderRow}>
          <span class={styles.sectionMiniTitle}>Photo Dimensions</span>
          <label class={styles.ratioLockToggle}>
            <input
              type="checkbox"
              checked={passport.keepAspectRatio}
              onChange={(e) => passport.setKeepAspectRatio((e.target as HTMLInputElement).checked)}
            />
            <span>Ratio Lock</span>
          </label>
        </div>
        <div class={styles.dimsInputsRow}>
          <div class={styles.dimFieldWrap}>
            <span class={styles.dimFieldLabel}>Width (px)</span>
            <input
              type="number"
              class={styles.dimInputNumber}
              value={passport.targetWidth}
              onInput={(e) => passport.setWidth(Number((e.target as HTMLInputElement).value))}
            />
          </div>
          <div class={styles.dimFieldWrap}>
            <span class={styles.dimFieldLabel}>Height (px)</span>
            <input
              type="number"
              class={styles.dimInputNumber}
              value={passport.targetHeight}
              onInput={(e) => passport.setHeight(Number((e.target as HTMLInputElement).value))}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function PresetsTabContent({ passport }: { passport: UsePassportPhotoReturn }) {
  return (
    <div class={styles.tabContentStack}>
      <div class={styles.presetGrid}>
        {PASSPORT_PRESETS.map((p) => {
          const isActive = passport.activePresetId === p.id;
          return (
            <button
              key={p.id}
              type="button"
              class={styles.presetCardBtn}
              data-active={String(isActive)}
              onClick={() => passport.applyPreset(p)}
            >
              <span class={styles.presetCardName}>
                {isActive ? '✓ ' : ''}
                {p.name}
              </span>
              <span class={styles.presetCardDim}>
                {p.unit} • {p.width}×{p.height} px
              </span>
            </button>
          );
        })}
      </div>

      <div class={styles.formatConfigRow}>
        <select
          class={styles.studioMiniBtn}
          style={{ flex: 1, padding: '6px' }}
          value={passport.outputFormat}
          onChange={(e) =>
            passport.setOutputFormat((e.target as HTMLInputElement).value as PassportOutputFormat)
          }
        >
          <option value="jpg">Format: JPG</option>
          <option value="png">Format: PNG</option>
          <option value="webp">Format: WebP</option>
        </select>
        <input
          type="number"
          min="1"
          max="100"
          value={passport.quality}
          class={styles.studioMiniBtn}
          style={{ width: '80px', padding: '6px' }}
          placeholder="Quality"
          title="Image Quality % (1-100)"
          onInput={(e) => passport.setQuality(Number((e.target as HTMLInputElement).value))}
        />
        <input
          type="text"
          value={passport.customFileName}
          class={styles.studioMiniBtn}
          style={{ flex: 1.5, padding: '6px' }}
          placeholder="Filename (optional)"
          onInput={(e) => passport.setCustomFileName((e.target as HTMLInputElement).value)}
        />
      </div>
    </div>
  );
}

function AdjustTabContent({ enhance }: { enhance: UsePassportEnhanceStateReturn }) {
  const { adjustments, setAdjustment } = enhance;
  return (
    <div class={styles.tabSlidersContainer}>
      <div class={styles.sliderGroup}>
        <div class={styles.sliderHeader}>
          <span>☀️ Brightness</span>
          <span>{adjustments.brightness}</span>
        </div>
        <input
          type="range"
          min="-30"
          max="30"
          value={adjustments.brightness}
          class={styles.rangeSlider}
          onInput={(e) => setAdjustment('brightness', Number((e.target as HTMLInputElement).value))}
        />
      </div>

      <div class={styles.sliderGroup}>
        <div class={styles.sliderHeader}>
          <span>🌓 Contrast</span>
          <span>{adjustments.contrast}</span>
        </div>
        <input
          type="range"
          min="-30"
          max="30"
          value={adjustments.contrast}
          class={styles.rangeSlider}
          onInput={(e) => setAdjustment('contrast', Number((e.target as HTMLInputElement).value))}
        />
      </div>

      <div class={styles.sliderGroup}>
        <div class={styles.sliderHeader}>
          <span>🎨 Saturation</span>
          <span>{adjustments.saturation}</span>
        </div>
        <input
          type="range"
          min="-20"
          max="20"
          value={adjustments.saturation}
          class={styles.rangeSlider}
          onInput={(e) => setAdjustment('saturation', Number((e.target as HTMLInputElement).value))}
        />
      </div>

      <div class={styles.sliderGroup}>
        <div class={styles.sliderHeader}>
          <span>▲ Sharpen</span>
          <span>{adjustments.sharpen}</span>
        </div>
        <input
          type="range"
          min="0"
          max="10"
          value={adjustments.sharpen}
          class={styles.rangeSlider}
          onInput={(e) => setAdjustment('sharpen', Number((e.target as HTMLInputElement).value))}
        />
      </div>
    </div>
  );
}

function FiltersTabContent({ enhance }: { enhance: UsePassportEnhanceStateReturn }) {
  const { activeFilter, setActiveFilter } = enhance;
  return (
    <div class={styles.filterPillsScroll}>
      {FILTER_ITEMS.map((f) => (
        <button
          key={f.id}
          type="button"
          class={styles.filterPillBtn}
          data-active={String(activeFilter === f.id)}
          onClick={() => setActiveFilter(f.id)}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}

function RetouchTabContent({ enhance }: { enhance: UsePassportEnhanceStateReturn }) {
  const { adjustments, setAdjustment } = enhance;
  return (
    <div class={styles.tabSlidersContainer}>
      <div class={styles.sliderGroup}>
        <div class={styles.sliderHeader}>
          <span>✨ Reduce Blemishes (Light)</span>
          <span>{adjustments.reduceBlemishes}</span>
        </div>
        <input
          type="range"
          min="0"
          max="10"
          value={adjustments.reduceBlemishes}
          class={styles.rangeSlider}
          onInput={(e) =>
            setAdjustment('reduceBlemishes', Number((e.target as HTMLInputElement).value))
          }
        />
      </div>

      <div class={styles.sliderGroup}>
        <div class={styles.sliderHeader}>
          <span>✦ Skin Smoothing (Subtle)</span>
          <span>{adjustments.skinSmooth}</span>
        </div>
        <input
          type="range"
          min="0"
          max="10"
          value={adjustments.skinSmooth}
          class={styles.rangeSlider}
          onInput={(e) => setAdjustment('skinSmooth', Number((e.target as HTMLInputElement).value))}
        />
      </div>
    </div>
  );
}

function BackgroundTabContent() {
  return (
    <div class={styles.tabContentStack}>
      <span class={styles.sectionMiniTitle}>Official Background Color (Optional):</span>
      <div class={styles.bgSwatchesGrid}>
        <button type="button" class={styles.bgSwatchBtn} data-active="true">
          <div
            class={styles.swatchCircle}
            style={{ background: '#ffffff', border: '1px solid #ccc' }}
          />
          <span>Plain White (US/Schengen)</span>
        </button>
        <button type="button" class={styles.bgSwatchBtn} data-active="false">
          <div class={styles.swatchCircle} style={{ background: '#ebf5ff' }} />
          <span>Light Blue</span>
        </button>
        <button type="button" class={styles.bgSwatchBtn} data-active="false">
          <div class={styles.swatchCircle} style={{ background: '#f3f4f6' }} />
          <span>Light Gray</span>
        </button>
        <button type="button" class={styles.bgSwatchBtn} data-active="false">
          <div class={styles.swatchCircle} style={{ background: '#fffbeb' }} />
          <span>Light Cream</span>
        </button>
      </div>
      <div class={styles.alignmentCallout}>
        <span>ℹ️</span>
        <span>
          Standard visa & passport specifications accept original plain light backgrounds.
        </span>
      </div>
    </div>
  );
}

function SheetTabContent({ passport }: { passport: UsePassportPhotoReturn }) {
  const { sheetLayout, paperSize, setPaperSize, printSheet, downloadSheet } = passport;

  return (
    <div class={styles.sheetTabWrap}>
      <div class={styles.sheetConfigRow}>
        <span style={{ fontSize: '11px', fontWeight: 700 }}>
          Paper Layout: {sheetLayout.paper.name} ({sheetLayout.photoCount} photos)
        </span>
        <select
          class={styles.studioMiniBtn}
          style={{ width: '100%', padding: '6px' }}
          value={paperSize}
          onChange={(e) => setPaperSize((e.target as HTMLInputElement).value as typeof paperSize)}
        >
          <option value="quarter-a4">4×6 inch (Quarter A4) - Standard Photo Paper</option>
          <option value="a4">A4 Full Sheet (210×297 mm)</option>
          <option value="half-a4">Half A4 / A5 (148×210 mm)</option>
        </select>
      </div>

      <div class={styles.sheetActionButtonsRow}>
        <button
          type="button"
          class={styles.printDirectBtn}
          onClick={() => void printSheet()}
          title="Print directly to local printer"
        >
          <span>🖨️</span>
          <span>Direct Print Sheet</span>
        </button>

        <button
          type="button"
          class={styles.shareWhatsAppBtn}
          onClick={() => void downloadSheet()}
          title="Download printable 300 DPI sheet to share on WhatsApp or print at shop"
        >
          <span>📄</span>
          <span>Save Sheet for WhatsApp / Print (JPG)</span>
        </button>
      </div>

      <div class={styles.sheetHintNotice}>
        <span>✓ 300 DPI High-Res Grid with Scissors Guidelines</span>
      </div>
    </div>
  );
}

export function PassportMobileToolTabs({
  activeTab,
  passport,
  enhance,
}: PassportMobileToolTabsProps) {
  if (activeTab === 'crop') return <CropTabContent passport={passport} />;
  if (activeTab === 'presets') return <PresetsTabContent passport={passport} />;
  if (activeTab === 'adjust') return <AdjustTabContent enhance={enhance} />;
  if (activeTab === 'filters') return <FiltersTabContent enhance={enhance} />;
  if (activeTab === 'retouch') return <RetouchTabContent enhance={enhance} />;
  if (activeTab === 'background') return <BackgroundTabContent />;
  if (activeTab === 'sheet') return <SheetTabContent passport={passport} />;
  return null;
}
