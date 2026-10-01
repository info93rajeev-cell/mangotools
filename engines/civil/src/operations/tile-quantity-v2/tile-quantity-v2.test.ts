import { createTestContext, executeOperation } from '@mangotools/core';
import { describe, expect, it } from 'vitest';
import { messages } from '../../errors.ts';
import { tileQuantityV2 } from './operation.ts';

const room = {
  mode: 'dimensions',
  unit: 'm',
  surfaceLength: '5',
  surfaceWidth: '4',
  quantity: '1',
  tileUnit: 'mm',
  tileLength: '300',
  tileWidth: '300',
  wastagePercent: '10',
  packMode: 'none',
};

async function value(input: Record<string, unknown>) {
  const result = await executeOperation(tileQuantityV2, input, {}, createTestContext());
  if (!result.ok) throw new Error(result.error.code);
  return result.value;
}

describe('civil.tile.quantity@2', () => {
  it('orders whole tiles and never renders noise like 713.999999', async () => {
    const v = await value({ ...room, surfaceLength: '7.14', surfaceWidth: '9', tileLength: '300' });
    expect(v.orderTiles).toMatch(/^\d+$/);
    expect(v.baseTiles).toMatch(/^\d+\.\d{2}$/);
  });

  it('applies wastage once to the unrounded base count', async () => {
    const v = await value(room);
    expect(v.baseTiles).toBe('222.22');
    expect(v.orderTiles).toBe('245');
  });

  it('gives the same pieces for equivalent metric and imperial inputs', async () => {
    const imperial = await value({
      ...room,
      unit: 'ft',
      surfaceLength: '12',
      surfaceWidth: '10',
      tileUnit: 'in',
      tileLength: '12',
      tileWidth: '12',
    });
    const metric = await value({
      ...room,
      surfaceLength: '3.6576',
      surfaceWidth: '3.048',
      tileLength: '304.8',
      tileWidth: '304.8',
    });
    expect(metric.orderTiles).toBe(imperial.orderTiles);
    expect(metric.orderTiles).toBe('132');
  });

  it('treats blank tiles per box as "no box count"', async () => {
    const v = await value({ ...room, packMode: 'pieces' });
    expect(v.boxes).toBeUndefined();
  });

  it('has a message for every code it can return', () => {
    for (const code of tileQuantityV2.errors) expect(messages[code]).toBeDefined();
    expect(messages.CIVIL_ASSUMPTION_TILE_FACE).toBeDefined();
  });
});
