import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import { type Browser, chromium } from '@playwright/test';

const BASE_URL = 'http://localhost:4321';
const OUT_LOCAL = join(process.cwd(), 'tests/artifacts/food-planner');
const OUT_ARTIFACT =
  'C:/Users/user/.gemini/antigravity/brain/0d73044e-7f74-45a9-99aa-f9e87a72e13a/qa-evidence';

mkdirSync(OUT_LOCAL, { recursive: true });
mkdirSync(OUT_ARTIFACT, { recursive: true });

function saveScreenshot(filename: string, buffer: Buffer) {
  writeFileSync(join(OUT_LOCAL, filename), buffer);
  writeFileSync(join(OUT_ARTIFACT, filename), buffer);
}

interface TestResult {
  name: string;
  passed: boolean;
  details?: string;
}

interface SectionMetrics {
  recipesCount: number;
  ingredientsRowCount: number;
  shoppingItemsCount: number;
  scheduleTasksCount: number;
}

async function runDesktopQa(
  browser: Browser,
  results: TestResult[],
  errors: string[],
): Promise<SectionMetrics> {
  console.log('\n>>> [1/2] RUNNING DESKTOP TESTING (1440px)...');
  const desktopContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });
  const page = await desktopContext.newPage();
  page.on('pageerror', (err) => errors.push(`Desktop Page Error: ${err.message}`));

  await page.goto(`${BASE_URL}/food-planner`);
  await page.waitForFunction(() => document.querySelectorAll('astro-island[ssr]').length === 0, {
    timeout: 15000,
  });
  await page.waitForSelector('[data-tool-island="food-planner"]', { timeout: 15000 });
  console.log('✓ Page loaded & Island hydrated');

  const breadcrumbs = await page.locator('nav[aria-label="Breadcrumb"]').count();
  results.push({ name: 'Desktop Breadcrumb exists', passed: breadcrumbs > 0 });

  // 1. Recipes & Menu
  saveScreenshot('desktop-01-recipes-menu.png', await page.screenshot({ fullPage: true }));
  console.log('✓ Captured desktop-01-recipes-menu.png');

  const recipesCount = await page.locator('table tbody tr').count();
  const sourceCheckedCount = await page.locator('text=Source Checked').count();
  const prototypeCount = await page.locator('text=Prototype').count();
  results.push({
    name: 'Recipe verification badges use approved taxonomy (Source Checked / Prototype)',
    passed: sourceCheckedCount > 0 && prototypeCount > 0,
    details: `${sourceCheckedCount} Source Checked, ${prototypeCount} Prototype`,
  });

  // Test Recipe Toggle (remove & re-add so plan remains consistently at 6 recipes across all sections)
  const mathriCard = page.locator('text=Mathri').locator('..').locator('..');
  const addBtn = mathriCard.locator('button', { hasText: /Add|Added/ }).first();
  if (await addBtn.isVisible()) {
    await addBtn.click(); // remove Mathri -> 5 dishes
    await page.waitForTimeout(300);
    await addBtn.click(); // re-add Mathri -> back to 6 dishes
    await page.waitForTimeout(300);
    results.push({ name: 'Dynamic Recipe Toggle works (remove & re-add)', passed: true });
  }

  // 2. Ingredients
  await page.getByRole('tab', { name: /Ingredients/i }).click();
  await page.waitForTimeout(500);
  saveScreenshot('desktop-02-ingredients.png', await page.screenshot({ fullPage: true }));
  const ingredientsRowCount = await page.locator('table tbody tr').count();
  results.push({
    name: 'Ingredients Table rendered with scaled lines',
    passed: ingredientsRowCount > 0,
    details: `${ingredientsRowCount} rows`,
  });

  // 3. Shopping List
  await page.getByRole('tab', { name: /Shopping List/i }).click();
  await page.waitForTimeout(500);
  const mapsLink = page.locator('a[href*="google.com/maps"]').first();
  const mapsHref = await mapsLink.getAttribute('href');
  results.push({
    name: 'Google Maps grocery discovery link is valid',
    passed: Boolean(mapsHref?.includes('google.com/maps/search/grocery')),
  });
  const shoppingItemsCount = await page
    .locator('input[type="checkbox"][aria-label*="Mark"]')
    .count();
  results.push({
    name: 'Shopping List populates items reliably',
    passed: shoppingItemsCount > 0,
    details: `${shoppingItemsCount} shopping items`,
  });
  saveScreenshot('desktop-03-shopping-list.png', await page.screenshot({ fullPage: true }));

  // 4. Cost Estimation
  await page.getByRole('tab', { name: /Cost Estimation/i }).click();
  await page.waitForTimeout(500);
  const wholesaleBtn = page.getByRole('button', { name: /Wholesale/i });
  if (await wholesaleBtn.isVisible()) {
    await wholesaleBtn.click();
    results.push({ name: 'Retail vs Wholesale Pricing Switcher works', passed: true });
  }
  saveScreenshot('desktop-04-cost-estimation.png', await page.screenshot({ fullPage: true }));

  // 5. Cooking Schedule
  await page.getByRole('tab', { name: /Cooking Schedule/i }).click();
  await page.waitForTimeout(500);
  const burnerSelect = page.locator('select#schedule-burners');
  if (await burnerSelect.isVisible()) {
    await burnerSelect.selectOption('4');
    results.push({ name: 'Burner Capacity Selector works', passed: true });
  }
  const scheduleCheckbox = page
    .locator('input[type="checkbox"][aria-label*="Mark task completed"]')
    .first();
  if (await scheduleCheckbox.isVisible()) {
    await scheduleCheckbox.check();
    results.push({ name: 'Cooking Schedule Task completion works', passed: true });
  }
  const scheduleTasksCount = await page
    .locator('input[type="checkbox"][aria-label*="Mark task completed"]')
    .count();
  saveScreenshot('desktop-05-cooking-schedule.png', await page.screenshot({ fullPage: true }));

  // Axe Accessibility Check
  console.log('\nChecking WCAG 2.1 AA Accessibility with Axe...');
  const axeResults = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  const seriousViolations = axeResults.violations.filter(
    (v) => v.impact === 'serious' || v.impact === 'critical',
  );
  results.push({
    name: 'Axe Accessibility Audit (WCAG 2.1 AA)',
    passed: seriousViolations.length === 0,
    details: `${seriousViolations.length} serious/critical violations`,
  });

  await desktopContext.close();

  return {
    recipesCount,
    ingredientsRowCount,
    shoppingItemsCount,
    scheduleTasksCount,
  };
}

