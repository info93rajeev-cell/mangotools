import styles from './businessStudio.module.css';
import type { MarkupCalculatorState } from './useMarkupCalculator.ts';

const MARKUP_MARGIN_TIERS = [
  { markup: '20%', margin: '16.67%' },
  { markup: '40%', margin: '28.57%' },
  { markup: '50%', margin: '33.33%' },
  { markup: '100%', margin: '50.00%' },
];

export function MarkupActionsCard({ state }: { state: MarkupCalculatorState }) {
  const { copySummary, downloadCsv } = state;

  return (
    <section class={`${styles.businessCard} ${styles.cardActions}`} aria-label="Quick Actions">
      <div class={styles.cardHeading}>
        <span class={`${styles.cardIcon} ${styles.iconAmber}`}>⚡</span>
        <span>Quick Actions</span>
      </div>

      <button
        type="button"
        class={styles.yellowActionBtn}
        onClick={copySummary}
        title="Calculate Price and copy summary"
      >
        <span>▦ Calculate & Copy Price</span>
      </button>

      <div class={styles.actionsRow}>
        <button type="button" class={styles.ghostActionBtn} onClick={copySummary}>
          <span>📋 Copy Summary</span>
        </button>
        <button type="button" class={styles.ghostActionBtn} onClick={downloadCsv}>
          <span>📥 Download CSV</span>
        </button>
      </div>
    </section>
  );
}

export function MarkupComparisonCard() {
  return (
    <section class={`${styles.businessCard} ${styles.cardBreakdown}`} aria-label="Markup vs Margin">
      <div class={styles.cardHeading}>
        <span class={`${styles.cardIcon} ${styles.iconCyan}`}>↔</span>
        <span>Markup vs. Margin</span>
      </div>

      <div style={{ fontSize: '11px', color: '#64748b', lineHeight: '1.4' }}>
        Markup measures profit over <strong>COST</strong>. Margin measures profit over{' '}
        <strong>SELLING PRICE</strong>.
      </div>

      <table class={styles.itemizedTable} aria-label="Markup vs Margin Table">
        <thead>
          <tr>
            <th>Markup %</th>
            <th>Effective Margin %</th>
          </tr>
        </thead>
        <tbody>
          {MARKUP_MARGIN_TIERS.map((tier) => (
            <tr key={tier.markup}>
              <td style={{ fontWeight: 700, color: '#7c3aed' }}>{tier.markup}</td>
              <td style={{ fontWeight: 700, color: '#059669' }}>{tier.margin}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export function MarkupNotesCard({ state }: { state: MarkupCalculatorState }) {
  const { calculation } = state;

  return (
    <section class={`${styles.businessCard} ${styles.cardNotes}`} aria-label="Formula and Working">
      <div class={styles.cardHeading}>
        <span class={`${styles.cardIcon} ${styles.iconViolet}`}>𝑓</span>
        <span>Formula & Working</span>
      </div>

      <div class={styles.noteBox}>
        <div>
          • <strong>Selling Price</strong> = Cost × (1 + Markup ÷ 100)
        </div>
        <div style={{ marginTop: '2px', color: '#1e40af', fontWeight: 600 }}>
          ₹{calculation.baseCost} × (1 + {state.markupPercent}/100) = ₹{calculation.sellingPrice}
        </div>
        <div style={{ marginTop: '4px' }}>
          • <strong>Gross Margin</strong> = (Price − Cost) ÷ Price × 100 = {calculation.grossMargin}
          %
        </div>
      </div>
    </section>
  );
}
