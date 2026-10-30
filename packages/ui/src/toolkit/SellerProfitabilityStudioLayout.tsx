import styles from './businessStudio.module.css';
import {
  SellerProfitabilityDetailsCard,
  SellerProfitabilityResultsSummaryCard,
  SellerProfitabilityVisualCard,
} from './SellerProfitabilityCenterCards.tsx';
import {
  SellerProfitabilityAdvancedCard,
  SellerProfitabilityInputsCard,
} from './SellerProfitabilityLeftCards.tsx';
import {
  SellerProfitabilityActionsCard,
  SellerProfitabilityNotesCard,
} from './SellerProfitabilityRightCards.tsx';
import { useSellerProfitability } from './useSellerProfitability.ts';

export interface SellerProfitabilityStudioLayoutProps {
  notify?: (msg: string) => void;
}

export function SellerProfitabilityStudioLayout({ notify }: SellerProfitabilityStudioLayoutProps) {
  const state = useSellerProfitability(notify);

  return (
    <div
      class={styles.studioContainer}
      data-seller-profitability-studio=""
      data-testid="seller-profitability-studio"
    >
      <div class={styles.studio3Col}>
        {/* Left Column: Inputs & Advanced */}
        <div class={styles.studioColumn}>
          <SellerProfitabilityInputsCard state={state} />
          <SellerProfitabilityAdvancedCard state={state} />
        </div>

        {/* Center Column: Results Headline & Details */}
        <div class={styles.studioColumn}>
          <SellerProfitabilityResultsSummaryCard state={state} />
          <SellerProfitabilityDetailsCard state={state} />
          <SellerProfitabilityVisualCard state={state} />
        </div>

        {/* Right Column: Actions & Formula Notes */}
        <div class={styles.studioColumn}>
          <SellerProfitabilityActionsCard state={state} />
          <SellerProfitabilityNotesCard />
        </div>
      </div>
    </div>
  );
}
