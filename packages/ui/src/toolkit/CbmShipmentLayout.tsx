import type { ResolvedPreset } from '@mangotools/schemas';
import { CbmCostPanel } from './CbmCostPanel.tsx';
import { CbmCostResult } from './CbmCostResult.tsx';
import { CbmNotesPanel } from './CbmNotesPanel.tsx';
import { CbmOptionsPanel } from './CbmOptionsPanel.tsx';
import { CbmOutputActions, CbmPrintReport } from './CbmOutputActions.tsx';
import { CbmPackageWorksheet } from './CbmPackageWorksheet.tsx';
import { CbmShipmentResults } from './CbmShipmentResults.tsx';
import { CbmVisualizationPanel } from './CbmShipmentVisualization.tsx';
import { shipmentSummary } from './cbmShipmentCopy.ts';
import s from './cbmWorkspace.module.css';
import { messageFor } from './presentation.ts';
import { useCbmShipment } from './useCbmShipment.ts';

export function CbmShipmentLayout({ preset }: { preset: ResolvedPreset }) {
  const [state, controller] = useCbmShipment();
  const text = shipmentSummary(state);
  return (
    <div data-cbm-workspace="">
      <div class={s.workspace}>
        <div class={s.left}>
          <CbmPackageWorksheet state={state} controller={controller} preset={preset} />
          <CbmOptionsPanel state={state} controller={controller} />
          <CbmCostPanel state={state} controller={controller} preset={preset} />
          <CbmNotesPanel warnings={state.warnings} preset={preset} />
          {state.error ? (
            <p class={s.error} role="alert">
              {messageFor(preset, state.error)}
            </p>
          ) : null}
        </div>
        <div class={s.right}>
          <CbmVisualizationPanel packages={state.packages} />
          <CbmShipmentResults state={state} />
          <CbmCostResult state={state} />
          <CbmOutputActions summary={text} enabled={!!state.shipment} />
        </div>
      </div>
      <CbmPrintReport summary={text} />
    </div>
  );
}
