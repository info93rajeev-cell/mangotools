import { createTestContext, executeOperation } from '@mangotools/core';
import { describe, expect, it } from 'vitest';
import { cbmShipment } from './operation.ts';

const row = { length: '60', width: '40', height: '40', unit: 'cm', quantity: '10' };
const run = (change: Record<string, unknown>, params = {}) =>
  executeOperation(cbmShipment, { packages: [{ ...row, ...change }] }, params, createTestContext());

describe('shipment validation', () => {
  it.each([
    ['length', '', 'LOGISTICS_MISSING_INPUT'],
    ['width', undefined, 'LOGISTICS_MISSING_INPUT'],
    ['height', '0', 'LOGISTICS_NOT_POSITIVE'],
    ['length', '-1', 'LOGISTICS_NOT_POSITIVE'],
    ['quantity', '0', 'LOGISTICS_QUANTITY_NOT_POSITIVE'],
    ['quantity', '-1', 'LOGISTICS_QUANTITY_NOT_POSITIVE'],
    ['quantity', '2.5', 'LOGISTICS_QUANTITY_NOT_WHOLE'],
    ['quantity', '1000001', 'LOGISTICS_QUANTITY_TOO_LARGE'],
    ['length', 'NaN', 'LOGISTICS_INVALID_NUMBER'],
    ['length', 'Infinity', 'LOGISTICS_INVALID_NUMBER'],
    ['length', '1e2', 'LOGISTICS_INVALID_NUMBER'],
    ['length', '1,000', 'LOGISTICS_INVALID_NUMBER'],
    ['length', '1.1234567890123', 'LOGISTICS_TOO_MANY_DECIMALS'],
    ['length', '1000000000000', 'LOGISTICS_MEASUREMENT_TOO_LARGE'],
    ['length', '1'.repeat(65), 'LOGISTICS_VALUE_TOO_LONG'],
    ['quantity', '1'.repeat(65), 'LOGISTICS_VALUE_TOO_LONG'],
    ['weightPerItem', '0', 'LOGISTICS_NOT_POSITIVE'],
    ['weightPerItem', '-1', 'LOGISTICS_NOT_POSITIVE'],
    ['weightPerItem', 'NaN', 'LOGISTICS_INVALID_NUMBER'],
    ['weightPerItem', '1.1234567890123', 'LOGISTICS_TOO_MANY_DECIMALS'],
    ['weightPerItem', '1000000000000', 'LOGISTICS_MEASUREMENT_TOO_LARGE'],
  ])('returns a typed error for %s=%s', async (field, value, code) => {
    expect(await run({ [field]: value })).toMatchObject({
      ok: false,
      error: { code, path: `packages.0.${field}` },
    });
  });

  it('requires a unit for supplied weight', async () => {
    expect(await run({ weightPerItem: '1' })).toMatchObject({
      ok: false,
      error: { code: 'LOGISTICS_WEIGHT_UNIT_REQUIRED', path: 'packages.0.weightUnit' },
    });
  });

  it.each([
    { unit: 'yd' },
    { weightUnit: 'oz' },
    { length: 1 },
    { length: Number.NaN },
    { length: Number.POSITIVE_INFINITY },
  ])('rejects structural input %j', async (change) => {
    expect(await run(change)).toMatchObject({ ok: false, error: { code: 'INVALID_INPUT' } });
  });

  it.each(['description', 'filename'])(
    'rejects unrestricted %s without echoing it',
    async (field) => {
      const result = await run({ [field]: 'private-content-123' });
      expect(result).toMatchObject({ ok: false, error: { code: 'INVALID_INPUT' } });
      expect(JSON.stringify(result)).not.toContain('private-content-123');
    },
  );

  it('reports first row then field in deterministic order', async () => {
    expect(
      await executeOperation(
        cbmShipment,
        {
          packages: [
            { ...row, width: '0', length: '-1' },
            { ...row, length: '0' },
          ],
        },
        {},
        createTestContext(),
      ),
    ).toMatchObject({
      ok: false,
      error: { path: 'packages.0.length' },
    });
  });

  it('rejects unknown keys, unsupported precision and rounding', async () => {
    expect(
      await executeOperation(
        cbmShipment,
        { packages: [row], filename: 'secret' },
        {},
        createTestContext(),
      ),
    ).toMatchObject({ ok: false, error: { code: 'INVALID_INPUT' } });
    expect(await run({}, { decimals: 7 })).toMatchObject({
      ok: false,
      error: { code: 'INVALID_PARAMS' },
    });
    expect(await run({}, { rounding: 'floor' })).toMatchObject({
      ok: false,
      error: { code: 'INVALID_PARAMS' },
    });
  });
});
