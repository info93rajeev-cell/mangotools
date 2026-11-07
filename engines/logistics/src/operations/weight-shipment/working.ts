import type { WorkingStep } from '@mangotools/core';
import type { MeasuredRow } from './measure.ts';
import type { BilledOn } from './schema.ts';

export const step = (
  ref: string,
  formulaKey: string,
  variables: Record<string, string>,
  result: string,
): WorkingStep => ({ ref, formulaKey, variables, result });

/** Full-precision steps for one row; the tool preset supplies the templates. */
export function rowWorking(row: MeasuredRow, unit: string, divisor: string): WorkingStep[] {
  const p = `packages.${row.index}`;
  const { length, width, height, quantity } = row;
  return [
    step(
      `${p}.volumeCm3PerPiece`,
      'vws.volume',
      { length, width, height, unit },
      row.volumeCm3PerPiece,
    ),
    step(
      `${p}.volumetricTotal`,
      'vws.rowVolumetric',
      { volume: row.volumeCm3PerPiece, divisor, quantity },
      row.volumetricTotal,
    ),
    step(
      `${p}.actualTotal`,
      'vws.rowActual',
      { weight: row.actualPerPiece, quantity },
      row.actualTotal,
    ),
  ];
}

export function totalWorking(t: {
  pieces: string;
  volumetric: string;
  actual: string;
  chargeable: string;
  billedOn: BilledOn;
}): WorkingStep[] {
  return [
    step('totalPieces', 'vws.pieces', { pieces: t.pieces }, t.pieces),
    step('volumetricTotal', 'vws.total.volumetric', { total: t.volumetric }, t.volumetric),
    step('actualTotal', 'vws.total.actual', { total: t.actual }, t.actual),
    step(
      'chargeableTotal',
      `vws.chargeable.${t.billedOn}`,
      { actual: t.actual, volumetric: t.volumetric },
      t.chargeable,
    ),
  ];
}
