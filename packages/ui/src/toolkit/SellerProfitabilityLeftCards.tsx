import styles from './businessStudio.module.css';
import type { SellerProfitabilityState } from './useSellerProfitability.ts';

function SellerPricingTabFields({ state }: { state: SellerProfitabilityState }) {
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

function SellerFulfillmentTabFields({ state }: { state: SellerProfitabilityState }) {
  const {
    warehousingCost,
    setWarehousingCost,
    labourCost,
    setLabourCost,
    overheadCost,
    setOverheadCost,
    monthlyQty,
    setMonthlyQty,
  } = state;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div class={styles.fieldGrid3}>
        <div class={styles.fieldGroup}>
          <label class={styles.fieldLabel} for="seller-warehouse">
            Warehousing (₹/unit)
          </label>
          <input
            id="seller-warehouse"
            type="number"
            class={styles.fieldInput}
            value={warehousingCost}
            onInput={(e) => setWarehousingCost(Number((e.target as HTMLInputElement).value) || 0)}
          />
        </div>
        <div class={styles.fieldGroup}>
          <label class={styles.fieldLabel} for="seller-labour">
            Labour / Pack (₹)
          </label>
          <input
            id="seller-labour"
            type="number"
            class={styles.fieldInput}
            value={labourCost}
            onInput={(e) => setLabourCost(Number((e.target as HTMLInputElement).value) || 0)}
          />
        </div>
        <div class={styles.fieldGroup}>
          <label class={styles.fieldLabel} for="seller-overhead">
            Overhead (₹)
          </label>
          <input
            id="seller-overhead"
            type="number"
            class={styles.fieldInput}
            value={overheadCost}
            onInput={(e) => setOverheadCost(Number((e.target as HTMLInputElement).value) || 0)}
          />
        </div>
      </div>

      <div class={styles.fieldGroup}>
        <label class={styles.fieldLabel} for="seller-monthly-vol">
          Monthly order volume (units)
        </label>
        <input
          id="seller-monthly-vol"
          type="number"
          class={styles.fieldInput}
          value={monthlyQty}
          onInput={(e) => setMonthlyQty(Number((e.target as HTMLInputElement).value) || 0)}
        />
      </div>
    </div>
  );
}

function SellerMarketplaceGstFields({ state }: { state: SellerProfitabilityState }) {
  const {
    commissionPercent,
    setCommissionPercent,
    closingFee,
    setClosingFee,
    adCost,
    setAdCost,
    gstRate,
    setGstRate,
  } = state;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
          <label class={styles.fieldLabel} for="seller-closing">
            Closing fee (₹)
          </label>
          <input
            id="seller-closing"
            type="number"
            class={styles.fieldInput}
            value={closingFee}
            onInput={(e) => setClosingFee(Number((e.target as HTMLInputElement).value) || 0)}
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
      </div>

      <div class={styles.fieldGrid2}>
        <div class={styles.fieldGroup}>
          <label class={styles.fieldLabel} for="seller-gst-rate">
            Product GST rate
          </label>
          <select
            id="seller-gst-rate"
            class={styles.fieldInput}
            value={gstRate}
            onChange={(e) => setGstRate(Number((e.target as HTMLSelectElement).value))}
          >
            <option value={0}>0% (Exempt)</option>
            <option value={5}>5%</option>
            <option value={12}>12%</option>
            <option value={18}>18% (Standard)</option>
            <option value={28}>28% (Luxury)</option>
          </select>
        </div>
        <div class={styles.fieldGroup}>
          <label class={styles.fieldLabel} for="seller-gst-note">
            Marketplace GST & TCS
          </label>
          <div
            id="seller-gst-note"
            style={{
              padding: '6px 8px',
              fontSize: '10.5px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              color: '#475569',
            }}
          >
            18% fee GST + 2% TCS/TDS applied automatically
          </div>
        </div>
      </div>
    </div>
  );
}

