import type { ResolvedPreset } from '@mangotools/schemas';
import { Icon } from '../primitives/Icon.tsx';
import s from './cbmInputs.module.css';
import type { CbmController } from './cbmShipmentController.ts';
import type { CbmSnapshot } from './cbmShipmentModel.ts';
import { cbmText as t } from './cbmStrings.ts';
import { CURRENCIES, cbmWorkbenchText as w } from './cbmWorkbenchStrings.ts';
import { cbmWorksheetText as ws } from './cbmWorksheetStrings.ts';
import { messageFor } from './presentation.ts';

interface Props {
  className?: string;
  state: CbmSnapshot;
  controller: CbmController;
  preset: ResolvedPreset;
}
type CostFieldName = 'rate' | 'minimumCharge' | 'otherCharges';
const symbolOf = (currency: string) =>
  CURRENCIES.find(([code]) => code === currency)?.[1] ?? currency;

function CurrencyPrefix({ state, controller }: Props) {
  return (
    <select
      class={s.currency}
      aria-label={t.currency}
      aria-describedby="cbm-currency-note"
      value={state.costInput.currency}
      onChange={(e) => controller.setCost({ currency: e.currentTarget.value })}
    >
      {CURRENCIES.map(([code, symbol]) => (
        <option key={code} value={code}>
          {symbol}
        </option>
      ))}
    </select>
  );
}

function CostField(props: Props & { field: CostFieldName }) {
  const { field, state, controller, preset } = props;
  const error = state.costError?.path === field ? messageFor(preset, state.costError) : null;
  const id = `cbm-cost-${field}`;
  return (
    <div class={s.costField}>
      <label for={id}>
        {t[field]}
        {field === 'rate' ? null : <span class={s.optional}> {w.optional}</span>}
        {field === 'otherCharges' ? (
          <span class={s.info} title={w.otherNote}>
            <Icon name="info" />
            <span class="visually-hidden">{w.otherNote}</span>
          </span>
        ) : null}
      </label>
      <span class={s.amountField}>
        {field === 'rate' ? (
          <CurrencyPrefix {...props} />
        ) : (
          <span class={s.prefix} aria-hidden="true">
            {symbolOf(state.costInput.currency)}
          </span>
        )}
        <input
          id={id}
          aria-label={t[field]}
          value={state.costInput[field]}
          inputMode="decimal"
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          maxLength={64}
          onInput={(e) => controller.setCost({ [field]: e.currentTarget.value })}
        />
        {field === 'rate' ? (
          <span class={s.suffix} data-cbm-rate-suffix="" aria-hidden="true">
            {ws.rateSuffix}
          </span>
        ) : null}
      </span>
      {error ? (
        <span id={`${id}-error`} class={s.error}>
          {error}
        </span>
      ) : null}
    </div>
  );
}

/** Optional cost estimate inputs: the user's own per-CBM rate; no live prices. */
export function CbmCostPanel(props: Props) {
  const { state, controller, className = '' } = props;
  return (
    <section class={`${s.panel} ${s.costPanel} ${className}`} aria-labelledby="cbm-cost-title">
      <div class={s.costHeading}>
        <Icon name="coins" class={s.costIcon} />
        <h2 id="cbm-cost-title">
          {w.costTitle} <span class={s.optional}>{w.optionalTitle}</span>
        </h2>
        <label class={s.toggle}>
          <input
            type="checkbox"
            checked={state.costInput.enabled}
            onChange={(e) => controller.setCost({ enabled: e.currentTarget.checked })}
          />
          <span class="visually-hidden">{t.enable}</span>
        </label>
      </div>
      {state.costInput.enabled ? (
        <>
          <p class={s.costHelp}>{t.costHelp}</p>
          <div class={s.costFields}>
            <label class={s.costField}>
              {w.rateBasis}
              <select aria-label={w.rateBasis} value="per-cbm">
                <option value="per-cbm">{t.basis}</option>
              </select>
            </label>
            {(['rate', 'minimumCharge', 'otherCharges'] as const).map((field) => (
              <CostField key={field} {...props} field={field} />
            ))}
          </div>
          <p id="cbm-currency-note" class="visually-hidden">
            {w.currencyNote}
          </p>
        </>
      ) : null}
    </section>
  );
}
