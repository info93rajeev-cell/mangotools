import { createTestContext, executeOperation } from '@mangotools/core';
import { mul } from '@mangotools/engine-numeric';
import { describe, expect, it } from 'vitest';
import { messages } from '../../errors.ts';
import { weightChargeable } from './operation.ts';
import { CUBIC_CM_PER_CUBED_UNIT, KG_PER_WEIGHT_UNIT } from './units.ts';

const run = (input: Record<string, unknown>, params: Record<string, unknown> = {}) =>
  executeOperation(weightChargeable, input, params, createTestContext());

const carton = {
  unit: 'cm',
  length: '50',
  width: '40',
  height: '30',
  quantity: '10',
  weight: '8',
  weightUnit: 'kg',
  divisor: '5000',
};

describe('logistics.weight.chargeable', () => {
  it('uses exact unit factors', () => {
    expect(CUBIC_CM_PER_CUBED_UNIT.in).toBe(mul(mul('2.54', '2.54'), '2.54'));
    expect(CUBIC_CM_PER_CUBED_UNIT.m).toBe(mul(mul('100', '100'), '100'));
    expect(CUBIC_CM_PER_CUBED_UNIT.mm).toBe(mul(mul('0.1', '0.1'), '0.1'));
    expect(KG_PER_WEIGHT_UNIT.lb).toBe('0.45359237');
  });

  it('gives the same result for numbers and strings', async () => {
    const fromStrings = await run(carton);
    const fromNumbers = await run({
      ...carton,
      length: 50,
      width: 40,
      height: 30,
      quantity: 10,
      weight: 8,
      divisor: 5000,
    });
    expect(fromStrings).toEqual(fromNumbers);
  });

  it('reports the billed basis in the output and in the working step key', async () => {
    const cases: [Record<string, unknown>, string][] = [
      [carton, 'volumetric'],
      [{ ...carton, weight: '20' }, 'actual'],
      [{ ...carton, weight: '12' }, 'equal'],
    ];
    for (const [input, basis] of cases) {
      const result = await run(input);
      if (!result.ok) throw new Error('expected success');
      expect(result.value.billedOn).toBe(basis);
      const keys = result.value.working.map((s) => s.formulaKey);
      expect(keys).toContain(`vw.chargeable.${basis}`);
    }
  });

  it('keeps full precision in the working and rounds only the outputs', async () => {
    const result = await run({
      ...carton,
      length: '10',
      width: '10',
      height: '10',
      quantity: '3',
      weight: '0.1',
      divisor: '6000',
    });
    if (!result.ok) throw new Error('expected success');
    expect(result.value.volumetricPerPackage).toBe('0.167');
    expect(result.value.volumetricTotal).toBe('0.500');
    const volumetric = result.value.working.find((s) => s.formulaKey === 'vw.volumetric');
    expect(volumetric?.result).toBe('0.16666666666666666667');
    expect(volumetric?.variables).toEqual({ volume: '1000', divisor: '6000' });
  });

  it('lists every working step in order, with a conversion step for pounds', async () => {
    const result = await run({ ...carton, weight: '22', weightUnit: 'lb', quantity: '1' });
    if (!result.ok) throw new Error('expected success');
    expect(result.value.working.map((s) => s.formulaKey)).toEqual([
      'vw.volume',
      'vw.volumetric',
      'vw.actual.convert',
      'vw.chargeable.volumetric',
      'vw.total.volumetric',
      'vw.total.actual',
      'vw.total.chargeable',
    ]);
    const actual = result.value.working[2];
    expect(actual?.variables).toEqual({ weight: '22', weightUnit: 'lb', factor: '0.45359237' });
    expect(actual?.result).toBe('9.97903214');
  });

  it('rejects unknown units through the input schema', async () => {
    expect((await run({ ...carton, unit: 'ft' })).ok).toBe(false);
    expect((await run({ ...carton, weightUnit: 'oz' })).ok).toBe(false);
  });

  it('has an English message for every code it can return', () => {
    for (const code of weightChargeable.errors) expect(messages[code], code).toBeTruthy();
  });
});
