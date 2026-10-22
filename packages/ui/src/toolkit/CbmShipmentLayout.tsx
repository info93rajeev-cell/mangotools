import type { ResolvedPreset } from '@mangotools/schemas';
import { useRef } from 'preact/hooks';
import { CbmCostPanel } from './CbmCostPanel.tsx';
import { CbmCostResult } from './CbmCostResult.tsx';
import { CbmNextSteps, CbmNotesPanel } from './CbmNotesPanel.tsx';
import { CbmOptionsPanel } from './CbmOptionsPanel.tsx';
import { CbmOutputActions, CbmPrintReport } from './CbmOutputActions.tsx';
import { CbmPackageWorksheet } from './CbmPackageWorksheet.tsx';
import { CbmQuickActions } from './CbmQuickActions.tsx';
import { CbmShipmentResults } from './CbmShipmentResults.tsx';
import { CbmVisualizationPanel } from './CbmShipmentVisualization.tsx';
import page from './cbmPage.module.css';
import { shipmentSummary } from './cbmShipmentCopy.ts';
import s from './cbmWorkspace.module.css';
import { messageFor } from './presentation.ts';
import { useCbmPageChrome } from './useCbmPageChrome.ts';
import { useCbmShipment } from './useCbmShipment.ts';
import { useCbmWorkbench } from './useCbmWorkbench.ts';

export function CbmShipmentLayout({ preset }: { preset: ResolvedPreset }) {
  const [state, controller] = useCbmShipment();
  const bench = useCbmWorkbench(state, controller);
  const text = shipmentSummary(state);
  const active = state.packages[bench.activeIndex];
  const moved = useRef<HTMLDivElement>(null);
  useCbmPageChrome(moved);
  return (
    <div data-cbm-workspace="" class={page.root}>
      <CbmQuickActions
        printable={!!state.shipment}
        summary={text}
        onVisualization={bench.showVisualization}
        onUnits={bench.showUnits}
      />
      <div class={s.workspace}>
        <div class={s.left}>
          <div class={s.leftCard}>
            <CbmPackageWorksheet
              className={s.worksheetSlot}
              state={state}
              controller={controller}
              preset={preset}
              weightUnit={bench.options.weightUnit}
              selected={bench.selected}
              activeId={active?.id}
              showTotalRow={bench.options.showTotalRow}
              onToggle={bench.toggle}
              onMove={bench.move}
              onActivate={bench.setActiveId}
            />
            <CbmOptionsPanel
              className={s.optionsSlot}
              state={state}
              controller={controller}
              options={bench.options}
              open={bench.optionsOpen}
              onOpen={bench.setOptionsOpen}
              onOptions={bench.setOptions}
            />
            <CbmCostPanel
              className={s.costInputsSlot}
              state={state}
              controller={controller}
              preset={preset}
            />
          </div>
          <div class={s.cards} data-cbm-cards="">
            <CbmNotesPanel className={s.notesSlot} warnings={state.warnings} preset={preset} />
            <CbmNextSteps className={s.stepsSlot} />
            <div ref={moved} class={s.moved} />
          </div>
          {state.error ? (
            <p class={s.error} role="alert">
              {messageFor(preset, state.error)}
            </p>
          ) : null}
        </div>
        <div class={s.right}>
          {bench.options.showVisualization && active ? (
            <CbmVisualizationPanel
              className={s.visualizationSlot}
              row={active}
              index={bench.activeIndex}
            />
          ) : null}
          <CbmShipmentResults className={s.resultsSlot} state={state} />
          <CbmCostResult className={s.costResultSlot} state={state} />
          <CbmOutputActions
            className={s.outputActionsSlot}
            feedbackClassName={s.outputFeedbackSlot}
            summary={text}
            enabled={!!state.shipment}
          />
        </div>
      </div>
      <CbmPrintReport summary={text} />
    </div>
  );
}
