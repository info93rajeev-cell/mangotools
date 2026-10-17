import { describe, expect, it } from 'vitest';
import { numberBits, observe, runLibraryCases } from '../support/library-observation.ts';

describe('public-library determinism observations', () => {
  it('records nested binary64 bits without precision reduction', async () => {
    const result = await observe({ nested: [1, 1 + Number.EPSILON, -0], label: 'decimal' });
    expect(result.bits).toEqual({
      nested: ['3ff0000000000000', '3ff0000000000001', '0000000000000000'],
      label: null,
    });
    expect(result.value).toEqual({ nested: [1, 1 + Number.EPSILON, 0], label: 'decimal' });
    expect(numberBits(Number.MIN_VALUE)).toBe('0000000000000001');
    expect(numberBits(-1)).toBe('bff0000000000000');
  });

  it('normalizes only negative zero and canonicalizes object ordering', async () => {
    expect(await observe(-0)).toEqual(await observe(0));
    expect((await observe({ b: 2, a: 1 })).hash).toBe((await observe({ a: 1, b: 2 })).hash);
    expect((await observe(1)).hash).not.toBe((await observe(1 + Number.EPSILON)).hash);
    expect((await observe('0.30')).json).toBe('"0.30"');
  });

  it.each([NaN, Infinity, -Infinity, undefined, 1n, new Date(0), new Array(1)])(
    'rejects lossy output %s',
    async (value) => {
      await expect(observe(value)).rejects.toThrow();
    },
  );

  it('rejects absent and inherited exports rather than reporting false parity', async () => {
    const item = { id: 'missing', exportName: 'toString', args: [], expected: null };
    await expect(runLibraryCases({}, [item])).rejects.toThrow('Unknown public export');
  });
});
