import { createTestContext, executeOperation } from '@mangotools/core';
import { describe, expect, it } from 'vitest';
import { messages } from '../../errors.ts';
import { palletFit } from './operation.ts';
import { CM_PER_UNIT } from './units.ts';

const run = (input: Record<string, unknown>, params: Record<string, unknown> = {}) =>
  executeOperation(palletFit, input, params, createTestContext());

const carton = {
  unit: 'cm',
  length: '40',
  width: '30',
  height: '20',
  quantity: '100',
  palletType: 'euro',
  palletUnit: 'cm',
  maxStackHeight: '150',
};

describe('logistics.pallet.fit', () => {
  it('uses exact linear unit factors', () => {
    expect(CM_PER_UNIT).toEqual({ m: '100', cm: '1', mm: '0.1', in: '2.54' });
  });

  it('gives the same result for numbers and strings', async () => {
    const fromStrings = await run(carton);
    const fromNumbers = await run({ ...carton, length: 40, width: 30, height: 20, quantity: 100 });
    expect(fromStrings).toEqual(fromNumbers);
  });

  it('defaults stackable, allowBaseRotation and keepUpright to true', async () => {
    const withDefaults = await run(carton);
    const explicit = await run(carton, {
      stackable: true,
      allowBaseRotation: true,
      keepUpright: true,
    });
    expect(withDefaults).toEqual(explicit);
  });

  it('picks the better base orientation and gives an exact-fit worked example', async () => {
    const result = await run(carton);
    if (!result.ok) throw new Error('expected success');
    expect(result.value.bestOrientation).toBe('wlh');
    expect(result.value.cartonsAlongPalletLength).toBe('4');
    expect(result.value.cartonsAlongPalletWidth).toBe('2');
    expect(result.value.cartonsPerLayer).toBe('8');
    expect(result.value.layers).toBe('7');
    expect(result.value.cartonsPerPallet).toBe('56');
    expect(result.value.palletsRequired).toBe('2');
    expect(result.value.cartonsOnLastPallet).toBe('44');
    expect(result.value.usedAreaPercent).toBe('100.000');
    expect(result.value.unusedAreaPercent).toBe('0.000');
    expect(result.value.estimatedStackHeight).toBe('140.000');
  });

  it('always carries the three standing warnings', async () => {
    const result = await run(carton);
    if (!result.ok) throw new Error('expected success');
    expect(result.warnings.map((w) => w.code)).toEqual(
      expect.arrayContaining([
        'LOGISTICS_PALLET_NOT_LOAD_SAFETY',
        'LOGISTICS_PALLET_VERIFY_BEFORE_SHIPMENT',
        'LOGISTICS_PALLET_DIMENSIONS_VARY',
      ]),
    );
  });

  it('warns only when more than one pallet is needed', async () => {
    const one = await run({ ...carton, quantity: '10' });
    if (!one.ok) throw new Error('expected success');
    expect(one.value.palletsRequired).toBe('1');
    expect(one.warnings.map((w) => w.code)).not.toContain(
      'LOGISTICS_PALLET_MULTIPLE_PALLETS_REQUIRED',
    );

    const many = await run({ ...carton, quantity: '100' });
    if (!many.ok) throw new Error('expected success');
    expect(many.warnings.map((w) => w.code)).toContain(
      'LOGISTICS_PALLET_MULTIPLE_PALLETS_REQUIRED',
    );
  });

  it('caps layers to 1 when cartons are not stackable', async () => {
    const stacked = await run(carton);
    const notStacked = await run(carton, { stackable: false });
    if (!stacked.ok || !notStacked.ok) throw new Error('expected success');
    expect(stacked.value.layers).not.toBe('1');
    expect(notStacked.value.layers).toBe('1');
    expect(Number(notStacked.value.cartonsPerPallet)).toBeLessThan(
      Number(stacked.value.cartonsPerPallet),
    );
  });

  it('tries only the given footprint when base rotation is not allowed', async () => {
    const rotated = await run(carton);
    const fixed = await run(carton, { allowBaseRotation: false });
    if (!rotated.ok || !fixed.ok) throw new Error('expected success');
    expect(fixed.value.bestOrientation).toBe('lwh');
    expect(Number(fixed.value.cartonsPerLayer)).toBeLessThanOrEqual(
      Number(rotated.value.cartonsPerLayer),
    );
  });

  it('never rotates carton height onto the footprint when keepUpright is set', async () => {
    const result = await run(carton, { keepUpright: true });
    if (!result.ok) throw new Error('expected success');
    expect(['lwh', 'wlh']).toContain(result.value.bestOrientation);
  });

  it('allows height rotation only when keepUpright is turned off', async () => {
    const input = {
      unit: 'cm',
      length: '10',
      width: '10',
      height: '200',
      quantity: '10',
      palletType: 'custom',
      palletUnit: 'cm',
      palletLength: '250',
      palletWidth: '80',
      maxStackHeight: '50',
    };
    const upright = await run(input, { keepUpright: true });
    expect(upright.ok).toBe(false);
    if (upright.ok) throw new Error('expected error');
    expect(upright.error.code).toBe('LOGISTICS_CARTON_TALLER_THAN_STACK_LIMIT');

    const notUpright = await run(input, { keepUpright: false });
    if (!notUpright.ok) throw new Error('expected success');
    expect(notUpright.value.layers).not.toBe('0');
    expect(notUpright.value.cartonsPerPallet).toBe('40');
  });

  it('supports a custom pallet in a different unit', async () => {
    const result = await run({
      unit: 'cm',
      length: '30',
      width: '20',
      height: '15',
      quantity: '10',
      palletType: 'custom',
      palletUnit: 'm',
      palletLength: '1.2',
      palletWidth: '1',
      maxStackHeight: '1',
    });
    if (!result.ok) throw new Error('expected success');
    expect(result.value.cartonsAlongPalletLength).toBe('4');
    expect(result.value.cartonsAlongPalletWidth).toBe('5');
  });

  it('rejects a carton whose footprint does not fit the pallet base', async () => {
    const result = await run({ ...carton, length: '200', width: '200' });
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('expected error');
    expect(result.error.code).toBe('LOGISTICS_CARTON_EXCEEDS_PALLET_BASE');
  });

  it('rejects a carton taller than the stack height limit', async () => {
    const result = await run({ ...carton, height: '200' });
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('expected error');
    expect(result.error.code).toBe('LOGISTICS_CARTON_TALLER_THAN_STACK_LIMIT');
    expect(result.error.path).toBe('maxStackHeight');
  });

  it('lists every working step, in order', async () => {
    const result = await run(carton);
    if (!result.ok) throw new Error('expected success');
    expect(result.value.working.map((s) => s.formulaKey)).toEqual([
      'pf.orientation.wlh',
      'pf.layers',
      'pf.cartonsPerPallet',
      'pf.palletsRequired',
      'pf.cartonsOnLastPallet',
      'pf.usedArea',
      'pf.estimatedStackHeight',
    ]);
  });

  it('rejects an unknown pallet type or unit through the input schema', async () => {
    expect((await run({ ...carton, unit: 'ft' })).ok).toBe(false);
    expect((await run({ ...carton, palletType: 'chep' })).ok).toBe(false);
  });

  it('has an English message for every error code it can return', () => {
    for (const code of palletFit.errors) expect(messages[code], code).toBeTruthy();
  });

  it('has an English message for every warning code it can raise', () => {
    const warningCodes = [
      'LOGISTICS_PALLET_NOT_LOAD_SAFETY',
      'LOGISTICS_PALLET_VERIFY_BEFORE_SHIPMENT',
      'LOGISTICS_PALLET_DIMENSIONS_VARY',
      'LOGISTICS_PALLET_MULTIPLE_PALLETS_REQUIRED',
    ];
    for (const code of warningCodes) expect(messages[code], code).toBeTruthy();
  });
});
