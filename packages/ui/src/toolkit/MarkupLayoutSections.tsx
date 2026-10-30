import styles from './businessStudio.module.css';
import {
  MarkupFinancialDetailsCard,
  MarkupResultsSummaryCard,
  MarkupVisualCard,
} from './MarkupCenterCards.tsx';
import { MarkupInputsCard, MarkupOptionalAdditionsCard } from './MarkupLeftCards.tsx';
import { MarkupActionsCard, MarkupComparisonCard, MarkupNotesCard } from './MarkupRightCards.tsx';
import type { MarkupCalculatorState } from './useMarkupCalculator.ts';

export function MarkupLeftCardsWrapper({ state }: { state: MarkupCalculatorState }) {
  return (
    <div class={styles.studioColumn}>
      <MarkupInputsCard state={state} />
      <MarkupOptionalAdditionsCard state={state} />
    </div>
  );
}

export function MarkupCenterCardsWrapper({ state }: { state: MarkupCalculatorState }) {
  return (
    <div class={styles.studioColumn}>
      <MarkupResultsSummaryCard state={state} />
      <MarkupFinancialDetailsCard state={state} />
      <MarkupVisualCard state={state} />
    </div>
  );
}

export function MarkupRightCardsWrapper({ state }: { state: MarkupCalculatorState }) {
  return (
    <div class={styles.studioColumn}>
      <MarkupActionsCard state={state} />
      <MarkupComparisonCard />
      <MarkupNotesCard state={state} />
    </div>
  );
}
