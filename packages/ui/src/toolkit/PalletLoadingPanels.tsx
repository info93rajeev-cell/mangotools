import styles from './palletLoading.module.css';
import type { PalletLoadingResult } from './palletLoadingModel.ts';

interface PalletLoadingResultsProps {
  result: PalletLoadingResult;
  showWeightInResults: boolean;
}

export function PalletLoadingResults({ result, showWeightInResults }: PalletLoadingResultsProps) {
  return (
    <div class={styles.card}>
      <div class={styles.cardHead}>
        <span class={styles.cardTitle}>3. Results Summary</span>
      </div>

      <div class={styles.resultsContainer}>
        <div class={styles.resultsKpiGrid}>
          <div class={styles.kpiCard}>
            <span class={styles.kpiIcon} aria-hidden="true">
              📦
            </span>
            <div class={styles.kpiBody}>
              <span class={styles.kpiLabel}>Boxes per layer</span>
              <span class={styles.kpiValue}>{result.boxesPerLayer}</span>
              <span class={styles.kpiSub}>
                ({result.alongLength} × {result.alongWidth})
              </span>
            </div>
          </div>

          <div class={styles.kpiCard}>
            <span class={styles.kpiIcon} aria-hidden="true">
              🧱
            </span>
            <div class={styles.kpiBody}>
              <span class={styles.kpiLabel}>Total layers</span>
              <span class={styles.kpiValue}>{result.totalLayers}</span>
            </div>
          </div>

          <div class={styles.kpiCard}>
            <span class={styles.kpiIcon} aria-hidden="true">
              🔢
            </span>
            <div class={styles.kpiBody}>
              <span class={styles.kpiLabel}>Total boxes</span>
              <span class={styles.kpiValue}>{result.totalBoxes}</span>
            </div>
          </div>

          <div class={styles.kpiCard}>
            <span class={styles.kpiIcon} aria-hidden="true">
              📊
            </span>
            <div class={styles.kpiBody}>
              <span class={styles.kpiLabel}>Space utilization</span>
              <span class={styles.kpiValue}>{result.spaceUtilizationPercent}%</span>
              <div class={styles.progressBarWrap}>
                <div
                  class={styles.progressBarFill}
                  style={{ width: `${Math.min(100, result.spaceUtilizationPercent)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div class={styles.kpiCard}>
          <span class={styles.kpiIcon} aria-hidden="true">
            📐
          </span>
          <div class={styles.kpiBody}>
            <span class={styles.kpiLabel}>Pallet dimensions (loaded)</span>
            <span class={styles.kpiSub}>
              L: {result.loadedDimensions.length} cm × W: {result.loadedDimensions.width} cm × H:{' '}
              {result.loadedDimensions.height} cm
            </span>
          </div>
        </div>

        {showWeightInResults && (
          <div class={styles.kpiCard}>
            <span class={styles.kpiIcon} aria-hidden="true">
              ⚖️
            </span>
            <div class={styles.kpiBody}>
              <span class={styles.kpiLabel}>Total gross weight</span>
              <span class={styles.kpiValue}>{result.weightBreakdown.totalGrossWeightKg} kg</span>
              <span class={styles.kpiSub}>
                Boxes: {result.weightBreakdown.totalBoxesWeightKg} kg • Pallet: 25 kg
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function PalletLoadingQuickGuide() {
  return (
    <div class={styles.card}>
      <div class={styles.cardHead}>
        <span class={styles.cardTitle}>Quick Guide</span>
      </div>

      <ol class={styles.quickGuideList}>
        <li class={styles.guideStep}>
          <span class={styles.stepNum}>1</span>
          <span>Select pallet type and dimensions.</span>
        </li>
        <li class={styles.guideStep}>
          <span class={styles.stepNum}>2</span>
          <span>Enter box/carton size.</span>
        </li>
        <li class={styles.guideStep}>
          <span class={styles.stepNum}>3</span>
          <span>Set stacking options and limits.</span>
        </li>
        <li class={styles.guideStep}>
          <span class={styles.stepNum}>4</span>
          <span>Results and 3D stack render automatically!</span>
        </li>
      </ol>

      <details class={styles.accordionItem}>
        <summary class={styles.accordionSummary}>
          <span aria-hidden="true">📋</span> Typical pallet sizes
        </summary>
        <div class={styles.accordionContent}>
          • Standard / ISO: 120 × 100 cm
          <br />• Euro (EUR 1): 120 × 80 cm
          <br />• US GMA: 48 × 40 in (121.9 × 101.6 cm)
          <br />• Asian: 110 × 110 cm
          <br />• Australian: 116.5 × 116.5 cm
        </div>
      </details>

      <details class={styles.accordionItem}>
        <summary class={styles.accordionSummary}>
          <span aria-hidden="true">📐</span> Calculation method
        </summary>
        <div class={styles.accordionContent}>
          Tests both box orientations (lengthwise and widthwise) to find the maximum boxes per layer
          without overhang, then multiplies by permitted layer height.
        </div>
      </details>

      <details class={styles.accordionItem}>
        <summary class={styles.accordionSummary}>
          <span aria-hidden="true">⚠️</span> Important notes
        </summary>
        <div class={styles.accordionContent}>
          Wooden pallets typically weigh 20–25 kg. Max dynamic payload is usually 1,500 kg. Use
          corner boards and stretch wrap for stable transit.
        </div>
      </details>
    </div>
  );
}

interface PalletLoadingActionBarProps {
  copyFeedback: boolean;
  onCopySummary: () => void;
  onReset: () => void;
}

export function PalletLoadingActionBar({
  copyFeedback,
  onCopySummary,
  onReset,
}: PalletLoadingActionBarProps) {
  return (
    <div class={styles.actionBar}>
      <button type="button" class={styles.primaryCalculateBtn}>
        <span aria-hidden="true">🧮</span> Calculate Pallet Loading
      </button>
      <button type="button" class={styles.secondaryBtn} onClick={() => window.print()}>
        <span aria-hidden="true">🖨️</span> Print / Save PDF
      </button>
      <button type="button" class={styles.secondaryBtn} onClick={onCopySummary}>
        <span aria-hidden="true">📋</span> {copyFeedback ? 'Copied!' : 'Copy Summary'}
      </button>
      <button type="button" class={styles.secondaryBtn} onClick={onReset}>
        <span aria-hidden="true">↺</span> Reset
      </button>
    </div>
  );
}
