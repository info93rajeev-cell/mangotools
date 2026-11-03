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

const rupees = (v: number) => `₹${v.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

/** Every line that makes up total expenses, so the table adds up to the total it shows. */
function breakdownRows(state: SellerProfitabilityState): [string, number][] {
  const { sellingPrice, productCost, packagingCost, shippingCost, adCost, otherCharges } = state;
  const c = state.calculation;
  const rows: [string, number][] = [['Selling price', sellingPrice]];
  if (c.outputGst > 0 && c.netBaseRevenue < sellingPrice) {
    rows.push(['GST inside the price (paid to govt)', -c.outputGst]);
  }
  rows.push(['Product cost', -productCost]);
  rows.push(['Packaging + shipping', -(packagingCost + shippingCost)]);
  const backOffice = c.directFulfillment - packagingCost - shippingCost;
  if (backOffice > 0) rows.push(['Warehousing, labour, overhead', -backOffice]);
  rows.push(['Commission + closing fee', -c.totalMarketplaceFees]);
  if (c.marketplaceFeeGst > 0) rows.push(['GST on marketplace fees', -c.marketplaceFeeGst]);
  rows.push(['Ads + other', -(adCost + otherCharges)]);
  if (c.rtoLossPerUnit > 0) rows.push(['Returns (per sale, averaged)', -c.rtoLossPerUnit]);
  return rows;
}

export function SellerRevenueCostBreakdownCard({ state }: { state: SellerProfitabilityState }) {
  const { calculation } = state;
  const loss = calculation.netProfit < 0;

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
          {breakdownRows(state).map(([label, value]) => (
            <tr key={label}>
              <td>{label}</td>
              <td>{value < 0 ? `−${rupees(-value)}` : rupees(value)}</td>
            </tr>
          ))}
          <tr style={{ fontWeight: 850, background: loss ? '#fef2f2' : '#f0fdf4' }}>
            <td>{loss ? 'Net loss' : 'Net profit'}</td>
            <td style={{ color: loss ? '#b91c1c' : '#047857' }}>
              {loss ? `−${rupees(-calculation.netProfit)}` : rupees(calculation.netProfit)}
            </td>
          </tr>
        </tbody>
      </table>
    </section>
  );
}

export function SellerWhereMoneyGoesCard({ state }: { state: SellerProfitabilityState }) {
  const { sellingPrice, productCost, calculation: c } = state;
  const sp = Math.max(1, sellingPrice);
  const pct = (v: number) => Math.min(100, Math.max(0, Math.round((v / sp) * 100)));
  const gst = c.netBaseRevenue < sellingPrice ? c.outputGst : 0;
  const fees = c.totalMarketplaceFees + c.marketplaceFeeGst;
  const prodPct = pct(productCost);
  const feePct = pct(fees);
  const gstPct = pct(gst);
  const otherPct = pct(c.totalExpenses - productCost - fees);
  const profitPct = pct(c.netProfit);

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
        {gstPct > 0 ? <span style={{ width: `${gstPct}%`, background: '#94a3b8' }} /> : null}
        <span style={{ width: `${profitPct}%`, background: '#18b86b' }} />
      </div>

      <div class={styles.legend}>
        <span>🔵 Product {prodPct}%</span>
        <span>🟠 Other {otherPct}%</span>
        <span>🟣 Fees {feePct}%</span>
        {gstPct > 0 ? <span>⚪ GST {gstPct}%</span> : null}
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
