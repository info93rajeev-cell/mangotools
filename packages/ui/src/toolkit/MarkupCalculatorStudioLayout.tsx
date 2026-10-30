import styles from './businessStudio.module.css';
import {
  MarkupCenterCardsWrapper,
  MarkupLeftCardsWrapper,
  MarkupRightCardsWrapper,
} from './MarkupLayoutSections.tsx';
import { useMarkupCalculator } from './useMarkupCalculator.ts';

export interface MarkupCalculatorStudioLayoutProps {
  notify?: (msg: string) => void;
}

export function MarkupCalculatorStudioLayout({ notify }: MarkupCalculatorStudioLayoutProps) {
  const state = useMarkupCalculator(notify);

  return (
    <div
      class={styles.studioContainer}
      data-markup-calculator-studio=""
      data-testid="markup-calculator-studio"
    >
      <div class={styles.studio3Col}>
        <MarkupLeftCardsWrapper state={state} />
        <MarkupCenterCardsWrapper state={state} />
        <MarkupRightCardsWrapper state={state} />
      </div>
    </div>
  );
}
