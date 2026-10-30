import { useState } from 'preact/hooks';
import styles from './businessStudio.module.css';
import type { SellerProfitabilityState } from './useSellerProfitability.ts';

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
  const [productTab, setProductTab] = useState<'single' | 'compare'>('single');

  return (
    <section class={styles.card} aria-label="Selling Price and Costs">
      <div class={styles.heading}>
        <span class={`${styles.ico} ${styles.icoViolet}`}>▤</span>
        <span>Selling Price & Costs</span>
      </div>

      <div class={styles.tabs} role="tablist" aria-label="Product Mode">
        <button
          type="button"
          class={`${styles.tab} ${productTab === 'single' ? styles.tabActive : ''}`}
          onClick={() => setProductTab('single')}
        >
          Single product
        </button>
        <button
          type="button"
          class={`${styles.tab} ${productTab === 'compare' ? styles.tabActive : ''}`}
          onClick={() => setProductTab('compare')}
        >
          Compare products
        </button>
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
            Fee GST (optional)
          </label>
          <select
            id="seller-fee-gst"
            class={styles.fieldInput}
            value={gstRate}
            onChange={(e) => setGstRate(Number((e.target as HTMLSelectElement).value))}
          >
            <option value={18}>18% (Standard GST)</option>
            <option value={0}>0% (Exempt)</option>
            <option value={5}>5%</option>
            <option value={12}>12%</option>
          </select>
        </div>
      </div>

      <div class={styles.note} style={{ marginTop: '9px' }}>
        Use actual fee values. Do not treat sample values as marketplace tariffs.
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
