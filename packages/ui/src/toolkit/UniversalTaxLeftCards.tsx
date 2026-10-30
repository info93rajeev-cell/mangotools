import { useState } from 'preact/hooks';
import styles from './businessStudio.module.css';
import type { UseUniversalTaxReturn } from './useUniversalTax.ts';

function UniversalTaxRateSubcard({ tax }: { tax: UseUniversalTaxReturn }) {
  const { gstRate, setGstRate } = tax;
  const [isCustomRate, setIsCustomRate] = useState(() => ![0, 5, 18, 40].includes(gstRate));

  const handleRateTab = (rate: number, custom = false) => {
    setIsCustomRate(custom);
    setGstRate(rate);
  };

  return (
    <div class={styles.subCard}>
      <div class={styles.heading}>
        <span class={`${styles.ico} ${styles.icoViolet}`}>％</span>
        <span>Choose GST Rate</span>
      </div>
      <div class={styles.tabs} role="tablist" aria-label="Preset GST Rates">
        {[0, 5, 18, 40].map((r) => (
          <button
            key={r}
            type="button"
            class={`${styles.tab} ${!isCustomRate && gstRate === r ? styles.tabActive : ''}`}
            onClick={() => handleRateTab(r)}
          >
            {r}%
          </button>
        ))}
        <button
          type="button"
          class={`${styles.tab} ${isCustomRate ? styles.tabActive : ''}`}
          onClick={() => handleRateTab(gstRate, true)}
        >
          Custom
        </button>
      </div>
      <div class={styles.field}>
        <label class={styles.label} for="gst-calc-rate">
          Selected GST rate
        </label>
        {isCustomRate ? (
          <input
            id="gst-calc-rate"
            type="number"
            class={styles.fieldInput}
            value={gstRate}
            min="0"
            max="100"
            step="0.1"
            onInput={(e) => setGstRate(Number((e.target as HTMLInputElement).value) || 0)}
          />
        ) : (
          <div class={styles.valueDisplay}>{gstRate}%</div>
        )}
      </div>
    </div>
  );
}

function UniversalTaxSupplySubcard({ tax }: { tax: UseUniversalTaxReturn }) {
  const { supplyType, setSupplyType } = tax;

  return (
    <div class={styles.subCard}>
      <div class={styles.heading}>
        <span class={`${styles.ico} ${styles.icoCyan}`}>⇄</span>
        <span>Supply Type</span>
      </div>
      <div class={styles.tabs} role="tablist" aria-label="Supply Type">
        <button
          type="button"
          class={`${styles.tab} ${supplyType === 'intra' ? styles.tabActive : ''}`}
          onClick={() => setSupplyType('intra')}
        >
          Intra-state (CGST + SGST)
        </button>
        <button
          type="button"
          class={`${styles.tab} ${supplyType === 'inter' ? styles.tabActive : ''}`}
          onClick={() => setSupplyType('inter')}
        >
          Inter-state (IGST)
        </button>
      </div>
      <div class={styles.note}>Pick supply type to see the correct tax component split.</div>
    </div>
  );
}

export function UniversalTaxGstCalculationCard({ tax }: { tax: UseUniversalTaxReturn }) {
  const { priceMode, setPriceMode, amount, setAmount, setSupplyType } = tax;
  const [activeTab, setActiveTab] = useState<'add' | 'remove' | 'split'>(() =>
    priceMode === 'inclusive' ? 'remove' : 'add',
  );

  const handleModeTab = (tab: 'add' | 'remove' | 'split') => {
    setActiveTab(tab);
    if (tab === 'add') setPriceMode('exclusive');
    else if (tab === 'remove') setPriceMode('inclusive');
    else {
      setPriceMode('exclusive');
      setSupplyType('intra');
    }
  };

  return (
    <section class={styles.card} aria-label="GST Calculation">
      <div class={styles.heading}>
        <span class={`${styles.ico} ${styles.icoGreen}`}>₹</span>
        <span>GST Calculation</span>
      </div>

      <div class={styles.tabs} role="tablist" aria-label="GST Price Mode">
        <button
          type="button"
          class={`${styles.tab} ${activeTab === 'add' ? styles.tabActive : ''}`}
          onClick={() => handleModeTab('add')}
          role="tab"
          aria-selected={activeTab === 'add'}
        >
          Add GST
        </button>
        <button
          type="button"
          class={`${styles.tab} ${activeTab === 'remove' ? styles.tabActive : ''}`}
          onClick={() => handleModeTab('remove')}
          role="tab"
          aria-selected={activeTab === 'remove'}
        >
          Remove GST
        </button>
        <button
          type="button"
          class={`${styles.tab} ${activeTab === 'split' ? styles.tabActive : ''}`}
          onClick={() => handleModeTab('split')}
          role="tab"
          aria-selected={activeTab === 'split'}
        >
          GST Split
        </button>
      </div>

      <div class={styles.field}>
        <label class={styles.label} for="gst-calc-amount">
          Amount (₹)
        </label>
        <input
          id="gst-calc-amount"
          type="number"
          class={styles.fieldInput}
          value={amount}
          min="0"
          step="any"
          onInput={(e) => setAmount(Number((e.target as HTMLInputElement).value) || 0)}
        />
      </div>

      <UniversalTaxRateSubcard tax={tax} />
      <UniversalTaxSupplySubcard tax={tax} />
    </section>
  );
}

export function UniversalTaxActionsCard({
  tax,
  onReset,
}: {
  tax: UseUniversalTaxReturn;
  onReset: () => void;
}) {
  const { copySummary } = tax;

  return (
    <section class={styles.card} aria-label="Calculation and Actions">
      <div class={styles.heading}>
        <span class={`${styles.ico} ${styles.icoAmber}`}>⚙</span>
        <span>Calculation & Actions</span>
      </div>

      <button type="button" class={styles.btn} onClick={copySummary}>
        <span>▦ Calculate GST</span>
      </button>

      <div class={styles.divider} />

      <div class={styles.lower}>
        <button type="button" class={styles.pill} onClick={onReset}>
          <span>↺ Reset</span>
        </button>
        <button type="button" class={styles.pill} onClick={copySummary}>
          <span>▤ Copy result</span>
        </button>
      </div>
    </section>
  );
}

export function UniversalTaxLeftCards({
  tax,
  onReset,
}: {
  tax: UseUniversalTaxReturn;
  onReset: () => void;
}) {
  return (
    <div class={styles.stack}>
      <UniversalTaxGstCalculationCard tax={tax} />
      <UniversalTaxActionsCard tax={tax} onReset={onReset} />
    </div>
  );
}
