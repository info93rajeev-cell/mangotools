import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { expect, test } from '@playwright/test';
import { ROOT } from '../../scripts/lib/paths.ts';
import { bundlePublicLibrary, publicLibraryEntry } from '../support/library-bundle.ts';
import { type LibraryCase, observe, runLibraryCases } from '../support/library-observation.ts';

const packageName = '@mangotools/engine-numeric';
const directory = join(ROOT, 'engines/numeric');
const cases: LibraryCase[] = JSON.parse(
  readFileSync(join(ROOT, 'tests/determinism/fixtures/numeric-public.json'), 'utf8'),
);

let bundle: string;
test.beforeAll(async () => {
  expect(Number(process.versions.node.split('.')[0]), 'Node 24 reference runtime').toBe(24);
  bundle = await bundlePublicLibrary(packageName, directory);
});

test('public Numeric exports match expected results and exact Node bits/hash', async ({ page }) => {
  const library: Record<string, unknown> = await import(
    pathToFileURL(publicLibraryEntry(packageName, directory)).href
  );
  const expected = await Promise.all(
    cases.map(async (item) => ({
      id: item.id,
      ...(await observe(item.expected)),
    })),
  );
  const node = await runLibraryCases(library, cases);
  expect(node).toEqual(expected);
  // Intercepted only in this test: no generated, built or deployed route/asset.
  await page.route('**/__public-library-test__', (route) =>
    route.fulfill({
      contentType: 'text/html',
      body: '<!doctype html><title>Library determinism test</title>',
    }),
  );
  await page.goto('/__public-library-test__');
  await page.addScriptTag({ content: bundle });
  const browser = await page.evaluate(async (vectors) => {
    const harness = (
      globalThis as unknown as {
        PublicLibraryHarness: { run(input: LibraryCase[]): Promise<unknown> };
      }
    ).PublicLibraryHarness;
    return harness.run(vectors);
  }, cases);
  // Includes recursively recorded binary64 bits, canonical JSON and SHA-256.
  expect(browser).toEqual(node);
});
