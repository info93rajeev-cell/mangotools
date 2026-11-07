import { inr, pct } from './businessFormat.ts';
import styles from './businessStudio.module.css';
import type { AmazonFeeEstimatorState, AmazonResult } from './useAmazonFeeEstimator.ts';

const isLoss = (r: AmazonResult | null) => Boolean(r?.economicProfit.startsWith('-'));

function Metric(props: {
  ico: string;
  tone: string;
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div class={styles.metric}>
      <span class={`${styles.ico} ${props.tone}`}>{props.ico}</span>
      <div class={styles.metricTextGroup}>
        <small>{props.label}</small>
        <strong style={props.color ? { color: props.color } : undefined}>{props.value}</strong>
      </div>
    </div>
  );
}

function SummaryMetrics({ r }: { r: AmazonResult }) {
  return (
    <div class={styles.metrics}>
      <Metric
        ico="％"
        tone={styles.icoGreen}
        label="Profit margin"
        value={pct(r.profitMarginPercent)}
        color={isLoss(r) ? 'var(--color-danger)' : 'var(--color-success)'}
      />
      <Metric
        ico="₹"
        tone={styles.icoBlue}
        label="Bank settlement"
        value={inr(r.estimatedSettlement)}
      />
      <Metric
        ico="▣"
        tone={styles.icoViolet}
        label="Amazon fees"
        value={inr(r.marketplaceFeesTotal)}
      />
      <Metric
        ico="⚖"
        tone={styles.icoAmber}
        label="Break-even price"
        value={inr(r.breakEvenSellingPrice)}
      />
    </div>
  );
}

function SummaryBody({ state }: { state: AmazonFeeEstimatorState }) {
  const r = state.result;
  const loss = isLoss(r);
  return (
    <>
      <div
        class={`${styles.headlineResult} ${loss ? styles.headlineResultLoss : ''}`}
        data-primary-result=""
      >
        <small>{loss ? 'Estimated loss per sale' : 'Estimated profit per sale'}</small>
        <strong>
          <output>{r ? inr(r.economicProfit) : '…'}</output>
        </strong>
      </div>
      {r ? <SummaryMetrics r={r} /> : null}
      {r && state.monthlyProfit !== null ? (
        <div class={styles.strip} style={{ marginTop: '8px' }}>
          <span>
            {loss ? 'Loss' : 'Profit'} on {state.monthlyQty} sales / month
          </span>
          <b>{inr(state.monthlyProfit)}</b>
        </div>
      ) : null}
    </>
  );
}

export function AmazonFeeResultsSummaryCard({ state }: { state: AmazonFeeEstimatorState }) {
  return (
    <section class={styles.card} aria-label="Profit and Settlement Estimate" aria-live="polite">
      <div class={styles.heading}>
        <span class={`${styles.ico} ${styles.icoGreen}`}>✓</span>
        <span>Profit & Settlement Estimate</span>
      </div>
      {state.error ? (
        <div class={styles.note} role="alert">
          {state.error}
        </div>
      ) : (
        <SummaryBody state={state} />
      )}
    </section>
  );
}

function Row(props: { label: string; value: string; sign?: '−' | ''; muted?: boolean }) {
  return (
    <tr>
      <td>{props.label}</td>
      <td class={props.muted ? styles.tdMuted : undefined}>
        {props.sign ?? ''}
        {inr(props.value)}
      </td>
    </tr>
  );
}

/** Profit lines, then the cash settlement lines, all from the engine. */
export function AmazonFeeStatementCard({ state }: { state: AmazonFeeEstimatorState }) {
  const r = state.result;
  if (!r) return null;
  const recoverable = r.recoverableMarketplaceFeeGst !== '0.00';
  return (
    <section class={styles.card} aria-label="Itemized Profit Statement">
      <div class={styles.heading}>
        <span class={`${styles.ico} ${styles.icoViolet}`}>▥</span>
        <span>Itemized Profit Statement</span>
      </div>
      <table class={styles.smallTable} aria-label="Statement Table">
        <thead>
          <tr>
            <th>Profit per sale</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          <Row label="Selling price" value={r.grossCustomerValue} />
          {r.orderProductGstAmount !== '0.00' ? (
            <Row
              label="GST inside the price (paid to govt)"
              value={r.orderProductGstAmount}
              sign="−"
              muted
            />
          ) : null}
          <Row label="Product cost" value={r.productCostRecognised} sign="−" muted />
          <Row
            label="Packaging, ads and returns"
            value={r.sellerControlledCostsTotal}
            sign="−"
            muted
          />
          <Row label="Amazon fees" value={r.marketplaceFeesTotal} sign="−" muted />
          {r.nonRecoverableMarketplaceFeeGst !== '0.00' ? (
            <Row
              label="GST on fees (not claimed)"
              value={r.nonRecoverableMarketplaceFeeGst}
              sign="−"
              muted
            />
          ) : null}
          <tr class={styles.totalRow}>
            <td>Net profit</td>
            <td class={isLoss(r) ? styles.tdLoss : styles.tdGain}>{inr(r.economicProfit)}</td>
          </tr>
        </tbody>
      </table>
      <table class={styles.smallTable} aria-label="Settlement Table" style={{ marginTop: '10px' }}>
        <thead>
          <tr>
            <th>Bank settlement</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          <Row label="Selling price" value={r.grossCustomerValue} />
          <Row label="Amazon fees" value={r.marketplaceFeesTotal} sign="−" muted />
          <Row
            label={recoverable ? 'GST on fees (claim back as ITC)' : 'GST on fees'}
            value={r.marketplaceFeeGstTotal}
            sign="−"
            muted
          />
          <Row label="TCS 0.5% (GST)" value={r.tcsAmount} sign="−" muted />
          <Row label="TDS 0.1% (income tax)" value={r.tdsAmount} sign="−" muted />
          <tr style={{ fontWeight: 850 }}>
            <td>Estimated settlement</td>
            <td>{inr(r.estimatedSettlement)}</td>
          </tr>
        </tbody>
      </table>
    </section>
  );
}

/** Bar widths only: each engine amount as a share of the selling price. */
export function AmazonFeeVisualCard({ state }: { state: AmazonFeeEstimatorState }) {
  const r = state.result;
  if (!r) return null;
  const price = Number(r.grossCustomerValue) || 1;
  const parts = [
    ['Product', r.productCostRecognised, '#3081ee'],
    ['Amazon fees', r.marketplaceFeesTotal, '#ae62e5'],
    ['Other costs', r.sellerControlledCostsTotal, '#f9b52c'],
    ['GST', r.orderProductGstAmount, '#94a3b8'],
    ['Profit', r.economicProfit, '#18b86a'],
  ].map(([label, v, color]) => ({
    label,
    color,
    share: Math.max(0, (Number(v) / price) * 100),
  }));
  return (
    <section class={styles.card} aria-label="Revenue Allocation">
      <div class={styles.heading}>
        <span class={`${styles.ico} ${styles.icoPink}`}>◔</span>
        <span>Where the selling price goes</span>
      </div>
      <div class={styles.bar}>
        {parts.map((p) => (
          <span key={p.label} style={{ width: `${p.share}%`, background: p.color }} />
        ))}
      </div>
      <div class={styles.legend}>
        {parts.map((p) => (
          <span key={p.label}>
            <i class={styles.dot} style={{ background: p.color }} />
            {p.label} {p.share.toFixed(1)}%
          </span>
        ))}
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
