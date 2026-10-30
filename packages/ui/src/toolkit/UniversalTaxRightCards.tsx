import { useState } from 'preact/hooks';
import styles from './businessStudio.module.css';
import type { UseUniversalTaxReturn } from './useUniversalTax.ts';

interface LineItem {
  id: string;
  name: string;
  amount: number;
}

const DEFAULT_LINE_ITEMS: LineItem[] = [
  { id: 'item-1', name: 'Product A', amount: 5000 },
  { id: 'item-2', name: 'Product B', amount: 3000 },
];

export function UniversalTaxVisualCard({ tax }: { tax: UseUniversalTaxReturn }) {
  const { results } = tax;
  const baseAmt = Math.max(0, results.taxableAmount);
  const taxAmt = Math.max(0, results.totalTax);
  const total = baseAmt + taxAmt;
  const basePct = total > 0 ? Math.round((baseAmt / total) * 100) : 100;
  const donutGradient = `conic-gradient(#1671ed 0% ${basePct}%, #1ab96b ${basePct}% 100%)`;

  return (
    <section class={styles.card} aria-label="Tax Share Visual">
      <div class={styles.heading}>
        <span class={`${styles.ico} ${styles.icoPink}`}>◔</span>
        <span>Tax Share Visual</span>
      </div>

      <div class={styles.chartcircle} style={{ background: donutGradient }}>
        <div class={styles.chartcircleInner}>
          <span>₹ {results.finalAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
          <span style={{ fontSize: '10px', color: '#64748b' }}>Total</span>
        </div>
      </div>

      <div class={styles.legend}>
        <span>
          <i class={styles.dot} style={{ background: '#1671ed' }} />
          Base ₹{results.taxableAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
        </span>
        <span>
          <i class={styles.dot} style={{ background: '#1ab96b' }} />
          GST ₹{results.totalTax.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
        </span>
      </div>
    </section>
  );
}

export function UniversalTaxMultipleItemsCard({ tax }: { tax: UseUniversalTaxReturn }) {
  const { setAmount } = tax;
  const [mode, setMode] = useState<'single' | 'bulk'>('single');
  const [items, setItems] = useState<LineItem[]>(DEFAULT_LINE_ITEMS);

  const handleAddItem = () => {
    const newItem: LineItem = {
      id: `item-${Date.now()}`,
      name: `Product ${String.fromCharCode(65 + (items.length % 26))}`,
      amount: 2000,
    };
    const nextList = [...items, newItem];
    setItems(nextList);
    const totalSum = nextList.reduce((acc, curr) => acc + curr.amount, 0);
    setAmount(totalSum);
  };

  return (
    <section class={styles.card} aria-label="Multiple Items">
      <div class={styles.heading}>
        <span class={`${styles.ico} ${styles.icoAmber}`}>▦</span>
        <span>Multiple Items (Optional)</span>
      </div>

      <div class={styles.tabs} role="tablist" aria-label="Single vs Bulk items">
        <button
          type="button"
          class={`${styles.tab} ${mode === 'single' ? styles.tabActive : ''}`}
          onClick={() => setMode('single')}
        >
          Single
        </button>
        <button
          type="button"
          class={`${styles.tab} ${mode === 'bulk' ? styles.tabActive : ''}`}
          onClick={() => setMode('bulk')}
        >
          Bulk items
        </button>
      </div>

      <table class={styles.smallTable} aria-label="Line items table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it) => (
            <tr key={it.id}>
              <td>{it.name}</td>
              <td>₹{it.amount.toLocaleString('en-IN')}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <button
        type="button"
        class={styles.pill}
        style={{ marginTop: '9px', width: '100%' }}
        onClick={handleAddItem}
      >
        <span>+ Add item</span>
      </button>
    </section>
  );
}

export function UniversalTaxAccuracyNotesCard() {
  return (
    <section class={styles.card} aria-label="Accuracy Notes">
      <div class={styles.heading}>
        <span class={`${styles.ico} ${styles.icoRed}`}>!</span>
        <span>Accuracy Notes</span>
      </div>
      <div class={styles.warn}>
        Confirm classification and applicable GST rate for the actual supply. Rates in this
        reference are sample inputs, not a legal determination.
      </div>
    </section>
  );
}

export function UniversalTaxRightCards({ tax }: { tax: UseUniversalTaxReturn }) {
  return (
    <div class={styles.stack}>
      <UniversalTaxVisualCard tax={tax} />
      <UniversalTaxMultipleItemsCard tax={tax} />
      <UniversalTaxAccuracyNotesCard />
    </div>
  );
}
