import { useEffect, useState } from 'preact/hooks';
import { AmazonFeeCenterCards } from './AmazonFeeCenterCards.tsx';
import { AmazonFeeLeftCards } from './AmazonFeeLeftCards.tsx';
import { AmazonFeeRightCards } from './AmazonFeeRightCards.tsx';
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
    hint: 'Calculations run 100% locally in your browser with zero server uploads.',
  },
  {
    id: 'step-fees',
    targetSelector: '[data-tour="amazon-fees"]',
    stepNumber: 2,
    title: '2. Referral, Closing & FBA Fees',
    description: 'Enter your category referral fee, closing fee, and weight handling fee.',
  },
  {
    id: 'step-results',
    targetSelector: '[data-tour="amazon-results"]',
    stepNumber: 3,
    title: '3. Instant Net Payout & Margin',
    description:
      'Review your per-order net profit, net margin %, and itemized deductions statement.',
  },
  {
    id: 'step-scenarios',
    targetSelector: '[data-tour="amazon-scenarios"]',
    stepNumber: 4,
    title: '4. FBA vs Easy Ship Comparison',
    description: 'Compare profitability between FBA, Easy Ship, and Self Ship models.',
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

  useEffect(() => {
    const handleOpen = () => setIsTourOpen(true);
    window.addEventListener('mangotools:open-tour', handleOpen);
    return () => window.removeEventListener('mangotools:open-tour', handleOpen);
  }, []);

  const handleSample = () => {
    state.setSellingPrice(1500);
    state.setProductPackagingCost(635);
    state.setReferralFee(120);
    state.setClosingHandling(125);
    state.setFeeGst(44.1);
    state.setAdsReturns(100);
    state.setFulfilmentMode('fba');
    notify?.('Sample Amazon product loaded (₹1,500 SP)');
  };

  const handleReset = () => {
    state.resetToDefaults();
  };

  return (
    <div class={styles.studioContainer} data-amazon-fee-studio="" data-testid="amazon-fee-studio">
      <div class={styles.titleRow}>
        <div class={styles.titleLeft}>
          <div class={styles.heroIcon}>▣</div>
          <div class={styles.titleTextGroup}>
            <h1 class={styles.titleHeading}>Amazon India Seller Fee & Profit Estimator</h1>
            <p class={styles.subtitle}>
              Manual Amazon fee estimator: input your fee rates, analyse settlement and
              profitability.
            </p>
          </div>
        </div>

        <div class={styles.topActions}>
          <button type="button" class={styles.pill} onClick={handleSample}>
            <span>☼ Try Sample</span>
          </button>
          <button type="button" class={styles.pill} onClick={state.copySummary}>
            <span>▤ Copy</span>
          </button>
          <button type="button" class={`${styles.pill} ${styles.pillDanger}`} onClick={handleReset}>
            <span>↺ Reset</span>
          </button>
          <TourLauncherButton onClick={() => setIsTourOpen(true)} />
        </div>
      </div>

      <div class={styles.columns}>
        <div data-tour="amazon-inputs">
          <AmazonFeeLeftCards state={state} />
        </div>
        <div data-tour="amazon-results">
          <AmazonFeeCenterCards state={state} />
        </div>
        <div data-tour="amazon-scenarios">
          <AmazonFeeRightCards state={state} />
        </div>
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
