import {
  AmazonFeeResultsSummaryCard,
  AmazonFeeStatementCard,
  AmazonFeeVisualCard,
} from './AmazonFeeCenterCards.tsx';
import { AmazonFeeInputsCard, AmazonFeeMarketplaceCard } from './AmazonFeeLeftCards.tsx';
import {
  AmazonFeeActionsCard,
  AmazonFeeComparisonCard,
  AmazonFeeNotesCard,
} from './AmazonFeeRightCards.tsx';
import styles from './businessStudio.module.css';
import type { AmazonFeeEstimatorState } from './useAmazonFeeEstimator.ts';

export function AmazonFeeLeftCardsWrapper({ state }: { state: AmazonFeeEstimatorState }) {
  return (
    <div class={styles.studioColumn}>
      <div data-tour="amazon-inputs">
        <AmazonFeeInputsCard state={state} />
      </div>
      <AmazonFeeMarketplaceCard state={state} />
    </div>
  );
}

export function AmazonFeeCenterCardsWrapper({ state }: { state: AmazonFeeEstimatorState }) {
  return (
    <div class={styles.studioColumn}>
      <div data-tour="amazon-results">
        <AmazonFeeResultsSummaryCard state={state} />
        <AmazonFeeStatementCard state={state} />
        <AmazonFeeVisualCard state={state} />
      </div>
    </div>
  );
}

export function AmazonFeeRightCardsWrapper({ state }: { state: AmazonFeeEstimatorState }) {
  return (
    <div class={styles.studioColumn}>
      <div data-tour="amazon-actions">
        <AmazonFeeActionsCard state={state} />
      </div>
      <AmazonFeeComparisonCard state={state} />
      <AmazonFeeNotesCard />
    </div>
  );
}
