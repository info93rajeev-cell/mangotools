import styles from './businessStudio.module.css';
import type { MarkupCalculatorState } from './useMarkupCalculator.ts';

function MarkupSummaryHeader({ state }: { state: MarkupCalculatorState }) {
  const { activeTab, calculation, stackedCalc, bogoCalc, fakeMrpCalc } = state;

  if (activeTab === 'stacked_discount') {
    return (
      <div class={styles.headlineHero}>
        <div>
          <div class={styles.headlineTitle}>Final Customer Price</div>
          <div class={styles.headlineAmount}>₹ {stackedCalc.finalCustomerPrice.toFixed(2)}</div>
        </div>
        <div class={styles.kpiBadge}>{stackedCalc.realEffectiveDiscount}% real disc</div>
      </div>
    );
  }

  if (activeTab === 'bogo_deals') {
    return (
      <div class={styles.headlineHero}>
        <div>
          <div class={styles.headlineTitle}>Effective Price / Item</div>
          <div class={styles.headlineAmount}>₹ {bogoCalc.effectivePricePerItem.toFixed(2)}</div>
        </div>
        <div class={styles.kpiBadge}>{bogoCalc.bogoEffectiveDiscount}% real disc</div>
      </div>
    );
  }

  if (activeTab === 'fake_mrp') {
    return (
      <div class={styles.headlineHero}>
        <div>
          <div class={styles.headlineTitle}>Required Inflated MRP</div>
          <div class={styles.headlineAmount}>₹ {fakeMrpCalc.inflatedFakeMrp.toFixed(2)}</div>
        </div>
        <div class={styles.kpiBadge}>{fakeMrpCalc.artificialMultiplier}x fake markup</div>
      </div>
    );
  }

  return (
    <div class={styles.headlineHero}>
      <div>
        <div class={styles.headlineTitle}>Recommended Selling Price</div>
        <div class={styles.headlineAmount}>₹ {calculation.sellingPrice.toFixed(2)}</div>
      </div>
      <div class={styles.kpiBadge}>{calculation.grossMargin}% margin</div>
    </div>
  );
}

