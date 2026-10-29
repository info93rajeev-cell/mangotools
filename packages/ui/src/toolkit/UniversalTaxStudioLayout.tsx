import { UniversalTaxCountryOptionsCard } from './UniversalTaxCountryOptionsCard.tsx';
import { UniversalTaxFormulaCard } from './UniversalTaxFormulaCard.tsx';
import { UniversalTaxInputsCard } from './UniversalTaxInputsCard.tsx';
import { UniversalTaxResultsCard } from './UniversalTaxResultsCard.tsx';
import { UniversalTaxSlabsCard } from './UniversalTaxSlabsCard.tsx';
import styles from './universalTax.module.css';
import { COUNTRIES, type CountryCode } from './universalTaxEngine.ts';
import { useUniversalTax } from './useUniversalTax.ts';

export interface UniversalTaxStudioLayoutProps {
  notify?: (msg: string) => void;
}

export function UniversalTaxStudioLayout({ notify }: UniversalTaxStudioLayoutProps) {
  const tax = useUniversalTax(notify);

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
        <span class={styles.calloutSparkles} aria-hidden="true">
          ✨
        </span>
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
          <UniversalTaxInputsCard tax={tax} />
          <UniversalTaxCountryOptionsCard tax={tax} />
        </div>

        {/* COLUMN 2: CARD 3 (RESULTS SUMMARY) */}
        <div class={styles.studioColumn}>
          <UniversalTaxResultsCard tax={tax} />
        </div>

        {/* COLUMN 3: CARDS 4 & 5 (UNIVERSAL TAX SETUP & FORMULA) */}
        <div class={styles.studioColumn}>
          <UniversalTaxSlabsCard tax={tax} />
          <UniversalTaxFormulaCard tax={tax} />
        </div>
      </div>
    </div>
  );
}
