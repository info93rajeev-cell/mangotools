import { createTestContext, executeOperation } from '@mangotools/core';
import { describe, expect, it } from 'vitest';
import { costEstimate } from './operation.ts';

const input = { rateBasis: 'per-cbm', quantity: '1', rate: '100', currency: 'INR' };
const run = (changes = {}, params = {}) =>
  executeOperation(costEstimate, { ...input, ...changes }, params, createTestContext());

describe('cost issue 207 acceptance', () => {
  it.each([
    [{}, '100.00', false],
    [{ quantity: '46.8', rate: '4500' }, '210600.00', false],
    [{ quantity: '46.8', rate: '4500', otherCharges: '2000' }, '212600.00', false],
    [{ quantity: '10', minimumCharge: '1500' }, '1500.00', true],
    [{ quantity: '20', minimumCharge: '1500' }, '2000.00', false],
    [{ quantity: '15', minimumCharge: '1500' }, '1500.00', false],
    [{ quantity: '100', otherCharges: '500' }, '10500.00', false],
    [{ minimumCharge: '0', otherCharges: '0' }, '100.00', false],
    [{ minimumCharge: ' ', otherCharges: '' }, '100.00', false],
  ])('calculates %j', async (changes, total, applied) => {
    expect(await run(changes)).toMatchObject({
      ok: true,
      value: {
        estimatedTotal: total,
        minimumApplied: applied,
      },
    });
  });

  it('compares the exact base with the minimum before rounding', async () => {
    expect(await run({ quantity: '1.0049', rate: '1', minimumCharge: '1' })).toMatchObject({
      ok: true,
      value: { baseCharge: '1.00', minimumApplied: false, freightCharge: '1.00' },
    });
    expect(await run({ quantity: '0.9999', rate: '1', minimumCharge: '1' })).toMatchObject({
      ok: true,
      value: { baseCharge: '1.00', minimumApplied: true, freightCharge: '1.00' },
    });
  });

  it('rounds decimal half cases deterministically', async () => {
    expect(await run({ quantity: '1.005', rate: '1' })).toMatchObject({
      ok: true,
      value: { estimatedTotal: '1.01' },
    });
    expect(await run({ quantity: '1.005', rate: '1' }, { rounding: 'half-even' })).toMatchObject({
      ok: true,
      value: { estimatedTotal: '1.00' },
    });
  });

  it('does not round exact CBM to displayed shipment precision', async () => {
    expect(await run({ quantity: '0.0125', rate: '1000' })).toMatchObject({
      ok: true,
      value: { estimatedTotal: '12.50' },
    });
  });

  it.each(['per-kg', 'per-pallet', 'per-box'])(
    'rejects unsupported basis %s',
    async (rateBasis) => {
      expect(await run({ rateBasis })).toMatchObject({
        ok: false,
        error: { code: 'INVALID_INPUT', path: 'rateBasis' },
      });
    },
  );

  it.each(['NaN', 'Infinity', 'abc', '1e3'])('rejects malformed rate %s', async (rate) => {
    expect(await run({ rate })).toMatchObject({
      ok: false,
      error: { code: 'LOGISTICS_INVALID_NUMBER', path: 'rate' },
    });
  });

  it.each(['sku', 'description', 'filename'])(
    'rejects unrestricted field %s without echoing content',
    async (field) => {
      const result = await run({ [field]: 'private-content-207' });
      expect(result).toMatchObject({ ok: false, error: { code: 'INVALID_INPUT' } });
      expect(JSON.stringify(result)).not.toContain('private-content-207');
    },
  );

  it('checks documented amount and volume caps', async () => {
    expect(await run({ rate: '1000000000000', quantity: '1000000' })).toMatchObject({
      ok: true,
      value: { estimatedTotal: '1000000000000000000.00' },
    });
    expect(await run({ rate: '1000000000000.01' })).toMatchObject({
      ok: false,
      error: { code: 'LOGISTICS_AMOUNT_TOO_LARGE', path: 'rate' },
    });
    expect(await run({ quantity: '1000000.000000000001' })).toMatchObject({
      ok: false,
      error: { code: 'LOGISTICS_RATE_QUANTITY_TOO_LARGE', path: 'quantity' },
    });
    expect(await run({ quantity: '0.1234567890123' })).toMatchObject({
      ok: false,
      error: { code: 'LOGISTICS_TOO_MANY_DECIMALS', path: 'quantity' },
    });
  });

  it('accepts the container boundary without deriving container counts', async () => {
    expect(await run({ rateBasis: 'per-container', quantity: '10000' })).toMatchObject({
      ok: true,
      value: { quantity: '10000' },
    });
    expect(await run({ rateBasis: 'per-container', quantity: '1.0' })).toMatchObject({
      ok: true,
      value: { quantity: '1' },
    });
  });

  it('is repeatable and performs no logging', async () => {
    const ctx = createTestContext();
    ctx.log = () => {
      throw new Error('unexpected logging');
    };
    const result = await executeOperation(costEstimate, input, {}, ctx);
    expect(result.ok).toBe(true);
    expect(result).toEqual(await run());
  });
});
