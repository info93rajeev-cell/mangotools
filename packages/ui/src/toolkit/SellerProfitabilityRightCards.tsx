import styles from './businessStudio.module.css';
import type { SellerProfitabilityState } from './useSellerProfitability.ts';

export function SellerTargetBreakevenCard({ state }: { state: SellerProfitabilityState }) {
  const { targetProfit, setTargetProfit, targetMargin, setTargetMargin, calculation } = state;

  return (
    <section class={styles.card} aria-label="Target and Break-even">
      <div class={styles.heading}>
        <span class={`${styles.ico} ${styles.icoAmber}`}>🎯</span>
        <span>Target & Break-even</span>
      </div>

      <div class={styles.grid2}>
        <div class={styles.field}>
          <label class={styles.label} for="seller-target-profit">
            Target profit (₹)
          </label>
          <input
            id="seller-target-profit"
            type="number"
            class={styles.fieldInput}
            value={targetProfit}
            onInput={(e) => setTargetProfit(Number((e.target as HTMLInputElement).value) || 0)}
          />
        </div>
        <div class={styles.field}>
          <label class={styles.label} for="seller-target-margin">
            Desired margin
          </label>
          <input
            id="seller-target-margin"
            type="number"
            class={styles.fieldInput}
            value={targetMargin}
            onInput={(e) => setTargetMargin(Number((e.target as HTMLInputElement).value) || 0)}
          />
        </div>
      </div>

      <div class={styles.strip} style={{ marginTop: '10px' }}>
        <span>Break-even price*</span>
        <b>₹{calculation.breakEvenPrice.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</b>
      </div>
      <p class={styles.muted}>*Depends on variable fee model and return assumptions.</p>
    </section>
  );
}

export function SellerReturnsRtoCard({ state }: { state: SellerProfitabilityState }) {
  const { returnRate, setReturnRate, reverseShipping, setReverseShipping } = state;

  return (
    <section class={styles.card} aria-label="Returns and RTO">
      <div class={styles.heading}>
        <span class={`${styles.ico} ${styles.icoPink}`}>↶</span>
        <span>Returns & RTO (Advanced)</span>
      </div>

      <div class={styles.grid2}>
        <div class={styles.field}>
          <label class={styles.label} for="seller-ret-rate">
            Return rate (%)
          </label>
          <input
            id="seller-ret-rate"
            type="number"
            class={styles.fieldInput}
            value={returnRate}
            onInput={(e) => setReturnRate(Number((e.target as HTMLInputElement).value) || 0)}
          />
        </div>
        <div class={styles.field}>
          <label class={styles.label} for="seller-rev-ship">
            Reverse shipping (₹)
          </label>
          <input
            id="seller-rev-ship"
            type="number"
            class={styles.fieldInput}
            value={reverseShipping}
            onInput={(e) => setReverseShipping(Number((e.target as HTMLInputElement).value) || 0)}
          />
        </div>
      </div>

      <div class={styles.warn} style={{ marginTop: '9px' }}>
        Return-adjusted profit requires a stated probability and recovery assumption.
      </div>
    </section>
  );
}

export function SellerExportCompareCard({ state }: { state: SellerProfitabilityState }) {
  const { copySummary, downloadCsv } = state;

  return (
    <section class={styles.card} aria-label="Export or Compare">
      <div class={styles.heading}>
        <span class={`${styles.ico} ${styles.icoCyan}`}>⇩</span>
        <span>Export / Compare</span>
      </div>

      <div class={styles.miniList}>
        <button type="button" class={styles.pill} onClick={copySummary}>
          <span>▤ Copy Summary</span>
        </button>
        <button type="button" class={styles.pill} onClick={downloadCsv}>
          <span>⇩ Download CSV</span>
        </button>
        <button type="button" class={styles.pill} onClick={copySummary}>
          <span>⚖ Compare Scenarios</span>
        </button>
      </div>
    </section>
  );
}

export function SellerProfitabilityRightCards({ state }: { state: SellerProfitabilityState }) {
  return (
    <div class={styles.stack}>
      <SellerTargetBreakevenCard state={state} />
      <SellerReturnsRtoCard state={state} />
      <SellerExportCompareCard state={state} />
    </div>
  );
}

export const SellerProfitabilityActionsCard = SellerExportCompareCard;
export const SellerProfitabilityNotesCard = SellerReturnsRtoCard;
