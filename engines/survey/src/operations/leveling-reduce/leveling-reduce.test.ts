import { canonicalJson, createTestContext, executeOperation } from '@mangotools/core';
import { expect, it } from 'vitest';
import { levelingReduce } from './operation.ts';
import { levelingOutput } from './schema.ts';

const run = (input: unknown) => executeOperation(levelingReduce, input, {}, createTestContext());
const book = {
  startRL: '-10.000000',
  observations: [
    { station: 'same', remarks: 'private', bs: '0' },
    { station: 'same', remarks: 'unchanged', fs: '.000001' },
  ],
};

it('keeps signed RL, zero staff, six places, labels and working exact without mutation', async () => {
  const before = JSON.stringify(book);
  const result = await run(book);
  expect(result.ok).toBe(true);
  if (!result.ok) return;
  const out = levelingOutput.parse(result.value);
  expect(out.endingRL).toBe('-10.000001');
  expect(out.rows.map((r) => [r.station, r.remarks])).toEqual([
    ['same', 'private'],
    ['same', 'unchanged'],
  ]);
  expect(out.working).toEqual([
    {
      ref: 'observations.1.rl',
      formulaKey: 'leveling.working.rl',
      variables: {
        previousRL: '-10',
        previousReading: '0',
        incomingReading: '0.000001',
        rise: '0',
        fall: '0.000001',
      },
      result: '-10.000001',
    },
  ]);
  expect(out.checks.map((c) => [c.status, c.expected, c.actual])).toEqual([
    ['pass', '-0.000001', '-0.000001'],
    ['pass', '-0.000001', '-0.000001'],
  ]);
  expect(JSON.stringify(book)).toBe(before);
  expect(JSON.stringify(await run(book))).toBe(JSON.stringify(result));
  expect(canonicalJson(await run(book))).toBe(canonicalJson(result));
});

it.each([
  ['-0', '0', '-10.000001'],
  ['-11', '-11', '0.999999'],
  ['-9', '-9', '-1.000001'],
])('normalizes closing %s and returns signed misclosure', async (closingRL, known, misclosure) => {
  const result = await run({ ...book, closingRL });
  expect(result.ok && result.value).toMatchObject({
    closingRL: known,
    misclosure,
  });
});

it('accepts 50 rows and ordinary notation, normalizes negative zero, and preserves exact checks', async () => {
  const observations = [
    { bs: '.5' },
    ...Array.from({ length: 48 }, () => ({ is: ' 1. ' })),
    { fs: '.5' },
  ];
  const result = await run({ startRL: '-0', observations });
  expect(result.ok && result.value).toMatchObject({ startingRL: '0', endingRL: '0', rlDelta: '0' });
});

it('returns only bounded error metadata, never field-book content', async () => {
  const result = await run({
    ...book,
    observations: [{ ...book.observations[0], bs: 'secret' }, { fs: '1' }],
  });
  expect(result).toEqual({
    ok: false,
    error: {
      code: 'SURVEY_LEVELING_INVALID_DECIMAL',
      path: 'observations.0.bs',
      messageKey: 'errors.SURVEY_LEVELING_INVALID_DECIMAL',
    },
  });
});
