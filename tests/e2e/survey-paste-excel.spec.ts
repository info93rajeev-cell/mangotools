import { join } from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';
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

const DEV_SURVEY_URL = 'http://127.0.0.1:4322/_dev/survey-workbench';

async function loadWorkbench(page: Page, width = 1440, height = 900) {
  await page.setViewportSize({ width, height });
  await page.goto(DEV_SURVEY_URL);
  await expect(page.locator('[data-survey-workbench]')).toBeVisible();
  await expect(page.locator('[data-results-badge]')).toHaveText(/Criterion not provided/);
}

const SAMPLE_EXCEL_TSV = `Station\tBS\tIS\tFS\tDist (m)\tRemarks
BM-A\t1.420\t\t\t0\tStart Bench
S1\t\t1.150\t\t25\tInter 1
CP1\t0.950\t\t1.850\t35\tChange 1
S2\t\t1.300\t\t20\tInter 2
CP2\t1.600\t\t0.750\t30\tChange 2
BM-B\t\t\t2.100\t45\tFinal Bench`;

test.describe('Survey Leveling — Paste from Excel Modal', () => {
  test('opens paste modal, shows empty state, and cancel preserves existing rows', async ({
    page,
  }) => {
    await loadWorkbench(page);

    const initialRows = page.locator('[data-level-book-table] tbody tr');
    await expect(initialRows).toHaveCount(6);
    await expect(initialRows.nth(0).locator('input').nth(0)).toHaveValue('BM-1');

    const pasteBtn = page.locator('[data-paste-excel]');
    await expect(pasteBtn).toBeVisible();
    await pasteBtn.click();

    const modal = page.locator('[data-paste-modal]');
    await expect(modal).toBeVisible();
    await expect(page.locator('#paste-modal-title')).toContainText('Paste Level Book from Excel');
    await expect(page.locator('[data-paste-empty-notice]')).toBeVisible();
    await expect(page.locator('[data-paste-replace-btn]')).toBeDisabled();

    await page.locator('[data-paste-textarea]').fill('Some random text');
    await page.locator('[data-paste-cancel-btn]').click();

    await expect(modal).not.toBeVisible();
    await expect(pasteBtn).toBeFocused();
    await expect(initialRows).toHaveCount(6);
    await expect(initialRows.nth(0).locator('input').nth(0)).toHaveValue('BM-1');
  });

  test('valid paste with headers and change points updates level book and recalculates', async ({
    page,
  }) => {
    await loadWorkbench(page);

    await page.locator('[data-paste-excel]').click();
    const modal = page.locator('[data-paste-modal]');
    await expect(modal).toBeVisible();

    await page.locator('[data-paste-textarea]').fill(SAMPLE_EXCEL_TSV);
    await expect(page.locator('[data-paste-success-banner]')).toContainText('All 6 rows valid');
    await expect(page.locator('[data-paste-header-pill]')).toContainText('Header row detected');

    const previewRows = page.locator('[data-paste-preview-table] tbody tr');
    await expect(previewRows).toHaveCount(6);
    await expect(previewRows.nth(2).locator('td').nth(1)).toHaveText('CP');
    await expect(previewRows.nth(2).locator('td').nth(2)).toHaveText('CP1');
    await expect(previewRows.nth(2).locator('td').nth(3)).toHaveText('0.950');
    await expect(previewRows.nth(2).locator('td').nth(5)).toHaveText('1.850');

    await page.locator('[data-paste-replace-btn]').click();
    await expect(modal).not.toBeVisible();
    await expect(page.getByText('Level book replaced with 6 pasted rows.')).toBeVisible();
    await expect(page.locator('[data-results-badge]')).toHaveText('Recalculate required');

    const mainRows = page.locator('[data-level-book-table] tbody tr');
    await expect(mainRows).toHaveCount(6);
    await expect(mainRows.nth(0).locator('input').nth(0)).toHaveValue('BM-A');
    await expect(mainRows.nth(2).locator('input').nth(0)).toHaveValue('CP1');
    await expect(mainRows.nth(5).locator('input').nth(0)).toHaveValue('BM-B');

    await page.locator('[data-calculate-btn]').click();
    await expect(page.locator('[data-results-table]')).toBeVisible();

    await page.locator('[data-method-tab="height-of-instrument"]').click();
    await page.locator('[data-calculate-btn]').click();
    await expect(page.locator('[data-results-table] thead th').nth(2)).toHaveText('HI (m)');
  });

  test('valid paste without headers positionally maps columns and calculates in both methods', async ({
    page,
  }) => {
    await loadWorkbench(page);

    await page.locator('[data-paste-excel]').click();
    await expect(page.locator('[data-paste-modal]')).toBeVisible();
    const noHeaderTSV = `STA-1\t1.800\t\t\t0\tStart\nSTA-2\t\t1.400\t\t15\tMid\nSTA-3\t\t\t2.000\t20\tEnd`;
    await page.locator('[data-paste-textarea]').fill(noHeaderTSV);

    await expect(page.locator('[data-paste-header-pill]')).toContainText('No header detected');
    await expect(page.locator('[data-paste-success-banner]')).toContainText('All 3 rows valid');

    await page.locator('[data-paste-replace-btn]').click();
    const mainRows = page.locator('[data-level-book-table] tbody tr');
    await expect(mainRows).toHaveCount(3);
    await expect(mainRows.nth(0).locator('input').nth(0)).toHaveValue('STA-1');

    await page.locator('[data-calculate-btn]').click();
    await expect(page.locator('[data-results-table]')).toBeVisible();

    await page.locator('[data-method-tab="height-of-instrument"]').click();
    await page.locator('#survey-adjust-by').selectOption('setup');
    await page.locator('[data-calculate-btn]').click();
    await expect(page.locator('[data-results-table] thead th').nth(2)).toHaveText('HI (m)');
  });

  test('invalid paste and sequence errors block replace button and never replace existing rows', async ({
    page,
  }) => {
    await loadWorkbench(page);

    const initialRows = page.locator('[data-level-book-table] tbody tr');
    await expect(initialRows).toHaveCount(6);

    const pasteBtn = page.locator('[data-paste-excel]');
    await pasteBtn.click();
    await expect(page.locator('[data-paste-modal]')).toBeVisible();

    // 1. First row has CP (both BS and FS)
    const firstRowCP = `CP-Start\t1.500\t\t1.200\t0\tStart CP\nSTA-2\t\t1.100\t\t20\tMid\nBM-2\t\t\t2.200\t30\tEnd`;
    await page.locator('[data-paste-textarea]').fill(firstRowCP);
    await expect(page.locator('[data-paste-error-banner]')).toContainText(
      'Found errors in 1 row(s)',
    );
    await expect(page.locator('[data-paste-replace-btn]')).toBeDisabled();

    // 2. Final row has CP (both FS and BS)
    const lastRowCP = `BM-1\t1.500\t\t\t0\tStart\nSTA-2\t\t1.100\t\t20\tMid\nCP-End\t0.800\t\t2.200\t30\tEnd CP`;
    await page.locator('[data-paste-textarea]').fill(lastRowCP);
    await expect(page.locator('[data-paste-error-banner]')).toContainText(
      'Found errors in 1 row(s)',
    );
    await expect(page.locator('[data-paste-replace-btn]')).toBeDisabled();

    // 3. Malformed readings
    const malformed = `Station\tBS\tIS\tFS\nBM-1\t1.500\t1.200\t\nBM-2\t\t\t-2.000`;
    await page.locator('[data-paste-textarea]').fill(malformed);
    await expect(page.locator('[data-paste-error-banner]')).toContainText(
      'Found errors in 2 row(s)',
    );
    await expect(page.locator('[data-paste-replace-btn]')).toBeDisabled();

    // Cancel modal and verify existing rows are completely unchanged
    await page.locator('[data-paste-cancel-btn]').click();
    await expect(page.locator('[data-paste-modal]')).not.toBeVisible();
    await expect(pasteBtn).toBeFocused();
    await expect(initialRows).toHaveCount(6);
    await expect(initialRows.nth(0).locator('input').nth(0)).toHaveValue('BM-1');
  });

  test('keyboard access: traps focus with forward and reverse Tab, and restores focus on close, cancel, and Escape', async ({
    page,
  }) => {
    await loadWorkbench(page);

    const pasteBtn = page.locator('[data-paste-excel]');
    await pasteBtn.click();
    const modal = page.locator('[data-paste-modal]');
    await expect(modal).toBeVisible();

    // 1. Textarea receives initial focus
    await expect(page.locator('[data-paste-textarea]')).toBeFocused();

    // 2. Reverse Tab from first focusable element wraps to last focusable element
    await page.locator('[data-paste-close-btn]').focus();
    await page.keyboard.press('Shift+Tab');
    await expect(page.locator('[data-paste-cancel-btn]')).toBeFocused();

    // 3. Forward Tab from last focusable element wraps to first focusable element
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-paste-close-btn]')).toBeFocused();

    // 4. Escape restores focus to opener button
    await page.keyboard.press('Escape');
    await expect(modal).not.toBeVisible();
    await expect(pasteBtn).toBeFocused();

    // 5. Close button restores focus to opener button
    await pasteBtn.click();
    await expect(modal).toBeVisible();
    await page.locator('[data-paste-close-btn]').click();
    await expect(modal).not.toBeVisible();
    await expect(pasteBtn).toBeFocused();

    // 6. Cancel button restores focus to opener button
    await pasteBtn.click();
    await expect(modal).toBeVisible();
    await page.locator('[data-paste-cancel-btn]').click();
    await expect(modal).not.toBeVisible();
    await expect(pasteBtn).toBeFocused();
  });

  test('mobile layout (360x800) traps focus, restores focus, and passes axe audit', async ({
    page,
  }) => {
    await loadWorkbench(page, 360, 800);

    const pasteBtn = page.locator('[data-paste-excel]');
    await pasteBtn.click();
    const modal = page.locator('[data-paste-modal]');
    await expect(modal).toBeVisible();
    await expect(page.locator('[data-paste-textarea]')).toBeFocused();

    // Mobile focus trap wrapping
    await page.locator('[data-paste-close-btn]').focus();
    await page.keyboard.press('Shift+Tab');
    await expect(page.locator('[data-paste-cancel-btn]')).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.locator('[data-paste-close-btn]')).toBeFocused();

    // Mobile focus restoration on Escape
    await page.keyboard.press('Escape');
    await expect(modal).not.toBeVisible();
    await expect(pasteBtn).toBeFocused();

    // Reopen and check layout
    await pasteBtn.click();
    await expect(modal).toBeVisible();

    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(hasHorizontalOverflow).toBe(false);

    await page.locator('[data-paste-textarea]').fill(SAMPLE_EXCEL_TSV);
    await expect(page.locator('[data-paste-success-banner]')).toBeVisible();

    const tableWrap = page.locator('[data-paste-preview-table]').locator('..');
    const scrollWidth = await tableWrap.evaluate((el) => el.scrollWidth);
    const clientWidth = await tableWrap.evaluate((el) => el.clientWidth);
    expect(scrollWidth).toBeGreaterThanOrEqual(clientWidth);

    const axe = await new AxeBuilder({ page }).analyze();
    expect(axe.violations).toEqual([]);

    await page.locator('[data-paste-cancel-btn]').click();
    await expect(modal).not.toBeVisible();
    await expect(pasteBtn).toBeFocused();
  });
});