function SellerReturnsFields({ state }: { state: SellerProfitabilityState }) {
  const {
    returnRate,
    setReturnRate,
    reverseShipping,
    setReverseShipping,
    damagedLossPercent,
    setDamagedLossPercent,
    calculation,
  } = state;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div class={styles.fieldGrid3}>
        <div class={styles.fieldGroup}>
          <label class={styles.fieldLabel} for="seller-ret-rate">
            Return / RTO (%)
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
            Reverse ship (₹)
          </label>
          <input
            id="seller-rev-ship"
            type="number"
            class={styles.fieldInput}
            value={reverseShipping}
            onInput={(e) => setReverseShipping(Number((e.target as HTMLInputElement).value) || 0)}
          />
        </div>
        <div class={styles.fieldGroup}>
          <label class={styles.fieldLabel} for="seller-dmg-loss">
            Damaged loss (%)
          </label>
          <input
            id="seller-dmg-loss"
            type="number"
            class={styles.fieldInput}
            value={damagedLossPercent}
            onInput={(e) =>
              setDamagedLossPercent(Number((e.target as HTMLInputElement).value) || 0)
            }
          />
        </div>
      </div>

      <div
        style={{
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '6px',
          padding: '6px 8px',
          fontSize: '11px',
          color: '#991b1b',
        }}
      >
        ⚠️ <strong>RTO Drag:</strong> Returns add an effective cost of ₹{calculation.rtoLossPerUnit}{' '}
        to every successfully delivered order.
      </div>
    </div>
  );
}

export function SellerProfitabilityLeftCards({ state }: { state: SellerProfitabilityState }) {
  const { activeTab, setActiveTab } = state;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <section class={styles.studioCard} aria-label="Selling Price and Costs">
        <div class={styles.cardHeading}>
          <span class={`${styles.cardIcon} ${styles.iconPurple}`}>🛒</span>
          <span>Selling Price & Detailed Costs</span>
        </div>

        <div class={styles.modeTabsRow} role="tablist" aria-label="Cost Categories">
          <button
            type="button"
            class={styles.modeTab}
            data-active={String(activeTab === 'pricing')}
            onClick={() => setActiveTab('pricing')}
          >
            🏷️ Pricing
          </button>
          <button
            type="button"
            class={styles.modeTab}
            data-active={String(activeTab === 'fulfillment')}
            onClick={() => setActiveTab('fulfillment')}
          >
            🏭 Warehouse & Labour
          </button>
          <button
            type="button"
            class={styles.modeTab}
            data-active={String(activeTab === 'marketplace_gst')}
            onClick={() => setActiveTab('marketplace_gst')}
          >
            🏛️ Fees & GST
          </button>
          <button
            type="button"
            class={styles.modeTab}
            data-active={String(activeTab === 'returns')}
            onClick={() => setActiveTab('returns')}
          >
            ↩️ Returns
          </button>
        </div>

        {activeTab === 'pricing' && <SellerPricingTabFields state={state} />}
        {activeTab === 'fulfillment' && <SellerFulfillmentTabFields state={state} />}
        {activeTab === 'marketplace_gst' && <SellerMarketplaceGstFields state={state} />}
        {activeTab === 'returns' && <SellerReturnsFields state={state} />}
      </section>
    </div>
  );
}

export function SellerProfitabilityAdvancedCard({ state }: { state: SellerProfitabilityState }) {
  const { calculation } = state;

  return (
    <section
      class={`${styles.businessCard} ${styles.cardAdvanced}`}
      aria-label="Target Margin & Breakeven"
    >
      <div class={styles.cardHeading}>
        <span class={`${styles.cardIcon} ${styles.iconGreen}`}>🎯</span>
        <span>Breakeven & Target Margin</span>
      </div>

      <div class={styles.kpiGrid2}>
        <div class={styles.kpiCard}>
          <span class={styles.kpiLabel}>Breakeven Price</span>
          <span class={styles.kpiValue} style={{ color: '#2563eb' }}>
            ₹{calculation.breakEvenPrice.toFixed(0)}
          </span>
        </div>
        <div class={styles.kpiCard}>
          <span class={styles.kpiLabel}>Net Margin</span>
          <span class={styles.kpiValue} style={{ color: '#059669' }}>
            {calculation.netMargin}%
          </span>
        </div>
      </div>
    </section>
  );
}

export const SellerProfitabilityInputsCard = SellerProfitabilityLeftCards;
