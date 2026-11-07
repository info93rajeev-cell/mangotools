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
      if (typeof window !== 'undefined' && window.__calculationDelay) {
        await new Promise((resolve, reject) => {
          const timer = setTimeout(resolve, window.__calculationDelay);
          if (signal?.aborted) {
            clearTimeout(timer);
            reject(new DOMException('Aborted', 'AbortError'));
          } else {
            signal?.addEventListener('abort', () => {
              clearTimeout(timer);
              reject(new DOMException('Aborted', 'AbortError'));
            });
          }
        });
      }
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

    // On initial mount, allowable constant C has no automatic default -> Criterion not provided
    const resultsBadge = page.locator('[data-results-badge]');
    await expect(resultsBadge).toHaveText(/Criterion not provided/);

    // Click "Try sample" button to load approved 6-station sample with C=24 and distance adjustment
    await page.locator('[data-try-sample]').click();

    // Wait for sample calculation -> Within limit
    await expect(resultsBadge).toHaveText(/Within limit/);

    // Verify arithmetic equality checks text
    await expect(
      page.getByText('Two arithmetic equality checks confirming three agreeing deltas'),
    ).toBeVisible();

    const resultTable = page.locator('[data-results-table]');
    await expect(resultTable).toBeVisible();

    // Verify 6 rows in results table
    const resultRows = resultTable.locator('tbody tr');
    await expect(resultRows).toHaveCount(6);

    // Verify Row 0 has dist=0, absent rise/fall (—), Raw RL 100.000, corr 0.0, Adjusted RL 100.000
    const firstRowCells = resultRows.first().locator('td');
    await expect(firstRowCells.nth(0)).toHaveText('BM-1');
    await expect(firstRowCells.nth(1)).toHaveText('0');
    await expect(firstRowCells.nth(2)).toHaveText('—');
    await expect(firstRowCells.nth(3)).toHaveText('—');
    await expect(firstRowCells.nth(4)).toHaveText('100.000');
    await expect(firstRowCells.nth(5)).toHaveText('0.0');
    await expect(firstRowCells.nth(6)).toHaveText('100.000');

    // Verify Row 5 (closing BM): dist=40, raw RL 99.800, corr +5.0, Adjusted RL 99.805
    const lastRowCells = resultRows.last().locator('td');
    await expect(lastRowCells.nth(0)).toHaveText('BM-2');
    await expect(lastRowCells.nth(1)).toHaveText('40');
    await expect(lastRowCells.nth(4)).toHaveText('99.800');
    await expect(lastRowCells.nth(5)).toHaveText('+5.0');
    await expect(lastRowCells.nth(6)).toHaveText('99.805');

    // Verify Line length chip displays measured length
    await expect(page.locator('[data-line-length-value]')).toHaveText('160 m (0.160 km)');

    // Verify Allowable limit tile displays ±9.6 mm
    await expect(page.locator('[data-tile-allowable]')).toHaveText('±9.6 mm');

    // Verify Copy level book and Print / Save PDF buttons
    const copyBtn = page.locator('[data-copy-book-btn]');
    const printBtn = page.locator('[data-print-book-btn]');
    await expect(copyBtn).toBeVisible();
    await expect(printBtn).toBeVisible();
    await expect(copyBtn).toHaveText(/Copy level book/);
    await expect(printBtn).toHaveText(/Print \/ Save PDF/);

    const copyClass = (await copyBtn.getAttribute('class')) ?? '';
    const printClass = (await printBtn.getAttribute('class')) ?? '';
    expect(copyClass).not.toContain('undefined');
    expect(printClass).not.toContain('undefined');

    const copyStyles = await copyBtn.evaluate((el) => {
      const s = window.getComputedStyle(el);
      return { color: s.color, cursor: s.cursor };
    });
    expect(copyStyles.color).toBe('rgb(26, 110, 245)');
    expect(copyStyles.cursor).toBe('pointer');

    const printStyles = await printBtn.evaluate((el) => {
      const s = window.getComputedStyle(el);
      return { backgroundColor: s.backgroundColor, color: s.color, cursor: s.cursor };
    });
    expect(printStyles.backgroundColor).toBe('rgb(251, 191, 36)');
    expect(printStyles.color).toBe('rgb(15, 23, 42)');
    expect(printStyles.cursor).toBe('pointer');

    if (vp.name === 'mobile') {
      const printBox = await printBtn.boundingBox();
      const copyBox = await copyBtn.boundingBox();
      expect(printBox).not.toBeNull();
      expect(copyBox).not.toBeNull();
      if (printBox && copyBox) {
        expect(copyBox.y).toBeGreaterThanOrEqual(printBox.y + printBox.height - 2);
      }
    } else if (vp.name === 'desktop') {
      const printBox = await printBtn.boundingBox();
      const copyBox = await copyBtn.boundingBox();
      expect(printBox).not.toBeNull();
      expect(copyBox).not.toBeNull();
      if (printBox && copyBox) {
        expect(Math.abs(printBox.y - copyBox.y)).toBeLessThan(5);
        expect(copyBox.x).toBeGreaterThan(printBox.x);
      }
    }

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

  await expect(page.locator('[data-results-badge]')).toHaveText(/Criterion not provided/);
  await page.locator('[data-try-sample]').click();
  await expect(page.locator('[data-results-badge]')).toHaveText(/Within limit/);
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

  // Recalculate (Start RL changed to 105.000 while known closing RL is 99.805 -> misclosure exceeds limit)
  await page.locator('[data-calculate-btn]').click();

  // Verify updated results
  await expect(page.locator('[data-results-badge]')).toHaveText(/Outside limit/);
  const firstRowRL = page.locator('[data-results-table] tbody tr').first().locator('td').nth(4);
  await expect(firstRowRL).toHaveText('105.000');
  await expect(copyBtn).toBeEnabled();
});

