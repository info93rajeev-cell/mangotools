import { useEffect, useRef } from 'preact/hooks';
import { AdvancedPenCanvas } from './AdvancedPenCanvas.tsx';
import { AdvancedPenControls } from './AdvancedPenControls.tsx';
import { AdvancedPenHeader } from './AdvancedPenHeader.tsx';
import { AdvancedPenRightPanel } from './AdvancedPenRightPanel.tsx';
import { AdvancedPenWorkflowGuide } from './AdvancedPenWorkflowGuide.tsx';
import styles from './advancedPenSelection.module.css';
import { useAdvancedPenSelection } from './useAdvancedPenSelection.ts';

export interface AdvancedPenStudioLayoutProps {
  notify: (msg: string) => void;
  /** The photo already opened in Quick Auto Removal, so you can keep working on it here. */
  initialFile?: File | null;
}

export function AdvancedPenStudioLayout({ notify, initialFile }: AdvancedPenStudioLayoutProps) {
  const penSelection = useAdvancedPenSelection(notify);
  const { loadFile } = penSelection;
  const started = useRef(false);
  useEffect(() => {
    if (started.current || !initialFile) return;
    started.current = true;
    void loadFile(initialFile);
  }, [initialFile, loadFile]);

  return (
    <div class={styles.studioContainer} data-advanced-pen-studio="">
      {/* TOP HEADER WITH ACTIONS */}
      <AdvancedPenHeader penSelection={penSelection} />

      {/* 3-COLUMN STUDIO WORKBENCH */}
      <div class={styles.studioGrid} data-has-file={String(!!penSelection.image)}>
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
