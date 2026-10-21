import type { OpWarning, WorkingStep } from '@mangotools/core';
import { warning } from '@mangotools/core';
import { add, isZero, mul, toFixedString } from '@mangotools/engine-numeric';
import type { MeasuredPackage } from './measure.ts';
import type { PackageOutput, ShipmentOutput, ShipmentParams } from './schema.ts';
import { CUBIC_FEET_PER_CUBIC_METRE } from './units.ts';
import { packageWorking, step } from './working.ts';

interface Totals {
  cbm: string;
  pieces: string;
  weight: string;
  weightedPieces: string;
  weightedRows: number;
}
const shown = (value: string, params: ShipmentParams) =>
  toFixedString(value, params.decimals, params.rounding);

function displayRow(row: MeasuredPackage, params: ShipmentParams): PackageOutput {
  return {
    index: row.index,
    quantity: row.quantity,
    cbmPerPieceExact: row.cbmPerPieceExact,
    cbmPerPiece: shown(row.cbmPerPieceExact, params),
    totalCbmExact: row.totalCbmExact,
    totalCbm: shown(row.totalCbmExact, params),
    totalWeightKgExact: row.totalWeightKgExact,
    totalWeightKg: row.totalWeightKgExact === null ? null : shown(row.totalWeightKgExact, params),
  };
}

function addPackage(total: Totals, row: MeasuredPackage): Totals {
  const weighted = row.totalWeightKgExact !== null;
  return {
    cbm: add(total.cbm, row.totalCbmExact),
    pieces: add(total.pieces, row.quantity),
    weight: add(total.weight, row.totalWeightKgExact ?? '0'),
    weightedPieces: weighted ? add(total.weightedPieces, row.quantity) : total.weightedPieces,
    weightedRows: total.weightedRows + (weighted ? 1 : 0),
  };
}

function totalWorking(total: Totals, cft: string): WorkingStep[] {
  const steps = [
    step('totalCbm', 'cbmShipment.total', { totalCbm: total.cbm }, total.cbm),
    step(
      'totalCft',
      'cbmShipment.cft',
      { cbm: total.cbm, factor: CUBIC_FEET_PER_CUBIC_METRE },
      cft,
    ),
    step('totalPieces', 'cbmShipment.pieces', { totalPieces: total.pieces }, total.pieces),
  ];
  if (total.weightedRows > 0) {
    steps.push(
      step(
        'knownPackedWeightKg',
        'cbmShipment.knownWeight',
        { weightedPieces: total.weightedPieces, totalPieces: total.pieces },
        total.weight,
      ),
    );
  }
  return steps;
}

export function aggregate(rows: MeasuredPackage[], params: ShipmentParams): ShipmentOutput {
  const initial: Totals = {
    cbm: '0',
    pieces: '0',
    weight: '0',
    weightedPieces: '0',
    weightedRows: 0,
  };
  const total = rows.reduce(addPackage, initial);
  const cft = mul(total.cbm, CUBIC_FEET_PER_CUBIC_METRE);
  const knownWeight = total.weightedRows > 0 ? total.weight : null;
  const coverage = total.weightedRows === rows.length ? 'complete' : 'partial';
  return {
    rows: rows.map((row) => displayRow(row, params)),
    totalCbmExact: total.cbm,
    totalCbm: shown(total.cbm, params),
    totalCftExact: cft,
    totalCft: shown(cft, params),
    totalPieces: total.pieces,
    knownPackedWeightKgExact: knownWeight,
    knownPackedWeightKg: knownWeight === null ? null : shown(knownWeight, params),
    weightCoverage: knownWeight === null ? 'none' : coverage,
    weightedPieces: total.weightedPieces,
    weightedRowCount: total.weightedRows,
    working: [...rows.flatMap(packageWorking), ...totalWorking(total, cft)],
  };
}

export function volumeWarnings(output: ShipmentOutput, decimals: number): OpWarning[] {
  const smallest = decimals === 0 ? '1' : `0.${'0'.repeat(decimals - 1)}1`;
  const paths = output.rows
    .filter((row) => isZero(row.cbmPerPiece))
    .map((row) => `packages.${row.index}`);
  if (isZero(output.totalCbm)) paths.push('totalCbm');
  return paths.map((path) =>
    warning('LOGISTICS_VOLUME_ROUNDS_TO_ZERO', { path, details: { smallest } }),
  );
}
