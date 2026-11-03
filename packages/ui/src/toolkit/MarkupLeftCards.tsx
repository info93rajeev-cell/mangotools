import { inr } from './businessFormat.ts';
import styles from './businessStudio.module.css';
import type { MarkupCalculatorState, MarkupPricingMode } from './useMarkupCalculator.ts';

const MODES: [MarkupPricingMode, string][] = [
  ['find_price', 'Find selling price'],
  ['find_markup', 'Find markup %'],
  ['target_margin', 'Target margin'],
];

const num = (e: Event) => Number((e.target as HTMLInputElement).value) || 0;

/** The second input changes with the mode: markup %, a selling price, or a target margin %. */
function ModeValueField({ state }: { state: MarkupCalculatorState }) {
  if (state.pricingMode === 'find_markup') {
    return (
      <div class={styles.field}>
        <label class={styles.label} for="markup-mode-price">
          Selling price (₹)
        </label>
        <input
          id="markup-mode-price"
          type="number"
          inputMode="decimal"
          class={styles.fieldInput}
          value={state.givenSellingPrice}
          onInput={(e) => state.setGivenSellingPrice(num(e))}
        />
      </div>
    );
  }
  if (state.pricingMode === 'target_margin') {
    return (
      <div class={styles.field}>
        <label class={styles.label} for="markup-mode-margin">
          Target margin (%)
        </label>
        <input
          id="markup-mode-margin"
          type="number"
          inputMode="decimal"
          class={styles.fieldInput}
          value={state.targetMarginPercent}
          onInput={(e) => state.setTargetMarginPercent(num(e))}
        />
      </div>
    );
  }
  return (
    <div class={styles.field}>
      <label class={styles.label} for="markup-desired-pct">
        Desired markup (%)
      </label>
      <input
        id="markup-desired-pct"
        type="number"
        inputMode="decimal"
        class={styles.fieldInput}
        value={state.markupPercent}
        onInput={(e) => state.setMarkupPercent(num(e))}
      />
    </div>
  );
}

const showResult = () =>
  document
    .querySelector('[aria-label="Pricing Result"]')
    ?.scrollIntoView({ behavior: 'smooth', block: 'start' });

export function MarkupPricingModeCard({ state }: { state: MarkupCalculatorState }) {
  const { pricingMode, setPricingMode, costPrice, setCostPrice, quantity, setQuantity } = state;

  return (
    <section class={styles.card} aria-label="Pricing Mode">
      <div class={styles.heading}>
        <span class={`${styles.ico} ${styles.icoViolet}`}>↗</span>
        <span>Pricing Mode</span>
      </div>

      <div class={styles.tabs} role="tablist" aria-label="Pricing Mode Tabs">
        {MODES.map(([m, label]) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={pricingMode === m}
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
          inputMode="decimal"
          class={styles.fieldInput}
          value={costPrice}
          onInput={(e) => setCostPrice(num(e))}
        />
      </div>

      <div class={styles.grid2} style={{ marginTop: '9px' }}>
        <ModeValueField state={state} />
        <div class={styles.field}>
          <label class={styles.label} for="markup-qty">
            Quantity
          </label>
          <input
            id="markup-qty"
            type="number"
            inputMode="numeric"
            class={styles.fieldInput}
            value={quantity}
            onInput={(e) => setQuantity(num(e) || 1)}
          />
        </div>
      </div>

      <button type="button" class={styles.btn} style={{ marginTop: '13px' }} onClick={showResult}>
        <span>▦ {MODES.find(([m]) => m === pricingMode)?.[1] ?? 'Calculate'}</span>
      </button>
    </section>
  );
}

export function MarkupOptionalAdditionsCard({ state }: { state: MarkupCalculatorState }) {
  const { additionalCost, setAdditionalCost, gstPercent, setGstPercent, result } = state;

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
            inputMode="decimal"
            value={additionalCost}
            onInput={(e) => setAdditionalCost(num(e))}
          />
        </div>
        <div class={styles.field}>
          <label class={styles.label} for="markup-gst-pricing">
            GST after pricing
          </label>
          <select
            id="markup-gst-pricing"
            class={styles.fieldInput}
            value={String(gstPercent)}
            onChange={(e) => setGstPercent(Number((e.target as HTMLSelectElement).value))}
          >
            <option value="0">None / 0%</option>
            <option value="5">5% GST</option>
            <option value="18">18% GST (standard)</option>
            <option value="40">40% GST</option>
          </select>
        </div>
      </div>

      {/* Shown right next to the GST choice, so the change is visible where it is made. */}
      {result?.priceWithGst ? (
        <div class={styles.strip} style={{ marginTop: '9px' }} data-markup-gst-price="">
          <span>Customer price with {gstPercent}% GST</span>
          <b>{inr(result.priceWithGst)}</b>
        </div>
      ) : null}

      <div class={styles.note} style={{ marginTop: '9px' }}>
        Margin and markup are on the tax-exclusive price. GST is added on top for the customer
        price.
      </div>
    </section>
  );
}

export function MarkupReverseCalculatorCard({ state }: { state: MarkupCalculatorState }) {
  const { givenSellingPrice, setGivenSellingPrice, costPrice, setCostPrice, setPricingMode } =
    state;

  const handleSolve = () => {
    setPricingMode('find_markup');
    showResult();
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
            inputMode="decimal"
            value={givenSellingPrice}
            onInput={(e) => setGivenSellingPrice(num(e))}
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
            inputMode="decimal"
            value={costPrice}
            onInput={(e) => setCostPrice(num(e))}
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
