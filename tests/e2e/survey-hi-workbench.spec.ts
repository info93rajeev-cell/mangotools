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
    await route.fulfill({ response, headers, body: html });
  });
  await page.addInitScript({ content: engineBundle });
});

const viewports = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'landscape', width: 740, height: 360 },
  { name: 'mobile', width: 360, height: 800 },
];

for (const vp of viewports) {
  test(`Height of Instrument Workbench renders correctly at ${vp.name} (${vp.width}x${vp.height})`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto('http://127.0.0.1:4322/_dev/survey-workbench');

    // Wait for initial hydration and default state (no automatic C -> Criterion not provided)
    await expect(page.locator('[data-results-badge]')).toHaveText(/Criterion not provided/);

    // Load sample
    await page.locator('[data-try-sample]').click();
    await expect(page.locator('[data-results-badge]')).toHaveText(/Within limit/);

    // Switch to Height of Instrument tab
    const hiTab = page.locator('[data-method-tab="height-of-instrument"]');
    await hiTab.click();

    // Verify invalidation on method switch -> stale notice
    await expect(page.locator('[data-results-badge]')).toHaveText('Recalculate required');
    await expect(page.locator('[data-stale-notice]')).toBeVisible();
    await expect(page.locator('[data-results-table]')).not.toBeVisible();

    // Recalculate levels using Height of Instrument
    await page.locator('[data-calculate-btn]').click();

    // Verify badge: Within limit
    await expect(page.locator('[data-results-badge]')).toHaveText(/Within limit/);

    // Verify arithmetic check subtitle for Collimation / HI
    await expect(
      page.getByText(
        'Collimation arithmetic check (Backsights − Foresights = Ending RL − Starting RL):',
      ),
    ).toBeVisible();

    // Verify exactly 2 check items are present, and Rise-Fall check is absent
    const checkItems = page.locator('[data-arithmetic-checks] li');
    await expect(checkItems).toHaveCount(2);
    await expect(page.getByText(/ΣRise − ΣFall/)).not.toBeVisible();

    // Check 1: ΣBS - ΣFS = 4.600 - 4.800 = −0.200 m
    await expect(checkItems.nth(0)).toContainText('ΣBS − ΣFS');
    await expect(checkItems.nth(0)).toContainText('−0.200 m');

    // Check 2: Last RL - First RL = 99.800 - 100.000 = −0.200 m
    await expect(checkItems.nth(1)).toContainText('Last RL − First RL');
    await expect(checkItems.nth(1)).toContainText('−0.200 m');

    // Verify Results table
    const resultTable = page.locator('[data-results-table]');
    await expect(resultTable).toBeVisible();

    // Verify headers: Station, Dist (m), HI (m), Raw RL (m), Corr. (mm), Adjusted RL (m)
    const headers = resultTable.locator('thead th');
    await expect(headers).toHaveCount(6);
    await expect(headers.nth(2)).toHaveText('HI (m)');
    await expect(headers.nth(3)).toHaveText('Raw RL (m)');

    // Verify rows count
    const rows = resultTable.locator('tbody tr');
    await expect(rows).toHaveCount(6);

    // Row 0: BM-1, dist 0, HI 101.500, Raw RL 100.000, corr 0.0, Adj 100.000
    const r0 = rows.nth(0).locator('td');
    await expect(r0.nth(0)).toHaveText('BM-1');
    await expect(r0.nth(1)).toHaveText('0');
    await expect(r0.nth(2)).toHaveText('101.500');
    await expect(r0.nth(3)).toHaveText('100.000');
    await expect(r0.nth(4)).toHaveText('0.0');
    await expect(r0.nth(5)).toHaveText('100.000');

    // Row 1: A, dist 30, HI —, Raw RL 100.300, corr +0.9, Adj 100.301
    const r1 = rows.nth(1).locator('td');
    await expect(r1.nth(0)).toHaveText('A');
    await expect(r1.nth(1)).toHaveText('30');
    await expect(r1.nth(2)).toHaveText('—');
    await expect(r1.nth(3)).toHaveText('100.300');
    await expect(r1.nth(4)).toHaveText('+0.9');
    await expect(r1.nth(5)).toHaveText('100.301');

    // Row 2: CP1, dist 30, HI 100.300, Raw RL 99.500, corr +1.9, Adj 99.502
    const r2 = rows.nth(2).locator('td');
    await expect(r2.nth(0)).toHaveText('CP1');
    await expect(r2.nth(1)).toHaveText('30');
    await expect(r2.nth(2)).toHaveText('100.300');
    await expect(r2.nth(3)).toHaveText('99.500');
    await expect(r2.nth(4)).toHaveText('+1.9');
    await expect(r2.nth(5)).toHaveText('99.502');

    // Row 5: BM-2, dist 40, HI —, Raw RL 99.800, corr +5.0, Adj 99.805
    const r5 = rows.nth(5).locator('td');
    await expect(r5.nth(0)).toHaveText('BM-2');
    await expect(r5.nth(1)).toHaveText('40');
    await expect(r5.nth(2)).toHaveText('—');
    await expect(r5.nth(3)).toHaveText('99.800');
    await expect(r5.nth(4)).toHaveText('+5.0');
    await expect(r5.nth(5)).toHaveText('99.805');

    // Run axe accessibility audit (zero violations)
    const axe = await new AxeBuilder({ page }).analyze();
    expect(axe.violations).toEqual([]);

    // Check no horizontal overflow
    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(hasHorizontalOverflow).toBe(false);

    // Capture screenshots
    const shotPath = `tests/artifacts/screenshots/survey-hi-workbench-${vp.name}-${vp.width}.png`;
    await page.screenshot({ path: shotPath, fullPage: true });

    // Copy to artifact directory
    const dest = `C:/Users/user/.gemini/antigravity/brain/ad6e6067-5d37-4438-af77-b06a7b8c5081/survey-hi-workbench-${vp.name}-${vp.width}.png`;
    try {
      copyFileSync(shotPath, dest);
    } catch {
      // Best-effort
    }
  });
}

