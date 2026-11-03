import styles from './businessStudio.module.css';
import type { SellerProfitabilityState } from './useSellerProfitability.ts';

/** One labelled number input bound to a studio value. */
function NumField(props: { id: string; label: string; value: number; set: (v: number) => void }) {
  return (
    <div class={styles.field}>
      <label class={styles.label} for={props.id}>
        {props.label}
      </label>
      <input
        id={props.id}
        type="number"
        inputMode="decimal"
        class={styles.fieldInput}
        value={props.value}
        onInput={(e) => props.set(Number((e.target as HTMLInputElement).value) || 0)}
      />
    </div>
  );
}

export function SellerPriceAndCostsCard({ state }: { state: SellerProfitabilityState }) {
  const {
    sellingPrice,
    setSellingPrice,
    productCost,
    setProductCost,
    packagingCost,
    setPackagingCost,
    shippingCost,
    setShippingCost,
    monthlyQty,
    setMonthlyQty,
    copySummary,
  } = state;

  return (
    <section class={styles.card} aria-label="Selling Price and Costs">
      <div class={styles.heading}>
        <span class={`${styles.ico} ${styles.icoViolet}`}>▤</span>
        <span>Selling Price & Costs</span>
      </div>

      <div class={styles.grid2}>
        <div class={styles.field}>
          <label class={styles.label} for="seller-sp">
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
        <div class={styles.field}>
          <label class={styles.label} for="seller-cost">
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

      <div class={styles.grid2} style={{ marginTop: '8px' }}>
        <div class={styles.field}>
          <label class={styles.label} for="seller-pack">
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
        <div class={styles.field}>
          <label class={styles.label} for="seller-ship">
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

      <div class={styles.grid3} style={{ marginTop: '8px' }}>
        <NumField
          id="seller-warehousing"
          label="Warehousing (₹)"
          value={state.warehousingCost}
          set={state.setWarehousingCost}
        />
        <NumField
          id="seller-labour"
          label="Labour (₹)"
          value={state.labourCost}
          set={state.setLabourCost}
        />
        <NumField
          id="seller-overhead"
          label="Overhead (₹)"
          value={state.overheadCost}
          set={state.setOverheadCost}
        />
      </div>

      <div class={styles.divider} />

      <div class={styles.field}>
        <label class={styles.label} for="seller-monthly-qty">
          Quantity / month
        </label>
        <input
          id="seller-monthly-qty"
          type="number"
          class={styles.fieldInput}
          value={monthlyQty}
          onInput={(e) => setMonthlyQty(Number((e.target as HTMLInputElement).value) || 0)}
        />
      </div>

      <button type="button" class={styles.btn} style={{ marginTop: '13px' }} onClick={copySummary}>
        <span>▦ Calculate Profit</span>
      </button>
    </section>
  );
}

export function SellerMarketplaceFeesCard({ state }: { state: SellerProfitabilityState }) {
  const {
    commissionPercent,
    setCommissionPercent,
    adCost,
    setAdCost,
    otherCharges,
    setOtherCharges,
    gstRate,
    setGstRate,
  } = state;

  return (
    <section class={styles.card} aria-label="Marketplace and Variable Fees">
      <div class={styles.heading}>
        <span class={`${styles.ico} ${styles.icoBlue}`}>⚙</span>
        <span>Marketplace & Variable Fees</span>
      </div>

      <div class={styles.grid2}>
        <div class={styles.field}>
          <label class={styles.label} for="seller-comm-pct">
            Commission (%)
          </label>
          <input
            id="seller-comm-pct"
            type="number"
            class={styles.fieldInput}
            value={commissionPercent}
            onInput={(e) => setCommissionPercent(Number((e.target as HTMLInputElement).value) || 0)}
          />
        </div>
        <div class={styles.field}>
          <label class={styles.label} for="seller-ad-cost">
            Advertising / order (₹)
          </label>
          <input
            id="seller-ad-cost"
            type="number"
            class={styles.fieldInput}
            value={adCost}
            onInput={(e) => setAdCost(Number((e.target as HTMLInputElement).value) || 0)}
          />
        </div>
      </div>

      <div class={styles.grid2} style={{ marginTop: '8px' }}>
        <div class={styles.field}>
          <label class={styles.label} for="seller-other-charges">
            Other charges (₹)
          </label>
          <input
            id="seller-other-charges"
            type="number"
            class={styles.fieldInput}
            value={otherCharges}
            onInput={(e) => setOtherCharges(Number((e.target as HTMLInputElement).value) || 0)}
          />
        </div>
        <div class={styles.field}>
          <label class={styles.label} for="seller-fee-gst">
            GST in your price
          </label>
          <select
            id="seller-fee-gst"
            class={styles.fieldInput}
            value={gstRate}
            onChange={(e) => setGstRate(Number((e.target as HTMLSelectElement).value))}
          >
            <option value={18}>18% (standard)</option>
            <option value={5}>5%</option>
            <option value={40}>40%</option>
            <option value={3}>3% (gold, silver)</option>
            <option value={0}>0% / not registered</option>
          </select>
        </div>
      </div>

      <div class={styles.field} style={{ marginTop: '8px' }}>
        <label class={styles.label} for="seller-gst-inclusive">
          Does your price include GST?
        </label>
        <select
          id="seller-gst-inclusive"
          class={styles.fieldInput}
          value={state.isGstInclusive ? 'yes' : 'no'}
          onChange={(e) => state.setIsGstInclusive((e.target as HTMLSelectElement).value === 'yes')}
        >
          <option value="yes">Yes, price includes GST</option>
          <option value="no">No, GST is added on top</option>
        </select>
      </div>

      <div class={styles.grid2} style={{ marginTop: '8px' }}>
        <NumField
          id="seller-closing-fee"
          label="Closing fee (₹)"
          value={state.closingFee}
          set={state.setClosingFee}
        />
        <NumField
          id="seller-fee-gst-rate"
          label="GST on fees (%)"
          value={state.feeGstRate}
          set={state.setFeeGstRate}
        />
      </div>

      <div class={styles.note} style={{ marginTop: '9px' }}>
        GST inside your price goes to the government and is taken out of profit. GST on fees is
        counted as a cost; set it to 0% if you claim input-tax credit. Use your actual fee values;
        samples are not marketplace tariffs.
      </div>
    </section>
  );
}

export function SellerProfitabilityLeftCards({ state }: { state: SellerProfitabilityState }) {
  return (
    <div class={styles.stack}>
      <SellerPriceAndCostsCard state={state} />
      <SellerMarketplaceFeesCard state={state} />
    </div>
  );
}

export const SellerProfitabilityInputsCard = SellerProfitabilityLeftCards;
