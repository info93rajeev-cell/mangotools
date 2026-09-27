import { createTestContext, executeOperation } from '@mangotools/core';
import { mul } from '@mangotools/engine-numeric';
import { describe, expect, it } from 'vitest';
import { messages } from '../../errors.ts';
import { concreteQuantity } from './operation.ts';
import { CUBIC_METRES_PER_CUBED_UNIT } from './units.ts';

const run = (input: Record<string, unknown>, params: Record<string, unknown> = {}) =>
  executeOperation(concreteQuantity, input, params, createTestContext());

const slab = {
  memberType: 'slab',
  unit: 'm',
  length: '5',
  width: '4',
  depth: '0.15',
  quantity: '1',
  wastagePercent: '0',
};

describe('civil.concrete.quantity', () => {
  it('uses exact cubed unit factors', () => {
    expect(CUBIC_METRES_PER_CUBED_UNIT.cm).toBe(mul(mul('0.01', '0.01'), '0.01'));
    expect(CUBIC_METRES_PER_CUBED_UNIT.mm).toBe(mul(mul('0.001', '0.001'), '0.001'));
    expect(CUBIC_METRES_PER_CUBED_UNIT.in).toBe(mul(mul('0.0254', '0.0254'), '0.0254'));
    expect(CUBIC_METRES_PER_CUBED_UNIT.ft).toBe(mul(mul('0.3048', '0.3048'), '0.3048'));
  });

  it('never uses floating point (5 x 4 x 0.15 m is exactly 3 m3)', async () => {
    const result = await run(slab, { decimals: 6 });
    expect(result.ok && result.value.baseVolumeM3).toBe('3.000000');
    expect(result.ok && result.value.working[0]?.result).toBe('3');
  });

  it('gives the same result for numbers and strings, and accepts 4.0 members as 4', async () => {
    const fromStrings = await run({ ...slab, quantity: '4.0' });
    const fromNumbers = await run({
      memberType: 'slab',
      unit: 'm',
      length: 5,
      width: 4,
      depth: 0.15,
      quantity: 4,
      wastagePercent: 0,
    });
    expect(fromStrings).toEqual(fromNumbers);
    expect(fromNumbers.ok && fromNumbers.value.baseVolumeM3).toBe('12.000');
  });

  it('applies wastage on top of the base volume, from the exact value', async () => {
    const result = await run({ ...slab, quantity: '4', wastagePercent: '5' });
    if (!result.ok) throw new Error('expected success');
    expect(result.value.baseVolumeM3).toBe('12.000');
    expect(result.value.wastageVolumeM3).toBe('0.600');
    expect(result.value.totalVolumeM3).toBe('12.600');
    expect(result.value.working.map((s) => [s.formulaKey, s.result])).toEqual([
      ['concrete.memberVolume', '3'],
      ['concrete.baseVolume', '12'],
      ['concrete.wastageVolume', '0.6'],
      ['concrete.totalVolume', '12.6'],
      ['concrete.totalVolumeFt3', mul('12.6', '35.3146667')],
    ]);
  });

  it('defaults to zero wastage, so total equals base volume', async () => {
    const result = await run(slab);
    expect(result.ok && result.value.wastageVolumeM3).toBe('0.000');
    expect(result.ok && result.value.totalVolumeM3).toBe(result.ok && result.value.baseVolumeM3);
  });

  it('flags an implausibly large dimension without rejecting the input', async () => {
    const result = await run({ ...slab, length: '150', width: '1', depth: '1' });
    expect(result.ok).toBe(true);
    expect(result.ok && result.warnings.map((w) => w.code)).toContain(
      'CIVIL_DIMENSION_UNREALISTIC',
    );
  });

  it('always carries the standing estimation-aid warnings', async () => {
    const result = await run(slab);
    const codes = result.ok ? result.warnings.map((w) => w.code) : [];
    expect(codes).toEqual([
      'CIVIL_ESTIMATION_AID_ONLY',
      'CIVIL_VERIFY_BEFORE_CONSTRUCTION',
      'CIVIL_LOCAL_PRACTICE_VARIES',
      'CIVIL_NOT_PROFESSIONAL_REPLACEMENT',
      'CIVIL_VOLUME_ONLY',
    ]);
  });

  it('rejects wastage above 50%', async () => {
    const result = await run({ ...slab, wastagePercent: '50.01' });
    expect(result.ok).toBe(false);
    expect(!result.ok && result.error.code).toBe('CIVIL_WASTAGE_OUT_OF_RANGE');
  });

  it('rejects an unknown unit through the input schema', async () => {
    const result = await run({ ...slab, unit: 'yard' });
    expect(result.ok).toBe(false);
  });

  it('rejects an unknown member type through the input schema', async () => {
    const result = await run({ ...slab, memberType: 'wall' });
    expect(result.ok).toBe(false);
  });

  it('respects the rounding param', async () => {
    const input = { ...slab, length: '0.5', width: '0.1', depth: '0.1' };
    const up = await run(input, { decimals: 2, rounding: 'half-up' });
    const even = await run(input, { decimals: 2, rounding: 'half-even' });
    expect(up.ok && up.value.baseVolumeM3).toBe('0.01');
    expect(even.ok && even.value.baseVolumeM3).toBe('0.00');
  });

  it('has an English message for every code it can return', () => {
    const codes = [...concreteQuantity.errors, 'CIVIL_DIMENSION_UNREALISTIC'];
    for (const code of codes) expect(messages[code], code).toBeTruthy();
  });
});
