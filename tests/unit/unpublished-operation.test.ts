import { createTestContext, executeOperation } from '@mangotools/core';
import { expect, it } from 'vitest';
import { checkFixture } from '../../scripts/lib/fixtures.ts';
import { unpublishedTargets } from '../determinism/unpublished-targets.ts';
import { observe } from '../support/library-observation.ts';
import { runOperationCases } from '../support/operation-observation.ts';
import { loadUnpublishedEngine, unpublishedFixtures } from '../support/unpublished-fixtures.ts';

const target = unpublishedTargets[0];
const fixtures = unpublishedFixtures(target.operation);
const engine = await loadUnpublishedEngine(target);
const cases = fixtures.map(({ file, fixture }) => ({
  id: file,
  operation: target.operation,
  input: fixture.input,
  params: fixture.params ?? {},
}));

it('explicitly covers every merged Leveling fixture, including successes and errors', () => {
  expect(unpublishedTargets.map((t) => t.operation)).toEqual(['survey.leveling.reduce@1']);
  expect(fixtures).toHaveLength(37);
  expect(fixtures.filter((f) => f.fixture.expected)).toHaveLength(3);
  expect(fixtures.filter((f) => f.fixture.expectedError)).toHaveLength(34);
});

it('uses the actual public descriptor and Core result, preserving fixture truth and observations', async () => {
  const observed = await runOperationCases(engine, [target.operation], cases);
  for (const [i, item] of cases.entries()) {
    const result = await executeOperation(
      engine.operations[0],
      item.input,
      item.params,
      createTestContext(),
    );
    expect(checkFixture(fixtures[i].fixture, result)).toBeNull();
    expect(observed[i]).toEqual({ id: item.id, ...(await observe(result)) });
  }
});

it('fails closed for empty discovery, empty cases, unreviewed operations and missing descriptors', async () => {
  expect(() => unpublishedFixtures('survey.missing.operation@999')).toThrow('No approved fixtures');
  await expect(runOperationCases(engine, [target.operation], [])).rejects.toThrow(
    'No operation cases',
  );
  await expect(runOperationCases(engine, [], cases)).rejects.toThrow('Unapproved operation');
  const absent = { ...engine, operations: [] };
  await expect(runOperationCases(absent, [target.operation], cases)).rejects.toThrow(
    'Missing operation',
  );
});
