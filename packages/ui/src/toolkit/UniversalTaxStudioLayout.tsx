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
import { useUniversalTax } from './useUniversalTax.ts';

const GST_TOUR_STEPS: TourStep[] = [
  {
    id: 'step-inputs',
    targetSelector: '[data-tour="inputs"]',
    stepNumber: 1,
    title: '1. Enter Amount & Quantity',
    description:
      'Type your base transaction price. You can also specify quantity, discount amount, or extra shipping charges.',
    hint: 'Switch to "Inclusive Price" if your entered price already includes tax.',
  },
  {
    id: 'step-country-slabs',
    targetSelector: '[data-tour="country-options"]',
    stepNumber: 2,
    title: '2. Select Supply & Tax Slab',
    description:
      'Choose Intra-state (CGST + SGST) or Inter-state (IGST), and select the applicable rate (0%, 5%, 12%, 18%, 28%).',
    hint: 'TDS/TCS and Cess are computed automatically with exact paisa rounding.',
  },
  {
    id: 'step-results',
    targetSelector: '[data-tour="results"]',
    stepNumber: 3,
    title: '3. Instant Results & Tax Split',
    description:
      'Review your net taxable value, exact tax breakdown, effective tax rate, and visual donut breakdown in real time.',
    hint: 'Guaranteed 0% floating-point drift — 100% in-browser private computation.',
  },
  {
    id: 'step-smart-assistant',
    targetSelector: '[data-tour="smart-assistant"]',
    stepNumber: 4,
    title: '4. Smart Assistant & Custom Slabs',
    description:
      'Use the HSN Rate Finder, estimate B2B Input Tax Credit (ITC), or configure custom multi-tier tax brackets.',
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

  return (
    <div class={styles.studioContainer} data-universal-tax-studio="">
      {/* 1. TOP CALLOUT PROMOTIONAL / ACCURACY BANNER */}
      <div class={styles.saveCalloutBanner}>
        <div class={styles.calloutLeft}>
          <span class={styles.calloutIcon} aria-hidden="true">
            🎁
          </span>
          <div class={styles.calloutTextGroup}>
            <span class={styles.calloutTitle}>Save more with accurate tax calculations</span>
            <span class={styles.calloutSub}>
              Compare inclusive & exclusive prices, explore tax slabs and make smarter business
              decisions.
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <TourLauncherButton onClick={() => setIsTourOpen(true)} />
          <span class={styles.calloutSparkles} aria-hidden="true">
            ✨
          </span>
        </div>
      </div>

      {/* 2. TOP NAV: COUNTRY SELECTOR PILLS & TAX SYSTEM SWITCHER */}
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

        <div style={{ display: 'flex', alignItems: 'center' }}>
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

      {/* 3. 3-COLUMN STUDIO WORKBENCH */}
      <div class={styles.studio3Col}>
        {/* COLUMN 1: CARDS 1 & 2 (INPUTS & COUNTRY OPTIONS) */}
        <div class={styles.studioColumn}>
          <div data-tour="inputs">
            <UniversalTaxInputsCard tax={tax} />
          </div>
          <div data-tour="country-options">
            <UniversalTaxCountryOptionsCard tax={tax} />
          </div>
        </div>

        {/* COLUMN 2: CARD 3 (RESULTS SUMMARY) */}
        <div class={styles.studioColumn}>
          <div data-tour="results">
            <UniversalTaxResultsCard tax={tax} />
          </div>
        </div>

        {/* COLUMN 3: CARDS 4 & 5 (UNIVERSAL TAX SETUP & FORMULA) */}
        <div class={styles.studioColumn}>
          <div data-tour="smart-assistant">
            <UniversalTaxSlabsCard tax={tax} />
          </div>
          <UniversalTaxFormulaCard tax={tax} />
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
