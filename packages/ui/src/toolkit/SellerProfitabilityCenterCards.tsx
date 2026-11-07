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

      <div
        class={`${styles.headlineResult} ${!isProfit ? styles.headlineResultLoss : ''}`}
        data-primary-result=""
      >
        <small>{isProfit ? 'Net Profit per Order' : 'Net Loss per Order'}</small>
        <strong>
          <output>
            {isProfit ? '' : '−'}₹
            {Math.abs(calculation.netProfit).toLocaleString('en-IN', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </output>
        </strong>
      </div>

      <div class={styles.metrics}>
        <div class={styles.metric}>
          <span class={`${styles.ico} ${styles.icoGreen}`}>％</span>
          <div class={styles.metricTextGroup}>
            <small>Net margin</small>
            <strong style={{ color: isProfit ? 'var(--color-success)' : 'var(--color-danger)' }}>
              {calculation.netMargin}%
            </strong>
          </div>
        </div>

        <div class={styles.metric}>
          <span class={`${styles.ico} ${styles.icoViolet}`}>↗</span>
          <div class={styles.metricTextGroup}>
            <small>Markup on cost</small>
            <strong>
              {calculation.markupOnCost === null ? '—' : `${calculation.markupOnCost}%`}
            </strong>
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

const rupees = (v: number) =>
  `₹${v.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** Every line the engine adds into total costs, so the table adds up to the profit it shows. */
function breakdownRows(state: SellerProfitabilityState): [string, number][] {
  const c = state.calculation;
  const rows: [string, number][] = [['Selling price', state.sellingPrice]];
  if (c.outputGst > 0) rows.push(['GST inside the price (paid to govt)', -c.outputGst]);
  rows.push(['Product cost', -state.productCost]);
  rows.push(['Packaging, shipping, warehousing, labour, overhead', -c.directFulfillment]);
  rows.push(['Commission + closing fee', -c.totalMarketplaceFees]);
  if (c.marketplaceFeeGst > 0) rows.push(['GST on marketplace fees', -c.marketplaceFeeGst]);
  rows.push(['Ads + other', -c.otherCosts]);
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
              <td>{value < 0 ? `−${rupees(-value)}` : rupees(Math.abs(value))}</td>
            </tr>
          ))}
          <tr
            style={{
              fontWeight: 850,
              background: loss ? 'var(--color-tint-red)' : 'var(--color-tint-green)',
            }}
          >
            <td>{loss ? 'Net loss' : 'Net profit'}</td>
            <td style={{ color: loss ? 'var(--color-danger)' : 'var(--color-success)' }}>
              {loss ? `−${rupees(-calculation.netProfit)}` : rupees(calculation.netProfit)}
            </td>
          </tr>
        </tbody>
      </table>
    </section>
  );
}

export function SellerWhereMoneyGoesCard({ state }: { state: SellerProfitabilityState }) {
  const c = state.calculation;
  // Shares of the selling price come from the engine; a loss shows as 0% profit in the bar.
  const pct = (v: number) => Math.min(100, Math.max(0, Math.round(v)));
  const prodPct = pct(c.costPct);
  const feePct = pct(c.feesPct);
  const gstPct = pct(c.gstPct);
  const otherPct = pct(c.fulfillmentPct + c.otherPct);
  const profitPct = pct(c.profitPct);

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
