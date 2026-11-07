import type { ResolvedPreset } from '@mangotools/schemas';
import { useEffect, useState } from 'preact/hooks';
import styles from './businessStudio.module.css';
import { MarkupCenterCards } from './MarkupCenterCards.tsx';
import { MarkupLeftCards } from './MarkupLeftCards.tsx';
import { MarkupRightCards } from './MarkupRightCards.tsx';
import { ToolOnboardingTour, TourLauncherButton, type TourStep } from './ToolOnboardingTour.tsx';
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
  preset: ResolvedPreset;
  notify?: (msg: string) => void;
}

export function MarkupCalculatorStudioLayout({
  preset,
  notify,
}: MarkupCalculatorStudioLayoutProps) {
  const state = useMarkupCalculator(preset, notify);
  const [isTourOpen, setIsTourOpen] = useState(false);

  useEffect(() => {
    const handleOpen = () => setIsTourOpen(true);
    window.addEventListener('mangotools:open-tour', handleOpen);
    return () => window.removeEventListener('mangotools:open-tour', handleOpen);
  }, []);

  // Loads the preset's own sample (the values its tool fixtures check), so "Try sample" and the
  // fixtures agree: cost ₹200 at 25% markup.
  const handleSample = () => {
    const sample = Object.values(preset.samples)[0]?.input ?? {};
    state.setPricingMode('find_price');
    state.setCostPrice(Number(sample.cost ?? 200));
    state.setMarkupPercent(Number(sample.markupPercent ?? 25));
    state.setAdditionalCost(0);
    state.setGstPercent(0);
    notify?.('Sample loaded: ₹200 cost at 25% markup');
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
          {/* Title and summary come from the page header (single H1). */}
        </div>

        <div class={styles.topActions}>
          <button type="button" class={styles.pill} onClick={handleSample} data-try-sample="">
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
