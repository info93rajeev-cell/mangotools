import styles from './passportMobileStudio.module.css';
import type { UsePassportEnhanceStateReturn } from './usePassportEnhanceState.ts';
import {
  PASSPORT_PRESETS,
  type PassportOutputFormat,
  type UsePassportPhotoReturn,
} from './usePassportPhoto.ts';

export type MobileToolTab = 'presets' | 'adjust' | 'filters' | 'retouch' | 'sheet';

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

function PresetsTabContent({ passport }: { passport: UsePassportPhotoReturn }) {
  return (
    <>
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

      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <select
          class={styles.studioMiniBtn}
          style={{ flex: 1, padding: '6px' }}
          value={passport.outputFormat}
          onChange={(e) =>
            passport.setOutputFormat((e.target as HTMLInputElement).value as PassportOutputFormat)
          }
        >
          <option value="jpg">JPG Format</option>
          <option value="png">PNG Format</option>
          <option value="webp">WebP Format</option>
        </select>
        <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
          Q: {passport.quality}%
        </span>
      </div>
    </>
  );
}

function AdjustTabContent({ enhance }: { enhance: UsePassportEnhanceStateReturn }) {
  const { adjustments, setAdjustment } = enhance;
  return (
    <>
      <div class={styles.sliderRow}>
        <div class={styles.sliderHeader}>
          <span>☀️ Brightness</span>
          <span>{adjustments.brightness}</span>
        </div>
        <input
          type="range"
          min={-30}
          max={30}
          value={adjustments.brightness}
          class={styles.mobileRangeInput}
          onInput={(e) => setAdjustment('brightness', Number((e.target as HTMLInputElement).value))}
        />
      </div>

      <div class={styles.sliderRow}>
        <div class={styles.sliderHeader}>
          <span>🌓 Contrast</span>
          <span>{adjustments.contrast}</span>
        </div>
        <input
          type="range"
          min={-30}
          max={30}
          value={adjustments.contrast}
          class={styles.mobileRangeInput}
          onInput={(e) => setAdjustment('contrast', Number((e.target as HTMLInputElement).value))}
        />
      </div>

      <div class={styles.sliderRow}>
        <div class={styles.sliderHeader}>
          <span>🎨 Saturation</span>
          <span>{adjustments.saturation}</span>
        </div>
        <input
          type="range"
          min={-20}
          max={20}
          value={adjustments.saturation}
          class={styles.mobileRangeInput}
          onInput={(e) => setAdjustment('saturation', Number((e.target as HTMLInputElement).value))}
        />
      </div>
    </>
  );
}

function FiltersTabContent({ enhance }: { enhance: UsePassportEnhanceStateReturn }) {
  const { activeFilter, setActiveFilter } = enhance;
  return (
    <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', padding: '4px 0' }}>
      {FILTER_ITEMS.map((item) => (
        <button
          key={item.id}
          type="button"
          class={styles.quickPresetChip}
          data-active={String(activeFilter === item.id)}
          onClick={() => setActiveFilter(item.id)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

function RetouchTabContent({ enhance }: { enhance: UsePassportEnhanceStateReturn }) {
  const { adjustments, setAdjustment } = enhance;
  return (
    <>
      <div class={styles.sliderRow}>
        <div class={styles.sliderHeader}>
          <span>✨ Reduce Blemishes (Light)</span>
          <span>{adjustments.reduceBlemishes}</span>
        </div>
        <input
          type="range"
          min={0}
          max={10}
          value={adjustments.reduceBlemishes}
          class={styles.mobileRangeInput}
          onInput={(e) =>
            setAdjustment('reduceBlemishes', Number((e.target as HTMLInputElement).value))
          }
        />
      </div>

      <div class={styles.sliderRow}>
        <div class={styles.sliderHeader}>
          <span>✦ Skin Smoothing (Subtle)</span>
          <span>{adjustments.skinSmooth}</span>
        </div>
        <input
          type="range"
          min={0}
          max={10}
          value={adjustments.skinSmooth}
          class={styles.mobileRangeInput}
          onInput={(e) => setAdjustment('skinSmooth', Number((e.target as HTMLInputElement).value))}
        />
      </div>
    </>
  );
}

function SheetTabContent({ passport }: { passport: UsePassportPhotoReturn }) {
  const { sheetLayout, isGeneratingSheet, printSheet, downloadSheet, paperSize, setPaperSize } =
    passport;
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
          disabled={isGeneratingSheet}
        >
          <span>🖨️</span>
          <span>Direct Print Sheet</span>
        </button>
        <button
          type="button"
          class={styles.shareWhatsAppBtn}
          onClick={() => void downloadSheet()}
          disabled={isGeneratingSheet}
        >
          <span>📄</span>
          <span>Save Sheet for WhatsApp / Print (JPG)</span>
        </button>
      </div>

      <div class={styles.sheetNotice}>
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
  return (
    <div class={styles.toolBodyArea}>
      {activeTab === 'presets' && <PresetsTabContent passport={passport} />}
      {activeTab === 'adjust' && <AdjustTabContent enhance={enhance} />}
      {activeTab === 'filters' && <FiltersTabContent enhance={enhance} />}
      {activeTab === 'retouch' && <RetouchTabContent enhance={enhance} />}
      {activeTab === 'sheet' && <SheetTabContent passport={passport} />}
    </div>
  );
}
