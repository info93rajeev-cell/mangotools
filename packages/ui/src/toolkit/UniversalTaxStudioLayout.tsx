import { useEffect, useState } from 'preact/hooks';
import styles from './businessStudio.module.css';
import {
  isTourCompleted,
  ToolOnboardingTour,
  TourLauncherButton,
  type TourStep,
} from './ToolOnboardingTour.tsx';
import { UniversalTaxCenterCards } from './UniversalTaxCenterCards.tsx';
import { UniversalTaxLeftCards } from './UniversalTaxLeftCards.tsx';
import { UniversalTaxRightCards } from './UniversalTaxRightCards.tsx';
import { useUniversalTax } from './useUniversalTax.ts';

const GST_TOUR_STEPS: TourStep[] = [
  {
    id: 'step-inputs',
    targetSelector: '[data-tour="inputs"]',
    stepNumber: 1,
    title: '1. GST Mode & Amount',
    description:
      'Choose Add GST (exclusive), Remove GST (inclusive), or GST Split. Enter your transaction amount.',
    hint: 'Calculations run 100% locally in your browser with zero server uploads.',
  },
  {
    id: 'step-rate-supply',
    targetSelector: '[data-tour="rate-supply"]',
    stepNumber: 2,
    title: '2. Rate & Supply Type',
    description:
      'Select standard GST rates (0%, 5%, 18%, 40%, or Custom) and toggle between Intra-state (CGST+SGST) and Inter-state (IGST).',
  },
  {
    id: 'step-results',
    targetSelector: '[data-tour="results"]',
    stepNumber: 3,
    title: '3. Instant Results & Tax Split',
    description:
      'View your grand total, taxable base, and exact CGST, SGST, or IGST breakdown in real-time.',
  },
  {
    id: 'step-visual-bulk',
    targetSelector: '[data-tour="visual-bulk"]',
    stepNumber: 4,
    title: '4. Visual Share & Multiple Items',
    description: 'Explore the interactive tax share donut visual or add multiple bulk line items.',
  },
];

export interface UniversalTaxStudioLayoutProps {
  notify?: (msg: string) => void;
}

export function UniversalTaxStudioLayout({ notify }: UniversalTaxStudioLayoutProps) {
  const tax = useUniversalTax(notify);
  const [isTourOpen, setIsTourOpen] = useState(false);

  useEffect(() => {
    if (!isTourCompleted('gst-calculator')) {
      const timer = setTimeout(() => setIsTourOpen(true), 600);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    const handleOpen = () => setIsTourOpen(true);
    window.addEventListener('mangotools:open-tour', handleOpen);
    return () => window.removeEventListener('mangotools:open-tour', handleOpen);
  }, []);

  const handleSample = () => {
    tax.setAmount(10000);
    tax.setGstRate(18);
    tax.setSupplyType('intra');
    tax.setPriceMode('exclusive');
    notify?.('Sample ₹10,000 at 18% GST loaded');
  };

  const handleReset = () => {
    tax.setAmount(10000);
    tax.setGstRate(18);
    tax.setSupplyType('intra');
    tax.setPriceMode('exclusive');
    notify?.('Inputs reset to defaults');
  };

  return (
    <div
      class={styles.studioContainer}
      data-universal-tax-studio=""
      data-testid="gst-calculator-studio"
    >
      <div class={styles.titleRow}>
        <div class={styles.titleLeft}>
          <div class={styles.heroIcon}>▦</div>
          <div class={styles.titleTextGroup}>
            <h1 class={styles.titleHeading}>GST Calculator</h1>
            <p class={styles.subtitle}>
              Add or remove GST, split CGST and SGST or IGST, and see exact taxable and total
              amounts.
            </p>
          </div>
        </div>

        <div class={styles.topActions}>
          <button type="button" class={styles.pill} onClick={handleSample}>
            <span>☼ Try Sample</span>
          </button>
          <button type="button" class={styles.pill} onClick={tax.copySummary}>
            <span>▤ Copy</span>
          </button>
          <button type="button" class={`${styles.pill} ${styles.pillDanger}`} onClick={handleReset}>
            <span>↺ Reset</span>
          </button>
          <TourLauncherButton onClick={() => setIsTourOpen(true)} />
        </div>
      </div>

      <div class={styles.columns}>
        <div data-tour="inputs">
          <UniversalTaxLeftCards tax={tax} onReset={handleReset} />
        </div>
        <div data-tour="results">
          <UniversalTaxCenterCards tax={tax} />
        </div>
        <div data-tour="visual-bulk">
          <UniversalTaxRightCards tax={tax} />
        </div>
      </div>

      <ToolOnboardingTour
        toolId="gst-calculator"
        steps={GST_TOUR_STEPS}
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
      />
    </div>
  );
}