test('Method switching and stale invalidation', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://127.0.0.1:4322/_dev/survey-workbench');

  // Wait for hydration
  await expect(page.locator('[data-results-badge]')).toHaveText(/Criterion not provided/);

  // Load sample in RF mode
  await page.locator('[data-try-sample]').click();
  await expect(page.locator('[data-results-badge]')).toHaveText(/Within limit/);
  await expect(page.locator('[data-results-table] thead th').nth(2)).toHaveText('Rise');

  // Switch to HI
  await page.locator('[data-method-tab="height-of-instrument"]').click();
  await expect(page.locator('[data-results-badge]')).toHaveText('Recalculate required');
  await expect(page.locator('[data-results-table]')).not.toBeVisible();

  // Recalculate in HI mode
  await page.locator('[data-calculate-btn]').click();
  await expect(page.locator('[data-results-badge]')).toHaveText(/Within limit/);
  await expect(page.locator('[data-results-table] thead th').nth(2)).toHaveText('HI (m)');

  // Switch back to RF
  await page.locator('[data-method-tab="rise-fall"]').click();
  await expect(page.locator('[data-results-badge]')).toHaveText('Recalculate required');
  await expect(page.locator('[data-results-table]')).not.toBeVisible();

  // Recalculate in RF mode
  await page.locator('[data-calculate-btn]').click();
  await expect(page.locator('[data-results-badge]')).toHaveText(/Within limit/);
  await expect(page.locator('[data-results-table] thead th').nth(2)).toHaveText('Rise');
});

test('Copy level book in HI mode writes HI column TSV', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://127.0.0.1:4322/_dev/survey-workbench');

  // Wait for hydration
  await expect(page.locator('[data-results-badge]')).toHaveText(/Criterion not provided/);

  // Load sample and switch to HI
  await page.locator('[data-try-sample]').click();
  await expect(page.locator('[data-results-badge]')).toHaveText(/Within limit/);
  await page.locator('[data-method-tab="height-of-instrument"]').click();
  await page.locator('[data-calculate-btn]').click();
  await expect(page.locator('[data-results-badge]')).toHaveText(/Within limit/);

  let copiedText = '';
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: async (t: string) => {
          (window as unknown as { __copied: string }).__copied = t;
        },
      },
      configurable: true,
    });
  });

  await page.locator('[data-copy-book-btn]').click();
  await expect(page.getByText('Level book copied to clipboard')).toBeVisible();

  copiedText = await page.evaluate(
    () => (window as unknown as { __copied: string }).__copied ?? '',
  );

  expect(copiedText).toContain('HI');
  expect(copiedText).not.toContain('Rise');
  expect(copiedText).not.toContain('Fall');

  // First row has HI 101.5
  const lines = copiedText.split('\n');
  expect(lines[0]).toBe('Station\tDist (m)\tBS\tIS\tFS\tHI\tRaw RL\tCorr (mm)\tAdjusted RL');
  expect(lines[1]).toBe('BM-1\t0\t1.5\t\t\t101.5\t100\t0.0\t100.000');
});

