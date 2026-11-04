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

test('In-flight calculation abort and invalidation on edit (deterministic delayed-run)', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://127.0.0.1:4322/_dev/survey-workbench');

  await expect(page.getByText('✓ Calculated')).toBeVisible();

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

  // Reset delay and recalculate with new input
  await page.evaluate(() => {
    (window as unknown as { __calculationDelay: number }).__calculationDelay = 0;
  });
  await page.locator('[data-calculate-btn]').click();

  await expect(page.getByText('✓ Calculated')).toBeVisible();
  const firstRowRL = page.locator('[data-results-table] tbody tr').first().locator('td').nth(3);
  await expect(firstRowRL).toHaveText('120.000');
});

test('Clipboard copy handling: success and failure toast paths', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://127.0.0.1:4322/_dev/survey-workbench');

  await expect(page.getByText('✓ Calculated')).toBeVisible();
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

test('Unvalidated distance inputs do not fabricate line length or alter illustrative profile', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://127.0.0.1:4322/_dev/survey-workbench');

  await expect(page.getByText('✓ Calculated')).toBeVisible();

  // 1. Verify Line length chip displays '—' in PR 1 (distance contract unvalidated)
  const lineLengthChip = page.locator('[data-line-length-value]');
  await expect(lineLengthChip).toHaveText('—');

  // 2. Verify profile SVG nodes have evenly spaced illustrative horizontal distribution
  const profileSvg = page.locator('svg[aria-label="Level profile chart"]');
  await expect(profileSvg).toBeVisible();

  // Check that no numeric distance labels (e.g. "30m", "160m") appear in the SVG
  const svgTextContents = await profileSvg.locator('text').allTextContents();
  for (const text of svgTextContents) {
    expect(text).not.toMatch(/^\d+m$/);
  }

  // 3. Inject changed or invalid distance data (arbitrary numbers, text, negative values)
  await page.evaluate(() => {
    const inputs = document.querySelectorAll<HTMLInputElement>('[data-cell^="dist-"]');
    inputs.forEach((input, i) => {
      input.disabled = false;
      input.value = i === 1 ? 'invalid-dist-string' : '99999';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
  });

  // 4. Recalculate levels
  await page.locator('[data-calculate-btn]').click();
  await expect(page.getByText('✓ Calculated')).toBeVisible();

  // 5. Line length must remain '—' and never fabricate measured length from unvalidated strings
  await expect(lineLengthChip).toHaveText('—');

  // 6. Profile nodes must remain evenly spaced illustrative stations (width - p.l - p.r) / 5 = 115.6px
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
});