export function MarkupResultsSummaryCard({ state }: { state: MarkupCalculatorState }) {
  const { activeTab, calculation, stackedCalc, bogoCalc, fakeMrpCalc } = state;

  return (
    <section class={`${styles.businessCard} ${styles.cardResults}`} aria-label="Pricing Result">
      <div class={styles.cardHeading}>
        <span class={`${styles.cardIcon} ${styles.iconGreen}`}>✓</span>
        <span>
          {activeTab === 'stacked_discount'
            ? 'Discount Reality & Final Price'
            : activeTab === 'bogo_deals'
              ? 'BOGO Deal Analysis'
              : activeTab === 'fake_mrp'
                ? 'Fake 90% MRP Buster'
                : 'Pricing Result'}
        </span>
      </div>

      <MarkupSummaryHeader state={state} />

      <div class={styles.kpiGrid3}>
        {activeTab === 'stacked_discount' ? (
          <>
            <div class={styles.kpiCard}>
              <span class={styles.kpiLabel}>Claimed Sum</span>
              <span class={styles.kpiValue} style={{ color: '#dc2626' }}>
                {stackedCalc.nominalSumDiscount}%
              </span>
            </div>
            <div class={styles.kpiCard}>
              <span class={styles.kpiLabel}>Actual Real Disc</span>
              <span class={styles.kpiValue} style={{ color: '#059669' }}>
                {stackedCalc.realEffectiveDiscount}%
              </span>
            </div>
            <div class={styles.kpiCard}>
              <span class={styles.kpiLabel}>Marketing Gap</span>
              <span class={styles.kpiValue} style={{ color: '#7c3aed' }}>
                -{stackedCalc.marketingHypeGap}%
              </span>
            </div>
          </>
        ) : activeTab === 'bogo_deals' ? (
          <>
            <div class={styles.kpiCard}>
              <span class={styles.kpiLabel}>Total Items</span>
              <span class={styles.kpiValue}>{bogoCalc.totalItemsReceived}</span>
            </div>
            <div class={styles.kpiCard}>
              <span class={styles.kpiLabel}>Customer Pays</span>
              <span class={styles.kpiValue} style={{ color: '#2563eb' }}>
                ₹{bogoCalc.totalCustomerPays}
              </span>
            </div>
            <div class={styles.kpiCard}>
              <span class={styles.kpiLabel}>Total Savings</span>
              <span class={styles.kpiValue} style={{ color: '#059669' }}>
                ₹{bogoCalc.totalCustomerSaved}
              </span>
            </div>
          </>
        ) : activeTab === 'fake_mrp' ? (
          <>
            <div class={styles.kpiCard}>
              <span class={styles.kpiLabel}>Actual Sale SP</span>
              <span class={styles.kpiValue} style={{ color: '#2563eb' }}>
                ₹{state.flashTargetSp}
              </span>
            </div>
            <div class={styles.kpiCard}>
              <span class={styles.kpiLabel}>Banner Discount</span>
              <span class={styles.kpiValue} style={{ color: '#dc2626' }}>
                {state.flashDiscountBanner}%
              </span>
            </div>
            <div class={styles.kpiCard}>
              <span class={styles.kpiLabel}>Fake MRP Hike</span>
              <span class={styles.kpiValue} style={{ color: '#7c3aed' }}>
                +{fakeMrpCalc.artificialMultiplier}x
              </span>
            </div>
          </>
        ) : (
          <>
            <div class={styles.kpiCard}>
              <span class={styles.kpiLabel}>Markup</span>
              <span class={styles.kpiValue} style={{ color: '#7c3aed' }}>
                {state.markupPercent}%
              </span>
            </div>
            <div class={styles.kpiCard}>
              <span class={styles.kpiLabel}>Gross Margin</span>
              <span class={styles.kpiValue} style={{ color: '#059669' }}>
                {calculation.grossMargin}%
              </span>
            </div>
            <div class={styles.kpiCard}>
              <span class={styles.kpiLabel}>Profit / Unit</span>
              <span class={styles.kpiValue} style={{ color: '#2563eb' }}>
                ₹{calculation.profitPerUnit.toFixed(0)}
              </span>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function StackedDiscountTable({ state }: { state: MarkupCalculatorState }) {
  const { mrp, discount1, discount2, discount3, stackedCalc } = state;
  return (
    <table class={styles.itemizedTable} aria-label="Stacked Discount Breakdown">
      <thead>
        <tr>
          <th>Discount Tier</th>
          <th>Price After</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Original Printed MRP</td>
          <td style={{ color: '#2563eb' }}>₹{mrp.toFixed(2)}</td>
        </tr>
        <tr>
          <td>After 1st Discount ({discount1}%)</td>
          <td style={{ color: '#64748b' }}>₹{stackedCalc.priceAfterD1.toFixed(2)}</td>
        </tr>
        <tr>
          <td>After 2nd Extra Coupon ({discount2}%)</td>
          <td style={{ color: '#64748b' }}>₹{stackedCalc.priceAfterD2.toFixed(2)}</td>
        </tr>
        <tr>
          <td>After 3rd Bank Offer ({discount3}%)</td>
          <td style={{ color: '#64748b' }}>₹{stackedCalc.priceAfterD3.toFixed(2)}</td>
        </tr>
        <tr style={{ background: '#f0fdf4', fontWeight: 800 }}>
          <td>Final Customer Price</td>
          <td style={{ color: '#059669' }}>₹{stackedCalc.finalCustomerPrice.toFixed(2)}</td>
        </tr>
      </tbody>
    </table>
  );
}

export function MarkupFinancialDetailsCard({ state }: { state: MarkupCalculatorState }) {
  const { activeTab, calculation } = state;

  return (
    <section
      class={`${styles.businessCard} ${styles.cardBreakdown}`}
      aria-label="Financial Details"
    >
      <div class={styles.cardHeading}>
        <span class={`${styles.cardIcon} ${styles.iconViolet}`}>▥</span>
        <span>
          {activeTab === 'stacked_discount'
            ? 'Step-by-Step Discount Breakdown'
            : 'Financial Details'}
        </span>
      </div>

      {activeTab === 'stacked_discount' ? (
        <StackedDiscountTable state={state} />
      ) : (
        <table class={styles.itemizedTable} aria-label="Itemized Pricing Details">
          <thead>
            <tr>
              <th>Item</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Base Product Cost</td>
              <td style={{ color: '#64748b' }}>₹{calculation.baseCost.toFixed(2)}</td>
            </tr>
            <tr>
              <td>Markup Added ({state.markupPercent}%)</td>
              <td style={{ color: '#059669' }}>+₹{calculation.markupAdded.toFixed(2)}</td>
            </tr>
            <tr style={{ background: '#eff6ff', fontWeight: 800 }}>
              <td>Selling Price</td>
              <td style={{ color: '#2563eb' }}>₹{calculation.sellingPrice.toFixed(2)}</td>
            </tr>
            <tr>
              <td>Gross Margin Percentage</td>
              <td style={{ color: '#0f172a' }}>{calculation.grossMargin}%</td>
            </tr>
          </tbody>
        </table>
      )}
    </section>
  );
}

export function MarkupVisualCard({ state }: { state: MarkupCalculatorState }) {
  const { activeTab, quantity, calculation, stackedCalc } = state;

  if (activeTab === 'stacked_discount') {
    const paidPct = Math.round((100 - stackedCalc.realEffectiveDiscount) * 10) / 10;
    return (
      <section
        class={`${styles.businessCard} ${styles.cardVisual}`}
        aria-label="Discount Breakdown"
      >
        <div class={styles.cardHeading}>
          <span class={`${styles.cardIcon} ${styles.iconPink}`}>◔</span>
          <span>True Savings vs What You Pay</span>
        </div>

        <div class={styles.segmentedBar}>
          <div
            style={{ width: `${paidPct}%`, background: '#2563eb' }}
            title={`You Pay ${paidPct}%`}
          />
          <div
            style={{ width: `${stackedCalc.realEffectiveDiscount}%`, background: '#10b981' }}
            title={`Real Discount ${stackedCalc.realEffectiveDiscount}%`}
          />
        </div>

        <div class={styles.segmentedLegend}>
          <span class={styles.legendItem}>
            <span class={styles.legendDot} style={{ background: '#2563eb' }} />
            Customer Pays {paidPct}% (₹{stackedCalc.finalCustomerPrice})
          </span>
          <span class={styles.legendItem}>
            <span class={styles.legendDot} style={{ background: '#10b981' }} />
            Real Savings {stackedCalc.realEffectiveDiscount}% (₹{stackedCalc.totalRealSavings})
          </span>
        </div>
      </section>
    );
  }

  return (
    <section class={`${styles.businessCard} ${styles.cardVisual}`} aria-label="Price Composition">
      <div class={styles.cardHeading}>
        <span class={`${styles.cardIcon} ${styles.iconPink}`}>◔</span>
        <span>Price Composition & Profits</span>
      </div>

      <div class={styles.kpiGrid2}>
        <div class={styles.kpiCard}>
          <span class={styles.kpiLabel}>Profit / Unit</span>
          <span class={styles.kpiValue} style={{ color: '#059669' }}>
            ₹{calculation.profitPerUnit.toFixed(2)}
          </span>
        </div>
        <div class={styles.kpiCard}>
          <span class={styles.kpiLabel}>Profit on {quantity} units</span>
          <span class={styles.kpiValue} style={{ color: '#2563eb' }}>
            ₹{calculation.profitOnQuantity.toLocaleString()}
          </span>
        </div>
      </div>

      <div class={styles.segmentedBar}>
        <div
          style={{ width: `${calculation.costPct}%`, background: '#2563eb' }}
          title={`Base Cost ${calculation.costPct}%`}
        />
        <div
          style={{ width: `${calculation.profitPct}%`, background: '#10b981' }}
          title={`Gross Profit ${calculation.profitPct}%`}
        />
      </div>

      <div class={styles.segmentedLegend}>
        <span class={styles.legendItem}>
          <span class={styles.legendDot} style={{ background: '#2563eb' }} />
          Cost {calculation.costPct}%
        </span>
        <span class={styles.legendItem}>
          <span class={styles.legendDot} style={{ background: '#10b981' }} />
          Gross Profit {calculation.profitPct}%
        </span>
      </div>
    </section>
  );
}
