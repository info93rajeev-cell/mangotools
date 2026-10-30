import styles from './businessStudio.module.css';
import type { MarkupCalculatorState } from './useMarkupCalculator.ts';

export function MarkupPricingResultCard({ state }: { state: MarkupCalculatorState }) {
  const { markupPercent, quantity, calculation } = state;

  return (
    <section class={styles.card} aria-label="Pricing Result">
      <div class={styles.heading}>
        <span class={`${styles.ico} ${styles.icoGreen}`}>✓</span>
        <span>Pricing Result</span>
      </div>

      <div class={styles.headlineResult}>
        <small>Recommended Selling Price</small>
        <strong>
          ₹{' '}
          {calculation.sellingPrice.toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </strong>
      </div>

      <div class={styles.metrics}>
        <div class={styles.metric}>
          <span class={`${styles.ico} ${styles.icoViolet}`}>↗</span>
          <div class={styles.metricTextGroup}>
            <small>Markup</small>
            <strong>{markupPercent.toFixed(1)}%</strong>
          </div>
        </div>

        <div class={styles.metric}>
          <span class={`${styles.ico} ${styles.icoGreen}`}>◔</span>
          <div class={styles.metricTextGroup}>
            <small>Gross margin</small>
            <strong style={{ color: '#059669' }}>{calculation.grossMargin.toFixed(2)}%</strong>
          </div>
        </div>

        <div class={styles.metric}>
          <span class={`${styles.ico} ${styles.icoAmber}`}>₹</span>
          <div class={styles.metricTextGroup}>
            <small>Profit per unit</small>
            <strong>
              ₹{calculation.profitPerUnit.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </strong>
          </div>
        </div>

        <div class={styles.metric}>
          <span class={`${styles.ico} ${styles.icoCyan}`}>▦</span>
          <div class={styles.metricTextGroup}>
            <small>Profit on {quantity} units</small>
            <strong>
              ₹{calculation.profitOnQuantity.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </strong>
          </div>
        </div>
      </div>
    </section>
  );
}

export function MarkupFormulaWorkingCard({ state }: { state: MarkupCalculatorState }) {
  const { costPrice, markupPercent, calculation } = state;
  const factor = (1 + markupPercent / 100).toFixed(2);

  return (
    <section class={styles.card} aria-label="Formula and Working">
      <div class={styles.heading}>
        <span class={`${styles.ico} ${styles.icoViolet}`}>𝑓</span>
        <span>Formula & Working</span>
      </div>

      <div class={styles.note}>
        Selling price = Cost × (1 + Markup ÷ 100)
        <br />
        <b>
          ₹{costPrice} × {factor} = ₹{calculation.sellingPrice.toFixed(2)}
        </b>
        <br />
        Margin = (₹{calculation.sellingPrice.toFixed(0)} − ₹{costPrice}) ÷ ₹
        {calculation.sellingPrice.toFixed(0)} × 100 = {calculation.grossMargin}%
      </div>
    </section>
  );
}

export function MarkupPriceCompositionCard({ state }: { state: MarkupCalculatorState }) {
  const { calculation } = state;
  const { costPct, profitPct } = calculation;

  return (
    <section class={styles.card} aria-label="Price Composition">
      <div class={styles.heading}>
        <span class={`${styles.ico} ${styles.icoPink}`}>◔</span>
        <span>Price Composition</span>
      </div>

      <div class={styles.bar}>
        <span style={{ width: `${costPct}%`, background: '#2680ed' }} />
        <span style={{ width: `${profitPct}%`, background: '#17b66b' }} />
      </div>

      <div class={styles.legend}>
        <span>
          <i class={styles.dot} style={{ background: '#2680ed' }} />
          Cost {costPct}%
        </span>
        <span>
          <i class={styles.dot} style={{ background: '#17b66b' }} />
          Gross profit {profitPct}%
        </span>
      </div>
    </section>
  );
}

export function MarkupCenterCards({ state }: { state: MarkupCalculatorState }) {
  return (
    <div class={styles.stack}>
      <MarkupPricingResultCard state={state} />
      <MarkupFormulaWorkingCard state={state} />
      <MarkupPriceCompositionCard state={state} />
    </div>
  );
}

export const MarkupResultsSummaryCard = MarkupPricingResultCard;
export const MarkupFinancialDetailsCard = MarkupFormulaWorkingCard;
export const MarkupVisualCard = MarkupPriceCompositionCard;
