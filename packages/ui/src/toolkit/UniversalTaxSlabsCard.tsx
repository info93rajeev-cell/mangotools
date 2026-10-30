import { CustomTaxSlabsView } from './CustomTaxSlabsView.tsx';
import { IndiaGstSmartAssistant } from './IndiaGstSmartAssistant.tsx';
import { InternationalTaxGuide } from './InternationalTaxGuide.tsx';
import styles from './universalTax.module.css';
import { COUNTRIES } from './universalTaxEngine.ts';
import type { UseUniversalTaxReturn } from './useUniversalTax.ts';

export interface UniversalTaxSlabsCardProps {
  tax: UseUniversalTaxReturn;
}

function getCard4Metadata(isIndiaGst: boolean, isCustomSlabs: boolean, countryName: string) {
  if (isIndiaGst) {
    return {
      title: 'Smart GST Assistant & Rate Finder',
      sub: 'Search official HSN rates, estimate B2B ITC savings, or review compliance rules.',
    };
  }
  if (isCustomSlabs) {
    return {
      title: 'Progressive Tax Slabs Setup',
      sub: 'Configure multi-tiered tax slabs and rate brackets for custom jurisdictions.',
    };
  }
  return {
    title: `${countryName} Tax Guide & Rules`,
    sub: 'Key statutory tax rates, thresholds, and local compliance requirements.',
  };
}

export function UniversalTaxSlabsCard({ tax }: UniversalTaxSlabsCardProps) {
  const { country, taxSystem, setTaxSystem } = tax;

  const isIndiaGst = country === 'in' && taxSystem === 'gst';
  const isCustomSlabs = taxSystem === 'custom_slabs';
  const profile = COUNTRIES.find((c) => c.id === country) ?? COUNTRIES[0];

  const meta = getCard4Metadata(isIndiaGst, isCustomSlabs, profile.name);

  return (
    <section class={styles.taxCard} aria-label="Smart Tax Assistant" data-tax-slabs-card="">
      <div class={styles.cardHeaderRow}>
        <div class={styles.cardTitleWithBadge}>
          <span class={`${styles.stepBadge} ${styles.stepBadge4}`}>4</span>
          <span class={styles.cardTitleText}>{meta.title}</span>
        </div>
      </div>
      <div class={styles.cardHeaderSub}>{meta.sub}</div>

      {isIndiaGst && (
        <IndiaGstSmartAssistant tax={tax} onSwitchToCustom={() => setTaxSystem('custom_slabs')} />
      )}

      {!isIndiaGst && isCustomSlabs && <CustomTaxSlabsView tax={tax} />}

      {!isIndiaGst && !isCustomSlabs && (
        <InternationalTaxGuide tax={tax} onSwitchToCustom={() => setTaxSystem('custom_slabs')} />
      )}
    </section>
  );
}
