import { createTestContext, executeOperation } from '@mangotools/core';
import { describe, expect, it } from 'vitest';
import { compareCodePoints } from './match.ts';
import { recordResolve } from './operation.ts';

const run = (input: unknown) => executeOperation(recordResolve, input, {}, createTestContext());

const base = { datasetVersion: 'synthetic-v1', effectiveDate: '2026-06-15', conditions: {} };

const dated = (id: string) => ({ id, effectiveFrom: '2026-01-01', status: 'verified' });

describe('reference.record.resolve@1', () => {
  it('accepts exactly 5,000 records', async () => {
    const records = Array.from({ length: 5000 }, (_, i) => ({
      ...dated(`r${i}`),
      match: { slot: `s${i}` },
    }));
    const result = await run({ ...base, records, conditions: { selectors: { slot: 's4999' } } });
    expect(result.ok && result.value.resolution).toBe('matched');
    expect(result.ok && result.value.candidateIds).toEqual(['r4999']);
  });

  it('rejects more than 5,000 records', async () => {
    const records = Array.from({ length: 5001 }, (_, i) => dated(`r${i}`));
    const result = await run({ ...base, records });
    expect(!result.ok && result.error.code).toBe('REFERENCE_TOO_MANY_RECORDS');
    expect(!result.ok && result.error.path).toBe('records');
  });

  it('does not treat "*" as a wildcard', async () => {
    const records = [{ ...dated('star'), match: { zone: '*' } }];
    const result = await run({ ...base, records, conditions: { selectors: { zone: 'zone-a' } } });
    expect(result.ok && result.value.resolution).toBe('no-match');
  });

  it('does not match when a required selector is absent from the query', async () => {
    const records = [{ ...dated('cat'), match: { category: 'category-x' } }];
    const result = await run({ ...base, records });
    expect(result.ok && result.value.resolution).toBe('no-match');
    expect(result.ok && result.value.counts).toEqual({
      records: 1,
      dateEligible: 1,
      conditionEligible: 0,
    });
  });

  it('ignores inherited object keys when matching selectors', async () => {
    const records = [{ ...dated('proto'), match: { constructor: 'x' } }];
    const result = await run({ ...base, records });
    expect(result.ok && result.value.resolution).toBe('no-match');
  });

  it('rejects unknown top-level and record keys through the strict schema', async () => {
    const extraTop = await run({ ...base, records: [], extra: 'x' });
    expect(!extraTop.ok && extraTop.error.code).toBe('INVALID_INPUT');
    const extraRecord = await run({ ...base, records: [{ ...dated('a'), priority: '1' }] });
    expect(!extraRecord.ok && extraRecord.error.code).toBe('INVALID_INPUT');
  });

  it('rejects map keys that are not lower camel case or over the key limit', async () => {
    const badKey = await run({ ...base, records: [{ ...dated('a'), match: { Zone: 'z' } }] });
    expect(!badKey.ok && badKey.error.code).toBe('INVALID_INPUT');
    const many = Object.fromEntries(Array.from({ length: 17 }, (_, i) => [`k${i}`, 'v']));
    const tooMany = await run({ ...base, records: [{ ...dated('a'), meta: many }] });
    expect(!tooMany.ok && tooMany.error.code).toBe('INVALID_INPUT');
  });

  it('reports a missing record status', async () => {
    const result = await run({ ...base, records: [{ id: 'a', effectiveFrom: '2026-01-01' }] });
    expect(!result.ok && result.error).toMatchObject({
      code: 'REFERENCE_MISSING_INPUT',
      path: 'records.0.status',
    });
  });

  it('rejects an empty effectiveFrom as an invalid date', async () => {
    const result = await run({ ...base, records: [{ ...dated('a'), effectiveFrom: '' }] });
    expect(!result.ok && result.error.code).toBe('REFERENCE_INVALID_DATE');
  });

  it('is deterministic for the same input', async () => {
    const records = [dated('b'), dated('a')];
    const first = await run({ ...base, records });
    const second = await run({ ...base, records });
    expect(JSON.stringify(first)).toBe(JSON.stringify(second));
  });
});

describe('compareCodePoints', () => {
  it('orders by Unicode code point, not UTF-16 code unit', () => {
    // U+FF5E (one code unit) is below U+1F600 (a surrogate pair starting at 0xD83D).
    const sorted = ['\u{1F600}', '～', 'b', 'B', 'a'].sort(compareCodePoints);
    expect(sorted).toEqual(['B', 'a', 'b', '～', '\u{1F600}']);
  });
});