test('Error path alignment, input focus and error recovery', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://127.0.0.1:4322/_dev/survey-workbench');

  await expect(page.locator('[data-results-badge]')).toHaveText(/Criterion not provided/);
  await page.locator('[data-try-sample]').click();
  await expect(page.locator('[data-results-badge]')).toHaveText(/Within limit/);

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
  await expect(page.locator('[data-results-badge]')).toHaveText(/Within limit/);
  await expect(cell).not.toHaveAttribute('aria-invalid', 'true');

  // Test start distance non-zero rejection (contract invariant: d0 must be 0 or omitted)
  const dist0 = page.locator('#survey-obs-0-dist');
  await dist0.fill('10');
  await page.locator('[data-calculate-btn]').click();

  await expect(dist0).toBeFocused();
  await expect(dist0).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('[data-survey-error]')).toHaveText(
    /Starting station distance must be 0 or omitted\./,
  );

  // Recovery
  await dist0.fill('0');
  await page.locator('[data-calculate-btn]').click();
  await expect(page.locator('[data-results-badge]')).toHaveText(/Within limit/);
});

test('Row addition and deletion interaction', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://127.0.0.1:4322/_dev/survey-workbench');

  await expect(page.locator('[data-results-badge]')).toHaveText(/Criterion not provided/);
  await page.locator('[data-try-sample]').click();
  await expect(page.locator('[data-results-badge]')).toHaveText(/Within limit/);

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

test('In-flight calculation abort and invalidation on edit (deterministic delayed-run)', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://127.0.0.1:4322/_dev/survey-workbench');

  await expect(page.locator('[data-results-badge]')).toHaveText(/Criterion not provided/);
  await page.locator('[data-try-sample]').click();
  await expect(page.locator('[data-results-badge]')).toHaveText(/Within limit/);

  // Inject a 400ms delay into calculation requests
  await page.evaluate(() => {
    (window as unknown as { __calculationDelay: number }).__calculationDelay = 400;
  });

  // Trigger calculation
  await page.locator('[data-calculate-btn]').click();

  // While calculation is in-flight (under 400ms), edit Start RL
  const startRLInput = page.locator('#survey-startRL');
  await startRLInput.fill('120.000');

  // Wait 600ms to allow delayed run to resolve or reject
  await page.waitForTimeout(600);

  // Assert UI remains in stale state and did NOT accept the late old response
  await expect(page.getByText('Recalculate required')).toBeVisible();
  await expect(page.locator('[data-stale-notice]')).toBeVisible();
  await expect(page.locator('[data-results-table]')).not.toBeVisible();
  await expect(page.locator('[data-copy-book-btn]')).toBeDisabled();
  await expect(page.locator('[data-print-book-btn]')).toBeDisabled();

  // Reset delay and recalculate with new input (Start RL=120.000 -> misclosure exceeds limit)
  await page.evaluate(() => {
    (window as unknown as { __calculationDelay: number }).__calculationDelay = 0;
  });
  await page.locator('[data-calculate-btn]').click();

  await expect(page.locator('[data-results-badge]')).toHaveText(/Outside limit/);
  const firstRowRL = page.locator('[data-results-table] tbody tr').first().locator('td').nth(4);
  await expect(firstRowRL).toHaveText('120.000');
});

