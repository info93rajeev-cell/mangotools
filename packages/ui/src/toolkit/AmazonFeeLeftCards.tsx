import styles from './businessStudio.module.css';
import type { AmazonFeeEstimatorState } from './useAmazonFeeEstimator.ts';

export function AmazonFeeInputsCard({ state }: { state: AmazonFeeEstimatorState }) {
  const {
    fulfilmentMode,
    setFulfilmentMode,
    sellingPrice,
    setSellingPrice,
    productPackagingCost,
    setProductPackagingCost,
    packedWeight,
    setPackedWeight,
    monthlyQty,
    setMonthlyQty,
  } = state;

  return (
    <section
      class={`${styles.businessCard} ${styles.card1Inputs}`}
      aria-label="Listing and Fulfilment"
    >
      <div class={styles.cardHeading}>
        <span class={`${styles.cardIcon} ${styles.iconViolet}`}>▣</span>
        <span>Listing & Fulfilment</span>
      </div>

      <div class={styles.modeTabs}>
        <button
          type="button"
          class={styles.modeTab}
          data-active={fulfilmentMode === 'fba'}
          onClick={() => setFulfilmentMode('fba')}
        >
          FBA
        </button>
        <button
          type="button"
          class={styles.modeTab}
          data-active={fulfilmentMode === 'easy_ship'}
          onClick={() => setFulfilmentMode('easy_ship')}
        >
          Easy Ship
        </button>
        <button
          type="button"
          class={styles.modeTab}
          data-active={fulfilmentMode === 'self_ship'}
          onClick={() => setFulfilmentMode('self_ship')}
        >
          Self Ship
        </button>
      </div>

      <div class={styles.fieldGroup}>
        <label class={styles.fieldLabel} for="amz-sp">
          Selling price (₹)
        </label>
        <input
          id="amz-sp"
          type="number"
          class={styles.fieldInput}
          value={sellingPrice}
          onInput={(e) => setSellingPrice(Number((e.target as HTMLInputElement).value) || 0)}
        />
      </div>

      <div class={styles.fieldGrid2}>
        <div class={styles.fieldGroup}>
          <label class={styles.fieldLabel} for="amz-cost">
            Product + packaging (₹)
          </label>
          <input
            id="amz-cost"
            type="number"
            class={styles.fieldInput}
            value={productPackagingCost}
            onInput={(e) =>
              setProductPackagingCost(Number((e.target as HTMLInputElement).value) || 0)
            }
          />
        </div>
        <div class={styles.fieldGroup}>
          <label class={styles.fieldLabel} for="amz-weight">
            Packed weight (grams)
          </label>
          <input
            id="amz-weight"
            type="number"
            class={styles.fieldInput}
            value={packedWeight}
            onInput={(e) => setPackedWeight(Number((e.target as HTMLInputElement).value) || 0)}
          />
        </div>
      </div>

      <div class={styles.fieldGroup}>
        <label class={styles.fieldLabel} for="amz-qty">
          Estimated units sold / month
        </label>
        <input
          id="amz-qty"
          type="number"
          class={styles.fieldInput}
          value={monthlyQty}
          onInput={(e) => setMonthlyQty(Number((e.target as HTMLInputElement).value) || 1)}
        />
      </div>
    </section>
  );
}

export function AmazonFeeMarketplaceCard({ state }: { state: AmazonFeeEstimatorState }) {
  const {
    referralFee,
    setReferralFee,
    closingHandling,
    setClosingHandling,
    feeGst,
    setFeeGst,
    adsReturns,
    setAdsReturns,
  } = state;

  return (
    <section class={`${styles.businessCard} ${styles.cardAdvanced}`} aria-label="Amazon Fee Inputs">
      <div class={styles.cardHeading}>
        <span class={`${styles.cardIcon} ${styles.iconBlue}`}>⚙</span>
        <span>Manual Amazon Fee Inputs</span>
      </div>

      <div class={styles.fieldGrid2}>
        <div class={styles.fieldGroup}>
          <label class={styles.fieldLabel} for="amz-ref">
            Referral fee (₹)
          </label>
          <input
            id="amz-ref"
            type="number"
            class={styles.fieldInput}
            value={referralFee}
            onInput={(e) => setReferralFee(Number((e.target as HTMLInputElement).value) || 0)}
          />
        </div>
        <div class={styles.fieldGroup}>
          <label class={styles.fieldLabel} for="amz-closing">
            Closing + handling (₹)
          </label>
          <input
            id="amz-closing"
            type="number"
            class={styles.fieldInput}
            value={closingHandling}
            onInput={(e) => setClosingHandling(Number((e.target as HTMLInputElement).value) || 0)}
          />
        </div>
      </div>

      <div class={styles.fieldGrid2}>
        <div class={styles.fieldGroup}>
          <label class={styles.fieldLabel} for="amz-gst">
            GST on fees (₹, 18%)
          </label>
          <input
            id="amz-gst"
            type="number"
            class={styles.fieldInput}
            value={feeGst}
            onInput={(e) => setFeeGst(Number((e.target as HTMLInputElement).value) || 0)}
          />
        </div>
        <div class={styles.fieldGroup}>
          <label class={styles.fieldLabel} for="amz-ads">
            Ads + returns (₹)
          </label>
          <input
            id="amz-ads"
            type="number"
            class={styles.fieldInput}
            value={adsReturns}
            onInput={(e) => setAdsReturns(Number((e.target as HTMLInputElement).value) || 0)}
          />
        </div>
      </div>

      <div class={styles.noteBox}>
        Enter fees from your Amazon Seller Central schedule. All calculations run client-side.
      </div>
    </section>
  );
}
