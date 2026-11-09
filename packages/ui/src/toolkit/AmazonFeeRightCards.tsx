import { useState } from 'preact/hooks';
import { inr } from './businessFormat.ts';
import styles from './businessStudio.module.css';
import type { AmazonFeeEstimatorState } from './useAmazonFeeEstimator.ts';

export function AmazonFeeVerificationCard() {
  return (
    <section class={styles.card} aria-label="Fee Verification">
      <div class={styles.heading}>
        <span class={`${styles.ico} ${styles.icoAmber}`}>!</span>
        <span>Fee Verification</span>
      </div>
      <div class={styles.warn}>
        Amazon fee schedules change by category, dimensions, shipment and programme. The displayed
        values are manually entered sample amounts, NOT official live rates.
      </div>
    </section>
  );
}

const MODE_NAMES = { fba: 'FBA', easy_ship: 'Easy Ship', self_ship: 'Self Ship' } as const;

export function AmazonScenarioComparisonCard({ state }: { state: AmazonFeeEstimatorState }) {
  const r = state.result;
  const [tab, setTab] = useState<'current' | 'compare'>('current');

  return (
    <section class={styles.card} aria-label="Scenario Comparison">
      <div class={styles.heading}>
        <span class={`${styles.ico} ${styles.icoCyan}`}>⇄</span>
        <span>Scenario Comparison</span>
      </div>

      <div class={styles.tabs} role="tablist" aria-label="Comparison Tabs">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'current'}
          class={`${styles.tab} ${tab === 'current' ? styles.tabActive : ''}`}
          onClick={() => setTab('current')}
        >
          Current
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'compare'}
          class={`${styles.tab} ${tab === 'compare' ? styles.tabActive : ''}`}
          onClick={() => setTab('compare')}
        >
          Compare
        </button>
      </div>

      {tab === 'current' ? (
        <table class={styles.smallTable} aria-label="Scenario Comparison Table">
          <thead>
            <tr>
              <th>Mode</th>
              <th>Net profit</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{MODE_NAMES[state.fulfilmentMode]} · your fees</td>
              <td
                style={{
                  color: r?.economicProfit.startsWith('-')
                    ? 'var(--color-danger)'
                    : 'var(--color-success)',
                }}
              >
                {inr(r?.economicProfit ?? null)}
              </td>
            </tr>
          </tbody>
        </table>
      ) : (
        <p class={styles.muted}>
          Fees differ by mode. To compare, switch the mode above and enter that mode's closing and
          weight-handling fees from Seller Central; the profit updates for each.
        </p>
      )}
    </section>
  );
}

export function AmazonActionsReportingCard({ state }: { state: AmazonFeeEstimatorState }) {
  const { copySummary, downloadCsv } = state;

  return (
    <section class={styles.card} aria-label="Actions and Reporting">
      <div class={styles.heading}>
        <span class={`${styles.ico} ${styles.icoViolet}`}>⇩</span>
        <span>Actions & Reporting</span>
      </div>

      <div class={styles.miniList}>
        <button type="button" class={styles.pill} onClick={copySummary}>
          <span>▤ Copy Profit Breakdown</span>
        </button>
        <button type="button" class={styles.pill} onClick={downloadCsv}>
          <span>⇩ Download CSV</span>
        </button>
        <button type="button" class={styles.pill} onClick={() => window.print()}>
          <span>▣ Print Summary</span>
        </button>
      </div>
    </section>
  );
}

export function AmazonFeeRightCards({ state }: { state: AmazonFeeEstimatorState }) {
  return (
    <div class={styles.stack}>
      <AmazonFeeVerificationCard />
      <AmazonScenarioComparisonCard state={state} />
      <AmazonActionsReportingCard state={state} />
    </div>
  );
}

export const AmazonFeeActionsCard = AmazonActionsReportingCard;
export const AmazonFeeComparisonCard = AmazonScenarioComparisonCard;
export const AmazonFeeNotesCard = AmazonFeeVerificationCard;