test('Clipboard copy handling: success and failure toast paths', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://127.0.0.1:4322/_dev/survey-workbench');

  await expect(page.locator('[data-results-badge]')).toHaveText(/Criterion not provided/);
  await page.locator('[data-try-sample]').click();
  await expect(page.locator('[data-results-badge]')).toHaveText(/Within limit/);
  const copyBtn = page.locator('[data-copy-book-btn]');

  // Test 1: Successful clipboard write
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: async () => {},
      },
      configurable: true,
    });
  });

  await copyBtn.click();
  await expect(page.getByText('Level book copied to clipboard')).toBeVisible();

  // Test 2: Clipboard write rejection (e.g. permission denied)
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: async () => {
          throw new Error('NotAllowedError: Permission denied');
        },
      },
      configurable: true,
    });
  });

  await copyBtn.click();
  await expect(
    page.getByText(
      'Could not copy to clipboard. Please copy manually or check browser permissions.',
    ),
  ).toBeVisible();
});

test('Tolerance criterion, missing distance, and illustrative profile when unvalidated', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://127.0.0.1:4322/_dev/survey-workbench');

  // Initial load without C -> Criterion not provided
  await expect(page.locator('[data-results-badge]')).toHaveText(/Criterion not provided/);
  await expect(page.locator('[data-tile-allowable]')).toHaveText('—');

  // Clear all distances to test illustrative spacing when distances are absent
  await page.evaluate(() => {
    const inputs = document.querySelectorAll<HTMLInputElement>('[data-cell^="dist-"]');
    inputs.forEach((input) => {
      input.value = '';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
  });

  await page.locator('[data-calculate-btn]').click();
  await expect(page.locator('[data-results-badge]')).toHaveText(/Criterion not provided/);

  // Line length chip must display '—'
  const lineLengthChip = page.locator('[data-line-length-value]');
  await expect(lineLengthChip).toHaveText('—');

  // Profile nodes must be evenly spaced (115.6px ± 0.5px)
  const profileSvg = page.locator('svg[aria-label="Level profile chart"]');
  await expect(profileSvg).toBeVisible();

  const circles = profileSvg.locator('circle');
  await expect(circles).toHaveCount(6);
  const cxValues: number[] = [];
  for (let i = 0; i < 6; i++) {
    const cx = Number(await circles.nth(i).getAttribute('cx'));
    cxValues.push(cx);
  }
  for (let i = 1; i < cxValues.length; i++) {
    const spacing = cxValues[i] - cxValues[i - 1];
    expect(Math.abs(spacing - 115.6)).toBeLessThan(0.5);
  }

  // Supply C=24 and request distance adjustment with missing distances -> missing distance error
  const constInput = page.locator('#survey-allowable-const');
  await constInput.fill('24');
  const adjustSelect = page.locator('#survey-adjust-by');
  await adjustSelect.selectOption('distance');
  await page.locator('[data-calculate-btn]').click();

  const dist1 = page.locator('#survey-obs-1-dist');
  await expect(dist1).toBeFocused();
  await expect(dist1).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('[data-survey-error]')).toHaveText(
    /Distance from previous station is required for distance-based adjustment\./,
  );
});

