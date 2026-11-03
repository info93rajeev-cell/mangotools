import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { ROOT } from '../../scripts/lib/paths.ts';
import { bundleTestEntryWithAssets, publicLibraryEntry } from '../support/library-bundle.ts';

const ui = join(ROOT, 'packages/ui');
const entry = (name: string, directory = ui) => JSON.stringify(publicLibraryEntry(name, directory));
const preactModuleEntry = JSON.stringify(
  publicLibraryEntry('preact', ui).replace(/preact\.js$/, 'preact.module.js'),
);

let bundle: string;
let bundleCss: string;

test.beforeAll(async () => {
  const result = await bundleTestEntryWithAssets(
    '@mangotools/ui',
    ui,
    `
    import { h, render } from ${preactModuleEntry};
    import { SurveyLevelingLayout } from ${JSON.stringify(join(ui, 'src/toolkit/survey/SurveyLevelingLayout.tsx'))};
    import { executeOperation, createTestContext } from ${entry('@mangotools/core')};
    import { engine } from ${entry('@mangotools/engine-survey', join(ROOT, 'engines/survey'))};

    export function mount() {
      const customRun = async (id, input, params, signal) => {
        const operation = engine.operations.find(op => op.id + '@' + op.major === id);
        if (!operation) return { ok: false, error: { code: 'OPERATION_NOT_FOUND' } };
        return executeOperation(operation, input, params, { ...createTestContext(), signal });
      };
      render(h(SurveyLevelingLayout, { customRun }), document.getElementById('root'));
    }
    `,
    'SurveyWorkbenchHarness',
  );
  bundle = result.code;
  bundleCss = result.css;
});

const viewports = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'landscape', width: 740, height: 360 },
  { name: 'mobile', width: 360, height: 800 },
];

for (const vp of viewports) {
  test(`Rise & Fall Leveling Workbench renders correctly at ${vp.name} (${vp.width}x${vp.height})`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    const distAssets = join(ROOT, 'apps/web/dist-prod/assets');
    let cssLinks = '';
    try {
      const cssFiles = readdirSync(distAssets).filter((n) => n.endsWith('.css'));
      cssLinks = cssFiles.map((n) => `<link rel="stylesheet" href="/assets/${n}">`).join('');
    } catch {
      // dist-prod may not be built yet in local dev
    }

    await page.route('**/__survey-workbench-test__', (route) =>
      route.fulfill({
        contentType: 'text/html',
        body: `<!doctype html>
<html lang="en">
<head>
  <title>Rise & Fall Workbench Test</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; width: 100%; }
    main { width: 100%; }
    ${bundleCss}
  </style>
  ${cssLinks}
</head>
<body>
  <main id="root"></main>
</body>
</html>`,
      }),
    );

    await page.goto('/__survey-workbench-test__');
    await page.addScriptTag({ content: bundle });
    await page.evaluate(() => {
      (
        window as unknown as { SurveyWorkbenchHarness: { mount(): void } }
      ).SurveyWorkbenchHarness.mount();
    });

    // Verify workbench mounted
    const workbench = page.locator('[data-survey-workbench]');
    await expect(workbench).toBeVisible();

    // Verify Title & Breadcrumb header
    await expect(
      page.getByRole('heading', { level: 1, name: 'Rise & Fall Leveling Calculator' }),
    ).toBeVisible();

    // Verify initial calculation results
    const closingRLTile = page.locator('[data-tile-closing-rl]');
    await expect(closingRLTile).toContainText('99.800 m');

    const misclosureTile = page.locator('[data-tile-misclosure]');
    await expect(misclosureTile).toContainText('−5 mm');

    // Verify Arithmetic Checks: all 3 deltas agree and 2 checks pass
    const checks = page.locator('[data-arithmetic-checks]');
    await expect(checks).toBeVisible();
    await expect(checks).toContainText('−0.200 m');

    // Verify disabled preview controls are non-interactive
    await expect(page.getByRole('button', { name: /Height of Instrument/i })).toBeDisabled();
    await expect(page.locator('#survey-allowable-const')).toBeDisabled();
    await expect(page.locator('#survey-adjust-by')).toBeDisabled();

    // Verify accessible keyboard navigation: Enter advances focus
    const firstBS = page.locator('#survey-obs-0-bs');
    await firstBS.focus();
    await page.keyboard.press('Enter');
    const firstIS = page.locator('#survey-obs-0-is');
    await expect(firstIS).toBeFocused();

    // Verify zero horizontal scroll overflow
    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(hasHorizontalOverflow).toBe(false);

    // Save screenshot artifact for desktop/mobile comparison
    await page.screenshot({
      path: `tests/artifacts/screenshots/survey-workbench-${vp.name}-${vp.width}.png`,
      fullPage: true,
    });

    // Test Reset & Try Sample
    const resetBtn = page.locator('[data-reset-btn]');
    await resetBtn.click();
    await expect(page.locator('#survey-startRL')).toHaveValue('');
    await expect(page.locator('[data-tile-closing-rl]')).toContainText('—');

    const sampleBtn = page.locator('[data-try-sample]');
    await sampleBtn.click();
    await expect(page.locator('#survey-startRL')).toHaveValue('100.000');
    await expect(closingRLTile).toContainText('99.800 m');

    // Accessibility audit with Axe
    const axe = await new AxeBuilder({ page }).disableRules(['color-contrast']).analyze();
    expect(axe.violations).toEqual([]);
  });
}
