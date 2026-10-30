import { useEffect, useState } from 'preact/hooks';
import styles from './businessStudio.module.css';
import { MarkupCenterCards } from './MarkupCenterCards.tsx';
import { MarkupLeftCards } from './MarkupLeftCards.tsx';
import { MarkupRightCards } from './MarkupRightCards.tsx';
import {
  isTourCompleted,
  ToolOnboardingTour,
  TourLauncherButton,
  type TourStep,
} from './ToolOnboardingTour.tsx';
import { useMarkupCalculator } from './useMarkupCalculator.ts';

const MARKUP_TOUR_STEPS: TourStep[] = [
  {
    id: 'step-inputs',
    targetSelector: '[data-tour="markup-inputs"]',
    stepNumber: 1,
    title: '1. Cost Price & Desired Markup',
    description:
      'Enter your unit base cost and desired markup % (e.g. 40%). Switch to Target Margin or Reverse Calculator mode anytime.',
    hint: 'Calculations run 100% locally in your browser with zero server uploads.',
  },
  {
    id: 'step-results',
    targetSelector: '[data-tour="markup-results"]',
    stepNumber: 2,
    title: '2. Recommended Selling Price',
    description:
      'Review your calculated selling price, exact gross profit per unit, gross margin %, and bulk volume profit.',
  },
  {
    id: 'step-comparison',
    targetSelector: '[data-tour="markup-comparison"]',
    stepNumber: 3,
    title: '3. Markup vs Margin Matrix',
    description:
      'Understand the difference between markup (over cost) and margin (over sale price) with the instant reference tier table.',
  },
];

export interface MarkupCalculatorStudioLayoutProps {
  notify?: (msg: string) => void;
}

export function MarkupCalculatorStudioLayout({ notify }: MarkupCalculatorStudioLayoutProps) {
  const state = useMarkupCalculator(notify);
  const [isTourOpen, setIsTourOpen] = useState(() => !isTourCompleted('markup-calculator'));

  useEffect(() => {
    const handleOpen = () => setIsTourOpen(true);
    window.addEventListener('mangotools:open-tour', handleOpen);
    return () => window.removeEventListener('mangotools:open-tour', handleOpen);
  }, []);

  const handleSample = () => {
    state.setCostPrice(500);
    state.setMarkupPercent(40);
    state.setQuantity(20);
    state.setPricingMode('find_price');
    notify?.('Sample ₹500 product at 40% markup loaded');
  };

  const handleReset = () => {
    state.resetToDefaults();
  };

  return (
    <div
      class={styles.studioContainer}
      data-markup-calculator-studio=""
      data-testid="markup-calculator-studio"
    >
      <div class={styles.titleRow}>
        <div class={styles.titleLeft}>
          <div class={styles.heroIcon}>％</div>
          <div class={styles.titleTextGroup}>
            <h1 class={styles.titleHeading}>Markup Calculator</h1>
            <p class={styles.subtitle}>
              Convert cost, markup and target margin into a profitable selling price.
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
        <div data-tour="markup-inputs">
          <MarkupLeftCards state={state} />
        </div>
        <div data-tour="markup-results">
          <MarkupCenterCards state={state} />
        </div>
        <div data-tour="markup-comparison">
          <MarkupRightCards state={state} />
        </div>
      </div>

      <ToolOnboardingTour
        toolId="markup-calculator"
        steps={MARKUP_TOUR_STEPS}
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
      />
    </div>
  );
}