test('HI mode with setup-based adjustment, open line, and missing C/distance', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://127.0.0.1:4322/_dev/survey-workbench');

  // Wait for hydration
  await expect(page.locator('[data-results-badge]')).toHaveText(/Criterion not provided/);

  // Load sample and switch to HI
  await page.locator('[data-try-sample]').click();
  await expect(page.locator('[data-results-badge]')).toHaveText(/Within limit/);
  await page.locator('[data-method-tab="height-of-instrument"]').click();
  await page.locator('[data-calculate-btn]').click();
  await expect(page.locator('[data-results-badge]')).toHaveText(/Within limit/);

  // 1. Setup-based adjustment in HI mode
  await page.locator('#survey-adjust-by').selectOption('setup');
  await page.locator('[data-calculate-btn]').click();
  await expect(page.locator('[data-results-badge]')).toHaveText(/Within limit/);

  const setupRows = page.locator('[data-results-table] tbody tr');
  // Row 0 corr: 0.0
  await expect(setupRows.nth(0).locator('td').nth(4)).toHaveText('0.0');
  // Row 2 (setup 1) corr: +1.7
  await expect(setupRows.nth(2).locator('td').nth(4)).toHaveText('+1.7');
  // Row 4 (setup 2) corr: +3.3
  await expect(setupRows.nth(4).locator('td').nth(4)).toHaveText('+3.3');
  // Row 5 (closing BM) corr: +5.0, adjusted RL: 99.805
  await expect(setupRows.nth(5).locator('td').nth(4)).toHaveText('+5.0');
  await expect(setupRows.nth(5).locator('td').nth(5)).toHaveText('99.805');

  // 2. Missing C constant -> Criterion not provided
  await page.locator('#survey-allowable-const').fill('');
  await page.locator('[data-calculate-btn]').click();
  await expect(page.locator('[data-results-badge]')).toHaveText(/Criterion not provided/);

  // 3. Open line: clear closing BM RL -> Calculated
  await page.locator('#survey-closeRL').fill('');
  await page.locator('[data-calculate-btn]').click();
  await expect(page.locator('[data-results-badge]')).toHaveText(/Calculated/);
  await expect(page.locator('[data-tile-misclosure]')).toHaveText('—');

  // 4. Missing distance with distance adjustment -> missing distance error
  await page.locator('#survey-closeRL').fill('99.805');
  await page.locator('#survey-allowable-const').fill('24');
  await page.locator('#survey-adjust-by').selectOption('distance');
  await page.locator('#survey-obs-1-dist').fill('');
  await page.locator('[data-calculate-btn]').click();

  const dist1 = page.locator('#survey-obs-1-dist');
  await expect(dist1).toBeFocused();
  await expect(dist1).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('[data-survey-error]')).toHaveText(
    /Distance from previous station is required for distance-based adjustment\./,
  );
});

