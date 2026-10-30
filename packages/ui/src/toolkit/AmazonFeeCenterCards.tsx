import styles from './businessStudio.module.css';
import type { AmazonFeeEstimatorState } from './useAmazonFeeEstimator.ts';

export function AmazonFeeResultsSummaryCard({ state }: { state: AmazonFeeEstimatorState }) {
  const { calculation } = state;
  const isProfitable = calculation.netProfit >= 0;

  return (
    <section class={`${styles.businessCard} ${styles.cardResults}`} aria-label="Results Summary">
      <div class={styles.cardHeading}>
        <span class={`${styles.cardIcon} ${styles.iconGreen}`}>✓</span>
        <span>Profit & Settlement Estimate</span>
      </div>

      <div
        class={styles.headlineHero}
        style={{
          background: isProfitable
            ? 'linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)'
            : 'linear-gradient(135deg, #fef2f2 0%, #fff1f2 100%)',
          borderColor: isProfitable ? '#a7f3d0' : '#fecaca',
        }}
      >
        <div>
          <div class={styles.headlineTitle} style={{ color: isProfitable ? '#047857' : '#b91c1c' }}>
            {isProfitable ? 'Estimated Net Profit / Sale' : 'Estimated Net Loss'}
          </div>
          <div
            class={styles.headlineAmount}
            style={{ color: isProfitable ? '#065f46' : '#991b1b' }}
          >
            ₹ {calculation.netProfit.toFixed(2)}
          </div>
        </div>

        <div
          class={styles.kpiBadge}
          style={{
            background: isProfitable ? '#d1fae5' : '#fee2e2',
            color: isProfitable ? '#065f46' : '#991b1b',
          }}
        >
          {calculation.netMargin}% margin
        </div>
      </div>

      <div class={styles.kpiGrid3}>
        <div class={styles.kpiCard}>
          <span class={styles.kpiLabel}>Profit Margin</span>
          <span class={styles.kpiValue} style={{ color: isProfitable ? '#059669' : '#dc2626' }}>
            {calculation.netMargin}%
          </span>
        </div>
        <div class={styles.kpiCard}>
          <span class={styles.kpiLabel}>Amazon Fees + GST</span>
          <span class={styles.kpiValue} style={{ color: '#7c3aed' }}>
            ₹{calculation.amazonFeesWithGst.toFixed(0)}
          </span>
        </div>
        <div class={styles.kpiCard}>
          <span class={styles.kpiLabel}>Bank Settlement</span>
          <span class={styles.kpiValue} style={{ color: '#2563eb' }}>
            ₹{calculation.bankPayout.toFixed(0)}
          </span>
        </div>
      </div>
    </section>
  );
}

export function AmazonFeeStatementCard({ state }: { state: AmazonFeeEstimatorState }) {
  const {
    sellingPrice,
    productPackagingCost,
    referralFee,
    closingHandling,
    feeGst,
    adsReturns,
    calculation,
  } = state;

  return (
    <section
      class={`${styles.businessCard} ${styles.cardBreakdown}`}
      aria-label="Itemized Profit Statement"
    >
      <div class={styles.cardHeading}>
        <span class={`${styles.cardIcon} ${styles.iconViolet}`}>▥</span>
        <span>Itemized Profit Statement</span>
      </div>

      <table class={styles.itemizedTable} aria-label="Amazon Fee Statement">
        <thead>
          <tr>
            <th>Component</th>
            <th>Amount (₹)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Selling Price</td>
            <td style={{ color: '#2563eb' }}>₹{sellingPrice.toFixed(2)}</td>
          </tr>
          <tr>
            <td>Product + Packaging</td>
            <td style={{ color: '#64748b' }}>−₹{productPackagingCost.toFixed(2)}</td>
          </tr>
          <tr>
            <td>Referral Fee</td>
            <td style={{ color: '#64748b' }}>−₹{referralFee.toFixed(2)}</td>
          </tr>
          <tr>
            <td>Closing + Weight Handling</td>
            <td style={{ color: '#64748b' }}>−₹{closingHandling.toFixed(2)}</td>
          </tr>
          <tr>
            <td>Fee GST (18%)</td>
            <td style={{ color: '#64748b' }}>−₹{feeGst.toFixed(2)}</td>
          </tr>
          <tr>
            <td>Advertising + Returns Reserve</td>
            <td style={{ color: '#64748b' }}>−₹{adsReturns.toFixed(2)}</td>
          </tr>
          <tr style={{ background: '#f8fafc', fontWeight: 800 }}>
            <td>Total Costs</td>
            <td style={{ color: '#dc2626' }}>₹{calculation.totalExpenses.toFixed(2)}</td>
          </tr>
          <tr style={{ background: '#f0fdf4', fontWeight: 800 }}>
            <td>Net Profit per Sale</td>
            <td style={{ color: '#059669' }}>₹{calculation.netProfit.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>
    </section>
  );
}

export function AmazonFeeVisualCard({ state }: { state: AmazonFeeEstimatorState }) {
  const { calculation } = state;

  return (
    <section class={`${styles.businessCard} ${styles.cardVisual}`} aria-label="Revenue Allocation">
      <div class={styles.cardHeading}>
        <span class={`${styles.cardIcon} ${styles.iconPink}`}>◔</span>
        <span>Revenue Allocation</span>
      </div>

      <div class={styles.segmentedBar}>
        <div
          style={{ width: `${calculation.costPct}%`, background: '#2563eb' }}
          title={`Product: ${calculation.costPct}%`}
        />
        <div
          style={{ width: `${calculation.feePct}%`, background: '#7c3aed' }}
          title={`Amazon Fees: ${calculation.feePct}%`}
        />
        <div
          style={{ width: `${calculation.otherPct}%`, background: '#f59e0b' }}
          title={`Ads & Returns: ${calculation.otherPct}%`}
        />
        <div
          style={{ width: `${calculation.profitPct}%`, background: '#10b981' }}
          title={`Profit: ${calculation.profitPct}%`}
        />
      </div>

      <div class={styles.legendRow}>
        <span class={styles.legendItem}>
          <span class={styles.legendDot} style={{ background: '#2563eb' }} />
          Cost {calculation.costPct}%
        </span>
        <span class={styles.legendItem}>
          <span class={styles.legendDot} style={{ background: '#7c3aed' }} />
          Fees {calculation.feePct}%
        </span>
        <span class={styles.legendItem}>
          <span class={styles.legendDot} style={{ background: '#f59e0b' }} />
          Ads {calculation.otherPct}%
        </span>
        <span class={styles.legendItem}>
          <span class={styles.legendDot} style={{ background: '#10b981' }} />
          Profit {calculation.profitPct}%
        </span>
      </div>
    </section>
  );
}
