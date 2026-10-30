import { useState } from 'preact/hooks';
import {
  AmazonFeeCenterCardsWrapper,
  AmazonFeeLeftCardsWrapper,
  AmazonFeeRightCardsWrapper,
} from './AmazonFeeLayoutSections.tsx';
import styles from './businessStudio.module.css';
import {
  isTourCompleted,
  ToolOnboardingTour,
  TourLauncherButton,
  type TourStep,
} from './ToolOnboardingTour.tsx';
import { useAmazonFeeEstimator } from './useAmazonFeeEstimator.ts';

const AMAZON_TOUR_STEPS: TourStep[] = [
  {
    id: 'step-inputs',
    targetSelector: '[data-tour="amazon-inputs"]',
    stepNumber: 1,
    title: '1. Select Category & Price',
    description:
      'Select your Amazon product category, item dimensions, weight tier, and listing price.',
    hint: 'Accurate dimensions ensure correct FBA weight handling tier fees.',
  },
  {
    id: 'step-results',
    targetSelector: '[data-tour="amazon-results"]',
    stepNumber: 2,
    title: '2. Fee Breakdown & Net Payout',
    description:
      'Review Amazon referral fees, closing fees, FBA pick & pack, and your exact net settlement.',
    hint: 'Calculations reflect the latest official Amazon India fee schedule.',
  },
  {
    id: 'step-actions',
    targetSelector: '[data-tour="amazon-actions"]',
    stepNumber: 3,
    title: '3. Quick Actions & Summary',
    description:
      'Copy fee breakdown to your clipboard or download a detailed spreadsheet of your payout.',
  },
];

export interface AmazonFeeEstimatorStudioLayoutProps {
  notify?: (msg: string) => void;
}

export function AmazonFeeEstimatorStudioLayout({ notify }: AmazonFeeEstimatorStudioLayoutProps) {
  const state = useAmazonFeeEstimator(notify);
  const [isTourOpen, setIsTourOpen] = useState(
    () => !isTourCompleted('amazon-india-seller-fee-profit-estimator'),
  );

  return (
    <div class={styles.studioContainer} data-amazon-fee-studio="" data-testid="amazon-fee-studio">
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
        <TourLauncherButton onClick={() => setIsTourOpen(true)} />
      </div>

      <div class={styles.studio3Col}>
        <AmazonFeeLeftCardsWrapper state={state} />
        <AmazonFeeCenterCardsWrapper state={state} />
        <AmazonFeeRightCardsWrapper state={state} />
      </div>

      <ToolOnboardingTour
        toolId="amazon-india-seller-fee-profit-estimator"
        steps={AMAZON_TOUR_STEPS}
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
      />
    </div>
  );
}
