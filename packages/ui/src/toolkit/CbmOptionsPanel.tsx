import s from './cbmInputs.module.css';
import type { CbmController } from './cbmShipmentController.ts';
import type { CbmSnapshot } from './cbmShipmentModel.ts';
import { cbmText as t } from './cbmStrings.ts';

export function CbmOptionsPanel({
  state,
  controller,
  className = '',
}: {
  className?: string;
  state: CbmSnapshot;
  controller: CbmController;
}) {
  return (
    <section class={`${s.panel} ${className}`} aria-labelledby="cbm-options-title">
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
  );
}
