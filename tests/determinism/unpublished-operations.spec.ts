import { join } from 'node:path';
import { toJsonSafe } from '@mangotools/core';
import { expect, test } from '@playwright/test';
import { ROOT } from '../../scripts/lib/paths.ts';
import { bundleTestEntry } from '../support/library-bundle.ts';
import { type OperationCase, runOperationCases } from '../support/operation-observation.ts';
import { runOperationWorker } from '../support/operation-worker.ts';
import { loadUnpublishedEngine, unpublishedFixtures } from '../support/unpublished-fixtures.ts';
import { unpublishedTargets } from './unpublished-targets.ts';

for (const target of unpublishedTargets) {
  test(`${target.operation}: all approved fixtures match public Node/browser worker observations`, async ({
    page,
  }) => {
    expect(Number(process.versions.node.split('.')[0]), 'Node 24 reference runtime').toBe(24);
    const fixtures = unpublishedFixtures(target.operation);
    expect(fixtures.length, 'non-vacuous approved fixture coverage').toBeGreaterThanOrEqual(
      target.minimumFixtures,
    );
    const cases: OperationCase[] = fixtures.map(({ file, fixture }) => ({
      id: file,
      operation: target.operation,
      input: toJsonSafe(fixture.input),
      params: toJsonSafe(fixture.params ?? {}),
    }));
    const engine = await loadUnpublishedEngine(target);
    const node = await runOperationCases(engine, [target.operation], cases);
    expect(node.map((row) => row.id)).toEqual(cases.map((row) => row.id));
    const runner = join(ROOT, 'tests/support/operation-observation.ts').replaceAll('\\', '/');
    const bundle = await bundleTestEntry(
      target.packageName,
      join(ROOT, target.directory),
      `import { engine } from ${JSON.stringify(target.packageName)};
       import { runOperationCases } from ${JSON.stringify(runner)};
       export const run = cases => runOperationCases(engine, ${JSON.stringify([target.operation])}, cases);`,
      'UnpublishedOperationHarness',
    );
    const browser = await runOperationWorker(page, bundle, cases);
    // Full Result, decimal strings, recursive binary64 bits, canonical JSON and SHA256.
    expect(browser).toEqual(node);
  });
}
