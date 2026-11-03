import styles from './businessStudio.module.css';
import type { SellerProfitabilityState } from './useSellerProfitability.ts';

const priceText = (v: number) =>
  Number.isFinite(v)
    ? `₹${v.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : 'Not reachable';

function PriceStrip({ label, value }: { label: string; value: number }) {
  return (
    <div class={styles.strip} style={{ marginTop: '8px' }}>
      <span>{label}</span>
      <b>{priceText(value)}</b>
    </div>
  );
}

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

      <PriceStrip label="Break-even price*" value={calculation.breakEvenPrice} />
      <PriceStrip label="Price for target profit" value={calculation.priceForTargetProfit} />
      <PriceStrip label="Price for desired margin" value={calculation.priceForTargetMargin} />
      <p class={styles.muted}>
        *The price where profit is zero, with the same fees, GST and returns. Target prices use the
        same costs; desired margin is profit ÷ revenue without GST.
      </p>
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

      <div class={styles.field} style={{ marginTop: '8px' }}>
        <label class={styles.label} for="seller-damaged">
          Product lost per return (%)
        </label>
        <input
          id="seller-damaged"
          type="number"
          inputMode="decimal"
          class={styles.fieldInput}
          value={state.damagedLossPercent}
          onInput={(e) =>
            state.setDamagedLossPercent(Number((e.target as HTMLInputElement).value) || 0)
          }
        />
      </div>

      <div class={styles.warn} style={{ marginTop: '9px' }}>
        Returns cost = return rate × (reverse shipping + the share of product cost you cannot
        resell).
      </div>
    </section>
  );
}

export function SellerExportCompareCard({ state }: { state: SellerProfitabilityState }) {
  const { copySummary, downloadCsv } = state;

  return (
    <section class={styles.card} aria-label="Export">
      <div class={styles.heading}>
        <span class={`${styles.ico} ${styles.icoCyan}`}>⇩</span>
        <span>Export</span>
      </div>

      <div class={styles.miniList}>
        <button type="button" class={styles.pill} onClick={copySummary}>
          <span>▤ Copy Summary</span>
        </button>
        <button type="button" class={styles.pill} onClick={downloadCsv}>
          <span>⇩ Download CSV</span>
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
