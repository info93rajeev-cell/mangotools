import styles from './passportEnhance.module.css';
import type { NaturalFilterId } from './passportEnhanceEngine.ts';
import { PASSPORT_PRESETS } from './passportPhotoPresets.ts';
import type { UsePassportEnhanceStateReturn } from './usePassportEnhanceState.ts';
import type { UsePassportPhotoReturn } from './usePassportPhoto.ts';

export interface PassportFiltersAdjustmentsCardProps {
  passport: UsePassportPhotoReturn;
  enhance: UsePassportEnhanceStateReturn;
}

const FILTER_ITEMS: { id: NaturalFilterId; label: string }[] = [
  { id: 'none', label: 'None' },
  { id: 'auto', label: 'Auto' },
  { id: 'natural', label: 'Natural' },
  { id: 'bright', label: 'Bright' },
  { id: 'soft', label: 'Soft' },
  { id: 'clear', label: 'Clear' },
  { id: 'warm', label: 'Warm' },
  { id: 'cool', label: 'Cool' },
];

interface SliderItemProps {
  label: string;
  min: number;
  max: number;
  value: number;
  onChange: (val: number) => void;
}

function SliderItem({ label, min, max, value, onChange }: SliderItemProps) {
  return (
    <div class={styles.sliderControlGroup}>
      <div class={styles.sliderInfoRow}>
        <span class={styles.sliderIconLabel}>{label}</span>
        <span class={styles.sliderValText}>{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        class={styles.customRangeInput}
        onInput={(e) => onChange(Number((e.target as HTMLInputElement).value))}
      />
    </div>
  );
}

function FilterThumbnailsRow({
  activeFilter,
  onSelect,
}: {
  activeFilter: NaturalFilterId;
  onSelect: (id: NaturalFilterId) => void;
}) {
  return (
    <div class={styles.filterThumbnailsScroll}>
      {FILTER_ITEMS.map((item) => {
        const isActive = activeFilter === item.id;
        return (
          <button
            key={item.id}
            type="button"
            class={`${styles.filterThumbBtn} ${isActive ? styles.filterActivePink : ''}`}
            onClick={() => onSelect(item.id)}
            title={`Apply ${item.label} filter`}
          >
            <div class={styles.filterThumbWrapper}>
              <img
                src="/samples/passport-portrait.jpg"
                alt={item.label}
                class={`${styles.filterThumbImage} ${styles[`filter_${item.id}`] || ''}`}
              />
            </div>
            <span class={styles.filterThumbLabel}>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function CropTabSection({
  passport,
  onDone,
}: {
  passport: UsePassportPhotoReturn;
  onDone: () => void;
}) {
  return (
    <div class={styles.cropTabContent}>
      <div class={styles.adjustHeaderRow}>
        <span class={styles.tabSectionTitle}>Official Preset Ratios</span>
        <button
          type="button"
          class={styles.resetGhostBtn}
          onClick={passport.resetCrop}
          title="Reset Crop"
        >
          ↺ Center Crop
        </button>
      </div>

      <div class={styles.cropPresetsRow}>
        {PASSPORT_PRESETS.slice(0, 4).map((p) => {
          const isActive = passport.activePresetId === p.id;
          return (
            <button
              key={p.id}
              type="button"
              class={`${styles.cropPresetChip} ${isActive ? styles.cropPresetChipActive : ''}`}
              onClick={() => passport.applyPreset(p)}
            >
              {p.name} ({p.unit})
            </button>
          );
        })}
      </div>

      <div class={styles.biometricGuideNotes}>
        <div class={styles.guideRule}>
          <span style={{ color: '#f59e0b', fontWeight: 700 }}>Crown (Amber):</span>
          <span>Align top of hair/head with dashed amber line</span>
        </div>
        <div class={styles.guideRule}>
          <span style={{ color: '#3b82f6', fontWeight: 700 }}>Eye Line (Blue):</span>
          <span>Keep eyes across the horizontal blue line (50-69%)</span>
        </div>
        <div class={styles.guideRule}>
          <span style={{ color: '#10b981', fontWeight: 700 }}>Chin (Green):</span>
          <span>Place chin tip inside bottom curve of oval</span>
        </div>
      </div>

      <button type="button" class={styles.primaryTabActionBtn} onClick={onDone}>
        ✓ Apply Crop & Continue to Adjustments
      </button>
    </div>
  );
}

function AdjustTabSection({ enhance }: { enhance: UsePassportEnhanceStateReturn }) {
  const { adjustments, setAdjustment, resetAdjustments } = enhance;
  return (
    <div class={styles.adjustTabContent}>
      <div class={styles.adjustHeaderRow}>
        <span class={styles.tabSectionTitle}>Manual Fine-Tuning</span>
        <button type="button" class={styles.resetGhostBtn} onClick={resetAdjustments}>
          ↺ Reset Adjustments
        </button>
      </div>

      <div class={styles.adjustmentsGrid}>
        <div class={styles.adjustmentsCol}>
          <SliderItem
            label="☀️ Brightness"
            min={-30}
            max={30}
            value={adjustments.brightness}
            onChange={(v) => setAdjustment('brightness', v)}
          />
          <SliderItem
            label="🌓 Contrast"
            min={-30}
            max={30}
            value={adjustments.contrast}
            onChange={(v) => setAdjustment('contrast', v)}
          />
          <SliderItem
            label="🎨 Saturation"
            min={-20}
            max={20}
            value={adjustments.saturation}
            onChange={(v) => setAdjustment('saturation', v)}
          />
        </div>

        <div class={styles.adjustmentsCol}>
          <SliderItem
            label="▲ Sharpen"
            min={0}
            max={10}
            value={adjustments.sharpen}
            onChange={(v) => setAdjustment('sharpen', v)}
          />
          <SliderItem
            label="✨ Reduce Blemishes"
            min={0}
            max={10}
            value={adjustments.reduceBlemishes}
            onChange={(v) => setAdjustment('reduceBlemishes', v)}
          />
          <SliderItem
            label="✦ Skin Smooth"
            min={0}
            max={10}
            value={adjustments.skinSmooth}
            onChange={(v) => setAdjustment('skinSmooth', v)}
          />
        </div>
      </div>
    </div>
  );
}

function FiltersTabSection({ enhance }: { enhance: UsePassportEnhanceStateReturn }) {
  const { activeFilter, setActiveFilter, filterIntensity, setFilterIntensity } = enhance;
  return (
    <div class={styles.filtersTabContent}>
      <div class={styles.adjustHeaderRow}>
        <span class={styles.tabSectionTitle}>Natural Visa & Passport Filters</span>
        <button
          type="button"
          class={styles.resetGhostBtn}
          onClick={() => setActiveFilter('natural')}
        >
          ↺ Reset to Natural
        </button>
      </div>

      <FilterThumbnailsRow activeFilter={activeFilter} onSelect={setActiveFilter} />

      <div class={styles.sliderControlGroup} style={{ marginTop: '2px' }}>
        <div class={styles.sliderInfoRow}>
          <span class={styles.sliderIconLabel}>Filter Intensity</span>
          <span class={styles.sliderValText}>{filterIntensity}%</span>
        </div>
        <input
          type="range"
          min={10}
          max={100}
          value={filterIntensity}
          class={styles.customRangeInput}
          onInput={(e) => setFilterIntensity(Number((e.target as HTMLInputElement).value))}
        />
      </div>
    </div>
  );
}

function RetouchTabSection({ enhance }: { enhance: UsePassportEnhanceStateReturn }) {
  const {
    spotEdits,
    undoSpotEdit,
    clearSpotEdits,
    brushSize,
    setBrushSize,
    adjustments,
    setAdjustment,
  } = enhance;
  return (
    <div class={styles.retouchTabContent}>
      <div class={styles.adjustHeaderRow}>
        <span class={styles.tabSectionTitle}>Spot Blemish Retouch</span>
        <span class={styles.spotsCountBadge}>{spotEdits.length} spot(s) healed</span>
      </div>

      <div class={styles.retouchSlidersRow}>
        <SliderItem
          label="🖌️ Brush Size"
          min={8}
          max={32}
          value={brushSize}
          onChange={(v) => setBrushSize(v)}
        />
        <SliderItem
          label="✦ Skin Smoothing"
          min={0}
          max={10}
          value={adjustments.skinSmooth}
          onChange={(v) => setAdjustment('skinSmooth', v)}
        />
      </div>

      <div class={styles.retouchActionsRow}>
        <button
          type="button"
          class={styles.retouchToolBtn}
          onClick={undoSpotEdit}
          disabled={spotEdits.length === 0}
        >
          ↩ Undo Spot
        </button>
        <button
          type="button"
          class={styles.retouchToolBtn}
          onClick={clearSpotEdits}
          disabled={spotEdits.length === 0}
        >
          🗑️ Clear All Spots
        </button>
      </div>

      <div class={styles.retouchHint}>
        💡 Click on any blemish or dark spot on the photo in Card 5 to heal it instantly with
        skin-tone blending.
      </div>
    </div>
  );
}

export function PassportFiltersAdjustmentsCard({
  passport,
  enhance,
}: PassportFiltersAdjustmentsCardProps) {
  const { activeTab, setActiveTab } = enhance;

  const tabTitle =
    activeTab === 'crop'
      ? 'Biometric Crop & Preset Dimensions'
      : activeTab === 'adjust'
        ? 'Manual Photo Adjustments'
        : activeTab === 'filters'
          ? 'Natural Visa & Passport Filters'
          : 'Spot Blemish Retouch';

  return (
    <div class={styles.filtersAdjustmentsCard}>
      <div class={styles.filterCardHeader}>
        <div class={styles.filterCardTitleRow}>
          <span class={styles.stepBadgePurple}>6</span>
          <span class={styles.filterCardTitle}>{tabTitle}</span>
        </div>
      </div>

      {activeTab === 'crop' && (
        <CropTabSection passport={passport} onDone={() => setActiveTab('adjust')} />
      )}
      {activeTab === 'adjust' && <AdjustTabSection enhance={enhance} />}
      {activeTab === 'filters' && <FiltersTabSection enhance={enhance} />}
      {activeTab === 'retouch' && <RetouchTabSection enhance={enhance} />}
    </div>
  );
}
