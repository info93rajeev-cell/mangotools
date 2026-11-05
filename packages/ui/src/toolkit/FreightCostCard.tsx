import type { ResolvedPreset } from '@mangotools/schemas';
import { useState } from 'preact/hooks';
import { formatDecimal } from '../format/numbers.ts';
import { Icon } from '../primitives/Icon.tsx';
import r from './cbmCostResult.module.css';
import s from './cbmInputs.module.css';
import { formatAmount } from './cbmResultFormat.ts';
import { CURRENCIES } from './cbmWorkbenchStrings.ts';
import f from './freightCostCard.module.css';
import { freightCostText as t } from './freightCostStrings.ts';
import { messageFor } from './presentation.ts';
import { useEngineRun } from './useEngineRun.ts';

/**
 * The optional freight cost estimate, shared by Pallet Loading and Volumetric Weight. It looks and
 * works like the one in the CBM calculator: the user's own rate, an optional minimum and other
 * charges, priced by the tested `logistics.cost.estimate` engine operation. No live prices.
 */

export interface FreightBasis {
  id: 'per-cbm' | 'per-kg' | 'per-pallet';
  /** Shown in the rate basis list, e.g. "Per kg (chargeable weight)". */
  label: string;
  /** Suffix after the rate, e.g. "/ kg". */
  unit: string;
  /** The quantity the rate is multiplied by, as an exact decimal string (empty when not known). */
  quantity: string;
  /** How the quantity is described under the result, e.g. "34.646 kg chargeable". */
  describe: string;
}

interface Output {
  rateBasis: string;
  currency: string;
  quantity: string;
  rate: string;
  baseCharge: string;
  minimumApplied: boolean;
  freightCharge: string;
  otherCharges: string;
  estimatedTotal: string;
}

type Field = 'rate' | 'minimumCharge' | 'otherCharges';
const PLAIN = /^\d+(\.\d+)?$/;
const symbolOf = (code: string) => CURRENCIES.find(([c]) => c === code)?.[1] ?? code;

function Coins() {
  const band = (y: number) =>
    `M2 ${y}v4.4c0 1.8 4.5 3.2 10 3.2s10-1.4 10-3.2V${y}c0 1.8-4.5 3.2-10 3.2S2 ${y + 1.8} 2 ${y}Z`;
  return (
    <svg class={s.costIcon} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d={band(14.2)} />
      <path d={band(9.6)} />
      <path d={band(5)} />
      <ellipse cx="12" cy="5" rx="10" ry="3.2" />
    </svg>
  );
}

