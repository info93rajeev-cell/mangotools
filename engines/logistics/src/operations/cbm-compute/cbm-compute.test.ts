import { createTestContext, executeOperation } from '@mangotools/core';
import { mul } from '@mangotools/engine-numeric';
import { describe, expect, it } from 'vitest';
import { messages } from '../../errors.ts';
import { cbmCompute } from './operation.ts';
import { CUBIC_METRES_PER_CUBED_UNIT } from './units.ts';

const run = (input: Record<string, unknown>, params: Record<string, unknown> = {}) =>
  executeOperation(cbmCompute, input, params, createTestContext());

const carton = { unit: 'cm', length: '50', width: '40', height: '30', quantity: '100' };

describe('logistics.cbm.compute', () => {
  it('uses exact cubed unit factors', () => {
    expect(CUBIC_METRES_PER_CUBED_UNIT.cm).toBe(mul(mul('0.01', '0.01'), '0.01'));
    expect(CUBIC_METRES_PER_CUBED_UNIT.mm).toBe(mul(mul('0.001', '0.001'), '0.001'));
    expect(CUBIC_METRES_PER_CUBED_UNIT.in).toBe(mul(mul('0.0254', '0.0254'), '0.0254'));
  });

  it('never uses floating point (0.1 × 0.2 × 0.3 m is exactly 0.006 m³)', async () => {
    const result = await run(
      { unit: 'm', length: '0.1', width: '0.2', height: '0.3', quantity: '1' },
      { decimals: 6 },
    );
    expect(result.ok && result.value.cbmPerCarton).toBe('0.006000');
    expect(result.ok && result.value.working[0]?.result).toBe('0.006');
  });

  it('gives the same result for numbers and strings, and accepts 12.0 cartons as 12', async () => {
    const fromStrings = await run({ ...carton, quantity: '12.0' });
    const fromNumbers = await run({ unit: 'cm', length: 50, width: 40, height: 30, quantity: 12 });
    expect(fromStrings).toEqual(fromNumbers);
    expect(fromNumbers.ok && fromNumbers.value.totalCbm).toBe('0.720');
  });

  it('computes the total from the exact volume and shows exact values in the working', async () => {
    const result = await run({ ...carton, length: '25', width: '25', height: '20' });
    if (!result.ok) throw new Error('expected success');
    expect(result.value.cbmPerCarton).toBe('0.013');
    expect(result.value.totalCbm).toBe('1.250');
    expect(result.value.working.map((s) => [s.formulaKey, s.result])).toEqual([
      ['cbm.perCarton', '0.0125'],
      ['cbm.total', '1.25'],
      ['cbm.cftPerCarton', '0.44143333375'],
      ['cbm.cftTotal', '44.143333375'],
    ]);
    expect(result.value.working[0]?.variables).toEqual({
      length: '25',
      width: '25',
      height: '20',
      unit: 'cm',
      factor: '0.000001',
    });
  });

  it('respects the rounding param', async () => {
    const input = { unit: 'm', length: '0.5', width: '0.1', height: '0.1', quantity: '1' };
    const up = await run(input, { decimals: 2, rounding: 'half-up' });
    const even = await run(input, { decimals: 2, rounding: 'half-even' });
    expect(up.ok && up.value.cbmPerCarton).toBe('0.01');
    expect(even.ok && even.value.cbmPerCarton).toBe('0.00');
  });

  it('rejects an unknown unit through the input schema', async () => {
    const result = await run({ ...carton, unit: 'ft' });
    expect(result.ok).toBe(false);
  });

  it('has an English message for every code it can return', () => {
    const codes = [...cbmCompute.errors, 'LOGISTICS_VOLUME_ROUNDS_TO_ZERO'];
    for (const code of codes) expect(messages[code], code).toBeTruthy();
  });
});
