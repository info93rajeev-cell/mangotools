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
      <AmazonFeeInputsCard state={state} />
      <AmazonFeeMarketplaceCard state={state} />
    </div>
  );
}

export function AmazonFeeCenterCardsWrapper({ state }: { state: AmazonFeeEstimatorState }) {
  return (
    <div class={styles.studioColumn}>
      <AmazonFeeResultsSummaryCard state={state} />
      <AmazonFeeStatementCard state={state} />
      <AmazonFeeVisualCard state={state} />
    </div>
  );
}

export function AmazonFeeRightCardsWrapper({ state }: { state: AmazonFeeEstimatorState }) {
  return (
    <div class={styles.studioColumn}>
      <AmazonFeeActionsCard state={state} />
      <AmazonFeeComparisonCard state={state} />
      <AmazonFeeNotesCard />
    </div>
  );
}
