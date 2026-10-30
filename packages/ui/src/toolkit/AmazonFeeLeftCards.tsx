import styles from './businessStudio.module.css';
import {
  AMAZON_CATEGORY_PRESETS,
  type AmazonFeeEstimatorState,
  type AmazonShippingZone,
} from './useAmazonFeeEstimator.ts';

function AmazonListingBasicFields({ state }: { state: AmazonFeeEstimatorState }) {
  const {
    sellingPrice,
    setSellingPrice,
    productPackagingCost,
    setProductPackagingCost,
    category,
    setCategory,
    setReferralFee,
  } = state;

  return (
    <>
      <div class={styles.fieldGrid2}>
        <div class={styles.fieldGroup}>
          <label class={styles.fieldLabel} for="amz-sp">
            Selling price (₹)
          </label>
          <input
            id="amz-sp"
            type="number"
            class={styles.fieldInput}
            value={sellingPrice}
            onInput={(e) => {
              const val = Number((e.target as HTMLInputElement).value) || 0;
              setSellingPrice(val);
            }}
          />
        </div>
        <div class={styles.fieldGroup}>
          <label class={styles.fieldLabel} for="amz-cost">
            Product + pack (₹)
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
      </div>

      <div class={styles.fieldGroup}>
        <label class={styles.fieldLabel} for="amz-category">
          Product category
        </label>
        <select
          id="amz-category"
          class={styles.fieldInput}
          value={category}
          onChange={(e) => {
            const catId = (e.target as HTMLSelectElement).value;
            setCategory(catId);
            const found = AMAZON_CATEGORY_PRESETS.find((c) => c.id === catId);
            if (found && found.id !== 'custom') {
              setReferralFee(Math.round((sellingPrice * found.rate) / 100));
            }
          }}
        >
          {AMAZON_CATEGORY_PRESETS.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}

function AmazonShippingWeightFields({ state }: { state: AmazonFeeEstimatorState }) {
  const {
    shippingZone,
    setShippingZone,
    packedWeight,
    setPackedWeight,
    monthlyQty,
    setMonthlyQty,
  } = state;

  return (
    <div class={styles.fieldGrid3}>
      <div class={styles.fieldGroup}>
        <label class={styles.fieldLabel} for="amz-zone">
          Delivery zone
        </label>
        <select
          id="amz-zone"
          class={styles.fieldInput}
          value={shippingZone}
          onChange={(e) =>
            setShippingZone((e.target as HTMLSelectElement).value as AmazonShippingZone)
          }
        >
          <option value="local">Local (City)</option>
          <option value="regional">Regional</option>
          <option value="national">National</option>
        </select>
      </div>
      <div class={styles.fieldGroup}>
        <label class={styles.fieldLabel} for="amz-weight">
          Weight (g)
        </label>
        <input
          id="amz-weight"
          type="number"
          class={styles.fieldInput}
          value={packedWeight}
          onInput={(e) => setPackedWeight(Number((e.target as HTMLInputElement).value) || 0)}
        />
      </div>
      <div class={styles.fieldGroup}>
        <label class={styles.fieldLabel} for="amz-qty">
          Units / mo
        </label>
        <input
          id="amz-qty"
          type="number"
          class={styles.fieldInput}
          value={monthlyQty}
          onInput={(e) => setMonthlyQty(Number((e.target as HTMLInputElement).value) || 1)}
        />
      </div>
    </div>
  );
}

export function AmazonFeeInputsCard({ state }: { state: AmazonFeeEstimatorState }) {
  const { fulfilmentMode, setFulfilmentMode } = state;

  return (
    <section
      class={`${styles.businessCard} ${styles.card1Inputs}`}
      aria-label="Listing and Fulfilment"
    >
      <div class={styles.cardHeading}>
        <span class={`${styles.cardIcon} ${styles.iconViolet}`}>▣</span>
        <span>Listing & Fulfilment Channel</span>
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

      <AmazonListingBasicFields state={state} />
      <AmazonShippingWeightFields state={state} />
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
        <span>Amazon Fees & Operational Costs</span>
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
            Closing + Weight (₹)
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
            18% Fee GST (₹)
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
            Ads & Returns / order (₹)
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

      <div
        style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '6px',
          padding: '6px 8px',
          fontSize: '11px',
          color: '#475569',
          lineHeight: '1.35',
        }}
      >
        💡 <strong>Pro Seller Tip:</strong> GST-registered sellers can claim 100% of the 18% Fee GST
        back as Input Tax Credit (ITC) in GSTR-3B.
      </div>
    </section>
  );
}
