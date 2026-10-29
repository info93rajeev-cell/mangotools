import styles from './passportEnhance.module.css';
import type { NaturalFilterId } from './passportEnhanceEngine.ts';
import type { UsePassportEnhanceStateReturn } from './usePassportEnhanceState.ts';

export interface PassportFiltersAdjustmentsCardProps {
  enhance: UsePassportEnhanceStateReturn;
}

const FILTER_ITEMS: { id: NaturalFilterId; label: string }[] = [
  { id: 'none', label: 'None' },
  { id: 'auto', label: 'Auto Enhance' },
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

export function PassportFiltersAdjustmentsCard({ enhance }: PassportFiltersAdjustmentsCardProps) {
  const { activeFilter, setActiveFilter, adjustments, setAdjustment } = enhance;

  return (
    <div class={styles.filtersAdjustmentsCard}>
      <div class={styles.filterCardHeader}>
        <div class={styles.filterCardTitleRow}>
          <span class={styles.stepBadgePurple}>6</span>
          <span class={styles.filterCardTitle}>Filters & Adjustments</span>
          <span class={styles.filterCardSubtitle}>(subtle improvements only)</span>
        </div>
      </div>

      <FilterThumbnailsRow activeFilter={activeFilter} onSelect={setActiveFilter} />

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
            label="✨ Reduce Blemishes (Light)"
            min={0}
            max={10}
            value={adjustments.reduceBlemishes}
            onChange={(v) => setAdjustment('reduceBlemishes', v)}
          />
          <SliderItem
            label="✦ Skin Smooth (Subtle)"
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
