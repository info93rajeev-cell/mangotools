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
  const result = await run(input);
  if (!result.ok) throw new Error(result.error.code);
  return result.value;
}

const run = (input: Record<string, unknown>) =>
  executeOperation(tileQuantityV2, input, {}, createTestContext());

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

  it('uses the selected decimal places as the wastage input precision ceiling', async () => {
    for (const input of [
      { decimalPlaces: '2', wastagePercent: '1.25' },
      { decimalPlaces: '3', wastagePercent: '1.250' },
      { decimalPlaces: '4', wastagePercent: '1.2500' },
    ]) {
      expect(await run({ ...room, ...input })).toMatchObject({ ok: true });
    }

    for (const input of [
      { decimalPlaces: '2', wastagePercent: '1.250' },
      { decimalPlaces: '3', wastagePercent: '1.2500' },
      { decimalPlaces: '4', wastagePercent: '1.25000' },
    ]) {
      expect(await run({ ...room, ...input })).toMatchObject({
        ok: false,
        error: { code: 'CIVIL_TOO_MANY_DECIMALS', path: 'wastagePercent' },
      });
    }
  });

  it('changes decimal presentation without changing exact tile arithmetic', async () => {
    const values = await Promise.all(
      ['2', '3', '4'].map((decimalPlaces) =>
        value({ ...room, decimalPlaces, wastagePercent: '1.25' }),
      ),
    );
    const adjusted = values.map(
      (result) => result.working.find((item) => item.ref === 'orderTiles')?.variables.adjusted,
    );
    expect(new Set(adjusted).size).toBe(1);
    expect(values.map((result) => result.baseTiles)).toEqual(['222.22', '222.222', '222.2222']);
    expect(values.map((result) => result.orderTiles)).toEqual(['225', '225', '225']);
  });

  it('keeps tile and box purchasing quantities as whole numbers at every precision', async () => {
    for (const decimalPlaces of ['2', '3', '4']) {
      const v = await value({
        ...room,
        decimalPlaces,
        packMode: 'pieces',
        tilesPerBox: '10',
      });
      expect(v.orderTiles).toMatch(/^\d+$/);
      expect(v.boxes).toMatch(/^\d+$/);
    }
  });

  it('has a message for every code it can return', () => {
    for (const code of tileQuantityV2.errors) expect(messages[code]).toBeDefined();
    expect(messages.CIVIL_ASSUMPTION_TILE_FACE).toBeDefined();
  });
});
