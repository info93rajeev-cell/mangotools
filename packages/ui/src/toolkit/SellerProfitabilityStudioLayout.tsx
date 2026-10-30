import { useEffect, useState } from 'preact/hooks';
import styles from './businessStudio.module.css';
import {
  SellerProfitabilityDetailsCard,
  SellerProfitabilityResultsSummaryCard,
  SellerProfitabilityVisualCard,
} from './SellerProfitabilityCenterCards.tsx';
import {
  SellerProfitabilityAdvancedCard,
  SellerProfitabilityInputsCard,
} from './SellerProfitabilityLeftCards.tsx';
import {
  SellerProfitabilityActionsCard,
  SellerProfitabilityNotesCard,
} from './SellerProfitabilityRightCards.tsx';
import {
  isTourCompleted,
  ToolOnboardingTour,
  TourLauncherButton,
  type TourStep,
} from './ToolOnboardingTour.tsx';
import { useSellerProfitability } from './useSellerProfitability.ts';

const PROFIT_MARGIN_TOUR_STEPS: TourStep[] = [
  {
    id: 'step-inputs',
    targetSelector: '[data-tour="profit-inputs"]',
    stepNumber: 1,
    title: '1. Cost of Goods & Selling Price',
    description: 'Enter your unit purchase cost and intended selling price, or target revenue.',
    hint: 'Toggle between margin-based and markup-based calculations anytime.',
  },
  {
    id: 'step-advanced',
    targetSelector: '[data-tour="profit-advanced"]',
    stepNumber: 2,
    title: '2. Operating Costs & Taxes',
    description:
      'Optionally account for packaging, shipping fees, sales commissions, and applicable taxes.',
  },
  {
    id: 'step-results',
    targetSelector: '[data-tour="profit-results"]',
    stepNumber: 3,
    title: '3. Instant Margins & Net Profit',
    description:
      'Review your net profit per unit, total profit, net margin %, and markup in real-time.',
    hint: 'Calculations run 100% locally in your browser with zero server uploads.',
  },
  {
    id: 'step-actions',
    targetSelector: '[data-tour="profit-actions"]',
    stepNumber: 4,
    title: '4. Quick Actions & CSV Export',
    description: 'Copy a clean summary of your profit analysis or export the breakdown to CSV.',
  },
];

export interface SellerProfitabilityStudioLayoutProps {
  notify?: (msg: string) => void;
}

export function SellerProfitabilityStudioLayout({ notify }: SellerProfitabilityStudioLayoutProps) {
  const state = useSellerProfitability(notify);
  const [isTourOpen, setIsTourOpen] = useState(() => !isTourCompleted('profit-margin-calculator'));

  useEffect(() => {
    const handleOpen = () => setIsTourOpen(true);
    window.addEventListener('mangotools:open-tour', handleOpen);
    return () => window.removeEventListener('mangotools:open-tour', handleOpen);
  }, []);

  return (
    <div
      class={styles.studioContainer}
      data-seller-profitability-studio=""
      data-testid="seller-profitability-studio"
    >
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
        <TourLauncherButton onClick={() => setIsTourOpen(true)} />
      </div>

      <div class={styles.studio3Col}>
        {/* Left Column: Inputs & Advanced */}
        <div class={styles.studioColumn}>
          <div data-tour="profit-inputs">
            <SellerProfitabilityInputsCard state={state} />
          </div>
          <div data-tour="profit-advanced">
            <SellerProfitabilityAdvancedCard state={state} />
          </div>
        </div>

        {/* Center Column: Results Headline & Details */}
        <div class={styles.studioColumn}>
          <div data-tour="profit-results">
            <SellerProfitabilityResultsSummaryCard state={state} />
            <SellerProfitabilityDetailsCard state={state} />
            <SellerProfitabilityVisualCard state={state} />
          </div>
        </div>

        {/* Right Column: Actions & Formula Notes */}
        <div class={styles.studioColumn}>
          <div data-tour="profit-actions">
            <SellerProfitabilityActionsCard state={state} />
          </div>
          <SellerProfitabilityNotesCard />
        </div>
      </div>

      <ToolOnboardingTour
        toolId="profit-margin-calculator"
        steps={PROFIT_MARGIN_TOUR_STEPS}
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
      />
    </div>
  );
}
