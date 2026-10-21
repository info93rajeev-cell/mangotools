import { createTestContext, executeOperation } from '@mangotools/core';
import { describe, expect, it } from 'vitest';
import { messages } from '../../errors.ts';
import { cbmShipment } from './operation.ts';

const packageRow = { length: '60', width: '40', height: '40', unit: 'cm', quantity: '10' };
const run = (packages: unknown = [packageRow], input = {}, params = {}) =>
  executeOperation(cbmShipment, { packages, ...input }, params, createTestContext());

describe('logistics.cbm.shipment', () => {
  it('aggregates mixed packages and optional weights exactly', async () => {
    const result = await run([
      { ...packageRow, weightPerItem: '5', weightUnit: 'kg' },
      { length: '1.2', width: '1', height: '1.2', unit: 'm', quantity: '2' },
    ]);
    expect(result).toMatchObject({
      ok: true,
      value: {
        totalCbmExact: '3.84',
        totalCbm: '3.840',
        totalCft: '135.608',
        totalPieces: '12',
        knownPackedWeightKgExact: '50',
        weightCoverage: 'partial',
        weightedPieces: '10',
        weightedRowCount: 1,
      },
    });
  });

  it.each([
    ['mm', '600', '400', '400', '0.096'],
    ['cm', '60', '40', '40', '0.096'],
    ['m', '0.6', '0.4', '0.4', '0.096'],
    ['in', '12', '12', '12', '0.028316846592'],
    ['ft', '1', '1', '1', '0.028316846592'],
  ])('normalizes %s exactly', async (unit, length, width, height, exact) => {
    expect(await run([{ unit, length, width, height, quantity: '1' }])).toMatchObject({
      ok: true,
      value: { totalCbmExact: exact },
    });
  });

  it('never sums rounded row volumes', async () => {
    const row = { ...packageRow, length: '25', width: '25', height: '20', quantity: '1' };
    expect(await run([row, row])).toMatchObject({
      ok: true,
      value: {
        rows: [{ totalCbm: '0.013' }, { totalCbm: '0.013' }],
        totalCbmExact: '0.025',
        totalCbm: '0.025',
      },
    });
  });

  it.each([
    ['kg', '0.5', '1'],
    ['g', '500', '1'],
    ['lb', '1', '0.90718474'],
  ])('converts %s weights', async (weightUnit, weightPerItem, exact) => {
    expect(await run([{ ...packageRow, quantity: '2', weightUnit, weightPerItem }])).toMatchObject({
      ok: true,
      value: { knownPackedWeightKgExact: exact, weightCoverage: 'complete', weightedPieces: '2' },
    });
  });

  it('keeps unknown weights null, including blank optional values', async () => {
    expect(await run([{ ...packageRow, weightPerItem: '  ', weightUnit: 'kg' }])).toMatchObject({
      ok: true,
      value: {
        knownPackedWeightKgExact: null,
        knownPackedWeightKg: null,
        weightCoverage: 'none',
        weightedPieces: '0',
        weightedRowCount: 0,
      },
    });
  });

  it.each([1, 50])('accepts %i rows and preserves order', async (count) => {
    const packages = Array.from({ length: count }, (_, i) => ({
      ...packageRow,
      quantity: String(i + 1),
    }));
    const result = await run(packages);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.rows.map((row) => row.index)).toEqual(packages.map((_, i) => i));
    expect(result.value.rows.map((row) => row.quantity)).toEqual(
      packages.map((row) => row.quantity),
    );
  });

  it.each([0, 51])('rejects %i rows', async (count) => {
    expect(await run(Array.from({ length: count }, () => packageRow))).toMatchObject({
      ok: false,
      error: { code: 'INVALID_INPUT', path: 'packages' },
    });
  });

  it('keeps tiny positive volumes exact and warns in row then shipment order', async () => {
    const result = await run([
      { ...packageRow, unit: 'mm', length: '1', width: '1', height: '1', quantity: '1' },
    ]);
    expect(result).toMatchObject({
      ok: true,
      value: { totalCbmExact: '0.000000001', totalCbm: '0.000' },
      warnings: [
        { path: 'packages.0', code: 'LOGISTICS_VOLUME_ROUNDS_TO_ZERO' },
        { path: 'totalCbm', code: 'LOGISTICS_VOLUME_ROUNDS_TO_ZERO' },
      ],
    });
  });

  it('uses params and display overrides without changing exact values', async () => {
    const row = {
      ...packageRow,
      unit: 'm',
      length: '0.5',
      width: '0.1',
      height: '0.1',
      quantity: '1',
    };
    expect(await run([row], {}, { decimals: 2 })).toMatchObject({
      ok: true,
      value: { totalCbm: '0.01' },
    });
    expect(await run([row], {}, { decimals: 2, rounding: 'half-even' })).toMatchObject({
      ok: true,
      value: { totalCbm: '0.00' },
    });
    expect(await run([row], { decimalPlaces: '4' }, { decimals: 2 })).toMatchObject({
      ok: true,
      value: { totalCbm: '0.0050', totalCbmExact: '0.005' },
    });
  });

  it('supports large exact values and the quantity boundary', async () => {
    expect(
      await run([
        {
          ...packageRow,
          unit: 'm',
          length: '999999999999',
          width: '1',
          height: '1',
          quantity: '1000000',
        },
      ]),
    ).toMatchObject({
      ok: true,
      value: { totalCbmExact: '999999999999000000', totalPieces: '1000000' },
    });
  });

  it('accepts twelve fractional digits and integral decimal quantities', async () => {
    expect(
      await run([{ ...packageRow, length: '0.000000000001', quantity: '12.0' }]),
    ).toMatchObject({ ok: true, value: { totalPieces: '12' } });
  });

  it('produces identical outcomes and never logs payloads', async () => {
    const ctx = createTestContext();
    ctx.log = () => {
      throw new Error('unexpected logging');
    };
    const a = await executeOperation(cbmShipment, { packages: [packageRow] }, {}, ctx);
    expect(a).toEqual(await run());
    expect(JSON.stringify(a)).toBe(JSON.stringify(await run()));
  });

  it('has messages for all declared errors and warnings', () => {
    for (const code of [...cbmShipment.errors, 'LOGISTICS_VOLUME_ROUNDS_TO_ZERO'])
      expect(messages[code]).toBeTruthy();
  });
});
