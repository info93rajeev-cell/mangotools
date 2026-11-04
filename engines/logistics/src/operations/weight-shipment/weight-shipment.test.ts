import { createTestContext, executeOperation } from '@mangotools/core';
import { describe, expect, it } from 'vitest';
import { weightShipment } from './operation.ts';

const run = (input: Record<string, unknown>) =>
  executeOperation(weightShipment, input, {}, createTestContext());

const base = { unit: 'cm', weightUnit: 'kg', divisor: '5000' };
const row = { length: '50', width: '40', height: '30', quantity: '10', weightPerPiece: '8' };

describe('logistics.weight.shipment', () => {
  it('matches logistics.weight.chargeable for a single row', async () => {
    const out = await run({ ...base, packages: [row] });
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    expect(out.value.volumetricTotal).toBe('120.000');
    expect(out.value.actualTotal).toBe('80.000');
    expect(out.value.chargeableTotal).toBe('120.000');
    expect(out.value.rows[0]?.volumetricPerPiece).toBe('12.000');
  });

  it('rounds totals from full precision, not from rounded rows', async () => {
    // 3 rows of 1,001 cm³ ÷ 6000 = 0.16683… each: rounded rows sum to 0.501, the exact total is 0.5005 → 0.501 half-up, 0.500 half-even
    const tiny = { length: '7', width: '11', height: '13', quantity: '1', weightPerPiece: '0.001' };
    const out = await executeOperation(
      weightShipment,
      { ...base, divisor: '6000', packages: [tiny, tiny, tiny] },
      { rounding: 'half-even' },
      createTestContext(),
    );
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    expect(out.value.totalVolumeCm3).toBe('3003');
    expect(out.value.volumetricTotal).toBe('0.500');
  });

  it('accepts numbers as well as strings', async () => {
    const numbers = await run({
      ...base,
      divisor: 5000,
      packages: [{ length: 50, width: 40, height: 30, quantity: 10, weightPerPiece: 8 }],
    });
    const strings = await run({ ...base, packages: [row] });
    expect(numbers).toEqual(strings);
  });

  it('names the row and field of the first invalid value', async () => {
    const out = await run({ ...base, packages: [row, { ...row, weightPerPiece: '' }] });
    expect(out.ok).toBe(false);
    if (out.ok) return;
    expect(out.error.code).toBe('LOGISTICS_MISSING_INPUT');
    expect(out.error.path).toBe('packages.1.weightPerPiece');
  });

  it('shows a working step for every row and the shipment totals', async () => {
    const out = await run({ ...base, packages: [row, row] });
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    const refs = out.value.working.map((s) => s.ref);
    expect(refs).toContain('packages.1.volumetricTotal');
    expect(refs.at(-1)).toBe('chargeableTotal');
  });
});
