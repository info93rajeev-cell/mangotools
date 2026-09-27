import { createTestContext, executeOperation } from '@mangotools/core';
import { mul } from '@mangotools/engine-numeric';
import { describe, expect, it } from 'vitest';
import { messages } from '../../errors.ts';
import { excavationVolume } from './operation.ts';
import { CUBIC_METRES_PER_CUBED_UNIT } from './units.ts';

const run = (input: Record<string, unknown>, params: Record<string, unknown> = {}) =>
  executeOperation(excavationVolume, input, params, createTestContext());

const pit = {
  excavationType: 'general',
  unit: 'm',
  length: '5',
  width: '4',
  depth: '1.5',
  quantity: '1',
  bulkingPercent: '0',
};

describe('civil.excavation.volume', () => {
  it('uses exact cubed unit factors', () => {
    expect(CUBIC_METRES_PER_CUBED_UNIT.cm).toBe(mul(mul('0.01', '0.01'), '0.01'));
    expect(CUBIC_METRES_PER_CUBED_UNIT.mm).toBe(mul(mul('0.001', '0.001'), '0.001'));
    expect(CUBIC_METRES_PER_CUBED_UNIT.in).toBe(mul(mul('0.0254', '0.0254'), '0.0254'));
    expect(CUBIC_METRES_PER_CUBED_UNIT.ft).toBe(mul(mul('0.3048', '0.3048'), '0.3048'));
  });

  it('never uses floating point (5 x 4 x 1.5 m is exactly 30 m3)', async () => {
    const result = await run(pit, { decimals: 6 });
    expect(result.ok && result.value.neatVolumeM3).toBe('30.000000');
    expect(result.ok && result.value.working[0]?.result).toBe('30');
  });

  it('gives the same result for numbers and strings, and accepts 3.0 pits as 3', async () => {
    const fromStrings = await run({ ...pit, quantity: '3.0' });
    const fromNumbers = await run({
      excavationType: 'general',
      unit: 'm',
      length: 5,
      width: 4,
      depth: 1.5,
      quantity: 3,
      bulkingPercent: 0,
    });
    expect(fromStrings).toEqual(fromNumbers);
    expect(fromNumbers.ok && fromNumbers.value.neatVolumeM3).toBe('90.000');
  });

  it('applies bulking on top of the neat volume, from the exact value', async () => {
    const result = await run({ ...pit, quantity: '2', bulkingPercent: '20' });
    if (!result.ok) throw new Error('expected success');
    expect(result.value.neatVolumeM3).toBe('60.000');
    expect(result.value.bulkingVolumeM3).toBe('12.000');
    expect(result.value.looseVolumeM3).toBe('72.000');
    expect(result.value.working.map((s) => [s.formulaKey, s.result])).toEqual([
      ['excavation.oneVolume', '30'],
      ['excavation.neatVolume', '60'],
      ['excavation.bulkingVolume', '12'],
      ['excavation.looseVolume', '72'],
      ['excavation.looseVolumeFt3', mul('72', '35.3146667')],
    ]);
  });

  it('defaults to zero bulking, so loose volume equals neat volume', async () => {
    const result = await run(pit);
    expect(result.ok && result.value.bulkingVolumeM3).toBe('0.000');
    expect(result.ok && result.value.looseVolumeM3).toBe(result.ok && result.value.neatVolumeM3);
  });

  it('flags an implausibly large dimension without rejecting the input', async () => {
    const result = await run({ ...pit, length: '150', width: '1', depth: '1' });
    expect(result.ok).toBe(true);
    expect(result.ok && result.warnings.map((w) => w.code)).toContain(
      'CIVIL_DIMENSION_UNREALISTIC',
    );
  });

  it('always carries the standing estimation-aid warnings', async () => {
    const result = await run(pit);
    const codes = result.ok ? result.warnings.map((w) => w.code) : [];
    expect(codes).toEqual([
      'CIVIL_ESTIMATION_AID_ONLY',
      'CIVIL_VERIFY_BEFORE_EXCAVATION',
      'CIVIL_EXCAVATION_CONDITIONS_VARY',
      'CIVIL_BULKING_VARIES',
      'CIVIL_NOT_PROFESSIONAL_REPLACEMENT_CONTRACTOR',
      'CIVIL_EXCAVATION_SCOPE_LIMIT',
    ]);
  });

  it('rejects bulking above 50%', async () => {
    const result = await run({ ...pit, bulkingPercent: '50.01' });
    expect(result.ok).toBe(false);
    expect(!result.ok && result.error.code).toBe('CIVIL_BULKING_OUT_OF_RANGE');
  });

  it('rejects negative bulking', async () => {
    const result = await run({ ...pit, bulkingPercent: '-1' });
    expect(result.ok).toBe(false);
    expect(!result.ok && result.error.code).toBe('CIVIL_BULKING_OUT_OF_RANGE');
  });

  it('rejects an unknown unit through the input schema', async () => {
    const result = await run({ ...pit, unit: 'yard' });
    expect(result.ok).toBe(false);
  });

  it('rejects an unknown excavation type through the input schema', async () => {
    const result = await run({ ...pit, excavationType: 'slope' });
    expect(result.ok).toBe(false);
  });

  it('respects the rounding param', async () => {
    const input = { ...pit, length: '0.5', width: '0.1', depth: '0.1' };
    const up = await run(input, { decimals: 2, rounding: 'half-up' });
    const even = await run(input, { decimals: 2, rounding: 'half-even' });
    expect(up.ok && up.value.neatVolumeM3).toBe('0.01');
    expect(even.ok && even.value.neatVolumeM3).toBe('0.00');
  });

  it('has an English message for every code it can return', () => {
    const codes = [...excavationVolume.errors, 'CIVIL_DIMENSION_UNREALISTIC'];
    for (const code of codes) expect(messages[code], code).toBeTruthy();
  });
});
