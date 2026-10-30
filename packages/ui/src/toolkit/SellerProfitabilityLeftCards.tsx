import styles from './businessStudio.module.css';
import type { SellerProfitabilityState } from './useSellerProfitability.ts';

function SellerPriceCostFields({ state }: { state: SellerProfitabilityState }) {
  const {
    sellingPrice,
    setSellingPrice,
    productCost,
    setProductCost,
    packagingCost,
    setPackagingCost,
    shippingCost,
    setShippingCost,
  } = state;

  return (
    <>
      <div class={styles.fieldGrid2}>
        <div class={styles.fieldGroup}>
          <label class={styles.fieldLabel} for="seller-sp">
            Selling price (₹)
          </label>
          <input
            id="seller-sp"
            type="number"
            class={styles.fieldInput}
            value={sellingPrice}
            onInput={(e) => setSellingPrice(Number((e.target as HTMLInputElement).value) || 0)}
          />
        </div>
        <div class={styles.fieldGroup}>
          <label class={styles.fieldLabel} for="seller-cost">
            Product cost (₹)
          </label>
          <input
            id="seller-cost"
            type="number"
            class={styles.fieldInput}
            value={productCost}
            onInput={(e) => setProductCost(Number((e.target as HTMLInputElement).value) || 0)}
          />
        </div>
      </div>

      <div class={styles.fieldGrid2}>
        <div class={styles.fieldGroup}>
          <label class={styles.fieldLabel} for="seller-pack">
            Packaging (₹)
          </label>
          <input
            id="seller-pack"
            type="number"
            class={styles.fieldInput}
            value={packagingCost}
            onInput={(e) => setPackagingCost(Number((e.target as HTMLInputElement).value) || 0)}
          />
        </div>
        <div class={styles.fieldGroup}>
          <label class={styles.fieldLabel} for="seller-ship">
            Shipping (₹)
          </label>
          <input
            id="seller-ship"
            type="number"
            class={styles.fieldInput}
            value={shippingCost}
            onInput={(e) => setShippingCost(Number((e.target as HTMLInputElement).value) || 0)}
          />
        </div>
      </div>
    </>
  );
}

function SellerMarketplaceFeeFields({ state }: { state: SellerProfitabilityState }) {
  const {
    commissionPercent,
    setCommissionPercent,
    adCost,
    setAdCost,
    otherCharges,
    setOtherCharges,
    monthlyQty,
    setMonthlyQty,
  } = state;

  return (
    <>
      <div class={styles.cardHeading}>
        <span class={`${styles.cardIcon} ${styles.iconBlue}`}>⚙</span>
        <span>Marketplace Fees & Ads</span>
      </div>

      <div class={styles.fieldGrid3}>
        <div class={styles.fieldGroup}>
          <label class={styles.fieldLabel} for="seller-comm">
            Commission (%)
          </label>
          <input
            id="seller-comm"
            type="number"
            class={styles.fieldInput}
            value={commissionPercent}
            onInput={(e) => setCommissionPercent(Number((e.target as HTMLInputElement).value) || 0)}
          />
        </div>
        <div class={styles.fieldGroup}>
          <label class={styles.fieldLabel} for="seller-ads">
            Ads / order (₹)
          </label>
          <input
            id="seller-ads"
            type="number"
            class={styles.fieldInput}
            value={adCost}
            onInput={(e) => setAdCost(Number((e.target as HTMLInputElement).value) || 0)}
          />
        </div>
        <div class={styles.fieldGroup}>
          <label class={styles.fieldLabel} for="seller-other">
            Other (₹)
          </label>
          <input
            id="seller-other"
            type="number"
            class={styles.fieldInput}
            value={otherCharges}
            onInput={(e) => setOtherCharges(Number((e.target as HTMLInputElement).value) || 0)}
          />
        </div>
      </div>

      <div class={styles.fieldGroup}>
        <label class={styles.fieldLabel} for="seller-qty">
          Quantity / month (for monthly projections)
        </label>
        <input
          id="seller-qty"
          type="number"
          class={styles.fieldInput}
          value={monthlyQty}
          onInput={(e) => setMonthlyQty(Number((e.target as HTMLInputElement).value) || 1)}
        />
      </div>
    </>
  );
}