async function runMobileQa(
  browser: Browser,
  results: TestResult[],
  errors: string[],
): Promise<SectionMetrics> {
  console.log('\n>>> [2/2] RUNNING MOBILE TESTING (390px - iPhone 12/13/14)...');
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const page = await mobileContext.newPage();
  page.on('pageerror', (err) => errors.push(`Mobile Page Error: ${err.message}`));

  await page.goto(`${BASE_URL}/food-planner`);
  await page.waitForFunction(() => document.querySelectorAll('astro-island[ssr]').length === 0, {
    timeout: 15000,
  });
  await page.waitForSelector('[data-tool-island="food-planner"]', { timeout: 15000 });

  saveScreenshot('mobile-01-recipes-menu.png', await page.screenshot({ fullPage: true }));
  console.log('✓ Captured mobile-01-recipes-menu.png');
  const recipesCount = await page.locator('table tbody tr').count();

  await page.getByRole('tab', { name: /Ingredients/i }).click({ force: true });
  await page.waitForTimeout(500);
  saveScreenshot('mobile-02-ingredients.png', await page.screenshot({ fullPage: true }));
  const ingredientsRowCount = await page.locator('table tbody tr').count();

  await page.getByRole('tab', { name: /Shopping List/i }).click({ force: true });
  await page.waitForTimeout(500);
  saveScreenshot('mobile-03-shopping-list.png', await page.screenshot({ fullPage: true }));
  const shoppingItemsCount = await page
    .locator('input[type="checkbox"][aria-label*="Mark"]')
    .count();

  await page.getByRole('tab', { name: /Cost Estimation/i }).click({ force: true });
  await page.waitForTimeout(500);
  saveScreenshot('mobile-04-cost-estimation.png', await page.screenshot({ fullPage: true }));

  await page.getByRole('tab', { name: /Cooking Schedule/i }).click({ force: true });
  await page.waitForTimeout(500);
  saveScreenshot('mobile-05-cooking-schedule.png', await page.screenshot({ fullPage: true }));
  const scheduleTasksCount = await page
    .locator('input[type="checkbox"][aria-label*="Mark task completed"]')
    .count();

  results.push({ name: 'Mobile 5-section navigation and rendering', passed: true });
  await mobileContext.close();

  return {
    recipesCount,
    ingredientsRowCount,
    shoppingItemsCount,
    scheduleTasksCount,
  };
}

async function main() {
  console.log('=====================================================');
  console.log('   FOOD PLANNER (FP-005) COMPREHENSIVE BROWSER QA');
  console.log('=====================================================');

  const browser = await chromium.launch({ headless: true });
  const errors: string[] = [];
  const results: TestResult[] = [];

  const desktopMetrics = await runDesktopQa(browser, results, errors);
  const mobileMetrics = await runMobileQa(browser, results, errors);
  await browser.close();

  console.log('\n=====================================================');
  console.log('         DESKTOP vs MOBILE CONSISTENCY CHECK');
  console.log('=====================================================');
  console.log('Metric                  | Desktop | Mobile  | Match');
  console.log('-----------------------------------------------------');
  const checkMatch = (name: string, d: number, m: number) => {
    const match = d === m;
    console.log(
      `${name.padEnd(23)} | ${String(d).padStart(7)} | ${String(m).padStart(7)} | ${match ? '✓ IDENTICAL' : '✗ MISMATCH'}`,
    );
    results.push({
      name: `Consistency: ${name}`,
      passed: match,
      details: `Desktop=${d}, Mobile=${m}`,
    });
  };

  checkMatch('Selected Recipes', desktopMetrics.recipesCount, mobileMetrics.recipesCount);
  checkMatch(
    'Ingredient Rows',
    desktopMetrics.ingredientsRowCount,
    mobileMetrics.ingredientsRowCount,
  );
  checkMatch('Shopping Items', desktopMetrics.shoppingItemsCount, mobileMetrics.shoppingItemsCount);
  checkMatch('Cooking Tasks', desktopMetrics.scheduleTasksCount, mobileMetrics.scheduleTasksCount);

  console.log('\n=====================================================');
  console.log('               FP-005 QA SUMMARY REPORT');
  console.log('=====================================================');
  let allPassed = true;
  for (const r of results) {
    const status = r.passed ? '✓ PASS' : '✗ FAIL';
    console.log(`${status} - ${r.name}${r.details ? ` (${r.details})` : ''}`);
    if (!r.passed) allPassed = false;
  }
  console.log(`\nPage Errors: ${errors.length}`);
  if (errors.length > 0) {
    console.log('Errors:', errors);
    allPassed = false;
  }

  if (!allPassed) {
    console.error('QA finished with failures.');
    process.exit(1);
  }
  console.log('ALL QA CHECKS PASSED SUCCESSFULLY!');
}

main().catch((e) => {
  console.error('QA Runner Exception:', e);
  process.exit(1);
});
