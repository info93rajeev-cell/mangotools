import type { ResolvedPreset } from '@mangotools/schemas';
import { useState } from 'preact/hooks';
import s from './cbmInputs.module.css';
import { type FreightBasis, FreightCostCard } from './FreightCostCard.tsx';
import f from './freightCostCard.module.css';
import { freightCostText as t } from './freightCostStrings.ts';
import type { PalletLoadingResult } from './palletLoadingModel.ts';

const fixed = (n: number, d: number) => (Number.isFinite(n) && n > 0 ? n.toFixed(d) : '');
const trim = (v: string) => (v.includes('.') ? v.replace(/\.?0+$/, '') : v);

/** Rate bases for a pallet shipment: per pallet, per m³ of loaded pallets, per kg gross. */
function palletBases(result: PalletLoadingResult, pallets: number): FreightBasis[] {
  const d = result.loadedDimensions;
  const toM = d.unit === 'mm' ? 0.001 : d.unit === 'inch' ? 0.0254 : 0.01;
  const m3 = d.length * toM * d.width * toM * d.height * toM * pallets;
  const kg = result.weightBreakdown.totalGrossWeightKg * pallets;
  const cbm = fixed(m3, 3);
  const gross = fixed(kg, 2);
  return [
    {
      id: 'per-pallet',
      label: 'Per pallet',
      unit: '/ pallet',
      quantity: pallets > 0 ? String(pallets) : '',
      describe: `${pallets} pallet${pallets === 1 ? '' : 's'}`,
    },
    {
      id: 'per-cbm',
      label: 'Per CBM (m³)',
      unit: '/ m³',
      quantity: cbm,
      describe: `${trim(cbm)} m³`,
    },
    {
      id: 'per-kg',
      label: 'Per kg (gross weight)',
      unit: '/ kg',
      quantity: gross,
      describe: `${trim(gross)} kg gross`,
    },
  ];
}

/** Optional cost estimate under the pallet settings, using the user's own rate. */
export function PalletCostCard(props: { result: PalletLoadingResult; preset?: ResolvedPreset }) {
  const [pallets, setPallets] = useState('1');
  const count = /^\d+$/.test(pallets) ? Number(pallets) : 0;
  return (
    <FreightCostCard
      idPrefix="pallet-cost"
      preset={props.preset}
      bases={palletBases(props.result, count)}
      extra={
        <div class={`${s.costFields} ${f.extra}`}>
          <label class={s.costField}>
            {t.pallets}
            <input
              inputMode="numeric"
              value={pallets}
              onInput={(e) => setPallets(e.currentTarget.value.trim())}
            />
          </label>
          <small>{t.palletsHelp}</small>
        </div>
      }
    />
  );
}
