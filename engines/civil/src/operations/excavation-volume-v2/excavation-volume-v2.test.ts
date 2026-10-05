import { createTestContext, executeOperation } from '@mangotools/core';
import { describe, expect, it } from 'vitest';
import { messages } from '../../errors.ts';
import { excavationVolumeV2 } from './operation.ts';

const pit = {
  excavationType: 'general',
  unit: 'm',
  length: '5',
  width: '4',
  depth: '1.5',
  quantity: '1',
  swellPercent: '0',
};

async function value(input: Record<string, unknown>) {
  const result = await executeOperation(excavationVolumeV2, input, {}, createTestContext());
  if (!result.ok) throw new Error(result.error.code);
  return result.value;
}

async function outcome(input: Record<string, unknown>) {
  return executeOperation(excavationVolumeV2, input, {}, createTestContext());
}

describe('civil.excavation.volume@2', () => {
  it('shows bank volume independently and hides loose volume without swell', async () => {
    const v = await value(pit);
    expect(v.bankVolumeM3).toBe('30.000');
    expect(v.looseVolumeM3).toBeUndefined();
    expect(v.truckLoads).toBeUndefined();
  });

  it('keeps bank volume unchanged when swell is applied', async () => {
    const v = await value({ ...pit, swellPercent: '30' });
    expect(v.bankVolumeM3).toBe('30.000');
    expect(v.looseVolumeM3).toBe('39.000');
  });

  it('uses bank volume for truck loads when no swell is set', async () => {
    const v = await value({ ...pit, truckCapacity: '10', truckCapacityUnit: 'm3' });
    expect(v.truckLoads).toBe('3');
  });

  it('gives the same volume for equivalent feet and metre inputs', async () => {
    const feet = await value({ ...pit, unit: 'ft', length: '30', width: '20', depth: '3' });
    const metres = await value({ ...pit, length: '9.144', width: '6.096', depth: '0.9144' });
    expect(metres.bankVolumeYd3).toBe(feet.bankVolumeYd3);
    expect(metres.bankVolumeYd3).toBe('66.67');
  });

  it('uses the selected decimal places for volume presentation and swell input precision', async () => {
    const accepted = [
      { decimalPlaces: '2', swellPercent: '1.25' },
      { decimalPlaces: '3', swellPercent: '1.250' },
      { decimalPlaces: '4', swellPercent: '1.2500' },
    ];
    for (const input of accepted)
      expect(await outcome({ ...pit, ...input })).toMatchObject({ ok: true });

    for (const input of [
      { decimalPlaces: '2', swellPercent: '1.250' },
      { decimalPlaces: '3', swellPercent: '1.2500' },
      { decimalPlaces: '4', swellPercent: '1.25000' },
    ]) {
      expect(await outcome({ ...pit, ...input })).toMatchObject({
        ok: false,
        error: { code: 'CIVIL_TOO_MANY_DECIMALS', path: 'swellPercent' },
      });
    }
  });

  it('changes presentation only while preserving exact volume and integer truck loads', async () => {
    const input = { ...pit, swellPercent: '1.25', truckCapacity: '7', truckCapacityUnit: 'm3' };
    const two = await value({ ...input, decimalPlaces: '2' });
    const three = await value({ ...input, decimalPlaces: '3' });
    const four = await value({ ...input, decimalPlaces: '4' });
    const exact = (result: typeof two) =>
      result.working.find((step) => step.ref === 'looseVolume')?.result;
    expect([exact(two), exact(three), exact(four)]).toEqual(['30.375', '30.375', '30.375']);
    expect([two.looseVolumeM3, three.looseVolumeM3, four.looseVolumeM3]).toEqual([
      '30.38',
      '30.375',
      '30.3750',
    ]);
    expect([two.truckLoads, three.truckLoads, four.truckLoads]).toEqual(['5', '5', '5']);
  });

  it('has a message for every code it can return', () => {
    for (const code of excavationVolumeV2.errors) expect(messages[code]).toBeDefined();
    expect(messages.CIVIL_EXCAVATION_SCOPE_LIMIT_V2).toBeDefined();
  });
});
