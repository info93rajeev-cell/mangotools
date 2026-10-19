import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import type { Result } from '@mangotools/core';
import type { ResolvedPreset } from '@mangotools/schemas';
import { expect, test } from '@playwright/test';
import { checkFixture } from '../../scripts/lib/fixtures.ts';
import { ROOT } from '../../scripts/lib/paths.ts';
import { bundleTestEntry, publicLibraryEntry } from '../support/library-bundle.ts';

const ui = join(ROOT, 'packages/ui');
const entry = (name: string, directory = ui) => JSON.stringify(publicLibraryEntry(name, directory));
const base: ResolvedPreset = JSON.parse(
  readFileSync(join(ROOT, 'generated/presets/estimate/gst.india.json'), 'utf8'),
);
const cases = ['leveling-reduce/001-fao-change-point', 'traverse-compute/001-ssgec-lab-p18'];
function fixture(name: string) {
  const [operation, id] = name.split('/');
  return JSON.parse(
    readFileSync(
      join(ROOT, `engines/survey/src/operations/${operation}/fixtures/${id}.yaml`),
      'utf8',
    ),
  );
}
let bundle: string;
test.beforeAll(async () => {
  bundle = await bundleTestEntry(
    '@mangotools/ui',
    ui,
    `
    import { h, render } from ${entry('preact')};
    import { SurveyResults } from ${entry('@mangotools/ui/toolkit/SurveyResults.tsx')};
    import { WorkingSteps } from ${entry('@mangotools/ui/toolkit/WorkingSteps.tsx')};
    import { executeOperation, createTestContext } from ${entry('@mangotools/core')};
    import { engine } from ${entry('@mangotools/engine-survey', join(ROOT, 'engines/survey'))};
    export async function mount(preset, sample) {
      const operation = engine.operations.find(op => op.id + '@' + op.major === sample.operation);
      const result = await executeOperation(operation, sample.input, sample.params, createTestContext());
      if (!result.ok) throw new Error(result.error.code);
      const value = result.value;
      const keys = [...Object.keys(value), ...Object.keys(value.closure ?? {}),
        ...Object.keys(value.rows?.[0] ?? value.legs?.[0] ?? {}), 'quantity', 'result', 'station', 'northingM', 'eastingM', 'labelKey', 'status', 'expected', 'actual'];
      preset.operation = sample.operation;
      preset.strings = { ...preset.strings, ...engine.messages, ...Object.fromEntries(keys.flatMap(key =>
        [['survey.column.' + key, key], ['survey.section.' + key, key]])) };
      render(h('div', {}, h(SurveyResults, { preset, value }),
        h(WorkingSteps, { preset, steps: value.working })), document.getElementById('root'));
      return result;
    }`,
    'SurveyHarness',
  );
});

for (const name of cases) {
  for (const viewport of [
    { width: 1366, height: 768 },
    { width: 360, height: 800 },
  ]) {
    test(`${name} result tables ${viewport.width}px`, async ({ page }, info) => {
      await page.setViewportSize(viewport);
      const requests: string[] = [];
      page.on('request', (request) => requests.push(`${request.method()} ${request.url()}`));
      const css = readdirSync(join(ROOT, 'apps/web/dist-prod/assets')).filter((name) =>
        name.endsWith('.css'),
      );
      await page.route('**/__survey-results-test__', (route) =>
        route.fulfill({
          contentType: 'text/html',
          body: `<!doctype html><html lang="en"><head><title>Survey result test</title><meta name="viewport" content="width=device-width, initial-scale=1">${css.map((name) => `<link rel="stylesheet" href="/assets/${name}">`).join('')}</head><body><main><h1>Survey results</h1><div id="root"></div></main></body></html>`,
        }),
      );
      await page.goto('/__survey-results-test__');
      await page.addScriptTag({ content: bundle });
      const example = fixture(name);
      const mount = (sample: typeof example) =>
        page.evaluate(
          async ({ preset, sample }) =>
            (
              window as unknown as {
                SurveyHarness: {
                  mount(p: ResolvedPreset, s: unknown): Promise<Result<Record<string, unknown>>>;
                };
              }
            ).SurveyHarness.mount(preset, sample),
          { preset: base, sample },
        );
      const outcome = await mount(example);
      expect(checkFixture(example, outcome)).toBeNull();
      await expect(page.getByRole('table')).toHaveCount(3);
      await expect(page.getByRole('columnheader', { name: 'station', exact: true })).toBeVisible();
      const working = page.locator('[data-working]');
      await expect(working).not.toHaveAttribute('open');
      await working.locator('summary').focus();
      await page.keyboard.press('Enter');
      await expect(working).toHaveAttribute('open');
      await page.keyboard.press('Enter');
      await expect(working).not.toHaveAttribute('open');
      if (name.startsWith('leveling')) {
        await expect(page.getByRole('cell', { name: '102.260', exact: true })).not.toHaveCount(0);
        await expect(page.getByRole('cell', { name: '—', exact: true })).not.toHaveCount(0);
        example.input.observations[0].station = '001';
        await mount(example);
        await expect(page.getByRole('cell', { name: '001', exact: true })).toBeVisible();
      } else {
        if (!outcome.ok) throw new Error('Expected successful immutable fixture');
        const closure = outcome.value.closure as Record<string, unknown>;
        const raw = String(closure.linearMisclosureM);
        await expect(page.locator(`td[title="${raw}"]`)).toHaveCount(1);
        await mount(fixture('traverse-compute/004-cardinal-rectangle'));
        await expect(
          page.getByRole('cell', { name: 'zero-misclosure', exact: true }),
        ).toBeVisible();
        await expect(
          page
            .getByRole('table', { name: 'closure', exact: true })
            .getByRole('cell', { name: '—', exact: true }),
        ).toBeVisible();
      }
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      const scroll = page.getByRole('region').first();
      await scroll.focus();
      await expect(scroll).toBeFocused();
      await page.evaluate(() => scrollTo(0, 0));
      await page.screenshot({
        path: `tests/artifacts/screenshots/survey-results-${name.split('/')[0]}-${info.project.name}-${viewport.width}.png`,
        fullPage: true,
      });
      expect(requests.every((request) => request.startsWith('GET http://127.0.0.1:'))).toBe(true);
    });
  }
}
