import { join } from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';
import { ROOT } from '../../scripts/lib/paths.ts';
import { bundleTestEntry, publicLibraryEntry } from '../support/library-bundle.ts';

const ui = join(ROOT, 'packages/ui');
const entry = (name: string, directory = ui) => JSON.stringify(publicLibraryEntry(name, directory));
const ARTIFACTS_DIR =
  'C:/Users/user/.gemini/antigravity/brain/ad6e6067-5d37-4438-af77-b06a7b8c5081';

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
  await page.route('**/survey-leveling-calculator*', async (route) => {
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

const PUBLIC_TOOL_URL = 'http://127.0.0.1:4321/survey-leveling-calculator';

async function loadPublicTool(page: Page, width = 1440, height = 900) {
  await page.setViewportSize({ width, height });
  await page.goto(PUBLIC_TOOL_URL);
  await expect(page.locator('[data-tool-island="survey-leveling-calculator"]')).toBeVisible();
  await expect(page.locator('[data-survey-workbench]')).toBeVisible();
  await expect(page.locator('[data-results-badge]')).toHaveText(/Criterion not provided/);
}

const SAMPLE_PASTE_DATA = `Station\tBS\tIS\tFS\tDist (m)\tRemarks
BM-A\t1.420\t\t\t0\tStart Bench
S1\t\t1.150\t\t25\tInter 1
CP1\t0.950\t\t1.850\t35\tChange 1
BM-B\t\t\t2.100\t40\tFinal Bench`;

test.describe('Public Tool — Survey Leveling Calculator', () => {
  test('1. renders public tool with site header, breadcrumbs, category and preview controls', async ({
    page,
  }) => {
    await loadPublicTool(page);

    // Site header and breadcrumbs
    await expect(page.locator('header.site-head, header[class*="header"]')).toBeVisible();
    const breadcrumbs = page.locator('nav[aria-label="Breadcrumb"], nav.crumbs');
    await expect(breadcrumbs).toBeVisible();
    await expect(breadcrumbs).toContainText('Surveying');
    await expect(breadcrumbs).toContainText('Survey Leveling Calculator');

    // Tool title and summary
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Survey Leveling Calculator');

    // Preview-only controls: reading unit selector
    const unitSelect = page.locator('#survey-reading-unit');
    await expect(unitSelect).toBeDisabled();
    await expect(unitSelect).toHaveAttribute(
      'title',
      'Reading unit: Metres (standard surveying unit; mm input is preview-only in this release)',
    );
    await expect(unitSelect.locator('option[value="mm"]')).toHaveText('mm (preview only)');

    // Site footer
    await expect(page.locator('footer.site-foot, footer[class*="footer"]')).toBeVisible();
  });

  test('2. verifies Rise & Fall and Height of Instrument reductions and arithmetic checks', async ({
    page,
  }) => {
    await loadPublicTool(page);

    // Calculate initial sample / default book
    await page.locator('[data-calculate-btn]').click();

    // Rise & Fall method (default)
    const rfTab = page.locator('[data-method-tab="rise-fall"]');
    await expect(rfTab).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('[data-results-table] th:has-text("Rise")')).toBeVisible();
    await expect(page.locator('[data-results-table] th:has-text("Fall")')).toBeVisible();
    await expect(page.locator('[data-arithmetic-checks] li')).toHaveCount(3);
    // Method accordion describes Rise & Fall
    const methodAcc = page.locator('[data-bottom-faq]').getByRole('button', { name: /Method/ });
    await methodAcc.click();
    await expect(page.locator('[data-method-accordion-desc]')).toContainText(
      'Rise & Fall reduction method',
    );

    // Switch to Height of Instrument
    const hiTab = page.locator('[data-method-tab="height-of-instrument"]');
    await hiTab.click();
    await expect(hiTab).toHaveAttribute('aria-selected', 'true');

    // Recalculate in HI mode
    await page.locator('[data-calculate-btn]').click();
    await expect(page.locator('[data-results-table] th:has-text("HI (m)")')).toBeVisible();
    await expect(page.locator('[data-arithmetic-checks] li')).toHaveCount(2);
    await expect(page.locator('[data-method-accordion-desc]')).toContainText(
      'Height of Instrument',
    );
  });

  test('3. verifies Excel paste modal, replace flow, copy level book and print actions', async ({
    page,
  }) => {
    await loadPublicTool(page);

    // Open Paste from Excel dialog
    await page.locator('[data-paste-excel]').click();
    const dialog = page.locator('[data-paste-modal]');
    await expect(dialog).toBeVisible();

    // Paste spreadsheet rows
    await page.locator('[data-paste-textarea]').fill(SAMPLE_PASTE_DATA);
    await expect(page.locator('[data-paste-success-banner]')).toBeVisible();
    await expect(page.locator('[data-paste-preview-table] tbody tr')).toHaveCount(4);

    // Replace level book
    await page.locator('[data-paste-replace-btn]').click();
    await expect(dialog).toBeHidden();
    await expect(page.getByText(/Level book replaced with 4 pasted rows/)).toBeVisible();

    // Calculate levels
    await page.locator('[data-calculate-btn]').click();
    await expect(page.locator('[data-results-table] tbody tr')).toHaveCount(4);

    // Copy level book action with mocked clipboard
    await page.evaluate(() => {
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: async () => {},
        },
        configurable: true,
      });
    });
    const copyBtn = page.locator('[data-copy-book-btn]');
    await expect(copyBtn).toBeEnabled();
    await copyBtn.click();
    await expect(page.getByText('Level book copied to clipboard')).toBeVisible();

    // Print button
    const printBtn = page.locator('[data-print-book-btn]');
    await expect(printBtn).toBeEnabled();
  });

  test('4. mobile viewport (360x800) and axe core accessibility audit', async ({ page }) => {
    await loadPublicTool(page, 360, 800);

    // Check no horizontal document scroll
    const isOverflown = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1,
    );
    expect(isOverflown).toBe(false);

    // Axe audit
    const axeResults = await new AxeBuilder({ page }).disableRules(['color-contrast']).analyze();
    expect(axeResults.violations).toEqual([]);
  });

  test('5. captures desktop, dark, landscape, and mobile screenshots', async ({ page }) => {
    const settleAndCapture = async (name: string) => {
      await page.evaluate(() => {
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
        window.scrollTo(0, 0);
      });
      await page.waitForTimeout(350);
      const headerBox = await page.locator('.site-header').boundingBox();
      if (headerBox) {
        expect(headerBox.y).toBe(0);
      }
      await page.screenshot({
        path: `tests/artifacts/screenshots/${name}.png`,
        fullPage: true,
      });
      await page.screenshot({
        path: `${ARTIFACTS_DIR}/${name}.png`,
        fullPage: true,
      });
    };

    // Desktop light (1440x900)
    await loadPublicTool(page, 1440, 900);
    await settleAndCapture('survey-leveling-public-desktop-1440');

    // Desktop dark (1440x900)
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
    await settleAndCapture('survey-leveling-public-desktop-dark-1440');

    // Landscape tablet (740x900)
    await page.evaluate(() => document.documentElement.removeAttribute('data-theme'));
    await page.setViewportSize({ width: 740, height: 900 });
    await settleAndCapture('survey-leveling-public-landscape-740');

    // Mobile (360x800)
    await page.setViewportSize({ width: 360, height: 800 });
    await settleAndCapture('survey-leveling-public-mobile-360');
  });
});
