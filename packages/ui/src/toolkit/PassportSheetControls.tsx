import styles from './passportPhoto.module.css';
import { PAPER_SIZES, type PaperSizeId } from './passportSheetGeometry.ts';
import type { UsePassportPhotoReturn } from './usePassportPhoto.ts';

export interface PassportSheetControlsProps {
  idPrefix: string;
  passport: UsePassportPhotoReturn;
  disabled?: boolean;
}

// biome-ignore lint/complexity/noExcessiveLinesPerFunction: Studio sheet controls
export function PassportSheetControls({
  idPrefix,
  passport,
  disabled = false,
}: PassportSheetControlsProps) {
  const {
    paperSize,
    setPaperSize,
    photoCount,
    setPhotoCount,
    showCutGuides,
    setShowCutGuides,
    sheetLayout,
  } = passport;

  const quickCounts = [2, 4, 5, 6, 8, 12, sheetLayout.cols, sheetLayout.maxCapacity];
  const uniqueCounts = Array.from(new Set(quickCounts)).filter(
    (c) => c >= 1 && c <= sheetLayout.maxCapacity,
  );

  return (
    <section class={styles.controlSection}>
      <div class={styles.sectionHeader}>
        <span class={styles.sectionTitle}>4. Studio Print Sheet</span>
        <span class={styles.sheetMiniNotice}>{sheetLayout.blankPercent}% blank for reuse</span>
      </div>

      {/* PAPER SIZE SELECTOR */}
      <div class={styles.paperChipsGrid}>
        {PAPER_SIZES.map((p) => {
          const isActive = paperSize === p.id;
          return (
            <button
              key={p.id}
              type="button"
              class={styles.paperChip}
              data-paper-select={p.id}
              data-active={String(isActive)}
              onClick={() => setPaperSize(p.id as PaperSizeId)}
              disabled={disabled}
              title={p.description}
            >
              <span class={styles.paperChipName}>{p.name}</span>
              <span class={styles.paperChipDim}>
                {Math.round(p.widthMm)}×{Math.round(p.heightMm)} mm
              </span>
            </button>
          );
        })}
      </div>

      {/* PHOTO COUNT INLINE ROW */}
      <div class={styles.photoCountRow}>
        <div class={styles.countField}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            <span class={styles.dimLabel}>Photos:</span>
            <div class={styles.stepperWrap}>
              <button
                type="button"
                class={styles.stepperBtn}
                onClick={() => setPhotoCount(Math.max(1, photoCount - 1))}
                disabled={disabled || photoCount <= 1}
                title="Decrease photos"
              >
                −
              </button>
              <input
                id={`${idPrefix}-sheet-photo-count`}
                type="number"
                min="1"
                max={sheetLayout.maxCapacity}
                class={styles.stepperInput}
                value={photoCount}
                onInput={(e) =>
                  setPhotoCount(
                    Math.max(
                      1,
                      Math.min(
                        sheetLayout.maxCapacity,
                        Number((e.target as HTMLInputElement).value),
                      ),
                    ),
                  )
                }
                disabled={disabled}
              />
              <button
                type="button"
                class={styles.stepperBtn}
                onClick={() => setPhotoCount(Math.min(sheetLayout.maxCapacity, photoCount + 1))}
                disabled={disabled || photoCount >= sheetLayout.maxCapacity}
                title="Increase photos"
              >
                +
              </button>
            </div>
          </div>

          {/* QUICK CHIPS INLINE */}
          <div class={styles.quickChipsWrap}>
            {uniqueCounts.slice(0, 5).map((c) => {
              const isChipActive = photoCount === c;
              const isRowFill = c === sheetLayout.cols;
              return (
                <button
                  key={c}
                  type="button"
                  class={styles.quickCountChip}
                  data-photo-count={c}
                  data-active={String(isChipActive)}
                  onClick={() => setPhotoCount(c)}
                  disabled={disabled}
                  title={isRowFill ? `Fill 1 full row (${c} photos)` : `${c} photos`}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* CUT GUIDES TOGGLE */}
      <div class={styles.switchRow}>
        <label class={styles.switchLabel}>
          <input
            type="checkbox"
            checked={showCutGuides}
            onChange={(e) => setShowCutGuides((e.target as HTMLInputElement).checked)}
            disabled={disabled}
          />
          <span>Scissors dashed cut lines</span>
        </label>
      </div>
    </section>
  );
}
