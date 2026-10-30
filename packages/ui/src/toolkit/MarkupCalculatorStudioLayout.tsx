import { useState } from 'preact/hooks';
import styles from './businessStudio.module.css';
import {
  MarkupCenterCardsWrapper,
  MarkupLeftCardsWrapper,
  MarkupRightCardsWrapper,
} from './MarkupLayoutSections.tsx';
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
    title: '1. Cost Price & Markup %',
    description:
      'Enter your unit cost price and desired markup percentage to compute selling price.',
    hint: 'You can also work backward from desired revenue.',
  },
  {
    id: 'step-results',
    targetSelector: '[data-tour="markup-results"]',
    stepNumber: 2,
    title: '2. Selling Price & Profit',
    description:
      'Review your final calculated selling price, total gross profit, and equivalent margin %.',
    hint: 'Calculations run in-browser with zero rounding drift.',
  },
  {
    id: 'step-actions',
    targetSelector: '[data-tour="markup-actions"]',
    stepNumber: 3,
    title: '3. Quick Actions & Copy',
    description:
      'Copy the markup summary to your clipboard or review the margin vs markup reference table.',
  },
];

export interface MarkupCalculatorStudioLayoutProps {
  notify?: (msg: string) => void;
}

export function MarkupCalculatorStudioLayout({ notify }: MarkupCalculatorStudioLayoutProps) {
  const state = useMarkupCalculator(notify);
  const [isTourOpen, setIsTourOpen] = useState(() => !isTourCompleted('markup-calculator'));

  return (
    <div
      class={styles.studioContainer}
      data-markup-calculator-studio=""
      data-testid="markup-calculator-studio"
    >
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
        <TourLauncherButton onClick={() => setIsTourOpen(true)} />
      </div>

      <div class={styles.studio3Col}>
        <MarkupLeftCardsWrapper state={state} />
        <MarkupCenterCardsWrapper state={state} />
        <MarkupRightCardsWrapper state={state} />
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