test('Selecting HI first then clicking Try sample retains HI mode and calculates with HI', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://127.0.0.1:4322/_dev/survey-workbench');

  // Wait for hydration
  await expect(page.locator('[data-results-badge]')).toHaveText(/Criterion not provided/);

  // 1. Select HI tab first BEFORE loading sample
  const hiTab = page.locator('[data-method-tab="height-of-instrument"]');
  const rfTab = page.locator('[data-method-tab="rise-fall"]');
  await hiTab.click();

  await expect(hiTab).toHaveAttribute('aria-selected', 'true');
  await expect(rfTab).toHaveAttribute('aria-selected', 'false');

  // 2. Click "Try sample"
  await page.locator('[data-try-sample]').click();

  // 3. Verify selected tab is STILL Height of Instrument (not silently switched to Rise & Fall)
  await expect(hiTab).toHaveAttribute('aria-selected', 'true');
  await expect(rfTab).toHaveAttribute('aria-selected', 'false');

  // 4. Verify calculation succeeded in HI mode
  await expect(page.locator('[data-results-badge]')).toHaveText(/Within limit/);

  // 5. Verify HI arithmetic checks
  await expect(
    page.getByText(
      'Collimation arithmetic check (Backsights − Foresights = Ending RL − Starting RL):',
    ),
  ).toBeVisible();
  const checkItems = page.locator('[data-arithmetic-checks] li');
  await expect(checkItems).toHaveCount(2);
  await expect(page.getByText(/ΣRise − ΣFall/)).not.toBeVisible();

  // 6. Verify Results Table has HI (m) header and values
  const resultTable = page.locator('[data-results-table]');
  await expect(resultTable).toBeVisible();
  await expect(resultTable.locator('thead th').nth(2)).toHaveText('HI (m)');
  const rows = resultTable.locator('tbody tr');
  await expect(rows).toHaveCount(6);
  await expect(rows.nth(0).locator('td').nth(2)).toHaveText('101.500');
  await expect(rows.nth(2).locator('td').nth(2)).toHaveText('100.300');
  await expect(rows.nth(4).locator('td').nth(2)).toHaveText('102.000');
  await expect(rows.nth(5).locator('td').nth(5)).toHaveText('99.805');
});

test('Method accordion describes the currently selected reduction method', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://127.0.0.1:4322/_dev/survey-workbench');

  // Wait for hydration
  await expect(page.locator('[data-results-badge]')).toHaveText(/Criterion not provided/);

  // Open the Method accordion
  const methodAcc = page.locator('[data-bottom-faq]').getByRole('button', { name: /Method/ });
  await methodAcc.click();

  const desc = page.locator('[data-method-accordion-desc]');
  // In initial Rise & Fall mode
  await expect(desc).toContainText('Rise & Fall reduction method');

  // Switch to Height of Instrument
  await page.locator('[data-method-tab="height-of-instrument"]').click();
  await expect(desc).toContainText('Height of Instrument (Collimation) method');

  // Switch back to Rise & Fall
  await page.locator('[data-method-tab="rise-fall"]').click();
  await expect(desc).toContainText('Rise & Fall reduction method');
});

test('Keyboard navigation (arrow keys, Home, End) on method tabs', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://127.0.0.1:4322/_dev/survey-workbench');

  // Wait for hydration
  await expect(page.locator('[data-results-badge]')).toHaveText(/Criterion not provided/);

  const rfTab = page.locator('[data-method-tab="rise-fall"]');
  const hiTab = page.locator('[data-method-tab="height-of-instrument"]');

  // Focus the active Rise & Fall tab
  await rfTab.focus();
  await expect(rfTab).toBeFocused();
  await expect(rfTab).toHaveAttribute('tabindex', '0');
  await expect(hiTab).toHaveAttribute('tabindex', '-1');

  // Press ArrowRight -> moves focus to HI tab and selects it
  await page.keyboard.press('ArrowRight');
  await expect(hiTab).toBeFocused();
  await expect(hiTab).toHaveAttribute('aria-selected', 'true');
  await expect(hiTab).toHaveAttribute('tabindex', '0');
  await expect(rfTab).toHaveAttribute('aria-selected', 'false');
  await expect(rfTab).toHaveAttribute('tabindex', '-1');

  // Press ArrowLeft -> moves focus back to RF tab and selects it
  await page.keyboard.press('ArrowLeft');
  await expect(rfTab).toBeFocused();
  await expect(rfTab).toHaveAttribute('aria-selected', 'true');
  await expect(rfTab).toHaveAttribute('tabindex', '0');
  await expect(hiTab).toHaveAttribute('aria-selected', 'false');
  await expect(hiTab).toHaveAttribute('tabindex', '-1');

  // Press End -> selects HI
  await page.keyboard.press('End');
  await expect(hiTab).toBeFocused();
  await expect(hiTab).toHaveAttribute('aria-selected', 'true');

  // Press Home -> selects RF
  await page.keyboard.press('Home');
  await expect(rfTab).toBeFocused();
  await expect(rfTab).toHaveAttribute('aria-selected', 'true');

  // Press ArrowDown / ArrowUp wrap-around
  await page.keyboard.press('ArrowDown');
  await expect(hiTab).toBeFocused();
  await expect(hiTab).toHaveAttribute('aria-selected', 'true');
});
