import styles from './businessStudio.module.css';
import type { UseUniversalTaxReturn } from './useUniversalTax.ts';

export function UniversalTaxResultsCard({ tax }: { tax: UseUniversalTaxReturn }) {
  const { results, priceMode, supplyType, gstRate } = tax;
  const isInclusive = priceMode === 'inclusive';
  const halfRate = (gstRate / 2).toFixed(1).replace(/\.0$/, '');
  const halfTax = results.totalTax / 2;

  return (
    <section class={styles.card} aria-label="GST Results">
      <div class={styles.heading}>
        <span class={`${styles.ico} ${styles.icoGreen}`}>✓</span>
        <span>GST Results</span>
      </div>

      <div class={styles.headlineResult}>
        <small>
          {isInclusive ? 'Taxable Amount (excluding GST)' : 'Grand Total (including GST)'}
        </small>
        <strong>
          ₹{' '}
          {isInclusive
            ? results.taxableAmount.toLocaleString('en-IN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })
            : results.finalAmount.toLocaleString('en-IN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
        </strong>
      </div>

      <div class={styles.metrics}>
        <div class={styles.metric}>
          <span class={`${styles.ico} ${styles.icoCyan}`}>₹</span>
          <div class={styles.metricTextGroup}>
            <small>Taxable Value</small>
            <strong>
              ₹ {results.taxableAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </strong>
          </div>
        </div>

        <div class={styles.metric}>
          <span class={`${styles.ico} ${styles.icoAmber}`}>％</span>
          <div class={styles.metricTextGroup}>
            <small>Total GST</small>
            <strong>
              ₹ {results.totalTax.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </strong>
          </div>
        </div>

        {supplyType === 'intra' ? (
          <>
            <div class={styles.metric}>
              <span class={`${styles.ico} ${styles.icoGreen}`}>↗</span>
              <div class={styles.metricTextGroup}>
                <small>CGST ({halfRate}%)</small>
                <strong>₹ {halfTax.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</strong>
              </div>
            </div>
            <div class={styles.metric}>
              <span class={`${styles.ico} ${styles.icoViolet}`}>↘</span>
              <div class={styles.metricTextGroup}>
                <small>SGST ({halfRate}%)</small>
                <strong>₹ {halfTax.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</strong>
              </div>
            </div>
          </>
        ) : (
          <>
            <div class={styles.metric}>
              <span class={`${styles.ico} ${styles.icoGreen}`}>↗</span>
              <div class={styles.metricTextGroup}>
                <small>IGST ({gstRate}%)</small>
                <strong>
                  ₹ {results.totalTax.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </strong>
              </div>
            </div>
            <div class={styles.metric}>
              <span class={`${styles.ico} ${styles.icoViolet}`}>↘</span>
              <div class={styles.metricTextGroup}>
                <small>Cess / Extras</small>
                <strong>₹ 0</strong>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

export function UniversalTaxBreakdownCard({ tax }: { tax: UseUniversalTaxReturn }) {
  const { results, supplyType, gstRate } = tax;
  const halfRate = (gstRate / 2).toFixed(1).replace(/\.0$/, '');
  const halfTax = results.totalTax / 2;

  return (
    <section class={styles.card} aria-label="Tax Calculation Breakdown">
      <div class={styles.heading}>
        <span class={`${styles.ico} ${styles.icoViolet}`}>≡</span>
        <span>Tax Calculation Breakdown</span>
      </div>

      <table class={styles.smallTable} aria-label="Tax Calculation Table">
        <thead>
          <tr>
            <th>Component</th>
            <th>Amount (₹)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Base amount</td>
            <td>
              {results.taxableAmount.toLocaleString('en-IN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </td>
          </tr>
          {supplyType === 'intra' ? (
            <>
              <tr>
                <td>CGST @ {halfRate}%</td>
                <td>
                  {halfTax.toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
              </tr>
              <tr>
                <td>SGST @ {halfRate}%</td>
                <td>
                  {halfTax.toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
              </tr>
            </>
          ) : (
            <tr>
              <td>IGST @ {gstRate}%</td>
              <td>
                {results.totalTax.toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </td>
            </tr>
          )}
          <tr style={{ fontWeight: 800 }}>
            <td>Grand total</td>
            <td>
              ₹{' '}
              {results.finalAmount.toLocaleString('en-IN', {
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

export function UniversalTaxFormulaCard() {
  return (
    <section class={styles.card} aria-label="Formula and Assumptions">
      <div class={styles.heading}>
        <span class={`${styles.ico} ${styles.icoCyan}`}>𝑓</span>
        <span>Formula & Assumptions</span>
      </div>
      <div class={styles.note}>
        Exclusive GST = Taxable value × rate / 100.
        <br />
        Inclusive taxable value = Total ÷ (1 + rate / 100).
      </div>
    </section>
  );
}

export function UniversalTaxCenterCards({ tax }: { tax: UseUniversalTaxReturn }) {
  return (
    <div class={styles.stack}>
      <UniversalTaxResultsCard tax={tax} />
      <UniversalTaxBreakdownCard tax={tax} />
      <UniversalTaxFormulaCard />
    </div>
  );
}
