import { createTestContext, executeOperation } from '@mangotools/core';
import { describe, expect, it } from 'vitest';
import { messages } from '../../errors.ts';
import { concreteQuantityV2 } from './operation.ts';

const slab = {
  memberType: 'slab',
  unit: 'm',
  length: '5',
  width: '4',
  depth: '0.15',
  quantity: '1',
  overagePercent: '0',
};

async function value(input: Record<string, unknown>) {
  const result = await executeOperation(concreteQuantityV2, input, {}, createTestContext());
  if (!result.ok) throw new Error(result.error.code);
  return result.value;
}

async function outcome(input: Record<string, unknown>) {
  return executeOperation(concreteQuantityV2, input, {}, createTestContext());
}

describe('civil.concrete.quantity@2', () => {
  it('formats volumes with practical precision only', async () => {
    const v = await value({ ...slab, length: '3.333333', width: '2.777777', depth: '0.123457' });
    expect(v.netVolumeM3).toMatch(/^\d+\.\d{3}$/);
    expect(v.orderVolumeYd3).toMatch(/^\d+\.\d{2}$/);
  });

  it('gives the same volume for equivalent inch and metre inputs', async () => {
    const inches = await value({ ...slab, unit: 'in', length: '120', width: '120', depth: '4' });
    const metres = await value({ ...slab, length: '3.048', width: '3.048', depth: '0.1016' });
    expect(metres.netVolumeFt3).toBe(inches.netVolumeFt3);
    expect(metres.netVolumeM3).toBe(inches.netVolumeM3);
  });

  it('ignores rectangular fields for a circular column and vice versa', async () => {
    const v = await value({ ...slab, memberType: 'circular-column', diameter: '1', height: '1' });
    expect(v.netVolumeM3).toBe('0.785');
  });

  it('omits bags unless a yield is supplied', async () => {
    const v = await value(slab);
    expect(v.bags).toBeUndefined();
    const withBags = await value({ ...slab, bagYield: '0.5', bagYieldUnit: 'm3' });
    expect(withBags.bags).toBe('6');
  });

  it('applies overage only to the order volume', async () => {
    const v = await value({ ...slab, overagePercent: '7.5' });
    expect(v.netVolumeM3).toBe('3.000');
    expect(v.orderVolumeM3).toBe('3.225');
  });

  it('uses the selected decimal places as the overage input precision ceiling', async () => {
    const accepted = [
      { decimalPlaces: '2', overagePercent: '1.25' },
      { decimalPlaces: '3', overagePercent: '1.250' },
      { decimalPlaces: '4', overagePercent: '1.2500' },
    ];
    for (const input of accepted)
      expect(await outcome({ ...slab, ...input })).toMatchObject({ ok: true });

    for (const input of [
      { decimalPlaces: '2', overagePercent: '1.250' },
      { decimalPlaces: '3', overagePercent: '1.2500' },
      { decimalPlaces: '4', overagePercent: '1.25000' },
    ]) {
      expect(await outcome({ ...slab, ...input })).toMatchObject({
        ok: false,
        error: { code: 'CIVIL_TOO_MANY_DECIMALS', path: 'overagePercent' },
      });
    }
  });

  it('does not change calculation semantics when precision metadata changes', async () => {
    const two = await value({ ...slab, decimalPlaces: '2', overagePercent: '1.25' });
    const three = await value({ ...slab, decimalPlaces: '3', overagePercent: '1.250' });
    const four = await value({ ...slab, decimalPlaces: '4', overagePercent: '1.2500' });
    const exact = (result: typeof two) =>
      result.working.find((step) => step.ref === 'orderVolume')?.result;
    expect([exact(two), exact(three), exact(four)]).toEqual(['3.0375', '3.0375', '3.0375']);
    expect([two.orderVolumeM3, three.orderVolumeM3, four.orderVolumeM3]).toEqual([
      '3.04',
      '3.038',
      '3.0375',
    ]);
  });

  it('accepts large but valid quantities', async () => {
    const v = await value({ ...slab, quantity: '1000000' });
    expect(v.netVolumeM3).toBe('3000000.000');
  });

  it('has a message for every code it can return', () => {
    for (const code of concreteQuantityV2.errors) expect(messages[code]).toBeDefined();
    for (const code of ['CIVIL_ASSUMPTION_OVERAGE', 'CIVIL_ASSUMPTION_NO_OVERAGE'])
      expect(messages[code]).toBeDefined();
  });
});
