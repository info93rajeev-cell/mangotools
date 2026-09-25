import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { canonicalHash, createTestContext, executeOperation } from '@mangotools/core';
import { expect, test } from '@playwright/test';
import { findOperation, loadEngines } from '../../scripts/lib/engines.ts';

interface Case {
  id: string;
  operation: string;
  input: unknown;
  params: unknown;
}

const cases = JSON.parse(
  readFileSync(join(process.cwd(), 'generated/determinism-fixtures.json'), 'utf8'),
) as Case[];

/** Hashes of every engine fixture outcome computed in Node (the reference). */
async function nodeHashes(): Promise<Record<string, string>> {
  const engines = await loadEngines();
  const out: Record<string, string> = {};
  for (const c of cases) {
    const op = findOperation(engines, c.operation);
    if (!op) throw new Error(`Unknown operation ${c.operation}`);
    out[c.id] = await canonicalHash(
      await executeOperation(op, c.input, c.params, createTestContext()),
    );
  }
  return out;
}

test('every engine fixture hashes identically in the browser worker and in Node', async ({
  page,
}) => {
  expect(cases.length).toBeGreaterThan(50);
  const reference = await nodeHashes();
  await page.goto('/_dev/determinism');
  const results = page.locator('#determinism-results');
  await expect(results).toHaveAttribute('data-done', 'true', { timeout: 20_000 });
  const browser = JSON.parse((await results.textContent()) ?? '{}') as Record<string, string>;
  expect(Object.keys(browser).sort()).toEqual(Object.keys(reference).sort());
  const differing = Object.keys(reference).filter((id) => browser[id] !== reference[id]);
  expect(differing).toEqual([]);
});
