import styles from './businessStudio.module.css';
import type { MarkupCalculatorState } from './useMarkupCalculator.ts';

function MarkupDynamicModeField({ state }: { state: MarkupCalculatorState }) {
  const {
    pricingMode,
    markupPercent,
    setMarkupPercent,
    givenSellingPrice,
    setGivenSellingPrice,
    targetMarginPercent,
    setTargetMarginPercent,
  } = state;

  if (pricingMode === 'find_price') {
    return (
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
    );
  }

  if (pricingMode === 'find_markup') {
    return (
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
    );
  }

  return (
    <div class={styles.fieldGroup}>
      <label class={styles.fieldLabel} for="markup-target">
        Target margin (%)
      </label>
      <input
        id="markup-target"
        type="number"
        class={styles.fieldInput}
        value={targetMarginPercent}
        onInput={(e) => setTargetMarginPercent(Number((e.target as HTMLInputElement).value) || 0)}
      />
    </div>
  );
}

function MarkupStandardInputs({ state }: { state: MarkupCalculatorState }) {
  const { pricingMode, setPricingMode, costPrice, setCostPrice } = state;

  return (
    <>
      <div class={styles.modeTabs}>
        <button
          type="button"
          class={styles.modeTab}
          data-active={pricingMode === 'find_price'}
          onClick={() => setPricingMode('find_price')}
        >
          Find Price
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
          Target Margin
        </button>
      </div>

      <div class={styles.fieldGrid2}>
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

        <MarkupDynamicModeField state={state} />
      </div>
    </>
  );
}

function StackedDiscountInputs({ state }: { state: MarkupCalculatorState }) {
  const {
    mrp,
    setMrp,
    discount1,
    setDiscount1,
    discount2,
    setDiscount2,
    discount3,
    setDiscount3,
    sellerCostForDiscount,
    setSellerCostForDiscount,
  } = state;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div class={styles.fieldGrid2}>
        <div class={styles.fieldGroup}>
          <label class={styles.fieldLabel} for="stacked-mrp">
            Printed MRP / List Price (₹)
          </label>
          <input
            id="stacked-mrp"
            type="number"
            class={styles.fieldInput}
            value={mrp}
            onInput={(e) => setMrp(Number((e.target as HTMLInputElement).value) || 0)}
          />
        </div>
        <div class={styles.fieldGroup}>
          <label class={styles.fieldLabel} for="stacked-cost">
            Seller product cost (₹)
          </label>
          <input
            id="stacked-cost"
            type="number"
            class={styles.fieldInput}
            value={sellerCostForDiscount}
            onInput={(e) =>
              setSellerCostForDiscount(Number((e.target as HTMLInputElement).value) || 0)
            }
          />
        </div>
      </div>

      <div class={styles.fieldGrid3}>
        <div class={styles.fieldGroup}>
          <label class={styles.fieldLabel} for="stacked-d1">
            1st Discount (%)
          </label>
          <input
            id="stacked-d1"
            type="number"
            class={styles.fieldInput}
            value={discount1}
            onInput={(e) => setDiscount1(Number((e.target as HTMLInputElement).value) || 0)}
          />
        </div>
        <div class={styles.fieldGroup}>
          <label class={styles.fieldLabel} for="stacked-d2">
            2nd Extra (%)
          </label>
          <input
            id="stacked-d2"
            type="number"
            class={styles.fieldInput}
            value={discount2}
            onInput={(e) => setDiscount2(Number((e.target as HTMLInputElement).value) || 0)}
          />
        </div>
        <div class={styles.fieldGroup}>
          <label class={styles.fieldLabel} for="stacked-d3">
            3rd Bank (%)
          </label>
          <input
            id="stacked-d3"
            type="number"
            class={styles.fieldInput}
            value={discount3}
            onInput={(e) => setDiscount3(Number((e.target as HTMLInputElement).value) || 0)}
          />
        </div>
      </div>
    </div>
  );
}

function BogoDealsInputs({ state }: { state: MarkupCalculatorState }) {
  const { bogoBuyQty, setBogoBuyQty, bogoGetQty, setBogoGetQty, bogoItemPrice, setBogoItemPrice } =
    state;

  return (
    <div class={styles.fieldGrid3}>
      <div class={styles.fieldGroup}>
        <label class={styles.fieldLabel} for="bogo-buy">
          Buy quantity
        </label>
        <input
          id="bogo-buy"
          type="number"
          class={styles.fieldInput}
          value={bogoBuyQty}
          onInput={(e) => setBogoBuyQty(Number((e.target as HTMLInputElement).value) || 1)}
        />
      </div>
      <div class={styles.fieldGroup}>
        <label class={styles.fieldLabel} for="bogo-get">
          Get FREE
        </label>
        <input
          id="bogo-get"
          type="number"
          class={styles.fieldInput}
          value={bogoGetQty}
          onInput={(e) => setBogoGetQty(Number((e.target as HTMLInputElement).value) || 0)}
        />
      </div>
      <div class={styles.fieldGroup}>
        <label class={styles.fieldLabel} for="bogo-price">
          Item price (₹)
        </label>
        <input
          id="bogo-price"
          type="number"
          class={styles.fieldInput}
          value={bogoItemPrice}
          onInput={(e) => setBogoItemPrice(Number((e.target as HTMLInputElement).value) || 0)}
        />
      </div>
    </div>
  );
}

