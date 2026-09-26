import { createTestContext, executeOperation } from '@mangotools/core';
import { describe, expect, it } from 'vitest';
import { messages } from '../../errors.ts';
import { containerFit } from './operation.ts';
import { CM_PER_UNIT } from './units.ts';

const run = (input: Record<string, unknown>, params: Record<string, unknown> = {}) =>
  executeOperation(containerFit, input, params, createTestContext());

const carton = {
  unit: 'cm',
  length: '40',
  width: '30',
  height: '20',
  quantity: '50',
  containerType: '20gp',
  usablePercent: '90',
};

describe('logistics.container.fit', () => {
  it('uses exact linear unit factors', () => {
    expect(CM_PER_UNIT).toEqual({ m: '100', cm: '1', mm: '0.1', in: '2.54' });
  });

  it('gives the same result for numbers and strings', async () => {
    const fromStrings = await run(carton);
    const fromNumbers = await run({ ...carton, length: 40, width: 30, height: 20, quantity: 50 });
    expect(fromStrings).toEqual(fromNumbers);
  });

  it('defaults stackable and allowRotation to true and keepUpright to false', async () => {
    const withDefaults = await run(carton);
    const explicit = await run(carton, {
      stackable: true,
      allowRotation: true,
      keepUpright: false,
    });
    expect(withDefaults).toEqual(explicit);
  });

  it('always carries the three standing warnings', async () => {
    const result = await run(carton);
    if (!result.ok) throw new Error('expected success');
    expect(result.warnings.map((w) => w.code)).toEqual(
      expect.arrayContaining([
        'LOGISTICS_CONTAINER_VOLUME_NOT_GUARANTEED',
        'LOGISTICS_CONTAINER_GRID_NOT_ADVANCED_PLANNING',
        'LOGISTICS_CONTAINER_VERIFY_PROFESSIONAL',
      ]),
    );
  });

  it('warns only for the capacity that is actually exceeded', async () => {
    const overGrid = await run({ ...carton, quantity: '1300' });
    if (!overGrid.ok) throw new Error('expected success');
    expect(overGrid.warnings.map((w) => w.code)).toEqual(
      expect.arrayContaining([
        'LOGISTICS_CONTAINER_OVER_CAPACITY_VOLUME',
        'LOGISTICS_CONTAINER_OVER_CAPACITY_GRID',
      ]),
    );
    const withinCapacity = await run(carton);
    if (!withinCapacity.ok) throw new Error('expected success');
    expect(withinCapacity.warnings.map((w) => w.code)).not.toContain(
      'LOGISTICS_CONTAINER_OVER_CAPACITY_VOLUME',
    );
    expect(withinCapacity.warnings.map((w) => w.code)).not.toContain(
      'LOGISTICS_CONTAINER_OVER_CAPACITY_GRID',
    );
  });

  it('caps the height count to 1 when cartons are not stackable', async () => {
    const stacked = await run({
      ...carton,
      length: '60',
      width: '40',
      height: '40',
      containerType: '40gp',
      quantity: '500',
    });
    const notStacked = await run(
      {
        ...carton,
        length: '60',
        width: '40',
        height: '40',
        containerType: '40gp',
        quantity: '500',
      },
      { stackable: false },
    );
    if (!stacked.ok || !notStacked.ok) throw new Error('expected success');
    expect(stacked.value.cartonsAlongHeight).not.toBe('1');
    expect(notStacked.value.cartonsAlongHeight).toBe('1');
    expect(Number(notStacked.value.maxCartonsByGrid)).toBeLessThan(
      Number(stacked.value.maxCartonsByGrid),
    );
  });

  it('tries only the given orientation when rotation is not allowed', async () => {
    const input = {
      ...carton,
      length: '30',
      width: '60',
      height: '40',
      containerType: '40gp',
      quantity: '100',
    };
    const rotated = await run(input);
    const fixed = await run(input, { allowRotation: false });
    if (!rotated.ok || !fixed.ok) throw new Error('expected success');
    expect(fixed.value.bestOrientation).toBe('lwh');
    expect(Number(fixed.value.maxCartonsByGrid)).toBeLessThanOrEqual(
      Number(rotated.value.maxCartonsByGrid),
    );
  });

  it('never rotates carton height onto a horizontal axis when keepUpright is set', async () => {
    const input = {
      ...carton,
      length: '50',
      width: '30',
      height: '70',
      containerType: '40hc',
      quantity: '200',
    };
    const upright = await run(input, { keepUpright: true });
    if (!upright.ok) throw new Error('expected success');
    expect(['lwh', 'wlh']).toContain(upright.value.bestOrientation);
  });

  it('supports a custom container in a different unit', async () => {
    const result = await run({
      unit: 'cm',
      length: '30',
      width: '20',
      height: '15',
      quantity: '100',
      containerType: 'custom',
      containerUnit: 'm',
      containerLength: '6',
      containerWidth: '2.4',
      containerHeight: '2.4',
      usablePercent: '95',
    });
    if (!result.ok) throw new Error('expected success');
    expect(result.value.containerCbm).toBe('34.560');
    expect(result.value.maxCartonsByGrid).toBe('3840');
  });

  it('rejects a carton that does not fit the container in any orientation', async () => {
    const result = await run({
      ...carton,
      length: '700',
      width: '700',
      height: '700',
      quantity: '1',
    });
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('expected error');
    expect(result.error.code).toBe('LOGISTICS_CARTON_EXCEEDS_CONTAINER');
  });

  it('lists every volume working step, in order, before the grid step', async () => {
    const result = await run(carton);
    if (!result.ok) throw new Error('expected success');
    expect(result.value.working.map((s) => s.formulaKey)).toEqual([
      'cf.cartonVolume',
      'cf.containerVolume.20gp',
      'cf.usableVolume',
      'cf.totalVolume',
      'cf.cartonsByVolume',
      'cf.remainingVolume',
      'cf.orientation.lwh',
    ]);
  });

  it('rejects an unknown container type or unit through the input schema', async () => {
    expect((await run({ ...carton, unit: 'ft' })).ok).toBe(false);
    expect((await run({ ...carton, containerType: '45gp' })).ok).toBe(false);
  });

  it('has an English message for every error code it can return', () => {
    for (const code of containerFit.errors) expect(messages[code], code).toBeTruthy();
  });

  it('has an English message for every warning code it can raise', () => {
    const warningCodes = [
      'LOGISTICS_CONTAINER_VOLUME_NOT_GUARANTEED',
      'LOGISTICS_CONTAINER_GRID_NOT_ADVANCED_PLANNING',
      'LOGISTICS_CONTAINER_VERIFY_PROFESSIONAL',
      'LOGISTICS_CONTAINER_OVER_CAPACITY_VOLUME',
      'LOGISTICS_CONTAINER_OVER_CAPACITY_GRID',
    ];
    for (const code of warningCodes) expect(messages[code], code).toBeTruthy();
  });
});
