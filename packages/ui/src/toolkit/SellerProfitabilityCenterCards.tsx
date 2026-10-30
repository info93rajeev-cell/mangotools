import styles from './businessStudio.module.css';
import type { SellerProfitabilityState } from './useSellerProfitability.ts';

export function SellerProfitabilitySummaryCard({ state }: { state: SellerProfitabilityState }) {
  const { calculation } = state;
  const isProfit = calculation.netProfit >= 0;

  return (
    <section class={styles.card} aria-label="Profitability Summary">
      <div class={styles.heading}>
        <span class={`${styles.ico} ${styles.icoGreen}`}>✓</span>
        <span>Profitability Summary</span>
      </div>

      <div class={`${styles.headlineResult} ${!isProfit ? styles.headlineResultLoss : ''}`}>
        <small>{isProfit ? 'Net Profit per Order' : 'Net Loss per Order'}</small>
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
            <small>Net margin</small>
            <strong style={{ color: isProfit ? '#059669' : '#dc2626' }}>
              {calculation.netMargin}%
            </strong>
          </div>
        </div>

        <div class={styles.metric}>
          <span class={`${styles.ico} ${styles.icoViolet}`}>↗</span>
          <div class={styles.metricTextGroup}>
            <small>Markup on cost</small>
            <strong>{calculation.markupOnCost}%</strong>
          </div>
        </div>

        <div class={styles.metric}>
          <span class={`${styles.ico} ${styles.icoCyan}`}>₹</span>
          <div class={styles.metricTextGroup}>
            <small>Monthly profit</small>
            <strong>
              ₹{calculation.monthlyProfit.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </strong>
          </div>
        </div>

        <div class={styles.metric}>
          <span class={`${styles.ico} ${styles.icoAmber}`}>≋</span>
          <div class={styles.metricTextGroup}>
            <small>Total cost</small>
            <strong>
              ₹{calculation.totalExpenses.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </strong>
          </div>
        </div>
      </div>
    </section>
  );
}

export function SellerRevenueCostBreakdownCard({ state }: { state: SellerProfitabilityState }) {
  const { productCost, packagingCost, shippingCost, adCost, otherCharges, calculation } = state;
  const packAndShip = packagingCost + shippingCost;
  const adsAndOther = adCost + otherCharges;

  return (
    <section class={styles.card} aria-label="Revenue and Cost Breakdown">
      <div class={styles.heading}>
        <span class={`${styles.ico} ${styles.icoViolet}`}>▥</span>
        <span>Revenue & Cost Breakdown</span>
      </div>

      <table class={styles.smallTable} aria-label="Cost Breakdown Table">
        <thead>
          <tr>
            <th>Item</th>
            <th>₹ per sale</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Product cost</td>
            <td>₹{productCost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
          </tr>
          <tr>
            <td>Packaging + shipping</td>
            <td>₹{packAndShip.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
          </tr>
          <tr>
            <td>Commission</td>
            <td>
              ₹{calculation.commissionAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </td>
          </tr>
          <tr>
            <td>Ads + other</td>
            <td>₹{adsAndOther.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
          </tr>
          <tr style={{ fontWeight: 800 }}>
            <td>Total expenses</td>
            <td style={{ color: '#dc2626' }}>
              ₹{calculation.totalExpenses.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </td>
          </tr>
          <tr style={{ fontWeight: 850, background: '#f0fdf4' }}>
            <td>Net profit</td>
            <td style={{ color: '#059669' }}>
              ₹{calculation.netProfit.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </td>
          </tr>
        </tbody>
      </table>
    </section>
  );
}

export function SellerWhereMoneyGoesCard({ state }: { state: SellerProfitabilityState }) {
  const {
    sellingPrice,
    productCost,
    packagingCost,
    shippingCost,
    adCost,
    otherCharges,
    calculation,
  } = state;
  const sp = Math.max(1, sellingPrice);
  const prodPct = Math.min(100, Math.round((productCost / sp) * 100));
  const otherPct = Math.min(
    100,
    Math.round(((packagingCost + shippingCost + adCost + otherCharges) / sp) * 100),
  );
  const feePct = Math.min(
    100,
    Math.round(((calculation.totalMarketplaceFees + calculation.marketplaceFeeGst) / sp) * 100),
  );
  const profitPct = Math.max(0, Math.round((calculation.netProfit / sp) * 100));

  return (
    <section class={styles.card} aria-label="Where the Money Goes">
      <div class={styles.heading}>
        <span class={`${styles.ico} ${styles.icoPink}`}>◔</span>
        <span>Where the Money Goes</span>
      </div>

      <div class={styles.bar}>
        <span style={{ width: `${prodPct}%`, background: '#2581ef' }} />
        <span style={{ width: `${otherPct}%`, background: '#f6ae27' }} />
        <span style={{ width: `${feePct}%`, background: '#aa69ea' }} />
        <span style={{ width: `${profitPct}%`, background: '#18b86b' }} />
      </div>

      <div class={styles.legend}>
        <span>🔵 Product {prodPct}%</span>
        <span>🟠 Other {otherPct}%</span>
        <span>🟣 Fees {feePct}%</span>
        <span>🟢 Profit {profitPct}%</span>
      </div>
    </section>
  );
}

export function SellerProfitabilityCenterCards({ state }: { state: SellerProfitabilityState }) {
  return (
    <div class={styles.stack}>
      <SellerProfitabilitySummaryCard state={state} />
      <SellerRevenueCostBreakdownCard state={state} />
      <SellerWhereMoneyGoesCard state={state} />
    </div>
  );
}

export const SellerProfitabilityResultsSummaryCard = SellerProfitabilitySummaryCard;
export const SellerProfitabilityDetailsCard = SellerRevenueCostBreakdownCard;
export const SellerProfitabilityVisualCard = SellerWhereMoneyGoesCard;
