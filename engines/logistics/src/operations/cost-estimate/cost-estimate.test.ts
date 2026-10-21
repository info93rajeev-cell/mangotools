import { createTestContext, executeOperation } from '@mangotools/core';
import { describe, expect, it } from 'vitest';
import { messages } from '../../errors.ts';
import { estimateFreight, freightCurrencies, rateBases } from '../../lib/freight-cost.ts';
import { costEstimate } from './operation.ts';

const run = (input: Record<string, unknown>, params: Record<string, unknown> = {}) =>
  executeOperation(costEstimate, input, params, createTestContext());

const perContainer = {
  rateBasis: 'per-container',
  quantity: '2',
  rate: '145000',
  otherCharges: '12000',
  currency: 'INR',
};

describe('logistics.cost.estimate', () => {
  it('supports exactly the two approved rate bases', () => {
    expect([...rateBases]).toEqual(['per-cbm', 'per-container']);
  });

  it('supports exactly the five approved Phase 1 currencies', async () => {
    expect([...freightCurrencies]).toEqual(['INR', 'USD', 'EUR', 'GBP', 'AED']);
    const cny = await run({ ...perContainer, currency: 'CNY' });
    expect(cny.ok).toBe(false);
  });

  it('uses the shared formula: max(quantity × rate, minimum) + other charges', () => {
    expect(
      estimateFreight('2', { rate: '145000', minimumCharge: null, otherCharges: '12000' }),
    ).toEqual({
      baseCharge: '290000',
      minimumApplied: false,
      freightCharge: '290000',
      estimatedTotal: '302000',
    });
    expect(estimateFreight('1', { rate: '100', minimumCharge: '250', otherCharges: null })).toEqual(
      {
        baseCharge: '100',
        minimumApplied: true,
        freightCharge: '250',
        estimatedTotal: '250',
      },
    );
  });

  it('applies a minimum equal to the base charge without marking it applied', () => {
    const estimate = estimateFreight('2', { rate: '50', minimumCharge: '100', otherCharges: null });
    expect(estimate.minimumApplied).toBe(false);
    expect(estimate.freightCharge).toBe('100');
  });

  it('never converts currency: changing the currency changes no value', async () => {
    const results = await Promise.all(
      freightCurrencies.map((currency) => run({ ...perContainer, currency })),
    );
    const values = results.map((r) => {
      if (!r.ok) throw new Error('expected success');
      const { currency, ...rest } = r.value;
      expect(currency).toBeDefined();
      return rest;
    });
    for (const value of values) expect(value).toEqual(values[0]);
  });

  it('gives the same result for numbers and strings', async () => {
    const fromStrings = await run(perContainer);
    const fromNumbers = await run({
      ...perContainer,
      quantity: 2,
      rate: 145000,
      otherCharges: 12000,
    });
    expect(fromNumbers).toEqual(fromStrings);
  });

  it('keeps exact working values and rounds outputs once', async () => {
    const result = await run({
      rateBasis: 'per-cbm',
      quantity: '0.123456789012',
      rate: '99.99',
      currency: 'USD',
    });
    if (!result.ok) throw new Error('expected success');
    const base = result.value.working.find((s) => s.ref === 'baseCharge');
    expect(base?.result).toBe('12.34444433330988');
    expect(result.value.baseCharge).toBe('12.34');
    expect(result.value.working.map((s) => s.formulaKey)).toEqual(['fc.base.per-cbm', 'fc.total']);
  });

  it('adds a minimum-charge working step only when a minimum is given', async () => {
    const result = await run({ ...perContainer, minimumCharge: '400000' });
    if (!result.ok) throw new Error('expected success');
    expect(result.value.working.map((s) => s.formulaKey)).toEqual([
      'fc.base.per-container',
      'fc.minimum.applied',
      'fc.total',
    ]);
    expect(result.value.estimatedTotal).toBe('412000.00');
  });

  it('rejects a container count that is not whole, and too many containers', async () => {
    const fractional = await run({ ...perContainer, quantity: '2.5' });
    expect(fractional.ok ? null : fractional.error.code).toBe(
      'LOGISTICS_CONTAINER_COUNT_NOT_WHOLE',
    );
    const tooMany = await run({ ...perContainer, quantity: '10001' });
    expect(tooMany.ok ? null : tooMany.error.code).toBe('LOGISTICS_RATE_QUANTITY_TOO_LARGE');
  });

  it('accepts a fractional volume for per-cbm', async () => {
    const result = await run({ ...perContainer, rateBasis: 'per-cbm', quantity: '2.5' });
    expect(result.ok && result.value.baseCharge).toBe('362500.00');
  });

  it('has a message for every error and notice code it can return', () => {
    const codes = [
      ...costEstimate.errors,
      'LOGISTICS_COST_USER_RATE',
      'LOGISTICS_COST_MINIMUM_APPLIED',
    ];
    for (const code of codes) expect(messages[code], code).toBeTruthy();
  });
});
