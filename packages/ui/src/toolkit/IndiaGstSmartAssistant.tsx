import { useState } from 'preact/hooks';
import { POPULAR_GST_CATEGORIES } from './indiaGstCategories.ts';
import styles from './universalTax.module.css';
import { formatCurrencyNumber } from './universalTaxEngine.ts';
import type { UseUniversalTaxReturn } from './useUniversalTax.ts';

export interface IndiaGstSmartAssistantProps {
  tax: UseUniversalTaxReturn;
  onSwitchToCustom: () => void;
}

function RateFinderTab({
  tax,
  filter,
  setFilter,
}: {
  tax: UseUniversalTaxReturn;
  filter: string;
  setFilter: (q: string) => void;
}) {
  const filtered = POPULAR_GST_CATEGORIES.filter(
    (c) =>
      c.title.toLowerCase().includes(filter.toLowerCase()) ||
      c.hsn.toLowerCase().includes(filter.toLowerCase()) ||
      c.note.toLowerCase().includes(filter.toLowerCase()),
  );

  return (
    <div>
      <input
        type="text"
        class={styles.rateSearchInput}
        placeholder="🔍 Search item or category (e.g. software, restaurant, laptop, rent)..."
        value={filter}
        onInput={(e) => setFilter((e.target as HTMLInputElement).value)}
      />

      <div class={styles.categoryListScroll}>
        {filtered.map((cat) => (
          <div key={cat.id} class={styles.categoryItemCard}>
            <div class={styles.categoryInfoCol}>
              <div class={styles.categoryTitleRow}>
                <span style={{ fontSize: '14px' }}>{cat.icon}</span>
                <span class={styles.categoryTitleText}>{cat.title}</span>
                <span class={styles.categoryRatePill}>
                  {cat.rate}%{cat.cess > 0 ? ` + ${cat.cess}% cess` : ''}
                </span>
              </div>
              <div class={styles.categoryDescText}>
                <strong>{cat.hsn}</strong> • {cat.note}
              </div>
            </div>
            <button
              type="button"
              class={styles.categoryApplyBtn}
              onClick={() => {
                tax.setGstRate(cat.rate);
                tax.setCessRate(cat.cess);
              }}
              title="Apply this rate to calculator"
            >
              ⚡ Apply
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ItcEstimatorTab({ tax }: { tax: UseUniversalTaxReturn }) {
  const [buyerType, setBuyerType] = useState<'b2b' | 'b2c'>('b2b');
  const { results, currencySymbol } = tax;
  const isB2B = buyerType === 'b2b';

  return (
    <div class={styles.itcContainer}>
      <div class={styles.itcToggleRow}>
        <button
          type="button"
          class={styles.itcToggleBtn}
          data-active={String(isB2B)}
          onClick={() => setBuyerType('b2b')}
        >
          🏢 Registered Business (B2B)
        </button>
        <button
          type="button"
          class={styles.itcToggleBtn}
          data-active={String(!isB2B)}
          onClick={() => setBuyerType('b2c')}
        >
          👤 Retail Consumer (B2C)
        </button>
      </div>

      <div class={styles.itcResultCard}>
        <div class={styles.itcGrid3Col}>
          <div class={styles.itcMetricBox}>
            <span class={styles.itcMetricLabel}>Invoice Total</span>
            <span class={styles.itcMetricVal}>
              {formatCurrencyNumber(results.finalAmount, currencySymbol)}
            </span>
          </div>
          <div class={styles.itcMetricBox}>
            <span class={styles.itcMetricLabel}>
              {isB2B ? 'Claimable ITC' : 'Non-Refundable Tax'}
            </span>
            <span class={styles.itcMetricVal} style={{ color: isB2B ? '#16a34a' : '#dc2626' }}>
              {formatCurrencyNumber(results.totalTax, currencySymbol)}
            </span>
          </div>
          <div class={styles.itcMetricBox}>
            <span class={styles.itcMetricLabel}>Real Net Cost</span>
            <span class={styles.itcMetricVal} style={{ color: '#2563eb' }}>
              {isB2B
                ? formatCurrencyNumber(results.taxableAmount, currencySymbol)
                : formatCurrencyNumber(results.finalAmount, currencySymbol)}
            </span>
          </div>
        </div>

        {isB2B ? (
          <div class={styles.itcBadgeHighlight}>
            🟢 <strong>Tax Advantage:</strong> You can claim{' '}
            {formatCurrencyNumber(results.totalTax, currencySymbol)} as Input Tax Credit (ITC) in
            GSTR-3B to offset your sales GST liability. Your effective expense is just{' '}
            {formatCurrencyNumber(results.taxableAmount, currencySymbol)}!
          </div>
        ) : (
          <div class={styles.itcBadgeNotice}>
            ℹ️ <strong>End-Consumer Note:</strong> For personal or unregistered purchases, GST cannot
            be claimed back. The full {formatCurrencyNumber(results.finalAmount, currencySymbol)} is
            your out-of-pocket expense.
          </div>
        )}
      </div>
    </div>
  );
}

function ComplianceRulesTab({ onSwitchToCustom }: { onSwitchToCustom: () => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div class={styles.complianceList}>
        <div class={styles.complianceItem}>
          <span class={styles.complianceItemTitle}>📌 Mandatory GST Registration Limits</span>
          <span class={styles.complianceItemBody}>
            • <strong>Goods:</strong> ₹40 Lakhs turnover (₹20 Lakhs for Special Category States).
            <br />• <strong>Services:</strong> ₹20 Lakhs turnover (₹10 Lakhs for Special Category).
          </span>
        </div>

        <div class={styles.complianceItem}>
          <span class={styles.complianceItemTitle}>🔄 Reverse Charge Mechanism (RCM)</span>
          <span class={styles.complianceItemBody}>
            Under RCM, the buyer/recipient pays tax directly to the government instead of the
            seller. Applies to Goods Transport Agency (GTA freight 5%), Legal services from
            Advocates, and Security/Manpower services.
          </span>
        </div>

        <div class={styles.complianceItem}>
          <span class={styles.complianceItemTitle}>🏷️ Composition Scheme Rules</span>
          <span class={styles.complianceItemBody}>
            Small businesses up to ₹1.5 Crore turnover can pay flat tax (1% for
            Manufacturers/Traders, 5% for Restaurants, 6% for Services). They cannot issue tax
            invoices or claim ITC.
          </span>
        </div>
      </div>

      <button
        type="button"
        class={styles.ghostActionBtn}
        style={{
          alignSelf: 'flex-start',
          color: '#7c3aed',
          borderColor: '#c4b5fd',
          fontSize: '11px',
          padding: '4px 8px',
        }}
        onClick={onSwitchToCustom}
      >
        <span>🌐 Need Progressive Multi-Tier Slabs? Switch to Custom Slabs</span>
      </button>
    </div>
  );
}

export function IndiaGstSmartAssistant({ tax, onSwitchToCustom }: IndiaGstSmartAssistantProps) {
  const [activeTab, setActiveTab] = useState<'finder' | 'itc' | 'rules'>('finder');
  const [filter, setFilter] = useState('');

  return (
    <div>
      <div class={styles.assistantTabsRow} role="tablist" aria-label="Smart GST Assistant Tabs">
        <button
          type="button"
          class={styles.assistantTabBtn}
          data-active={String(activeTab === 'finder')}
          onClick={() => setActiveTab('finder')}
          role="tab"
          aria-selected={activeTab === 'finder'}
        >
          🔍 Rate & HSN Finder
        </button>
        <button
          type="button"
          class={styles.assistantTabBtn}
          data-active={String(activeTab === 'itc')}
          onClick={() => setActiveTab('itc')}
          role="tab"
          aria-selected={activeTab === 'itc'}
        >
          💼 B2B ITC Net Cost
        </button>
        <button
          type="button"
          class={styles.assistantTabBtn}
          data-active={String(activeTab === 'rules')}
          onClick={() => setActiveTab('rules')}
          role="tab"
          aria-selected={activeTab === 'rules'}
        >
          ⚖️ Compliance Rules
        </button>
      </div>

      {activeTab === 'finder' && <RateFinderTab tax={tax} filter={filter} setFilter={setFilter} />}
      {activeTab === 'itc' && <ItcEstimatorTab tax={tax} />}
      {activeTab === 'rules' && <ComplianceRulesTab onSwitchToCustom={onSwitchToCustom} />}
    </div>
  );
}
