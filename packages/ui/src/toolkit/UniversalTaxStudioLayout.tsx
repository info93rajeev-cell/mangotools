import { useEffect, useState } from 'preact/hooks';
import {
  isTourCompleted,
  ToolOnboardingTour,
  TourLauncherButton,
  type TourStep,
} from './ToolOnboardingTour.tsx';
import { UniversalTaxCountryOptionsCard } from './UniversalTaxCountryOptionsCard.tsx';
import { UniversalTaxFormulaCard } from './UniversalTaxFormulaCard.tsx';
import { UniversalTaxInputsCard } from './UniversalTaxInputsCard.tsx';
import { UniversalTaxResultsCard } from './UniversalTaxResultsCard.tsx';
import { UniversalTaxSlabsCard } from './UniversalTaxSlabsCard.tsx';
import styles from './universalTax.module.css';
import { COUNTRIES, type CountryCode } from './universalTaxEngine.ts';
import { type UseUniversalTaxReturn, useUniversalTax } from './useUniversalTax.ts';

const UNIVERSAL_TAX_TOUR_STEPS: TourStep[] = [
  {
    id: 'step-inputs',
    targetSelector: '[data-tour="inputs"]',
    stepNumber: 1,
    title: '1. Calculation Inputs',
    description:
      'Choose Exclusive or Inclusive price mode, and enter your base amount, quantity, discount, and shipping charges.',
    hint: 'Calculations run 100% locally in your browser with zero server uploads.',
  },
  {
    id: 'step-country-options',
    targetSelector: '[data-tour="country-options"]',
    stepNumber: 2,
    title: '2. Country Tax Options',
    description:
      'Configure jurisdiction-specific tax rules, such as Intra-state (CGST+SGST) vs Inter-state (IGST), standard GST rates, and Cess.',
  },
  {
    id: 'step-results',
    targetSelector: '[data-tour="results"]',
    stepNumber: 3,
    title: '3. Results Summary & Breakdown',
    description:
      'View final amount, taxable amount, total tax, effective rate, and visual donut breakdown in real time.',
  },
  {
    id: 'step-universal-setup',
    targetSelector: '[data-tour="universal-setup"]',
    stepNumber: 4,
    title: '4. Universal Tax Setup & Formulas',
    description:
      'Set up progressive tax slabs for any country or inspect statutory tax formulas for GST, VAT, and Sales Tax.',
  },
];

export interface UniversalTaxStudioLayoutProps {
  notify?: (msg: string) => void;
}

function UniversalTaxHeaderBar({ onOpenTour }: { onOpenTour: () => void }) {
  return (
    <div class={styles.topHeaderRow}>
      <div class={styles.titleGroup}>
        <h1 class={styles.pageTitle}>Universal Tax Calculator</h1>
        <p class={styles.pageSubtitle}>
          Calculate GST, VAT, sales tax, and custom tax slabs for India and other countries — right
          in your browser.
        </p>
      </div>

      <div class={styles.saveCalloutBanner}>
        <div class={styles.calloutLeft}>
          <span class={styles.calloutIcon} aria-hidden="true">
            🎁
          </span>
          <div class={styles.calloutTextGroup}>
            <span class={styles.calloutTitle}>Save more with accurate tax calculations</span>
            <span class={styles.calloutSub}>
              Compare inclusive &amp; exclusive prices, explore tax slabs and make smarter business
              decisions.
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span class={styles.calloutSparkles} aria-hidden="true">
            ✨
          </span>
          <TourLauncherButton onClick={onOpenTour} />
        </div>
      </div>
    </div>
  );
}

function UniversalTaxTopNav({ tax }: { tax: UseUniversalTaxReturn }) {
  return (
    <nav class={styles.topBarNav} aria-label="Country and Tax System Navigation">
      <div class={styles.countryPillsRow}>
        {COUNTRIES.map((c) => (
          <button
            key={c.id}
            type="button"
            class={styles.countryPillBtn}
            data-active={String(tax.country === c.id)}
            onClick={() => tax.setCountry(c.id as CountryCode)}
            aria-pressed={tax.country === c.id}
          >
            <span>{c.flag}</span>
            <span>{c.name}</span>
          </button>
        ))}
      </div>

      <div class={styles.taxSystemNavWrapper}>
        <div class={styles.navDivider} aria-hidden="true" />
        <div class={styles.taxSystemNavGroup}>
          <span class={styles.taxSystemNavLabel}>Tax system:</span>
          <div class={styles.taxSystemTabs} role="tablist" aria-label="Tax System Categories">
            <button
              type="button"
              class={styles.taxSystemTabBtn}
              data-active={String(tax.taxSystem === 'gst')}
              onClick={() => tax.setTaxSystem('gst')}
              role="tab"
              aria-selected={tax.taxSystem === 'gst'}
            >
              India GST
            </button>
            <button
              type="button"
              class={styles.taxSystemTabBtn}
              data-active={String(tax.taxSystem === 'vat')}
              onClick={() => tax.setTaxSystem('vat')}
              role="tab"
              aria-selected={tax.taxSystem === 'vat'}
            >
              VAT
            </button>
            <button
              type="button"
              class={styles.taxSystemTabBtn}
              data-active={String(tax.taxSystem === 'sales_tax')}
              onClick={() => tax.setTaxSystem('sales_tax')}
              role="tab"
              aria-selected={tax.taxSystem === 'sales_tax'}
            >
              Sales Tax
            </button>
            <button
              type="button"
              class={styles.taxSystemTabBtn}
              data-active={String(tax.taxSystem === 'custom_slabs')}
              onClick={() => tax.setTaxSystem('custom_slabs')}
              role="tab"
              aria-selected={tax.taxSystem === 'custom_slabs'}
            >
              Custom Slabs
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
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

  return (
    <div
      class={styles.studioContainer}
      data-universal-tax-studio=""
      data-testid="gst-calculator-studio"
    >
      <UniversalTaxHeaderBar onOpenTour={() => setIsTourOpen(true)} />
      <UniversalTaxTopNav tax={tax} />

      <div class={styles.studio3Col}>
        <div class={styles.studioColumn}>
          <div data-tour="inputs">
            <UniversalTaxInputsCard tax={tax} />
          </div>
          <div data-tour="country-options">
            <UniversalTaxCountryOptionsCard tax={tax} />
          </div>
        </div>

        <div class={styles.studioColumn}>
          <div data-tour="results">
            <UniversalTaxResultsCard tax={tax} />
          </div>
        </div>

        <div class={styles.studioColumn}>
          <div data-tour="universal-setup">
            <UniversalTaxSlabsCard tax={tax} />
          </div>
          <UniversalTaxFormulaCard tax={tax} />
        </div>
      </div>

      <div class={styles.mobileOnlyActions}>
        <button type="button" class={styles.calculateBtn} onClick={tax.copySummary}>
          <span>▦</span>
          <span>Calculate Tax</span>
        </button>
        <button type="button" class={styles.ghostActionBtn} onClick={tax.copySummary}>
          <span>📋</span>
          <span>Copy Summary</span>
        </button>
        <button type="button" class={styles.ghostActionBtn} onClick={tax.downloadCsv}>
          <span>📥</span>
          <span>Download CSV</span>
        </button>
      </div>

      <ToolOnboardingTour
        toolId="gst-calculator"
        steps={UNIVERSAL_TAX_TOUR_STEPS}
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
      />
    </div>
  );
}
