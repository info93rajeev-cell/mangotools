import { createTestContext, executeOperation } from '@mangotools/core';
import { describe, expect, it } from 'vitest';
import { messages } from '../../errors.ts';
import { brickworkQuantityV2 } from './operation.ts';

const run = (input: Record<string, unknown>) =>
  executeOperation(brickworkQuantityV2, input, {}, createTestContext());

const wall = {
  unit: 'm',
  wallLength: '5',
  wallHeight: '3',
  quantity: '1',
  wythes: '1',
  brickUnit: 'mm',
  brickLength: '230',
  brickHeight: '75',
  mortarJoint: '10',
  wastagePercent: '0',
};

const value = async (input: Record<string, unknown>) => {
  const result = await run(input);
  if (!result.ok) throw new Error(result.error.code);
  return result.value;
};

describe('civil.brickwork.quantity@2', () => {
  it('orders whole bricks and never shows excessive precision', async () => {
    const v = await value({
      ...wall,
      wallLength: '937.123',
      wallHeight: '1.5',
      wastagePercent: '7',
    });
    expect(v.orderBricks).toMatch(/^\d+$/);
    expect(v.baseBricks).toMatch(/^\d+\.\d{2}$/);
    expect(v.netWallAreaM2).toMatch(/^\d+\.\d{2}$/);
  });

  it('gives the same order for exactly equivalent metric and imperial inputs', async () => {
    const imperial = await value({
      ...wall,
      unit: 'ft',
      wallLength: '10',
      wallHeight: '8',
      brickUnit: 'in',
      brickLength: '7.625',
      brickHeight: '2.25',
      mortarJoint: '0.375',
    });
    const metric = await value({
      ...wall,
      wallLength: '3.048',
      wallHeight: '2.4384',
      brickLength: '193.675',
      brickHeight: '57.15',
      mortarJoint: '9.525',
    });
    expect(metric.baseBricks).toBe(imperial.baseBricks);
    expect(metric.orderBricks).toBe(imperial.orderBricks);
  });

  it('multiplies the face-area count by the number of brick skins', async () => {
    const one = await value(wall);
    const two = await value({ ...wall, wythes: '2' });
    expect(two.baseBricks).toBe('1470.59');
    expect(one.baseBricks).toBe('735.29');
  });

  it('a higher wastage allowance never lowers the order', async () => {
    const low = await value({ ...wall, wastagePercent: '5' });
    const high = await value({ ...wall, wastagePercent: '10' });
    expect(Number(high.orderBricks)).toBeGreaterThan(Number(low.orderBricks));
  });

  it('deducts openings once per identical wall', async () => {
    const v = await value({
      ...wall,
      quantity: '3',
      openings: [{ width: '1', height: '2', quantity: '1' }],
    });
    expect(v.openingAreaM2).toBe('6.00');
    expect(v.netWallAreaM2).toBe('39.00');
  });

  it('accepts typed openings without changing the numerical result', async () => {
    const opening = { width: '1', height: '2', quantity: '1' };
    const untyped = await value({ ...wall, openings: [opening] });
    const typed = await value({ ...wall, openings: [{ type: 'window', ...opening }] });
    expect(typed).toEqual(untyped);
  });

  it('rejects an unsupported opening type at the strict operation boundary', async () => {
    const result = await run({
      ...wall,
      openings: [{ type: 'vent', width: '1', height: '2', quantity: '1' }],
    });
    expect(result).toMatchObject({ ok: false, error: { code: 'INVALID_INPUT' } });
  });

  it('accepts very large but valid walls', async () => {
    const v = await value({ ...wall, wallLength: '99', wallHeight: '99', quantity: '1000000' });
    expect(v.orderBricks).toMatch(/^\d+$/);
    expect(v.orderBricks.length).toBeGreaterThan(9);
  });

  it('tags estimating assumptions and standing notes with a severity', async () => {
    const result = await run({ ...wall, wastagePercent: '5' });
    if (!result.ok) throw new Error('expected success');
    const severity = Object.fromEntries(result.warnings.map((w) => [w.code, w.details?.severity]));
    expect(severity.CIVIL_ASSUMPTION_WASTAGE).toBe('assumption');
    expect(severity.CIVIL_ESTIMATION_AID_ONLY).toBe('info');
  });

  it('has a message for every error and warning code', () => {
    for (const code of brickworkQuantityV2.errors) expect(messages[code]).toBeDefined();
    for (const code of ['CIVIL_ASSUMPTION_MORTAR_JOINT', 'CIVIL_ASSUMPTION_WYTHES'])
      expect(messages[code]).toBeDefined();
  });
});
