import { CustomTaxSlabsView } from './CustomTaxSlabsView.tsx';
import styles from './universalTax.module.css';
import type { UseUniversalTaxReturn } from './useUniversalTax.ts';

export interface UniversalTaxSlabsCardProps {
  tax: UseUniversalTaxReturn;
}

export function UniversalTaxSlabsCard({ tax }: UniversalTaxSlabsCardProps) {
  return (
    <section class={styles.taxCard} aria-label="Universal Tax Setup" data-tax-slabs-card="">
      <div class={styles.cardHeaderRow}>
        <div class={styles.cardTitleWithBadge}>
          <span class={`${styles.stepBadge} ${styles.stepBadge4}`}>4</span>
          <span class={styles.cardTitleText}>🌐 Universal Tax Setup (For other countries)</span>
        </div>
      </div>
      <div class={styles.cardHeaderSub}>Create or edit tax slabs and rules for any country.</div>

      <CustomTaxSlabsView tax={tax} />
    </section>
  );
}
