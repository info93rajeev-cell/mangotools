import type { ResolvedPreset } from '@mangotools/schemas';
import s from './cbmInputs.module.css';
import type { CbmController } from './cbmShipmentController.ts';
import type { CbmSnapshot } from './cbmShipmentModel.ts';
import { cbmText as t } from './cbmStrings.ts';
import { messageFor } from './presentation.ts';

interface Props {
  className?: string;
  state: CbmSnapshot;
  controller: CbmController;
  preset: ResolvedPreset;
}
export function CbmCostPanel({ state, controller, preset, className = '' }: Props) {
  return (
    <section class={`${s.panel} ${className}`} aria-labelledby="cbm-cost-title">
      <h2 id="cbm-cost-title">{t.cost}</h2>
      <label class={s.toggle}>
        <input
          type="checkbox"
          checked={state.costInput.enabled}
          onChange={(e) => controller.setCost({ enabled: e.currentTarget.checked })}
        />
        {t.enable}
      </label>
      {state.costInput.enabled ? (
        <>
          <p>{t.costHelp}</p>
          <div class={s.costFields}>
            <label>
              {t.currency}
              <select
                value={state.costInput.currency}
                onChange={(e) => controller.setCost({ currency: e.currentTarget.value })}
              >
                {['INR', 'USD', 'EUR', 'GBP', 'AED'].map((currency) => (
                  <option key={currency}>{currency}</option>
                ))}
              </select>
            </label>
            <p>{t.basis}</p>
            {(['rate', 'minimumCharge', 'otherCharges'] as const).map((field) => {
              const error =
                state.costError?.path === field ? messageFor(preset, state.costError) : null;
              return (
                <label key={field}>
                  {t[field]}
                  <input
                    aria-label={t[field]}
                    value={state.costInput[field]}
                    inputMode="decimal"
                    aria-invalid={!!error}
                    aria-describedby={error ? `cbm-cost-${field}-error` : undefined}
                    maxLength={64}
                    onInput={(e) => controller.setCost({ [field]: e.currentTarget.value })}
                  />
                  {error ? (
                    <span id={`cbm-cost-${field}-error`} class={s.error}>
                      {error}
                    </span>
                  ) : null}
                </label>
              );
            })}
          </div>
          <p>{t.currencyHelp}</p>
        </>
      ) : null}
    </section>
  );
}
