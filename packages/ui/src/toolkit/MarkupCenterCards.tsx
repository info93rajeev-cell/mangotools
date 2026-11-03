import { renderTemplate } from '../format/template.ts';
import { inr, pct } from './businessFormat.ts';
import styles from './businessStudio.module.css';
import { presetCurrency } from './presentation.ts';
import type { MarginResult, MarkupCalculatorState } from './useMarkupCalculator.ts';

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

function ResultMetrics({ r, quantity }: { r: MarginResult; quantity: number }) {
  const loss = Number(r.profit) < 0;
  const tone = loss ? '#dc2626' : '#059669';
  return (
    <div class={styles.metrics}>
      <Metric ico="↗" tone={styles.icoViolet} label="Markup" value={pct(r.markupPercent)} />
      <Metric
        ico="◔"
        tone={styles.icoGreen}
        label="Gross margin"
        value={pct(r.marginPercent)}
        color={tone}
      />
      <Metric
        ico="₹"
        tone={styles.icoAmber}
        label={loss ? 'Loss per unit' : 'Profit per unit'}
        value={inr(r.profit)}
        color={loss ? tone : undefined}
      />
      <Metric
        ico="▦"
        tone={styles.icoCyan}
        label={`${loss ? 'Loss' : 'Profit'} on ${quantity} units`}
        value={inr(r.profitTotal)}
        color={loss ? tone : undefined}
      />
    </div>
  );
}

export function MarkupPricingResultCard({ state }: { state: MarkupCalculatorState }) {
  const { result: r, error, quantity, gstPercent } = state;
  return (
    <section class={styles.card} aria-label="Pricing Result" aria-live="polite">
      <div class={styles.heading}>
        <span class={`${styles.ico} ${styles.icoGreen}`}>✓</span>
        <span>Pricing Result</span>
      </div>
      {error ? (
        <div class={styles.note} role="alert">
          {error}
        </div>
      ) : (
        <>
          <div class={styles.headlineResult} data-primary-result="">
            <small>
              {state.pricingMode === 'find_markup' ? 'Your selling price' : 'Selling price'}
              {gstPercent > 0 ? ' (before GST)' : ''}
            </small>
            <strong>
              <output>{r ? inr(r.price) : '…'}</output>
            </strong>
          </div>
          {r?.priceWithGst ? (
            <div class={styles.strip} style={{ marginTop: '8px' }}>
              <span>Customer price with {gstPercent}% GST</span>
              <b>{inr(r.priceWithGst)}</b>
            </div>
          ) : null}
          {r ? <ResultMetrics r={r} quantity={quantity} /> : null}
        </>
      )}
    </section>
  );
}

/** Each step of the engine's own working, written with the preset's formula text. */
export function MarkupFormulaWorkingCard({ state }: { state: MarkupCalculatorState }) {
  const { result: r, preset } = state;
  const currency = presetCurrency(preset);
  return (
    <section class={styles.card} aria-label="Formula and Working">
      <div class={styles.heading}>
        <span class={`${styles.ico} ${styles.icoViolet}`}>𝑓</span>
        <span>Formula & Working</span>
      </div>
      <ol class={styles.note} style={{ margin: 0, paddingLeft: '18px' }}>
        {(r?.working ?? []).map((step) => {
          const template =
            preset.strings[`work.${step.formulaKey}`] ?? `${step.formulaKey} = {result}`;
          const parts = renderTemplate(
            template,
            { ...step.variables, result: step.result },
            { currency },
          );
          return (
            <li key={`${step.ref}-${step.formulaKey}`}>
              {parts.map((part, i) =>
                part.kind === 'value' ? (
                  <b key={i}>{part.text}</b>
                ) : (
                  <span key={i}>{part.text}</span>
                ),
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export function MarkupPriceCompositionCard({ state }: { state: MarkupCalculatorState }) {
  const margin = Number(state.result?.marginPercent ?? 0);
  // Bar widths only: the shares are the engine's margin and its complement.
  const profitPct = Math.min(100, Math.max(0, margin));
  const costPct = 100 - profitPct;
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
          Cost {costPct.toFixed(2)}%
        </span>
        <span>
          <i class={styles.dot} style={{ background: '#17b66b' }} />
          {margin < 0 ? 'Loss' : 'Gross profit'} {margin.toFixed(2)}%
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
