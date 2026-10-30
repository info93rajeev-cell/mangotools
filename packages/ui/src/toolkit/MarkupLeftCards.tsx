import styles from './businessStudio.module.css';
import type { MarkupCalculatorState } from './useMarkupCalculator.ts';

function MarkupModeFieldFindPrice({ state }: { state: MarkupCalculatorState }) {
  const { markupPercent, setMarkupPercent, quantity, setQuantity } = state;
  return (
    <div class={styles.fieldGrid2}>
      <div class={styles.fieldGroup}>
        <label class={styles.fieldLabel} for="markup-pct">
          Desired markup (%)
        </label>
        <input
          id="markup-pct"
          type="number"
          class={styles.fieldInput}
          value={markupPercent}
          onInput={(e) => setMarkupPercent(Number((e.target as HTMLInputElement).value) || 0)}
        />
      </div>
      <div class={styles.fieldGroup}>
        <label class={styles.fieldLabel} for="markup-qty">
          Quantity (units)
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
  );
}

function MarkupModeFieldFindMarkup({ state }: { state: MarkupCalculatorState }) {
  const { givenSellingPrice, setGivenSellingPrice, quantity, setQuantity } = state;
  return (
    <div class={styles.fieldGrid2}>
      <div class={styles.fieldGroup}>
        <label class={styles.fieldLabel} for="markup-sp">
          Selling price (₹)
        </label>
        <input
          id="markup-sp"
          type="number"
          class={styles.fieldInput}
          value={givenSellingPrice}
          onInput={(e) => setGivenSellingPrice(Number((e.target as HTMLInputElement).value) || 0)}
        />
      </div>
      <div class={styles.fieldGroup}>
        <label class={styles.fieldLabel} for="markup-qty-2">
          Quantity (units)
        </label>
        <input
          id="markup-qty-2"
          type="number"
          class={styles.fieldInput}
          value={quantity}
          onInput={(e) => setQuantity(Number((e.target as HTMLInputElement).value) || 1)}
        />
      </div>
    </div>
  );
}

function MarkupModeFieldTargetMargin({ state }: { state: MarkupCalculatorState }) {
  const { targetMarginPercent, setTargetMarginPercent, quantity, setQuantity } = state;
  return (
    <div class={styles.fieldGrid2}>
      <div class={styles.fieldGroup}>
        <label class={styles.fieldLabel} for="markup-target-margin">
          Target margin (%)
        </label>
        <input
          id="markup-target-margin"
          type="number"
          class={styles.fieldInput}
          value={targetMarginPercent}
          onInput={(e) => setTargetMarginPercent(Number((e.target as HTMLInputElement).value) || 0)}
        />
      </div>
      <div class={styles.fieldGroup}>
        <label class={styles.fieldLabel} for="markup-qty-3">
          Quantity (units)
        </label>
        <input
          id="markup-qty-3"
          type="number"
          class={styles.fieldInput}
          value={quantity}
          onInput={(e) => setQuantity(Number((e.target as HTMLInputElement).value) || 1)}
        />
      </div>
    </div>
  );
}

export function MarkupInputsCard({ state }: { state: MarkupCalculatorState }) {
  const { pricingMode, setPricingMode, costPrice, setCostPrice } = state;

  return (
    <section class={`${styles.businessCard} ${styles.card1Inputs}`} aria-label="Pricing Mode">
      <div class={styles.cardHeading}>
        <span class={`${styles.cardIcon} ${styles.iconViolet}`}>↗</span>
        <span>Pricing Mode</span>
      </div>

      <div class={styles.modeTabs}>
        <button
          type="button"
          class={styles.modeTab}
          data-active={pricingMode === 'find_price'}
          onClick={() => setPricingMode('find_price')}
        >
          Find selling price
        </button>
        <button
          type="button"
          class={styles.modeTab}
          data-active={pricingMode === 'find_markup'}
          onClick={() => setPricingMode('find_markup')}
        >
          Markup %
        </button>
        <button
          type="button"
          class={styles.modeTab}
          data-active={pricingMode === 'target_margin'}
          onClick={() => setPricingMode('target_margin')}
        >
          Target margin
        </button>
      </div>

      <div class={styles.fieldGroup}>
        <label class={styles.fieldLabel} for="markup-cost">
          Product cost (₹)
        </label>
        <input
          id="markup-cost"
          type="number"
          class={styles.fieldInput}
          value={costPrice}
          onInput={(e) => setCostPrice(Number((e.target as HTMLInputElement).value) || 0)}
        />
      </div>

      {pricingMode === 'find_price' && <MarkupModeFieldFindPrice state={state} />}
      {pricingMode === 'find_markup' && <MarkupModeFieldFindMarkup state={state} />}
      {pricingMode === 'target_margin' && <MarkupModeFieldTargetMargin state={state} />}
    </section>
  );
}

export function MarkupOptionalAdditionsCard({ state }: { state: MarkupCalculatorState }) {
  const { additionalCost, setAdditionalCost } = state;

  return (
    <section
      class={`${styles.businessCard} ${styles.cardAdvanced}`}
      aria-label="Optional Price Additions"
    >
      <div class={styles.cardHeading}>
        <span class={`${styles.cardIcon} ${styles.iconBlue}`}>⚙</span>
        <span>Optional Price Additions</span>
      </div>

      <div class={styles.fieldGroup}>
        <label class={styles.fieldLabel} for="markup-add-cost">
          Additional cost (packaging, handling ₹)
        </label>
        <input
          id="markup-add-cost"
          type="number"
          class={styles.fieldInput}
          value={additionalCost}
          onInput={(e) => setAdditionalCost(Number((e.target as HTMLInputElement).value) || 0)}
        />
      </div>

      <div class={styles.noteBox}>
        Margin and markup are computed on comparable tax-exclusive values. Add GST after deriving
        your base selling price.
      </div>
    </section>
  );
}
