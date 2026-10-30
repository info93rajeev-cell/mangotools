import {
  AmazonFeeCenterCardsWrapper,
  AmazonFeeLeftCardsWrapper,
  AmazonFeeRightCardsWrapper,
} from './AmazonFeeLayoutSections.tsx';
import styles from './businessStudio.module.css';
import { useAmazonFeeEstimator } from './useAmazonFeeEstimator.ts';

export interface AmazonFeeEstimatorStudioLayoutProps {
  notify?: (msg: string) => void;
}

export function AmazonFeeEstimatorStudioLayout({ notify }: AmazonFeeEstimatorStudioLayoutProps) {
  const state = useAmazonFeeEstimator(notify);

  return (
    <div class={styles.studioContainer} data-amazon-fee-studio="" data-testid="amazon-fee-studio">
      <div class={styles.studio3Col}>
        <AmazonFeeLeftCardsWrapper state={state} />
        <AmazonFeeCenterCardsWrapper state={state} />
        <AmazonFeeRightCardsWrapper state={state} />
      </div>
    </div>
  );
}
