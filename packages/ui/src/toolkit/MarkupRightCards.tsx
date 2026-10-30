import { useState } from 'preact/hooks';
import styles from './businessStudio.module.css';
import type { MarkupCalculatorState } from './useMarkupCalculator.ts';

export function MarkupVsMarginCard({ state }: { state: MarkupCalculatorState }) {
  const { markupPercent, calculation } = state;

  return (
    <section class={styles.card} aria-label="Markup vs Margin">
      <div class={styles.heading}>
        <span class={`${styles.ico} ${styles.icoAmber}`}>↔</span>
        <span>Markup vs. Margin</span>
      </div>

      <div class={styles.strip}>
        <span>{markupPercent.toFixed(1)}% markup</span>
        <b>{calculation.grossMargin.toFixed(2)}% margin</b>
      </div>
      <p class={styles.muted}>
        Markup measures profit over COST. Margin measures profit over SELLING PRICE.
      </p>

      <table
        class={styles.smallTable}
        aria-label="Markup Margin Tier Table"
        style={{ marginTop: '8px' }}
      >
        <thead>
          <tr>
            <th>Markup</th>
            <th>Margin</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>20%</td>
            <td>16.67%</td>
          </tr>
          <tr>
            <td>40%</td>
            <td>28.57%</td>
          </tr>
          <tr>
            <td>50%</td>
            <td>33.33%</td>
          </tr>
          <tr>
            <td>100%</td>
            <td>50.00%</td>
          </tr>
        </tbody>
      </table>
    </section>
  );
}

export function MarkupTargetMarginCard({ state }: { state: MarkupCalculatorState }) {
  const { costPrice, targetMarginPercent, setTargetMarginPercent } = state;
  const [localCost, setLocalCost] = useState(costPrice);
  const safeMargin = Math.min(99, Math.max(0, targetMarginPercent));
  const requiredPrice = safeMargin < 100 ? localCost / (1 - safeMargin / 100) : localCost;

  return (
    <section class={styles.card} aria-label="Target Margin Mode">
      <div class={styles.heading}>
        <span class={`${styles.ico} ${styles.icoCyan}`}>🎯</span>
        <span>Target Margin Mode</span>
      </div>

      <div class={styles.grid2}>
        <div class={styles.field}>
          <label class={styles.label} for="target-margin-pct">
            Target margin (%)
          </label>
          <input
            id="target-margin-pct"
            type="number"
            class={styles.fieldInput}
            value={targetMarginPercent}
            onInput={(e) =>
              setTargetMarginPercent(Number((e.target as HTMLInputElement).value) || 0)
            }
          />
        </div>
        <div class={styles.field}>
          <label class={styles.label} for="target-cost-price">
            Cost price (₹)
          </label>
          <input
            id="target-cost-price"
            type="number"
            class={styles.fieldInput}
            value={localCost}
            onInput={(e) => setLocalCost(Number((e.target as HTMLInputElement).value) || 0)}
          />
        </div>
      </div>

      <div class={styles.strip} style={{ marginTop: '10px' }}>
        <span>Required price</span>
        <b>₹{requiredPrice.toFixed(2)}</b>
      </div>
    </section>
  );
}

export function MarkupQuickActionsCard({ state }: { state: MarkupCalculatorState }) {
  const { copySummary, downloadCsv, resetToDefaults } = state;

  return (
    <section class={styles.card} aria-label="Quick Actions">
      <div class={styles.heading}>
        <span class={`${styles.ico} ${styles.icoPink}`}>⇩</span>
        <span>Quick Actions</span>
      </div>

      <div class={styles.miniList}>
        <button type="button" class={styles.pill} onClick={copySummary}>
          <span>▤ Copy Pricing Summary</span>
        </button>
        <button type="button" class={styles.pill} onClick={downloadCsv}>
          <span>⇩ Download CSV</span>
        </button>
        <button
          type="button"
          class={`${styles.pill} ${styles.pillDanger}`}
          onClick={resetToDefaults}
        >
          <span>↺ Reset Inputs</span>
        </button>
      </div>
    </section>
  );
}

export function MarkupRightCards({ state }: { state: MarkupCalculatorState }) {
  return (
    <div class={styles.stack}>
      <MarkupVsMarginCard state={state} />
      <MarkupTargetMarginCard state={state} />
      <MarkupQuickActionsCard state={state} />
    </div>
  );
}

export const MarkupActionsCard = MarkupQuickActionsCard;
export const MarkupComparisonCard = MarkupVsMarginCard;
export const MarkupNotesCard = MarkupTargetMarginCard;
