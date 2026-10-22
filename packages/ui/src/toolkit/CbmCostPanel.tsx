import type { ResolvedPreset } from '@mangotools/schemas';
import s from './cbmInputs.module.css';
import type { CbmController } from './cbmShipmentController.ts';
import type { CbmSnapshot } from './cbmShipmentModel.ts';
import { cbmText as t } from './cbmStrings.ts';
import { cbmWorksheetText as w } from './cbmWorksheetStrings.ts';
import { messageFor } from './presentation.ts';

interface Props {
  className?: string;
  state: CbmSnapshot;
  controller: CbmController;
  preset: ResolvedPreset;
}
type CostFieldName = 'rate' | 'minimumCharge' | 'otherCharges';
function CostField({ field, state, controller, preset }: Props & { field: CostFieldName }) {
  const error = state.costError?.path === field ? messageFor(preset, state.costError) : null;
  const prefix = state.costInput.currency === 'INR' ? '₹' : state.costInput.currency;
  return (
    <label>
      {t[field]}
      <span class={s.amountField}>
        {field === 'rate' ? (
          <span data-cbm-rate-prefix="" aria-hidden="true">
            {prefix}
          </span>
        ) : null}
        <input
          aria-label={t[field]}
          value={state.costInput[field]}
          inputMode="decimal"
          aria-invalid={!!error}
          aria-describedby={error ? `cbm-cost-${field}-error` : undefined}
          maxLength={64}
          onInput={(e) => controller.setCost({ [field]: e.currentTarget.value })}
        />
        {field === 'rate' ? (
          <span data-cbm-rate-suffix="" aria-hidden="true">
            {w.rateSuffix}
          </span>
        ) : null}
      </span>
      {error ? (
        <span id={`cbm-cost-${field}-error`} class={s.error}>
          {error}
        </span>
      ) : null}
    </label>
  );
}
export function CbmCostPanel({ state, controller, preset, className = '' }: Props) {
  return (
    <section class={`${s.panel} ${s.costPanel} ${className}`} aria-labelledby="cbm-cost-title">
      <div class={s.costHeading}>
        <h2 id="cbm-cost-title">{t.cost}</h2>
        <label class={s.toggle}>
          <input
            type="checkbox"
            checked={state.costInput.enabled}
            onChange={(e) => controller.setCost({ enabled: e.currentTarget.checked })}
          />
          <span class={s.srOnly}>{t.enable}</span>
        </label>
      </div>
      {state.costInput.enabled ? (
        <>
          <p>{t.costHelp}</p>
          <div class={s.costFields}>
            <label>
              {t.currency}
              <select
                aria-label={t.currency}
                value={state.costInput.currency}
                onChange={(e) => controller.setCost({ currency: e.currentTarget.value })}
              >
                {['INR', 'USD', 'EUR', 'GBP', 'AED'].map((currency) => (
                  <option key={currency}>{currency}</option>
                ))}
              </select>
            </label>
            <label>
              {w.rateBasis}
              <input aria-label={w.rateBasis} value={t.basis} readOnly />
            </label>
            {(['rate', 'minimumCharge', 'otherCharges'] as const).map((field) => (
              <CostField
                key={field}
                field={field}
                state={state}
                controller={controller}
                preset={preset}
              />
            ))}
          </div>
          <p>{t.currencyHelp}</p>
        </>
      ) : null}
    </section>
  );
}
