import type { WorkingStep } from '@mangotools/core';
import type { Computed, Measured } from './types.ts';

const step = (
  ref: string,
  formulaKey: string,
  variables: Record<string, string>,
  result: string,
): WorkingStep => ({ ref, formulaKey, variables, result });

/** Working steps with full-precision values (templates come from the tool preset). */
export function workingSteps(m: Measured, c: Computed): WorkingStep[] {
  const steps = [
    step(
      'surfaceAreaPerRoom',
      'tile.surfaceAreaPerRoom',
      { surfaceLength: m.surfaceLength, surfaceWidth: m.surfaceWidth, unit: m.unit },
      c.surfaceAreaPerRoomM2,
    ),
    step(
      'surfaceArea',
      'tile.surfaceArea',
      { surfaceAreaPerRoom: c.surfaceAreaPerRoomM2, quantity: m.quantity },
      c.surfaceAreaM2,
    ),
    step(
      'tileArea',
      'tile.tileArea',
      { tileLength: m.tileLength, tileWidth: m.tileWidth, unit: m.unit },
      c.tileAreaM2,
    ),
    step(
      'baseTileCount',
      'tile.baseTileCount',
      { surfaceArea: c.surfaceAreaM2, tileArea: c.tileAreaM2 },
      c.baseTileCount,
    ),
    step(
      'totalTiles',
      'tile.totalTiles',
      { baseTileCount: c.baseTileCount, wastagePercent: m.wastagePercent },
      c.totalTiles,
    ),
    step(
      'wastageTileCount',
      'tile.wastageTileCount',
      { totalTiles: c.totalTiles, baseTileCount: c.baseTileCount },
      c.wastageTileCount,
    ),
  ];
  if (c.boxesRequired !== null && m.tilesPerBox !== null) {
    steps.push(
      step(
        'boxesRequired',
        'tile.boxesRequired',
        { totalTiles: c.totalTiles, tilesPerBox: m.tilesPerBox },
        c.boxesRequired,
      ),
    );
  }
  return steps;
}

export function buildOutput(
  m: Measured,
  c: Computed,
  shown: (value: string) => string,
  working: WorkingStep[],
) {
  return {
    unit: m.unit,
    quantity: m.quantity,
    wastagePercent: m.wastagePercent,
    surfaceAreaM2: shown(c.surfaceAreaM2),
    surfaceAreaFt2: shown(c.surfaceAreaFt2),
    tileAreaM2: shown(c.tileAreaM2),
    baseTileCount: c.baseTileCount,
    wastageTileCount: c.wastageTileCount,
    totalTiles: c.totalTiles,
    ...(m.tilesPerBox !== null ? { tilesPerBox: m.tilesPerBox } : {}),
    ...(c.boxesRequired !== null ? { boxesRequired: c.boxesRequired } : {}),
    working,
  };
}
