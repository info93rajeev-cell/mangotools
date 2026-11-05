import type { ResolvedPreset } from '@mangotools/schemas';
import { type FreightBasis, FreightCostCard } from './FreightCostCard.tsx';

const positive = (v: string) => (/^\d+(\.\d+)?$/.test(v) && Number(v) > 0 ? v : '');
const trim = (v: string) => (v.includes('.') ? v.replace(/\.?0+$/, '') : v);

/** Optional cost estimate under the calculation settings: per kg chargeable (default) or per m³. */
export function VolumetricCostCard(props: {
  chargeableKg: string;
  volumeM3: string;
  preset?: ResolvedPreset;
}) {
  const kg = positive(props.chargeableKg);
  const m3 = positive(props.volumeM3);
  const bases: FreightBasis[] = [
    {
      id: 'per-kg',
      label: 'Per kg (chargeable weight)',
      unit: '/ kg',
      quantity: kg,
      describe: `${trim(kg)} kg chargeable`,
    },
    {
      id: 'per-cbm',
      label: 'Per CBM (m³)',
      unit: '/ m³',
      quantity: m3,
      describe: `${trim(m3)} m³`,
    },
  ];
  return <FreightCostCard idPrefix="volumetric-cost" preset={props.preset} bases={bases} />;
}
