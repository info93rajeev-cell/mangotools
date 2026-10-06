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

  it('uses the selected decimal places as the wastage input precision ceiling', async () => {
    for (const input of [
      { decimalPlaces: '2', wastagePercent: '1.25' },
      { decimalPlaces: '3', wastagePercent: '1.250' },
      { decimalPlaces: '4', wastagePercent: '1.2500' },
    ]) {
      expect(await run({ ...wall, ...input })).toMatchObject({ ok: true });
    }

    for (const input of [
      { decimalPlaces: '2', wastagePercent: '1.250' },
      { decimalPlaces: '3', wastagePercent: '1.2500' },
      { decimalPlaces: '4', wastagePercent: '1.25000' },
    ]) {
      expect(await run({ ...wall, ...input })).toMatchObject({
        ok: false,
        error: { code: 'CIVIL_TOO_MANY_DECIMALS', path: 'wastagePercent' },
      });
    }
  });

  it('changes presentation without changing exact plaster arithmetic', async () => {
    const results = await Promise.all(
      [
        { decimalPlaces: '2', wastagePercent: '1.25' },
        { decimalPlaces: '3', wastagePercent: '1.250' },
        { decimalPlaces: '4', wastagePercent: '1.2500' },
      ].map((precision) => run({ ...wall, ...precision })),
    );
    for (const result of results) if (!result.ok) throw new Error('expected success');
    const values = results.map((result) => (result.ok ? result.value : null));
    const exact = values.map(
      (value) => value?.working.find((step) => step.ref === 'orderVolume')?.result,
    );
    expect(exact).toEqual(['0.1458', '0.1458', '0.1458']);
    expect(values.map((value) => value?.orderVolumeM3)).toEqual(['0.15', '0.146', '0.1458']);
  });

  it('keeps bag quantities as whole numbers at every display precision', async () => {
    for (const decimalPlaces of ['2', '3', '4']) {
      const result = await run({
        ...wall,
        decimalPlaces,
        materialMode: 'bag-yield',
        bagYield: '30',
        bagYieldUnit: 'l',
      });
      expect(result.ok && result.value.bags).toBe('5');
    }
  });

  it('has a message for every code it can return', () => {
    for (const code of plasterQuantityV2.errors) expect(messages[code]).toBeDefined();
    expect(messages.CIVIL_ASSUMPTION_PLASTER_PRODUCT).toBeDefined();
  });
});