export function SellerProfitabilityInputsCard({ state }: { state: SellerProfitabilityState }) {
  const { mode, setMode } = state;

  return (
    <section class={`${styles.businessCard} ${styles.card1Inputs}`} aria-label="Inputs and Options">
      <div class={styles.cardHeading}>
        <span class={`${styles.cardIcon} ${styles.iconViolet}`}>▤</span>
        <span>Selling Price & Costs</span>
      </div>

      <div class={styles.modeTabs}>
        <button
          type="button"
          class={styles.modeTab}
          data-active={mode === 'single'}
          onClick={() => setMode('single')}
        >
          Single product
        </button>
        <button
          type="button"
          class={styles.modeTab}
          data-active={mode === 'compare'}
          onClick={() => setMode('compare')}
        >
          Compare
        </button>
        <button
          type="button"
          class={styles.modeTab}
          data-active={mode === 'targets'}
          onClick={() => setMode('targets')}
        >
          Targets
        </button>
      </div>

      <SellerPriceCostFields state={state} />
      <hr class={styles.divider} />
      <SellerMarketplaceFeeFields state={state} />
    </section>
  );
}

export function SellerProfitabilityAdvancedCard({ state }: { state: SellerProfitabilityState }) {
  const {
    showAdvanced,
    setShowAdvanced,
    returnRate,
    setReturnRate,
    reverseShipping,
    setReverseShipping,
    targetMargin,
    setTargetMargin,
    calculation,
  } = state;

  return (
    <section
      class={`${styles.businessCard} ${styles.cardAdvanced}`}
      aria-label="Advanced Options and RTO"
    >
      <div class={styles.cardHeading}>
        <span class={`${styles.cardIcon} ${styles.iconPink}`}>↶</span>
        <span>Break-even & RTO (Advanced)</span>
      </div>

      <div style={{ fontSize: '11px', color: '#64748b', lineHeight: '1.4' }}>
        Returns, reverse shipping and commission directly impact your realized margin.
      </div>

      <button
        type="button"
        class={styles.ghostActionBtn}
        style={{ width: '100%' }}
        onClick={() => setShowAdvanced(!showAdvanced)}
      >
        <span>{showAdvanced ? 'Hide advanced settings ▲' : 'Edit advanced assumptions ▼'}</span>
      </button>

      {showAdvanced && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
          <div class={styles.fieldGrid2}>
            <div class={styles.fieldGroup}>
              <label class={styles.fieldLabel} for="seller-ret-rate">
                Return rate (%)
              </label>
              <input
                id="seller-ret-rate"
                type="number"
                class={styles.fieldInput}
                value={returnRate}
                onInput={(e) => setReturnRate(Number((e.target as HTMLInputElement).value) || 0)}
              />
            </div>
            <div class={styles.fieldGroup}>
              <label class={styles.fieldLabel} for="seller-rev-ship">
                Reverse shipping (₹)
              </label>
              <input
                id="seller-rev-ship"
                type="number"
                class={styles.fieldInput}
                value={reverseShipping}
                onInput={(e) =>
                  setReverseShipping(Number((e.target as HTMLInputElement).value) || 0)
                }
              />
            </div>
          </div>

          <div class={styles.fieldGroup}>
            <label class={styles.fieldLabel} for="seller-target-margin">
              Desired target margin (%)
            </label>
            <input
              id="seller-target-margin"
              type="number"
              class={styles.fieldInput}
              value={targetMargin}
              onInput={(e) => setTargetMargin(Number((e.target as HTMLInputElement).value) || 0)}
            />
          </div>

          <div class={styles.warnBox}>
            Break-even price: <strong>₹{calculation.breakEvenPrice.toFixed(2)}</strong> (below which
            this order loses money).
          </div>
        </div>
      )}
    </section>
  );
}
