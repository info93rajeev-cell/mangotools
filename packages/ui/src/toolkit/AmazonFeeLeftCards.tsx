import styles from './businessStudio.module.css';
import {
  AMAZON_CATEGORY_PRESETS,
  type AmazonFeeEstimatorState,
  type FulfilmentMode,
} from './useAmazonFeeEstimator.ts';

function AmazonListingGrid({ state }: { state: AmazonFeeEstimatorState }) {
  const {
    productPackagingCost,
    setProductPackagingCost,
    packedWeight,
    setPackedWeight,
    monthlyQty,
    setMonthlyQty,
  } = state;

  return (
    <div class={styles.grid2} style={{ marginTop: '8px' }}>
      <div class={styles.field}>
        <label class={styles.label} for="amz-cost">
          Product cost (₹)
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
      <div class={styles.field}>
        <label class={styles.label} for="amz-packaging">
          Packaging (₹)
        </label>
        <input id="amz-packaging" type="number" class={styles.fieldInput} value={35} readOnly />
      </div>
      <div class={styles.field}>
        <label class={styles.label} for="amz-weight">
          Packed weight
        </label>
        <input
          id="amz-weight"
          type="text"
          class={styles.fieldInput}
          value={`${packedWeight} g`}
          onInput={(e) => {
            const num = parseInt((e.target as HTMLInputElement).value, 10);
            if (!Number.isNaN(num)) setPackedWeight(num);
          }}
        />
      </div>
      <div class={styles.field}>
        <label class={styles.label} for="amz-qty">
          Qty / month
        </label>
        <input
          id="amz-qty"
          type="number"
          class={styles.fieldInput}
          value={monthlyQty}
          onInput={(e) => setMonthlyQty(Number((e.target as HTMLInputElement).value) || 0)}
        />
      </div>
    </div>
  );
}