function FakeMrpBusterInputs({ state }: { state: MarkupCalculatorState }) {
  const { flashTargetSp, setFlashTargetSp, flashDiscountBanner, setFlashDiscountBanner } = state;

  return (
    <div class={styles.fieldGrid2}>
      <div class={styles.fieldGroup}>
        <label class={styles.fieldLabel} for="fake-target-sp">
          Target selling price (₹)
        </label>
        <input
          id="fake-target-sp"
          type="number"
          class={styles.fieldInput}
          value={flashTargetSp}
          onInput={(e) => setFlashTargetSp(Number((e.target as HTMLInputElement).value) || 0)}
        />
      </div>
      <div class={styles.fieldGroup}>
        <label class={styles.fieldLabel} for="fake-banner-disc">
          Advertised discount (%)
        </label>
        <input
          id="fake-banner-disc"
          type="number"
          class={styles.fieldInput}
          value={flashDiscountBanner}
          onInput={(e) => setFlashDiscountBanner(Number((e.target as HTMLInputElement).value) || 0)}
        />
      </div>
    </div>
  );
}

export function MarkupInputsCard({ state }: { state: MarkupCalculatorState }) {
  const { activeTab, setActiveTab } = state;

  return (
    <section
      class={`${styles.businessCard} ${styles.card1Inputs}`}
      aria-label="Markup and Discounts"
    >
      <div class={styles.cardHeading}>
        <span class={`${styles.cardIcon} ${styles.iconViolet}`}>↗</span>
        <span>Pricing & Discount Studio</span>
      </div>

      <div class={styles.modeTabsRow} role="tablist" aria-label="Calculation Modes">
        <button
          type="button"
          class={styles.modeTab}
          data-active={String(activeTab === 'markup')}
          onClick={() => setActiveTab('markup')}
        >
          🏷️ Markup
        </button>
        <button
          type="button"
          class={styles.modeTab}
          data-active={String(activeTab === 'stacked_discount')}
          onClick={() => setActiveTab('stacked_discount')}
        >
          💥 Stacked Discount
        </button>
        <button
          type="button"
          class={styles.modeTab}
          data-active={String(activeTab === 'bogo_deals')}
          onClick={() => setActiveTab('bogo_deals')}
        >
          🎁 BOGO Deals
        </button>
        <button
          type="button"
          class={styles.modeTab}
          data-active={String(activeTab === 'fake_mrp')}
          onClick={() => setActiveTab('fake_mrp')}
        >
          🎭 Fake MRP
        </button>
      </div>

      {activeTab === 'markup' && <MarkupStandardInputs state={state} />}
      {activeTab === 'stacked_discount' && <StackedDiscountInputs state={state} />}
      {activeTab === 'bogo_deals' && <BogoDealsInputs state={state} />}
      {activeTab === 'fake_mrp' && <FakeMrpBusterInputs state={state} />}
    </section>
  );
}

export function MarkupAdditionsCard({ state }: { state: MarkupCalculatorState }) {
  const { additionalCost, setAdditionalCost, quantity, setQuantity } = state;

  return (
    <section
      class={`${styles.businessCard} ${styles.cardAdvanced}`}
      aria-label="Additions and Packaging"
    >
      <div class={styles.cardHeading}>
        <span class={`${styles.cardIcon} ${styles.iconBlue}`}>+</span>
        <span>Volume & Extra Handling</span>
      </div>

      <div class={styles.fieldGrid2}>
        <div class={styles.fieldGroup}>
          <label class={styles.fieldLabel} for="markup-add">
            Packaging / extras (₹)
          </label>
          <input
            id="markup-add"
            type="number"
            class={styles.fieldInput}
            value={additionalCost}
            onInput={(e) => setAdditionalCost(Number((e.target as HTMLInputElement).value) || 0)}
          />
        </div>
        <div class={styles.fieldGroup}>
          <label class={styles.fieldLabel} for="markup-qty">
            Volume (units)
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
    </section>
  );
}

export const MarkupOptionalAdditionsCard = MarkupAdditionsCard;
