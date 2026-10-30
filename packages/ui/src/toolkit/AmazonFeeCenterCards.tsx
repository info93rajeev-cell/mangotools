import styles from './businessStudio.module.css';
import type { AmazonFeeEstimatorState } from './useAmazonFeeEstimator.ts';

export function AmazonFeeResultsSummaryCard({ state }: { state: AmazonFeeEstimatorState }) {
  const { sellingPrice, calculation } = state;
  const isProfit = calculation.netProfit >= 0;

  return (
    <section class={styles.card} aria-label="Profit and Settlement Estimate">
      <div class={styles.heading}>
        <span class={`${styles.ico} ${styles.icoGreen}`}>✓</span>
        <span>Profit & Settlement Estimate</span>
      </div>

      <div class={`${styles.headlineResult} ${!isProfit ? styles.headlineResultLoss : ''}`}>
        <small>{isProfit ? 'Estimated Profit per Sale' : 'Estimated Loss per Sale'}</small>
        <strong>
          ₹{' '}
          {calculation.netProfit.toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </strong>
      </div>

      <div class={styles.metrics}>
        <div class={styles.metric}>
          <span class={`${styles.ico} ${styles.icoGreen}`}>％</span>
          <div class={styles.metricTextGroup}>
            <small>Profit Margin</small>
            <strong style={{ color: isProfit ? '#059669' : '#dc2626' }}>
              {calculation.netMargin}%
            </strong>
          </div>
        </div>

        <div class={styles.metric}>
          <span class={`${styles.ico} ${styles.icoBlue}`}>₹</span>
          <div class={styles.metricTextGroup}>
            <small>Sales price</small>
            <strong>₹{sellingPrice.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</strong>
          </div>
        </div>

        <div class={styles.metric}>
          <span class={`${styles.ico} ${styles.icoViolet}`}>▣</span>
          <div class={styles.metricTextGroup}>
            <small>Amazon fees + fee GST</small>
            <strong>
              ₹{calculation.amazonFeesWithGst.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </strong>
          </div>
        </div>

        <div class={styles.metric}>
          <span class={`${styles.ico} ${styles.icoAmber}`}>↘</span>
          <div class={styles.metricTextGroup}>
            <small>Costs excluding fees</small>
            <strong>
              ₹
              {calculation.costsExcludingFees.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </strong>
          </div>
        </div>
      </div>
    </section>
  );
}

export function AmazonFeeStatementCard({ state }: { state: AmazonFeeEstimatorState }) {
  const { sellingPrice, productPackagingCost, feeGst, adsReturns, calculation } = state;

  return (
    <section class={styles.card} aria-label="Itemized Profit Statement">
      <div class={styles.heading}>
        <span class={`${styles.ico} ${styles.icoViolet}`}>▥</span>
        <span>Itemized Profit Statement</span>
      </div>

      <table class={styles.smallTable} aria-label="Statement Table">
        <thead>
          <tr>
            <th>Component</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Selling price</td>
            <td>
              ₹
              {sellingPrice.toLocaleString('en-IN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </td>
          </tr>
          <tr>
            <td>Product + packaging</td>
            <td style={{ color: '#64748b' }}>
              −₹
              {productPackagingCost.toLocaleString('en-IN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </td>
          </tr>
          <tr>
            <td>Referral + closing + handling</td>
            <td style={{ color: '#64748b' }}>
              −₹
              {calculation.totalAmazonFees.toLocaleString('en-IN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </td>
          </tr>
          <tr>
            <td>Fee GST</td>
            <td style={{ color: '#64748b' }}>
              −₹
              {feeGst.toLocaleString('en-IN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </td>
          </tr>
          <tr>
            <td>Advertising + expected returns</td>
            <td style={{ color: '#64748b' }}>
              −₹
              {adsReturns.toLocaleString('en-IN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </td>
          </tr>
          <tr style={{ fontWeight: 850, background: '#f0fdf4' }}>
            <td>Net profit</td>
            <td style={{ color: '#059669' }}>
              ₹
              {calculation.netProfit.toLocaleString('en-IN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </td>
          </tr>
        </tbody>
      </table>
    </section>
  );
}

export function AmazonFeeVisualCard({ state }: { state: AmazonFeeEstimatorState }) {
  const { calculation } = state;
  const { costPct, feePct, otherPct, profitPct } = calculation;

  return (
    <section class={styles.card} aria-label="Revenue Allocation">
      <div class={styles.heading}>
        <span class={`${styles.ico} ${styles.icoPink}`}>◔</span>
        <span>Revenue Allocation</span>
      </div>

      <div class={styles.bar}>
        <span style={{ width: `${costPct}%`, background: '#3081ee' }} />
        <span style={{ width: `${feePct}%`, background: '#ae62e5' }} />
        <span style={{ width: `${otherPct}%`, background: '#f9b52c' }} />
        <span style={{ width: `${profitPct}%`, background: '#18b86a' }} />
      </div>

      <div class={styles.legend}>
        <span>Cost {costPct}%</span>
        <span>Amazon fees {feePct}%</span>
        <span>Other {otherPct}%</span>
        <span>Profit {profitPct}%</span>
      </div>
    </section>
  );
}

export function AmazonFeeCenterCards({ state }: { state: AmazonFeeEstimatorState }) {
  return (
    <div class={styles.stack}>
      <AmazonFeeResultsSummaryCard state={state} />
      <AmazonFeeStatementCard state={state} />
      <AmazonFeeVisualCard state={state} />
    </div>
  );
}
