import styles from './businessStudio.module.css';
import type { SellerProfitabilityState } from './useSellerProfitability.ts';

export function SellerProfitabilityResultsSummaryCard({
  state,
}: {
  state: SellerProfitabilityState;
}) {
  const { calculation } = state;
  const isProfitable = calculation.netProfit >= 0;

  return (
    <section class={`${styles.businessCard} ${styles.cardResults}`} aria-label="Results Summary">
      <div class={styles.cardHeading}>
        <span class={`${styles.cardIcon} ${styles.iconGreen}`}>✓</span>
        <span>Profitability Summary</span>
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
            {isProfitable ? 'Net Profit per Sale' : 'Net Loss per Sale'}
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

      <div class={styles.kpiGrid2}>
        <div class={styles.kpiCard}>
          <span class={styles.kpiLabel}>Net Margin</span>
          <span class={styles.kpiValue} style={{ color: isProfitable ? '#059669' : '#dc2626' }}>
            {calculation.netMargin}%
          </span>
        </div>
        <div class={styles.kpiCard}>
          <span class={styles.kpiLabel}>Markup on Cost</span>
          <span class={styles.kpiValue} style={{ color: '#7c3aed' }}>
            {calculation.markupOnCost}%
          </span>
        </div>
      </div>
    </section>
  );
}

export function SellerProfitabilityDetailsCard({ state }: { state: SellerProfitabilityState }) {
  const { sellingPrice, productCost, calculation } = state;

  return (
    <section
      class={`${styles.businessCard} ${styles.cardBreakdown}`}
      aria-label="Financial Details"
    >
      <div class={styles.cardHeading}>
        <span class={`${styles.cardIcon} ${styles.iconViolet}`}>▥</span>
        <span>Financial Details</span>
      </div>

      <table class={styles.itemizedTable} aria-label="Itemized Profit Statement">
        <thead>
          <tr>
            <th>Item</th>
            <th>Amount (₹)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Selling Price (Revenue)</td>
            <td style={{ color: '#2563eb' }}>₹{sellingPrice.toFixed(2)}</td>
          </tr>
          <tr>
            <td>Product Cost</td>
            <td style={{ color: '#64748b' }}>−₹{productCost.toFixed(2)}</td>
          </tr>
          <tr>
            <td>Packaging + Shipping</td>
            <td style={{ color: '#64748b' }}>−₹{calculation.packagingShipping.toFixed(2)}</td>
          </tr>
          <tr>
            <td>Marketplace Commission</td>
            <td style={{ color: '#64748b' }}>−₹{calculation.commissionAmount.toFixed(2)}</td>
          </tr>
          <tr>
            <td>Advertising + Other</td>
            <td style={{ color: '#64748b' }}>−₹{calculation.adsOther.toFixed(2)}</td>
          </tr>
          <tr style={{ background: '#f8fafc', fontWeight: 800 }}>
            <td>Total Expenses</td>
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

export function SellerProfitabilityVisualCard({ state }: { state: SellerProfitabilityState }) {
  const { monthlyQty, calculation } = state;

  return (
    <section class={`${styles.businessCard} ${styles.cardVisual}`} aria-label="Visual Breakdown">
      <div class={styles.cardHeading}>
        <span class={`${styles.cardIcon} ${styles.iconPink}`}>◔</span>
        <span>Distribution & Breakdown</span>
      </div>

      <div class={styles.kpiGrid2}>
        <div class={styles.kpiCard}>
          <span class={styles.kpiLabel}>Total Costs / Sale</span>
          <span class={styles.kpiValue}>₹{calculation.totalExpenses.toFixed(0)}</span>
        </div>
        <div class={styles.kpiCard}>
          <span class={styles.kpiLabel}>Monthly Profit ({monthlyQty})</span>
          <span class={styles.kpiValue} style={{ color: '#059669' }}>
            ₹{calculation.monthlyProfit.toLocaleString()}
          </span>
        </div>
      </div>

      <div class={styles.segmentedBar}>
        <div
          style={{
            width: `${calculation.costPct}%`,
            background: '#2563eb',
            transition: 'width 0.2s',
          }}
          title={`Product Cost ${calculation.costPct}%`}
        />
        <div
          style={{
            width: `${calculation.extrasPct}%`,
            background: '#f59e0b',
            transition: 'width 0.2s',
          }}
          title={`Packaging/Shipping ${calculation.extrasPct}%`}
        />
        <div
          style={{
            width: `${calculation.feesPct}%`,
            background: '#9333ea',
            transition: 'width 0.2s',
          }}
          title={`Fees/Ads ${calculation.feesPct}%`}
        />
        <div
          style={{
            width: `${calculation.profitPct}%`,
            background: '#10b981',
            transition: 'width 0.2s',
          }}
          title={`Net Profit ${calculation.profitPct}%`}
        />
      </div>

      <div class={styles.segmentedLegend}>
        <span class={styles.legendItem}>
          <span class={styles.legendDot} style={{ background: '#2563eb' }} />
          Product {calculation.costPct}%
        </span>
        <span class={styles.legendItem}>
          <span class={styles.legendDot} style={{ background: '#f59e0b' }} />
          Extras {calculation.extrasPct}%
        </span>
        <span class={styles.legendItem}>
          <span class={styles.legendDot} style={{ background: '#9333ea' }} />
          Fees {calculation.feesPct}%
        </span>
        <span class={styles.legendItem}>
          <span class={styles.legendDot} style={{ background: '#10b981' }} />
          Profit {calculation.profitPct}%
        </span>
      </div>
    </section>
  );
}
