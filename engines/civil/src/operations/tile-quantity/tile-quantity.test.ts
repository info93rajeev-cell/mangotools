import { createTestContext, executeOperation } from '@mangotools/core';
import { describe, expect, it } from 'vitest';
import { messages } from '../../errors.ts';
import { tileQuantity } from './operation.ts';

const run = (input: Record<string, unknown>, params: Record<string, unknown> = {}) =>
  executeOperation(tileQuantity, input, params, createTestContext());

const room = {
  unit: 'm',
  surfaceLength: '5',
  surfaceWidth: '4',
  tileLength: '0.3',
  tileWidth: '0.3',
  quantity: '1',
  wastagePercent: '0',
};

describe('civil.tile.quantity', () => {
  it('computes surface area, tile area and base tile count for a simple meter room', async () => {
    const result = await run(room);
    if (!result.ok) throw new Error('expected success');
    expect(result.value.surfaceAreaM2).toBe('20.000');
    expect(result.value.tileAreaM2).toBe('0.090');
    expect(result.value.baseTileCount).toBe('223');
    expect(result.value.totalTiles).toBe('223');
    expect(result.value.wastageTileCount).toBe('0');
  });

  it('rounds the base tile count up, never down (20 / 0.09 = 222.22...)', async () => {
    const result = await run(room);
    expect(result.ok && result.value.baseTileCount).toBe('223');
  });

  it('applies wastage to the already-rounded base tile count, then rounds up again', async () => {
    const result = await run({ ...room, wastagePercent: '10' });
    if (!result.ok) throw new Error('expected success');
    // base 223 tiles x 1.10 = 245.3, rounded up to 246; wastage tiles = 246 - 223 = 23.
    expect(result.value.baseTileCount).toBe('223');
    expect(result.value.totalTiles).toBe('246');
    expect(result.value.wastageTileCount).toBe('23');
  });

  it('computes boxes required, rounded up, when tiles per box is given', async () => {
    const result = await run({ ...room, wastagePercent: '10', tilesPerBox: '10' });
    if (!result.ok) throw new Error('expected success');
    expect(result.value.totalTiles).toBe('246');
    expect(result.value.tilesPerBox).toBe('10');
    expect(result.value.boxesRequired).toBe('25');
  });

  it('omits boxes required entirely when tiles per box is left blank', async () => {
    const result = await run(room);
    expect(result.ok && result.value.boxesRequired).toBeUndefined();
    expect(result.ok && result.value.tilesPerBox).toBeUndefined();
    expect(result.ok && 'boxesRequired' in result.value).toBe(false);
  });

  it('multiplies surface area by the number of identical rooms', async () => {
    const result = await run({ ...room, quantity: '2' });
    if (!result.ok) throw new Error('expected success');
    expect(result.value.surfaceAreaM2).toBe('40.000');
    expect(result.value.baseTileCount).toBe('445');
  });

  it('gives a unit-independent tile count for a feet-based room and tile (both exactly divide)', async () => {
    const result = await run({
      unit: 'ft',
      surfaceLength: '10',
      surfaceWidth: '10',
      tileLength: '1',
      tileWidth: '1',
      quantity: '1',
      wastagePercent: '0',
    });
    if (!result.ok) throw new Error('expected success');
    expect(result.value.baseTileCount).toBe('100');
    expect(result.value.totalTiles).toBe('100');
  });

  it('gives the same result for numbers and strings', async () => {
    const fromStrings = await run(room);
    const fromNumbers = await run({
      unit: 'm',
      surfaceLength: 5,
      surfaceWidth: 4,
      tileLength: 0.3,
      tileWidth: 0.3,
      quantity: 1,
      wastagePercent: 0,
    });
    expect(fromStrings).toEqual(fromNumbers);
  });

  it('rejects zero and negative dimensions', async () => {
    const zero = await run({ ...room, surfaceLength: '0' });
    expect(!zero.ok && zero.error.code).toBe('CIVIL_NOT_POSITIVE');
    const negative = await run({ ...room, tileWidth: '-0.3' });
    expect(!negative.ok && negative.error.code).toBe('CIVIL_NOT_POSITIVE');
  });

  it('rejects missing dimensions', async () => {
    const { surfaceLength, ...missing } = room;
    const result = await run(missing);
    expect(!result.ok && result.error.code).toBe('CIVIL_MISSING_INPUT');
    expect(!result.ok && result.error.path).toBe('surfaceLength');
  });

  it('rejects an invalid number', async () => {
    const result = await run({ ...room, surfaceWidth: 'abc' });
    expect(!result.ok && result.error.code).toBe('CIVIL_INVALID_NUMBER');
  });

  it('rejects wastage below 0 or above 50', async () => {
    const negative = await run({ ...room, wastagePercent: '-1' });
    expect(!negative.ok && negative.error.code).toBe('CIVIL_WASTAGE_OUT_OF_RANGE');
    const tooHigh = await run({ ...room, wastagePercent: '50.01' });
    expect(!tooHigh.ok && tooHigh.error.code).toBe('CIVIL_WASTAGE_OUT_OF_RANGE');
  });

  it('rejects a tiles-per-box that is not a positive whole number', async () => {
    const zero = await run({ ...room, tilesPerBox: '0' });
    expect(!zero.ok && zero.error.code).toBe('CIVIL_TILES_PER_BOX_NOT_POSITIVE');
    const fractional = await run({ ...room, tilesPerBox: '10.5' });
    expect(!fractional.ok && fractional.error.code).toBe('CIVIL_TILES_PER_BOX_NOT_WHOLE');
    const negative = await run({ ...room, tilesPerBox: '-5' });
    expect(!negative.ok && negative.error.code).toBe('CIVIL_TILES_PER_BOX_NOT_POSITIVE');
  });

  it('rejects an invalid number of rooms', async () => {
    const notWhole = await run({ ...room, quantity: '1.5' });
    expect(!notWhole.ok && notWhole.error.code).toBe('CIVIL_QUANTITY_NOT_WHOLE');
    const zero = await run({ ...room, quantity: '0' });
    expect(!zero.ok && zero.error.code).toBe('CIVIL_QUANTITY_NOT_POSITIVE');
  });

  it('flags an implausibly large surface dimension without rejecting the input', async () => {
    const result = await run({ ...room, surfaceLength: '150' });
    expect(result.ok).toBe(true);
    expect(result.ok && result.warnings.map((w) => w.code)).toContain(
      'CIVIL_DIMENSION_UNREALISTIC',
    );
  });

  it('always carries the standing estimation-aid warnings', async () => {
    const result = await run(room);
    const codes = result.ok ? result.warnings.map((w) => w.code) : [];
    expect(codes).toEqual([
      'CIVIL_ESTIMATION_AID_ONLY',
      'CIVIL_VERIFY_TILE_BEFORE_INSTALLATION',
      'CIVIL_TILE_CONDITIONS_VARY',
      'CIVIL_NOT_PROFESSIONAL_REPLACEMENT_MASON',
      'CIVIL_TILE_SCOPE_LIMIT',
    ]);
  });

  it('respects the decimals param for area output, but never for tile/box counts', async () => {
    const result = await run(room, { decimals: 1 });
    expect(result.ok && result.value.surfaceAreaM2).toBe('20.0');
    expect(result.ok && result.value.baseTileCount).toBe('223');
  });

  it('has an English message for every code it can return', () => {
    const codes = [...tileQuantity.errors, 'CIVIL_DIMENSION_UNREALISTIC'];
    for (const code of codes) expect(messages[code], code).toBeTruthy();
  });
});
