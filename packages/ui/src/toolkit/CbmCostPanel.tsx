import type { ResolvedPreset } from '@mangotools/schemas';
import { useState } from 'preact/hooks';
import { formatDecimal } from '../format/numbers.ts';
import { Icon } from '../primitives/Icon.tsx';
import s from './cbmInputs.module.css';
import type { CbmController } from './cbmShipmentController.ts';
import type { CbmSnapshot } from './cbmShipmentModel.ts';
import { cbmText as t } from './cbmStrings.ts';
import { CURRENCIES, cbmWorkbenchText as w } from './cbmWorkbenchStrings.ts';
import { cbmWorksheetText as ws } from './cbmWorksheetStrings.ts';
import { messageFor } from './presentation.ts';
import { usePhone } from './usePhone.ts';

interface Props {
  className?: string;
  state: CbmSnapshot;
  controller: CbmController;
  preset: ResolvedPreset;
}
type CostFieldName = 'rate' | 'minimumCharge' | 'otherCharges';
const PLAIN = /^\d+(\.\d+)?$/;
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

/** Shows the amount grouped (4,500) while not being edited; the controller keeps the raw text. */
function AmountInput(props: Props & { field: CostFieldName; id: string; error: string | null }) {
  const { field, id, error, state, controller } = props;
  const [editing, setEditing] = useState(false);
  const raw = state.costInput[field];
  const grouping = state.costInput.currency === 'INR' ? 'indian' : 'international';
  const shown = editing || !PLAIN.test(raw) ? raw : formatDecimal(raw, grouping);
  return (
    <input
      id={id}
      aria-label={t[field]}
      value={shown}
      inputMode="decimal"
      aria-invalid={!!error}
      aria-describedby={error ? `${id}-error` : undefined}
      maxLength={64}
      onFocus={() => setEditing(true)}
      onBlur={() => setEditing(false)}
      onInput={(e) => controller.setCost({ [field]: e.currentTarget.value })}
    />
  );
}

function CostField(props: Props & { field: CostFieldName }) {
  const { field, state, preset } = props;
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
      <div class={s.amountRow}>
        <span class={s.amountField}>
          {field === 'rate' ? (
            <CurrencyPrefix {...props} />
          ) : (
            <span class={s.prefix} aria-hidden="true">
              {symbolOf(state.costInput.currency)}
            </span>
          )}
          <AmountInput {...props} field={field} id={id} error={error} />
        </span>
        {field === 'rate' ? (
          <span class={s.suffix} data-cbm-rate-suffix="" aria-hidden="true">
            {ws.rateSuffix}
          </span>
        ) : null}
      </div>
      {error ? (
        <span id={`${id}-error`} class={s.error}>
          {error}
        </span>
      ) : null}
    </div>
  );
}

/** One coin's edge below height `y`: a band under the front half of the coin's ellipse. */
const band = (y: number) =>
  `M2 ${y}v4.4c0 1.8 4.5 3.2 10 3.2s10-1.4 10-3.2V${y}c0 1.8-4.5 3.2-10 3.2S2 ${y + 1.8} 2 ${y}Z`;

/** The filled coin stack from the approved reference (decorative). */
function CoinsGlyph() {
  return (
    <svg class={s.costIcon} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d={band(14.2)} />
      <path d={band(9.6)} />
      <path d={band(5)} />
      <ellipse cx="12" cy="5" rx="10" ry="3.2" />
    </svg>
  );
}

function CostHeading({ state, controller, open, onOpen }: Props & CollapseProps) {
  const title = (
    <>
      <CoinsGlyph />
      <span>
        {w.costTitle} <span class={s.optional}>{w.optionalTitle}</span>
      </span>
    </>
  );
  return (
    <div class={s.costHeading}>
      <h2 id="cbm-cost-title" class={s.costTitle}>
        {onOpen ? (
          <button
            type="button"
            class={s.costTitle}
            aria-expanded={open}
            aria-controls="cbm-cost-fields"
            onClick={() => onOpen(!open)}
          >
            {title}
            <Icon name={open ? 'chevron-up' : 'chevron-down'} />
          </button>
        ) : (
          title
        )}
      </h2>
      <label class={s.toggle}>
        <input
          type="checkbox"
          checked={state.costInput.enabled}
          onChange={(e) => {
            controller.setCost({ enabled: e.currentTarget.checked });
            if (e.currentTarget.checked) onOpen?.(true);
          }}
        />
        <span class="visually-hidden">{t.enable}</span>
      </label>
    </div>
  );
}

interface CollapseProps {
  open: boolean;
  /** Present on phones, where the inputs fold under the heading. */
  onOpen?: (open: boolean) => void;
}

/** Optional cost estimate inputs: the user's own per-CBM rate; no live prices. */
export function CbmCostPanel(props: Props) {
  const { state, className = '' } = props;
  const phone = usePhone();
  const [open, setOpen] = useState(true);
  const shown = !phone || open;
  return (
    <section
      class={`${s.panel} ${s.costPanel} ${className}`}
      aria-labelledby="cbm-cost-title"
      data-open={shown}
    >
      <CostHeading {...props} open={shown} onOpen={phone ? setOpen : undefined} />
      {state.costInput.enabled && shown ? (
        <>
          <p class={s.costHelp}>{t.costHelp}</p>
          <div id="cbm-cost-fields" class={s.costFields}>
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
