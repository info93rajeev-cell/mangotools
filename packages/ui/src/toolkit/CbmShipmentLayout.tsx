import type { ResolvedPreset } from '@mangotools/schemas';
import { useState } from 'preact/hooks';
import { Button } from '../primitives/Button.tsx';
import { copyText } from './actions.ts';
import { CbmCostPanel, CbmCostResult } from './CbmCostPanel.tsx';
import { CbmPackageWorksheet } from './CbmPackageWorksheet.tsx';
import { CbmShipmentResults } from './CbmShipmentResults.tsx';
import { CbmShipmentVisualization } from './CbmShipmentVisualization.tsx';
import s from './cbmShipment.module.css';
import { shipmentSummary } from './cbmShipmentCopy.ts';
import { cbmText as t } from './cbmStrings.ts';
import { messageFor } from './presentation.ts';
import { useCbmShipment } from './useCbmShipment.ts';

export function CbmShipmentLayout({ preset }: { preset: ResolvedPreset }) {
  const [state, controller] = useCbmShipment();
  const [message, notify] = useState('');
  const [selected, select] = useState(0);
  const text = shipmentSummary(state);
  return (
    <div data-cbm-workspace="">
      <div class={s.workspace}>
        <div class={s.left}>
          <CbmPackageWorksheet state={state} controller={controller} preset={preset} />
          <section class={s.panel} aria-labelledby="cbm-options-title">
            <h2 id="cbm-options-title">{t.options}</h2>
            <div class={s.options}>
              <label>
                {t.defaultUnit}
                <select
                  value={state.unit}
                  onChange={(e) => controller.setDefaultUnit(e.currentTarget.value)}
                >
                  {['mm', 'cm', 'm', 'in', 'ft'].map((unit) => (
                    <option key={unit}>{unit}</option>
                  ))}
                </select>
              </label>
              <label>
                {t.precision}
                <select
                  value={state.precision}
                  onChange={(e) => controller.setPrecision(e.currentTarget.value)}
                >
                  {['2', '3', '4'].map((places) => (
                    <option key={places}>{places}</option>
                  ))}
                </select>
              </label>
            </div>
            <p>{t.defaultHelp}</p>
          </section>
          <CbmCostPanel state={state} controller={controller} preset={preset} />
          <details class={`${s.panel} ${s.notes}`}>
            <summary>{t.notes}</summary>
            <p>{t.formula}</p>
            <p>{t.measurement}</p>
            {state.warnings.map((warning, index) => (
              <p key={`${warning.code}-${index}`}>{messageFor(preset, warning)}</p>
            ))}
            <details>
              <summary>{t.references}</summary>
              <p>{t.capacities}</p>
              <p>
                <a href={t.sourceUrl}>{t.source}</a> · {t.sourceDate}
              </p>
              <p>{t.fitDisclaimer}</p>
              <p>{t.variation}</p>
              <a href="/container-loading-calculator">{t.fitLink}</a>
            </details>
          </details>
          {state.error ? (
            <p class={s.error} role="alert">
              {messageFor(preset, state.error)}
            </p>
          ) : null}
        </div>
        <div class={s.right}>
          <div class={s.visualSlot}>
            <label class={s.packageSelector}>
              {t.package}
              <select
                value={Math.min(selected, Math.max(0, state.packages.length - 1))}
                onChange={(e) => select(Number(e.currentTarget.value))}
              >
                {state.packages.map((row, index) => (
                  <option key={row.id} value={index}>
                    {row.description || `${t.package} ${index + 1}`}
                  </option>
                ))}
              </select>
            </label>
            <CbmShipmentVisualization row={state.packages[selected] ?? state.packages[0]} />
          </div>
          <CbmShipmentResults state={state} />
          <div class={s.costResult}>
            <CbmCostResult state={state} />
          </div>
          <div class={s.actions}>
            <Button size="sm" disabled={!state.shipment} onClick={() => window.print()}>
              {t.print}
            </Button>
            <Button
              size="sm"
              disabled={!state.shipment}
              onClick={async () => notify((await copyText(text)) ? t.copied : t.copyFailed)}
            >
              {t.copy}
            </Button>
          </div>
          <p role="status">{message}</p>
        </div>
      </div>
      <section class={s.report}>
        <h2>{t.branding}</h2>
        <pre>{text}</pre>
        <p>{t.fitDisclaimer}</p>
        <p>{t.variation}</p>
      </section>
    </div>
  );
}