test('Sub-metre (0.4 m) and non-integer (160.4 m) profile geometry, line-length text, and fallback', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://127.0.0.1:4322/_dev/survey-workbench');

  // Wait for initial render before clicking sample
  await expect(page.locator('[data-results-badge]')).toHaveText(/Criterion not provided/);

  // Load sample (standard 6 stations, 160 m total)
  await page.locator('[data-try-sample]').click();
  await expect(page.locator('[data-results-badge]')).toHaveText(/Within limit/);
  await expect(page.locator('[data-line-length-value]')).toHaveText('160 m (0.160 km)');

  const profileSvg = page.locator('svg[aria-label="Level profile chart"]');
  await expect(profileSvg).toBeVisible();

  // 1. Test non-integer length (160.4 m)
  // Edit row 5 distance from 40 to 40.4 -> total distance is 160.4 m
  const dist5 = page.locator('#survey-obs-5-dist');
  await dist5.fill('40.4');
  await page.locator('[data-calculate-btn]').click();

  // Line length chip must display explicit precision for non-integer distance consistent with km
  await expect(page.locator('[data-line-length-value]')).toHaveText('160.4 m (0.1604 km)');
  await expect(page.locator('[data-summary-tiles]')).toContainText('160.4 m (0.1604 km)');
  await expect(page.locator('[data-line-length-value]')).not.toHaveText('0 m');
  await expect(page.locator('[data-profile-card]')).toContainText('Proportional distance profile');

  // Terminal node position must not exceed the expected axis (W - padding.r = 640 - 16 = 624)
  const circles1604 = profileSvg.locator('circle');
  await expect(circles1604).toHaveCount(6);
  const lastCx1604 = Number(await circles1604.last().getAttribute('cx'));
  expect(lastCx1604).toBe(624);
  expect(lastCx1604).toBeLessThanOrEqual(624);

  // 2. Test sub-metre length (0.4 m)
  // Set distances so total is 0.4 m (0.1 + 0.1 + 0.1 + 0.05 + 0.05 = 0.4)
  await page.locator('#survey-obs-1-dist').fill('0.1');
  await page.locator('#survey-obs-2-dist').fill('0.1');
  await page.locator('#survey-obs-3-dist').fill('0.1');
  await page.locator('#survey-obs-4-dist').fill('0.05');
  await page.locator('#survey-obs-5-dist').fill('0.05');
  await page.locator('[data-calculate-btn]').click();

  // Line length chip must retain valid sub-metre distance without misleading 0.000 km or collapsing to 0 m
  await expect(page.locator('[data-line-length-value]')).toHaveText('0.4 m');
  await expect(page.locator('[data-summary-tiles]')).toContainText('0.4 m');
  await expect(page.locator('[data-line-length-value]')).not.toContainText('0.000 km');
  await expect(page.locator('[data-line-length-value]')).not.toHaveText('0 m');
  // Profile must remain proportional, not illustrative
  await expect(page.locator('[data-profile-card]')).toContainText('Proportional distance profile');

  // Terminal node position must be exactly at 624px
  const circles04 = profileSvg.locator('circle');
  await expect(circles04).toHaveCount(6);
  const lastCx04 = Number(await circles04.last().getAttribute('cx'));
  expect(lastCx04).toBe(624);
  expect(lastCx04).toBeLessThanOrEqual(624);

  // 3. Test micro sub-metre length (0.0004 m)
  // Set distances so total is 0.0004 m (0.0001 + 0.0001 + 0.0001 + 0.00005 + 0.00005 = 0.0004)
  await page.locator('#survey-obs-1-dist').fill('0.0001');
  await page.locator('#survey-obs-2-dist').fill('0.0001');
  await page.locator('#survey-obs-3-dist').fill('0.0001');
  await page.locator('#survey-obs-4-dist').fill('0.00005');
  await page.locator('#survey-obs-5-dist').fill('0.00005');
  await page.locator('[data-calculate-btn]').click();

  // Micro distance must NOT collapse to 0 m and must omit kilometre text rather than showing 0.000 km
  await expect(page.locator('[data-line-length-value]')).toHaveText('0.0004 m');
  await expect(page.locator('[data-summary-tiles]')).toContainText('0.0004 m');
  await expect(page.locator('[data-line-length-value]')).not.toContainText('0.000 km');
  await expect(page.locator('[data-line-length-value]')).not.toHaveText('0 m');
  await expect(page.locator('[data-profile-card]')).toContainText('Proportional distance profile');

  const circles0004 = profileSvg.locator('circle');
  await expect(circles0004).toHaveCount(6);
  const lastCx0004 = Number(await circles0004.last().getAttribute('cx'));
  expect(lastCx0004).toBe(624);
  expect(lastCx0004).toBeLessThanOrEqual(624);

  // 4. Test fallback when a distance is missing
  // Clear distance on row 2
  await page.locator('#survey-obs-2-dist').fill('');
  // Select unadjusted ('none') so calculation succeeds without throwing missing-distance validation error
  await page.locator('#survey-adjust-by').selectOption('none');
  await page.locator('[data-calculate-btn]').click();

  // Line length chip must display fallback '—'
  await expect(page.locator('[data-line-length-value]')).toHaveText('—');
  // Profile card header badge must show fallback 'Illustrative, not to scale'
  await expect(page.locator('[data-profile-card]')).toContainText('Illustrative, not to scale');
  // Summary tile subtext must display 'No measured length'
  await expect(page.locator('[data-summary-tiles]')).toContainText('No measured length');

  // Profile nodes must fall back to uniform illustrative spacing (115.6px ± 0.5px)
  const circlesFallback = profileSvg.locator('circle');
  await expect(circlesFallback).toHaveCount(6);
  const cxFallback: number[] = [];
  for (let i = 0; i < 6; i++) {
    cxFallback.push(Number(await circlesFallback.nth(i).getAttribute('cx')));
  }
  for (let i = 1; i < cxFallback.length; i++) {
    const spacing = cxFallback[i] - cxFallback[i - 1];
    expect(Math.abs(spacing - 115.6)).toBeLessThan(0.5);
  }
});
