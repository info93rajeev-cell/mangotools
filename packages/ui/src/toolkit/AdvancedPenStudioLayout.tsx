import { AdvancedPenCanvas } from './AdvancedPenCanvas.tsx';
import { AdvancedPenControls } from './AdvancedPenControls.tsx';
import { AdvancedPenHeader } from './AdvancedPenHeader.tsx';
import { AdvancedPenRightPanel } from './AdvancedPenRightPanel.tsx';
import { AdvancedPenWorkflowGuide } from './AdvancedPenWorkflowGuide.tsx';
import styles from './advancedPenSelection.module.css';
import { useAdvancedPenSelection } from './useAdvancedPenSelection.ts';

export interface AdvancedPenStudioLayoutProps {
  notify: (msg: string) => void;
}

export function AdvancedPenStudioLayout({ notify }: AdvancedPenStudioLayoutProps) {
  const penSelection = useAdvancedPenSelection(notify);

  return (
    <div class={styles.studioContainer} data-advanced-pen-studio="">
      {/* TOP HEADER WITH ACTIONS */}
      <AdvancedPenHeader penSelection={penSelection} />

      {/* 3-COLUMN STUDIO WORKBENCH */}
      <div class={styles.studioGrid}>
        {/* Left Column: Steps 1 & 2 */}
        <AdvancedPenControls penSelection={penSelection} />

        {/* Center Column: Step 3 Interactive Canvas */}
        <AdvancedPenCanvas penSelection={penSelection} />

        {/* Right Column: Steps 4, 5, 6 */}
        <AdvancedPenRightPanel penSelection={penSelection} />
      </div>

      {/* BOTTOM 5-STEP WORKFLOW & USE CASES */}
      <AdvancedPenWorkflowGuide />
    </div>
  );
}
