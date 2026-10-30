import styles from './businessStudio.module.css';
import type { MarkupCalculatorState } from './useMarkupCalculator.ts';

export function MarkupResultsSummaryCard({ state }: { state: MarkupCalculatorState }) {
  const { calculation } = state;

  return (
    <section class={`${styles.businessCard} ${styles.cardResults}`} aria-label="Pricing Result">
      <div class={styles.cardHeading}>
        <span class={`${styles.cardIcon} ${styles.iconGreen}`}>✓</span>
        <span>Pricing Result</span>
      </div>

      <div class={styles.headlineHero}>
        <div>
          <div class={styles.headlineTitle}>Recommended Selling Price</div>
          <div class={styles.headlineAmount}>₹ {calculation.sellingPrice.toFixed(2)}</div>
        </div>

        <div class={styles.kpiBadge}>{calculation.grossMargin}% margin</div>
      </div>

      <div class={styles.kpiGrid2}>
        <div class={styles.kpiCard}>
          <span class={styles.kpiLabel}>Markup</span>
          <span class={styles.kpiValue} style={{ color: '#7c3aed' }}>
            {state.markupPercent}%
          </span>
        </div>
        <div class={styles.kpiCard}>
          <span class={styles.kpiLabel}>Gross Margin</span>
          <span class={styles.kpiValue} style={{ color: '#059669' }}>
            {calculation.grossMargin}%
          </span>
        </div>
      </div>
    </section>
  );
}

export function MarkupFinancialDetailsCard({ state }: { state: MarkupCalculatorState }) {
  const { calculation } = state;

  return (
    <section
      class={`${styles.businessCard} ${styles.cardBreakdown}`}
      aria-label="Financial Details"
    >
      <div class={styles.cardHeading}>
        <span class={`${styles.cardIcon} ${styles.iconViolet}`}>▥</span>
        <span>Financial Details</span>
      </div>

      <table class={styles.itemizedTable} aria-label="Itemized Pricing Details">
        <thead>
          <tr>
            <th>Item</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Base Product Cost</td>
            <td style={{ color: '#64748b' }}>₹{calculation.baseCost.toFixed(2)}</td>
          </tr>
          <tr>
            <td>Markup Added ({state.markupPercent}%)</td>
            <td style={{ color: '#059669' }}>+₹{calculation.markupAdded.toFixed(2)}</td>
          </tr>
          <tr style={{ background: '#eff6ff', fontWeight: 800 }}>
            <td>Selling Price</td>
            <td style={{ color: '#2563eb' }}>₹{calculation.sellingPrice.toFixed(2)}</td>
          </tr>
          <tr>
            <td>Gross Margin Percentage</td>
            <td style={{ color: '#0f172a' }}>{calculation.grossMargin}%</td>
          </tr>
        </tbody>
      </table>
    </section>
  );
}

export function MarkupVisualCard({ state }: { state: MarkupCalculatorState }) {
  const { quantity, calculation } = state;

  return (
    <section class={`${styles.businessCard} ${styles.cardVisual}`} aria-label="Price Composition">
      <div class={styles.cardHeading}>
        <span class={`${styles.cardIcon} ${styles.iconPink}`}>◔</span>
        <span>Price Composition & Profits</span>
      </div>

      <div class={styles.kpiGrid2}>
        <div class={styles.kpiCard}>
          <span class={styles.kpiLabel}>Profit / Unit</span>
          <span class={styles.kpiValue} style={{ color: '#059669' }}>
            ₹{calculation.profitPerUnit.toFixed(2)}
          </span>
        </div>
        <div class={styles.kpiCard}>
          <span class={styles.kpiLabel}>Profit on {quantity} units</span>
          <span class={styles.kpiValue} style={{ color: '#2563eb' }}>
            ₹{calculation.profitOnQuantity.toLocaleString()}
          </span>
        </div>
      </div>

      <div class={styles.segmentedBar}>
        <div
          style={{ width: `${calculation.costPct}%`, background: '#2563eb' }}
          title={`Base Cost ${calculation.costPct}%`}
        />
        <div
          style={{ width: `${calculation.profitPct}%`, background: '#10b981' }}
          title={`Gross Profit ${calculation.profitPct}%`}
        />
      </div>

      <div class={styles.segmentedLegend}>
        <span class={styles.legendItem}>
          <span class={styles.legendDot} style={{ background: '#2563eb' }} />
          Cost {calculation.costPct}%
        </span>
        <span class={styles.legendItem}>
          <span class={styles.legendDot} style={{ background: '#10b981' }} />
          Gross Profit {calculation.profitPct}%
        </span>
      </div>
    </section>
  );
}
