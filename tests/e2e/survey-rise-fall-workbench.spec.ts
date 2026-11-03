import { copyFileSync } from 'node:fs';
import { join } from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { ROOT } from '../../scripts/lib/paths.ts';
import { bundleTestEntry, publicLibraryEntry } from '../support/library-bundle.ts';

const ui = join(ROOT, 'packages/ui');
const entry = (name: string, directory = ui) => JSON.stringify(publicLibraryEntry(name, directory));

let engineBundle: string;

test.beforeAll(async () => {
  engineBundle = await bundleTestEntry(
    '@mangotools/ui',
    ui,
    `
    import { executeOperation, createTestContext } from ${entry('@mangotools/core')};
    import { engine } from ${entry('@mangotools/engine-survey', join(ROOT, 'engines/survey'))};

    window.__customRun = async (id, input, params, signal) => {
      const operation = engine.operations.find(op => op.id + '@' + op.major === id);
      if (!operation) return { ok: false, error: { code: 'OPERATION_NOT_FOUND' } };
      return executeOperation(operation, input, params, { ...createTestContext(), signal });
    };
    `,
    'SurveyEngineClientBundle',
  );
});

test.beforeEach(async ({ page }) => {
  await page.route('**/_dev/survey-workbench*', async (route) => {
    const response = await route.fetch();
    let html = await response.text();
    html = html.replace(/<meta http-equiv="content-security-policy"[^>]*>/gi, '');
    const headers = { ...response.headers() };
    delete headers['content-security-policy'];
    delete headers['Content-Security-Policy'];
    await route.fulfill({
      response,
      headers,
      body: html,
    });
  });
  await page.addInitScript({ content: engineBundle });
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
    await page.goto('http://127.0.0.1:4322/_dev/survey-workbench');

    // Verify workbench is visible
    const workbench = page.locator('[data-survey-workbench]');
    await expect(workbench).toBeVisible();

    // Verify Breadcrumbs and Title with real site shell
    await expect(page.locator('h1')).toHaveText('Rise & Fall Leveling Calculator');
    await expect(page.getByText('Home')).toBeVisible();
    await expect(page.getByText('Surveying')).toBeVisible();

    // Wait for initial sample calculation
    const readyBadge = page.getByText('✓ Calculated');
    await expect(readyBadge).toBeVisible();

    // Verify arithmetic equality checks text
    await expect(
      page.getByText('Two arithmetic equality checks confirming three agreeing deltas'),
    ).toBeVisible();

    const resultTable = page.locator('[data-results-table]');
    await expect(resultTable).toBeVisible();

    // Verify 6 rows in results table
    const resultRows = resultTable.locator('tbody tr');
    await expect(resultRows).toHaveCount(6);

    // Verify Row 0 has absent rise/fall (—) rather than fabricated zeroes
    const firstRowCells = resultRows.first().locator('td');
    await expect(firstRowCells.nth(1)).toHaveText('—');
    await expect(firstRowCells.nth(2)).toHaveText('—');
    await expect(firstRowCells.nth(3)).toHaveText('100.000');

    // Run accessibility audit with COLOR CONTRAST ENABLED (no disabled rules)
    const axe = await new AxeBuilder({ page }).analyze();
    expect(axe.violations).toEqual([]);

    // Check no horizontal overflow
    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(hasHorizontalOverflow).toBe(false);

    // Capture full-page screenshot with real typography, header, and footer
    const shotPath = `tests/artifacts/screenshots/survey-workbench-${vp.name}-${vp.width}.png`;
    await page.screenshot({ path: shotPath, fullPage: true });

    // Also copy to artifacts directory for conversation presentation
    const artifactDest = `C:/Users/user/.gemini/antigravity/brain/ad6e6067-5d37-4438-af77-b06a7b8c5081/survey-workbench-${vp.name}-${vp.width}.png`;
    try {
      copyFileSync(shotPath, artifactDest);
    } catch {
      // Artifact directory copy is best-effort
    }
  });
}

test('Stale state invalidation on input change and recalculation', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://127.0.0.1:4322/_dev/survey-workbench');

  await expect(page.getByText('✓ Calculated')).toBeVisible();
  const copyBtn = page.locator('[data-copy-book-btn]');
  const printBtn = page.locator('[data-print-book-btn]');
  await expect(copyBtn).toBeEnabled();
  await expect(printBtn).toBeEnabled();

  // Edit Start RL -> result should immediately invalidate
  const startRLInput = page.locator('#survey-startRL');
  await startRLInput.fill('105.000');

  // Verify stale badge and notice
  await expect(page.getByText('Recalculate required')).toBeVisible();
  await expect(page.locator('[data-stale-notice]')).toBeVisible();
  await expect(page.getByText('Input values changed')).toBeVisible();

  // Verify table is hidden or cleared, and action buttons disabled
  await expect(page.locator('[data-results-table]')).not.toBeVisible();
  await expect(copyBtn).toBeDisabled();
  await expect(printBtn).toBeDisabled();

  // Recalculate
  await page.locator('[data-calculate-btn]').click();

  // Verify updated results
  await expect(page.getByText('✓ Calculated')).toBeVisible();
  const firstRowRL = page.locator('[data-results-table] tbody tr').first().locator('td').nth(3);
  await expect(firstRowRL).toHaveText('105.000');
  await expect(copyBtn).toBeEnabled();
});

test('Error path alignment, input focus and error recovery', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://127.0.0.1:4322/_dev/survey-workbench');

  await expect(page.getByText('✓ Calculated')).toBeVisible();

  // Change row 0 BS to invalid negative reading
  const cell = page.locator('#survey-obs-0-bs');
  await cell.fill('-1.500');

  // Trigger calculation
  await page.locator('[data-calculate-btn]').click();

  // Verify field error is focused, marked aria-invalid, and error message shown
  await expect(cell).toBeFocused();
  await expect(cell).toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByText('Check inputs')).toBeVisible();

  // Recovery: change back to valid reading
  await cell.fill('1.500');
  await page.locator('[data-calculate-btn]').click();

  // Verify error cleared and calculation succeeds
  await expect(page.getByText('✓ Calculated')).toBeVisible();
  await expect(cell).not.toHaveAttribute('aria-invalid', 'true');
});

test('Row addition and deletion interaction', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://127.0.0.1:4322/_dev/survey-workbench');

  await expect(page.getByText('✓ Calculated')).toBeVisible();

  const rows = page.locator('[data-level-book-table] tbody tr');
  const initialCount = await rows.count();
  expect(initialCount).toBe(6);

  // Add row
  await page.getByRole('button', { name: /Add row/ }).click();
  await expect(rows).toHaveCount(initialCount + 1);

  // Remove added row
  const lastDeleteBtn = rows.last().getByRole('button', { name: /Remove row/ });
  await lastDeleteBtn.click();
  await expect(rows).toHaveCount(initialCount);
});
