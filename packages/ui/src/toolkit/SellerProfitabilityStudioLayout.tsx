import type { ToolSnapshot, ToolStore } from '@mangotools/runtime';
import type { ResolvedPreset } from '@mangotools/schemas';
import { useEffect, useState } from 'preact/hooks';
import styles from './businessStudio.module.css';
import { SellerProfitabilityCenterCards } from './SellerProfitabilityCenterCards.tsx';
import { SellerProfitabilityLeftCards } from './SellerProfitabilityLeftCards.tsx';
import { SellerProfitabilityRightCards } from './SellerProfitabilityRightCards.tsx';
import { ToolOnboardingTour, TourLauncherButton, type TourStep } from './ToolOnboardingTour.tsx';
import { useSellerProfitability } from './useSellerProfitability.ts';

const PROFIT_MARGIN_TOUR_STEPS: TourStep[] = [
  {
    id: 'step-inputs',
    targetSelector: '[data-tour="profit-inputs"]',
    stepNumber: 1,
    title: '1. Cost of Goods & Selling Price',
    description: 'Enter your unit purchase cost, packaging, shipping, and target selling price.',
    hint: 'Calculations run 100% locally in your browser with zero server uploads.',
  },
  {
    id: 'step-fees',
    targetSelector: '[data-tour="profit-fees"]',
    stepNumber: 2,
    title: '2. Marketplace & Operating Fees',
    description: 'Specify commission %, advertising per order, other charges, and fee GST.',
  },
  {
    id: 'step-results',
    targetSelector: '[data-tour="profit-results"]',
    stepNumber: 3,
    title: '3. Instant Net Margin & Breakdown',
    description:
      'Review your per-order net profit, net margin %, markup on cost, and visual expenditure allocation.',
  },
  {
    id: 'step-breakeven',
    targetSelector: '[data-tour="profit-breakeven"]',
    stepNumber: 4,
    title: '4. Break-even & Returns Drag',
    description: 'Inspect break-even target prices and calculate the hidden cost of RTO returns.',
  },
];

export interface SellerProfitabilityStudioLayoutProps {
  preset: ResolvedPreset;
  snapshot: ToolSnapshot;
  store: ToolStore;
  notify?: (msg: string) => void;
}

export function SellerProfitabilityStudioLayout({
  preset,
  snapshot,
  store,
  notify,
}: SellerProfitabilityStudioLayoutProps) {
  const state = useSellerProfitability(preset, snapshot, store, notify);
  const [isTourOpen, setIsTourOpen] = useState(false);

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
      <div class={styles.titleRow}>
        <div class={styles.titleLeft}>
          <div class={styles.heroIcon}>↗</div>
          {/* Title and summary come from the page header (single H1). */}
        </div>

        <div class={styles.topActions}>
          <button type="button" class={styles.pill} onClick={state.loadSample}>
            <span>☼ Try Sample</span>
          </button>
          <button type="button" class={styles.pill} onClick={state.copySummary}>
            <span>▤ Copy</span>
          </button>
          <button
            type="button"
            class={`${styles.pill} ${styles.pillDanger}`}
            onClick={state.resetToDefaults}
          >
            <span>↺ Reset</span>
          </button>
          <TourLauncherButton onClick={() => setIsTourOpen(true)} />
        </div>
      </div>

      {state.error ? (
        <p class={styles.note} role="alert" data-seller-error="">
          {state.error}
        </p>
      ) : null}

      <div class={styles.columns}>
        <div data-tour="profit-inputs">
          <SellerProfitabilityLeftCards state={state} />
        </div>
        <div data-tour="profit-results">
          <SellerProfitabilityCenterCards state={state} />
        </div>
        <div data-tour="profit-breakeven">
          <SellerProfitabilityRightCards state={state} />
        </div>
      </div>

      <ToolOnboardingTour
        toolId="seller-profitability-calculator"
        steps={PROFIT_MARGIN_TOUR_STEPS}
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
      />
    </div>
  );
}
