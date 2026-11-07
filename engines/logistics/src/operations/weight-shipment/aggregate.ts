import { add, compare, div, toFixedString } from '@mangotools/engine-numeric';
import type { MeasuredRow } from './measure.ts';
import type { BilledOn, WeightShipmentOutput } from './schema.ts';
import { rowWorking, totalWorking } from './working.ts';

interface Options {
  unit: string;
  divisor: string;
  decimals: number;
  rounding: 'half-up' | 'half-even';
}

const basis = (actual: string, volumetric: string): BilledOn => {
  const order = compare(volumetric, actual);
  return order > 0 ? 'volumetric' : order < 0 ? 'actual' : 'equal';
};

const sum = (rows: MeasuredRow[], pick: (row: MeasuredRow) => string) =>
  rows.reduce((total, row) => add(total, pick(row)), '0');

function displayRow(r: MeasuredRow, shown: (value: string) => string) {
  const rowBasis = basis(r.actualTotal, r.volumetricTotal);
  return {
    index: r.index,
    quantity: r.quantity,
    volumeCm3PerPiece: r.volumeCm3PerPiece,
    volumetricPerPiece: shown(r.volumetricPerPiece),
    volumetricTotal: shown(r.volumetricTotal),
    actualPerPiece: shown(r.actualPerPiece),
    actualTotal: shown(r.actualTotal),
    chargeableTotal: shown(rowBasis === 'actual' ? r.actualTotal : r.volumetricTotal),
    billedOn: rowBasis,
  };
}

/** Shipment level: the whole consignment is billed on the higher of its two totals. Each output is rounded once, from full precision. */
export function aggregate(rows: MeasuredRow[], o: Options): WeightShipmentOutput {
  const volumetric = sum(rows, (r) => r.volumetricTotal);
  const actual = sum(rows, (r) => r.actualTotal);
  const volume = sum(rows, (r) => r.volumeCm3Total);
  const pieces = sum(rows, (r) => r.quantity);
  const billedOn = basis(actual, volumetric);
  const chargeable = billedOn === 'actual' ? actual : volumetric;
  const shown = (value: string) => toFixedString(value, o.decimals, o.rounding);
  return {
    rows: rows.map((r) => displayRow(r, shown)),
    totalPieces: pieces,
    totalVolumeCm3: volume,
    totalVolumeM3: shown(div(volume, '1000000')),
    volumetricTotal: shown(volumetric),
    actualTotal: shown(actual),
    chargeableTotal: shown(chargeable),
    billedOn,
    divisor: o.divisor,
    working: [
      ...rows.flatMap((r) => rowWorking(r, o.unit, o.divisor)),
      ...totalWorking({ pieces, volumetric, actual, chargeable, billedOn }),
    ],
  };
}
