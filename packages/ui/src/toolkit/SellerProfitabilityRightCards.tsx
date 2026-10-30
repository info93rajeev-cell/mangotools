import styles from './businessStudio.module.css';
import type { SellerProfitabilityState } from './useSellerProfitability.ts';

export function SellerProfitabilityActionsCard({ state }: { state: SellerProfitabilityState }) {
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
        title="Calculate and copy summary"
      >
        <span>▦ Calculate & Copy Profit</span>
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

export function SellerProfitabilityNotesCard() {
  return (
    <section class={`${styles.businessCard} ${styles.cardNotes}`} aria-label="Formula and Notes">
      <div class={styles.cardHeading}>
        <span class={`${styles.cardIcon} ${styles.iconCyan}`}>𝑓</span>
        <span>Formula / Important Notes</span>
      </div>

      <div class={styles.noteBox}>
        <div>
          <strong>Margin vs Markup Formula:</strong>
        </div>
        <div style={{ marginTop: '4px' }}>
          • <strong>Net Margin</strong> = (Net Profit ÷ Selling Price) × 100
        </div>
        <div>
          • <strong>Markup on Cost</strong> = (Net Profit ÷ Product Cost) × 100
        </div>
        <div style={{ marginTop: '4px' }}>
          • Margin cannot exceed 100%. Markup can exceed 100% when selling price is more than double
          cost.
        </div>
      </div>

      <div class={styles.warnBox}>
        Returns, reverse logistics, and customer return rates (RTO) directly reduce net margins.
        Verify all marketplace commission tiers before fixing product listing prices.
      </div>
    </section>
  );
}
