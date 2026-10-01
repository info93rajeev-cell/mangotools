import { createTestContext, executeOperation } from '@mangotools/core';
import { describe, expect, it } from 'vitest';
import { messages } from '../../errors.ts';
import { plasterQuantityV2 } from './operation.ts';

const wall = {
  surfaceType: 'wall',
  unit: 'm',
  length: '4',
  secondDimension: '3',
  quantity: '1',
  thickness: '12',
  thicknessUnit: 'mm',
  wastagePercent: '0',
  materialMode: 'none',
};

async function run(input: Record<string, unknown>) {
  return executeOperation(plasterQuantityV2, input, {}, createTestContext());
}

describe('civil.plaster.quantity@2', () => {
  it('never estimates bags without product data', async () => {
    const result = await run(wall);
    if (!result.ok) throw new Error('expected success');
    expect(result.value.bags).toBeUndefined();
    expect(result.warnings.map((w) => w.code)).toContain('CIVIL_INFO_PLASTER_MATERIAL');
  });

  it('scales bags by job thickness versus the product coverage thickness', async () => {
    const product = { materialMode: 'bag-coverage', bagCoverage: '1', bagCoverageUnit: 'm2' };
    const thin = await run({ ...wall, ...product, bagCoverageThickness: '12' });
    const thick = await run({ ...wall, ...product, bagCoverageThickness: '6' });
    expect(thin.ok && thin.value.bags).toBe('12');
    expect(thick.ok && thick.value.bags).toBe('24');
  });

  it('keeps volumes at practical precision', async () => {
    const result = await run({ ...wall, length: '3.333333', thickness: '12.5' });
    expect(result.ok && result.value.wetVolumeM3).toMatch(/^\d+\.\d{3}$/);
  });

  it('has a message for every code it can return', () => {
    for (const code of plasterQuantityV2.errors) expect(messages[code]).toBeDefined();
    expect(messages.CIVIL_ASSUMPTION_PLASTER_PRODUCT).toBeDefined();
  });
});
