import type { WorkingStep } from '@mangotools/core';
import type { MeasuredPackage } from './measure.ts';

export const step = (
  ref: string,
  formulaKey: string,
  variables: Record<string, string>,
  result: string,
): WorkingStep => ({ ref, formulaKey, variables, result });

export function packageWorking(row: MeasuredPackage): WorkingStep[] {
  const prefix = `packages.${row.index}`;
  const steps = [
    step(
      `${prefix}.cbmPerPiece`,
      'cbmShipment.perPiece',
      { length: row.length, width: row.width, height: row.height },
      row.cbmPerPieceExact,
    ),
    step(
      `${prefix}.totalCbm`,
      'cbmShipment.rowTotal',
      { cbmPerPiece: row.cbmPerPieceExact, quantity: row.quantity },
      row.totalCbmExact,
    ),
  ];
  if (row.totalWeightKgExact !== null) {
    steps.push(
      step(
        `${prefix}.totalWeightKg`,
        'cbmShipment.rowWeight',
        { quantity: row.quantity, totalWeightKg: row.totalWeightKgExact },
        row.totalWeightKgExact,
      ),
    );
  }
  return steps;
}