function Amount(props: {
  id: string;
  field: Field;
  value: string;
  currency: string;
  error: string | null;
  onInput: (v: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const grouping = props.currency === 'INR' ? 'indian' : 'international';
  const shown =
    editing || !PLAIN.test(props.value) ? props.value : formatDecimal(props.value, grouping);
  return (
    <input
      id={props.id}
      aria-label={t[props.field]}
      value={shown}
      inputMode="decimal"
      aria-invalid={!!props.error}
      maxLength={64}
      onFocus={() => setEditing(true)}
      onBlur={() => setEditing(false)}
      onInput={(e) => props.onInput(e.currentTarget.value)}
    />
  );
}

interface CostState {
  basis: FreightBasis['id'];
  currency: string;
  rate: string;
  minimumCharge: string;
  otherCharges: string;
}

function useCost(bases: FreightBasis[]) {
  const [on, setOn] = useState(false);
  const [c, setC] = useState<CostState>({
    basis: bases[0]?.id ?? 'per-cbm',
    currency: 'INR',
    rate: '',
    minimumCharge: '',
    otherCharges: '',
  });
  const basis = bases.find((b) => b.id === c.basis) ?? bases[0];
  const ready = on && basis && basis.quantity !== '' && c.rate.trim() !== '';
  const input = ready
    ? {
        rateBasis: basis.id,
        quantity: basis.quantity,
        rate: c.rate.trim(),
        currency: c.currency,
        ...(c.minimumCharge.trim() ? { minimumCharge: c.minimumCharge.trim() } : {}),
        ...(c.otherCharges.trim() ? { otherCharges: c.otherCharges.trim() } : {}),
      }
    : null;
  const run = useEngineRun<Output>('logistics.cost.estimate@1', input, {});
  return { on, setOn, c, setC, basis, run };
}

function Fields(props: {
  idPrefix: string;
  bases: FreightBasis[];
  cost: ReturnType<typeof useCost>;
  preset?: ResolvedPreset;
}) {
  const { c, setC, basis, run } = props.cost;
  const errorFor = (field: string) =>
    run.error?.path === field && props.preset ? messageFor(props.preset, run.error) : null;
  const field = (name: Field) => {
    const id = `${props.idPrefix}-${name}`;
    const error = errorFor(name);
    return (
      <div key={name} class={s.costField}>
        <label for={id}>
          {t[name]}
          {name === 'rate' ? null : <span class={s.optional}> {t.optionalField}</span>}
          {name === 'otherCharges' ? (
            <span class={s.info} title={t.otherNote}>
              <Icon name="info" />
              <span class="visually-hidden">{t.otherNote}</span>
            </span>
          ) : null}
        </label>
        <div class={s.amountRow}>
          <span class={s.amountField}>
            {name === 'rate' ? (
              <select
                class={s.currency}
                aria-label={t.currency}
                value={c.currency}
                onChange={(e) => setC({ ...c, currency: e.currentTarget.value })}
              >
                {CURRENCIES.map(([code, symbol]) => (
                  <option key={code} value={code}>
                    {symbol}
                  </option>
                ))}
              </select>
            ) : (
              <span class={s.prefix} aria-hidden="true">
                {symbolOf(c.currency)}
              </span>
            )}
            <Amount
              id={id}
              field={name}
              value={c[name]}
              currency={c.currency}
              error={error}
              onInput={(v) => setC({ ...c, [name]: v })}
            />
          </span>
          {name === 'rate' ? (
            <span class={s.suffix} aria-hidden="true">
              {basis?.unit}
            </span>
          ) : null}
        </div>
        {error ? <span class={s.error}>{error}</span> : null}
      </div>
    );
  };
  return (
    <div class={`${s.costFields} ${f.fields}`}>
      <label class={s.costField}>
        {t.rateBasis}
        <select
          aria-label={t.rateBasis}
          value={c.basis}
          onChange={(e) => setC({ ...c, basis: e.currentTarget.value as FreightBasis['id'] })}
        >
          {props.bases.map((b) => (
            <option key={b.id} value={b.id}>
              {b.label}
            </option>
          ))}
        </select>
      </label>
      {field('rate')}
      {field('minimumCharge')}
      {field('otherCharges')}
    </div>
  );
}

function Result({ cost }: { cost: ReturnType<typeof useCost> }) {
  const v = cost.run.value;
  return (
    <section class={`${r.card} ${f.result}`} aria-live="polite">
      <div class={r.head}>
        <h3 class={r.title}>{t.resultTitle}</h3>
        {v ? (
          <span class={r.badge}>
            <Icon name="circle-check" />
            {t.calculated}
          </span>
        ) : null}
      </div>
      {v ? (
        <dl class={r.figures}>
          <div class={r.item}>
            <dt>{v.minimumApplied ? t.minimumApplied : t.freight}</dt>
            <dd class={r.value}>{formatAmount(v.freightCharge, v.currency)}</dd>
            <dd class={r.note}>
              {cost.basis?.describe} × {formatAmount(v.rate, v.currency)}
            </dd>
          </div>
          <div class={r.item}>
            <dt>{t.otherCharges}</dt>
            <dd class={r.value}>{formatAmount(v.otherCharges, v.currency)}</dd>
          </div>
          <div class={r.total}>
            <dt>{t.total}</dt>
            <dd>{formatAmount(v.estimatedTotal, v.currency)}</dd>
          </div>
        </dl>
      ) : (
        <p class={r.empty}>{t.waiting}</p>
      )}
      <p class={r.empty}>{t.disclaimer}</p>
    </section>
  );
}

export function FreightCostCard(props: {
  idPrefix: string;
  bases: FreightBasis[];
  preset?: ResolvedPreset;
  /** Extra inputs shown above the rate fields (e.g. the number of pallets). */
  extra?: preact.ComponentChildren;
  className?: string;
}) {
  const cost = useCost(props.bases);
  return (
    <section
      class={`${s.panel} ${s.costPanel} ${f.card} ${props.className ?? ''}`}
      aria-labelledby={`${props.idPrefix}-title`}
    >
      <div class={s.costHeading}>
        <h2 id={`${props.idPrefix}-title`} class={s.costTitle}>
          <Coins />
          <span>
            {t.title} <span class={s.optional}>{t.optional}</span>
          </span>
        </h2>
        <label class={s.toggle}>
          <input
            type="checkbox"
            checked={cost.on}
            onChange={(e) => cost.setOn(e.currentTarget.checked)}
          />
          <span class="visually-hidden">{t.enable}</span>
        </label>
      </div>
      {cost.on ? (
        <>
          <p class={s.costHelp}>{t.help}</p>
          {props.extra}
          <Fields idPrefix={props.idPrefix} bases={props.bases} cost={cost} preset={props.preset} />
          <Result cost={cost} />
        </>
      ) : null}
    </section>
  );
}
