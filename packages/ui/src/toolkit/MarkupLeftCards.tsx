import styles from './businessStudio.module.css';
import type { MarkupCalculatorState, MarkupPricingMode } from './useMarkupCalculator.ts';

export function MarkupPricingModeCard({ state }: { state: MarkupCalculatorState }) {
  const {
    pricingMode,
    setPricingMode,
    costPrice,
    setCostPrice,
    markupPercent,
    setMarkupPercent,
    quantity,
    setQuantity,
    copySummary,
  } = state;

  return (
    <section class={styles.card} aria-label="Pricing Mode">
      <div class={styles.heading}>
        <span class={`${styles.ico} ${styles.icoViolet}`}>↗</span>
        <span>Pricing Mode</span>
      </div>

      <div class={styles.tabs} role="tablist" aria-label="Pricing Mode Tabs">
        {(
          [
            ['find_price', 'Find selling price'],
            ['find_markup', 'Find markup %'],
            ['target_margin', 'Target margin'],
          ] as [MarkupPricingMode, string][]
        ).map(([m, label]) => (
          <button
            key={m}
            type="button"
            class={`${styles.tab} ${pricingMode === m ? styles.tabActive : ''}`}
            onClick={() => setPricingMode(m)}
          >
            {label}
          </button>
        ))}
      </div>

      <div class={styles.field}>
        <label class={styles.label} for="markup-cost-price">
          Product cost (₹)
        </label>
        <input
          id="markup-cost-price"
          type="number"
          class={styles.fieldInput}
          value={costPrice}
          onInput={(e) => setCostPrice(Number((e.target as HTMLInputElement).value) || 0)}
        />
      </div>

      <div class={styles.grid2} style={{ marginTop: '9px' }}>
        <div class={styles.field}>
          <label class={styles.label} for="markup-desired-pct">
            Desired markup (%)
          </label>
          <input
            id="markup-desired-pct"
            type="number"
            class={styles.fieldInput}
            value={markupPercent}
            onInput={(e) => setMarkupPercent(Number((e.target as HTMLInputElement).value) || 0)}
          />
        </div>
        <div class={styles.field}>
          <label class={styles.label} for="markup-qty">
            Quantity
          </label>
          <input
            id="markup-qty"
            type="number"
            class={styles.fieldInput}
            value={quantity}
            onInput={(e) => setQuantity(Number((e.target as HTMLInputElement).value) || 1)}
          />
        </div>
      </div>

      <button type="button" class={styles.btn} style={{ marginTop: '13px' }} onClick={copySummary}>
        <span>▦ Calculate Selling Price</span>
      </button>
    </section>
  );
}

export function MarkupOptionalAdditionsCard({ state }: { state: MarkupCalculatorState }) {
  const { additionalCost, setAdditionalCost } = state;

  return (
    <section class={styles.card} aria-label="Optional Price Additions">
      <div class={styles.heading}>
        <span class={`${styles.ico} ${styles.icoBlue}`}>⚙</span>
        <span>Optional Price Additions</span>
      </div>

      <div class={styles.grid2}>
        <div class={styles.field}>
          <label class={styles.label} for="markup-add-cost">
            Additional cost (₹)
          </label>
          <input
            id="markup-add-cost"
            type="number"
            class={styles.fieldInput}
            value={additionalCost}
            onInput={(e) => setAdditionalCost(Number((e.target as HTMLInputElement).value) || 0)}
          />
        </div>
        <div class={styles.field}>
          <label class={styles.label} for="markup-gst-pricing">
            GST after pricing
          </label>
          <select id="markup-gst-pricing" class={styles.fieldInput} defaultValue="18">
            <option value="0">Optional / 0%</option>
            <option value="5">5% GST</option>
            <option value="12">12% GST</option>
            <option value="18">18% Standard</option>
          </select>
        </div>
      </div>

      <div class={styles.note} style={{ marginTop: '9px' }}>
        Margin and markup are calculated on comparable tax-exclusive values.
      </div>
    </section>
  );
}

export function MarkupReverseCalculatorCard({ state }: { state: MarkupCalculatorState }) {
  const { givenSellingPrice, setGivenSellingPrice, setCostPrice, setPricingMode } = state;

  const handleSolve = () => {
    setPricingMode('find_markup');
  };

  return (
    <section class={styles.card} aria-label="Reverse Calculator">
      <div class={styles.heading}>
        <span class={`${styles.ico} ${styles.icoCyan}`}>⇄</span>
        <span>Reverse Calculator</span>
      </div>

      <div class={styles.grid2}>
        <div class={styles.field}>
          <label class={styles.label} for="markup-given-sp">
            Given selling price
          </label>
          <input
            id="markup-given-sp"
            type="number"
            class={styles.fieldInput}
            value={givenSellingPrice}
            onInput={(e) => setGivenSellingPrice(Number((e.target as HTMLInputElement).value) || 0)}
          />
        </div>
        <div class={styles.field}>
          <label class={styles.label} for="markup-given-cost">
            Given cost
          </label>
          <input
            id="markup-given-cost"
            type="number"
            class={styles.fieldInput}
            defaultValue={500}
            onInput={(e) => setCostPrice(Number((e.target as HTMLInputElement).value) || 0)}
          />
        </div>
      </div>

      <button
        type="button"
        class={styles.pill}
        style={{ marginTop: '9px', width: '100%' }}
        onClick={handleSolve}
      >
        <span>Solve for markup & margin</span>
      </button>
    </section>
  );
}

export function MarkupLeftCards({ state }: { state: MarkupCalculatorState }) {
  return (
    <div class={styles.stack}>
      <MarkupPricingModeCard state={state} />
      <MarkupOptionalAdditionsCard state={state} />
      <MarkupReverseCalculatorCard state={state} />
    </div>
  );
}

export const MarkupInputsCard = MarkupPricingModeCard;
