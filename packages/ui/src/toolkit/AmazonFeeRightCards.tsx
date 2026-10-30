import styles from './businessStudio.module.css';
import type { AmazonFeeEstimatorState } from './useAmazonFeeEstimator.ts';

export function AmazonFeeActionsCard({ state }: { state: AmazonFeeEstimatorState }) {
  const { copySummary, downloadCsv } = state;

  return (
    <section
      class={`${styles.businessCard} ${styles.cardActions}`}
      aria-label="Actions and Scenarios"
    >
      <div class={styles.cardHeading}>
        <span class={`${styles.cardIcon} ${styles.iconAmber}`}>⚡</span>
        <span>Actions & Reporting</span>
      </div>

      <button
        type="button"
        class={styles.yellowActionBtn}
        onClick={copySummary}
        title="Estimate Profit and copy breakdown"
      >
        <span>▦ Estimate & Copy Profit</span>
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

export function AmazonFeeComparisonCard({ state }: { state: AmazonFeeEstimatorState }) {
  const { calculation, fulfilmentMode } = state;

  return (
    <section
      class={`${styles.businessCard} ${styles.cardBreakdown}`}
      aria-label="Scenario Comparison"
    >
      <div class={styles.cardHeading}>
        <span class={`${styles.cardIcon} ${styles.iconCyan}`}>⇄</span>
        <span>Scenario Comparison</span>
      </div>

      <table class={styles.itemizedTable} aria-label="Fulfilment Comparison">
        <thead>
          <tr>
            <th>Mode</th>
            <th>Est. Net Profit</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ background: fulfilmentMode === 'fba' ? '#eff6ff' : 'transparent' }}>
            <td>
              <strong>FBA (Fulfilled by Amazon)</strong>
            </td>
            <td style={{ color: '#059669', fontWeight: 800 }}>
              ₹{calculation.netProfit.toFixed(2)}
            </td>
          </tr>
          <tr style={{ background: fulfilmentMode === 'easy_ship' ? '#eff6ff' : 'transparent' }}>
            <td>Easy Ship</td>
            <td style={{ color: '#64748b' }}>Custom Rates</td>
          </tr>
          <tr style={{ background: fulfilmentMode === 'self_ship' ? '#eff6ff' : 'transparent' }}>
            <td>Self Ship (Merchant)</td>
            <td style={{ color: '#64748b' }}>Custom Rates</td>
          </tr>
        </tbody>
      </table>
    </section>
  );
}

export function AmazonFeeNotesCard() {
  return (
    <section
      class={`${styles.businessCard} ${styles.cardNotes}`}
      aria-label="Fee Verification Notes"
    >
      <div class={styles.cardHeading}>
        <span class={`${styles.cardIcon} ${styles.iconViolet}`}>!</span>
        <span>Fee Verification</span>
      </div>

      <div class={styles.warnBox}>
        Amazon fee schedules change across categories, dimensions, and fulfillment tiers. Displayed
        figures are user-entered estimates, NOT official live rates from Amazon Seller Central.
      </div>

      <div class={styles.noteBox}>
        • <strong>Referral Fee:</strong> Category-based percentage on selling price.
        <br />• <strong>Closing Fee:</strong> Tier-based charge by item price bracket.
        <br />• <strong>Fee GST:</strong> 18% GST applies to all Amazon fees in India.
      </div>
    </section>
  );
}