export function AmazonListingFulfilmentCard({ state }: { state: AmazonFeeEstimatorState }) {
  const {
    fulfilmentMode,
    setFulfilmentMode,
    sellingPrice,
    setSellingPrice,
    category,
    setCategory,
    setReferralFee,
  } = state;

  const handleCategoryChange = (catId: string) => {
    setCategory(catId);
    const found = AMAZON_CATEGORY_PRESETS.find((c) => c.id === catId);
    if (found && found.id !== 'custom') {
      setReferralFee(Math.round((sellingPrice * found.rate) / 100));
    }
  };

  return (
    <section class={styles.card} aria-label="Listing & Fulfilment">
      <div class={styles.heading}>
        <span class={`${styles.ico} ${styles.icoViolet}`}>▣</span>
        <span>Listing & Fulfilment</span>
      </div>

      <div class={styles.tabs} role="tablist" aria-label="Fulfilment Mode">
        {(['fba', 'easy_ship', 'self_ship'] as FulfilmentMode[]).map((m) => (
          <button
            key={m}
            type="button"
            class={`${styles.tab} ${fulfilmentMode === m ? styles.tabActive : ''}`}
            onClick={() => setFulfilmentMode(m)}
          >
            {m === 'fba' ? 'FBA' : m === 'easy_ship' ? 'Easy Ship' : 'Self Ship'}
          </button>
        ))}
      </div>

      <div class={styles.field}>
        <label class={styles.label} for="amz-sp">
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

      <AmazonListingGrid state={state} />

      <div class={styles.field} style={{ marginTop: '8px' }}>
        <label class={styles.label} for="amz-category">
          Category
        </label>
        <select
          id="amz-category"
          class={styles.fieldInput}
          value={category}
          onChange={(e) => handleCategoryChange((e.target as HTMLSelectElement).value)}
        >
          {AMAZON_CATEGORY_PRESETS.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
    </section>
  );
}

export function AmazonFeeInputsCard({ state }: { state: AmazonFeeEstimatorState }) {
  const { referralFee, setReferralFee, closingHandling, setClosingHandling, feeGst, setFeeGst } =
    state;
  const weightHandling = Math.max(0, closingHandling - 25);

  return (
    <section class={styles.card} aria-label="Manual Amazon Fee Inputs">
      <div class={styles.heading}>
        <span class={`${styles.ico} ${styles.icoBlue}`}>⚙</span>
        <span>Manual Amazon Fee Inputs</span>
      </div>

      <div class={styles.grid2}>
        <div class={styles.field}>
          <label class={styles.label} for="amz-ref-fee">
            Referral fee (₹)
          </label>
          <input
            id="amz-ref-fee"
            type="number"
            class={styles.fieldInput}
            value={referralFee}
            onInput={(e) => setReferralFee(Number((e.target as HTMLInputElement).value) || 0)}
          />
        </div>
        <div class={styles.field}>
          <label class={styles.label} for="amz-closing-fee">
            Closing fee (₹)
          </label>
          <input
            id="amz-closing-fee"
            type="number"
            class={styles.fieldInput}
            value={25}
            onInput={(e) => {
              const val = Number((e.target as HTMLInputElement).value) || 0;
              setClosingHandling(val + weightHandling);
            }}
          />
        </div>
        <div class={styles.field}>
          <label class={styles.label} for="amz-weight-handling">
            Weight handling (₹)
          </label>
          <input
            id="amz-weight-handling"
            type="number"
            class={styles.fieldInput}
            value={weightHandling || 100}
            onInput={(e) => {
              const val = Number((e.target as HTMLInputElement).value) || 0;
              setClosingHandling(25 + val);
            }}
          />
        </div>
        <div class={styles.field}>
          <label class={styles.label} for="amz-fee-gst">
            GST on fees (₹)
          </label>
          <input
            id="amz-fee-gst"
            type="number"
            class={styles.fieldInput}
            value={feeGst}
            step="0.01"
            onInput={(e) => setFeeGst(Number((e.target as HTMLInputElement).value) || 0)}
          />
        </div>
      </div>

      <div class={styles.note} style={{ marginTop: '9px' }}>
        Enter fees from Seller Central. No live fees are fetched.
      </div>
    </section>
  );
}

export function AmazonOtherCostsCard({ state }: { state: AmazonFeeEstimatorState }) {
  const { adsReturns, setAdsReturns, copySummary } = state;
  const adsVal = Math.round(adsReturns * 0.6);
  const returnsVal = Math.round(adsReturns * 0.4);

  return (
    <section class={styles.card} aria-label="Other Costs">
      <div class={styles.heading}>
        <span class={`${styles.ico} ${styles.icoAmber}`}>₹</span>
        <span>Other Costs</span>
      </div>

      <div class={styles.grid2}>
        <div class={styles.field}>
          <label class={styles.label} for="amz-ads">
            Ads / order (₹)
          </label>
          <input
            id="amz-ads"
            type="number"
            class={styles.fieldInput}
            value={adsVal}
            onInput={(e) => {
              const val = Number((e.target as HTMLInputElement).value) || 0;
              setAdsReturns(val + returnsVal);
            }}
          />
        </div>
        <div class={styles.field}>
          <label class={styles.label} for="amz-returns">
            Expected returns (₹)
          </label>
          <input
            id="amz-returns"
            type="number"
            class={styles.fieldInput}
            value={returnsVal}
            onInput={(e) => {
              const val = Number((e.target as HTMLInputElement).value) || 0;
              setAdsReturns(adsVal + val);
            }}
          />
        </div>
      </div>

      <button type="button" class={styles.btn} style={{ marginTop: '10px' }} onClick={copySummary}>
        <span>▦ Estimate Seller Profit</span>
      </button>
    </section>
  );
}

export function AmazonFeeLeftCards({ state }: { state: AmazonFeeEstimatorState }) {
  return (
    <div class={styles.stack}>
      <AmazonListingFulfilmentCard state={state} />
      <AmazonFeeInputsCard state={state} />
      <AmazonOtherCostsCard state={state} />
    </div>
  );
}

export const AmazonFeeMarketplaceCard = AmazonFeeInputsCard;
