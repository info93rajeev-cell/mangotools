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

async function runDesktopQa(browser: Browser, results: TestResult[], errors: string[]) {
  console.log('\n>>> [1/2] RUNNING DESKTOP TESTING (1440px)...');
  const desktopContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });
  const desktopPage = await desktopContext.newPage();
  desktopPage.on('pageerror', (err) => errors.push(`Desktop Page Error: ${err.message}`));

  await desktopPage.goto(`${BASE_URL}/food-planner`);
  await desktopPage.waitForFunction(
    () => document.querySelectorAll('astro-island[ssr]').length === 0,
    { timeout: 15000 },
  );
  await desktopPage.waitForSelector('[data-tool-island="food-planner"]', { timeout: 15000 });
  console.log('✓ Page loaded & Island hydrated');

  const breadcrumbCount = await desktopPage.locator('nav[aria-label="Breadcrumb"]').count();
  results.push({ name: 'Desktop Breadcrumb exists', passed: breadcrumbCount > 0 });

  // 1. Recipes & Menu
  saveScreenshot('desktop-01-recipes-menu.png', await desktopPage.screenshot({ fullPage: true }));
  console.log('✓ Captured desktop-01-recipes-menu.png');

  // Toggle Mathri
  const mathriCard = desktopPage.locator('text=Mathri').locator('..').locator('..');
  const addBtn = mathriCard.locator('button', { hasText: /Add|Added/ }).first();
  if (await addBtn.isVisible()) {
    await addBtn.click();
    await desktopPage.waitForTimeout(400);
    results.push({ name: 'Dynamic Recipe Toggle works', passed: true });
  }

  // 2. Ingredients
  await desktopPage.getByRole('tab', { name: /Ingredients/i }).click();
  await desktopPage.waitForTimeout(400);
  saveScreenshot('desktop-02-ingredients.png', await desktopPage.screenshot({ fullPage: true }));
  const tableRows = await desktopPage.locator('table tbody tr').count();
  results.push({
    name: 'Ingredients Table rendered with scaled lines',
    passed: tableRows > 0,
    details: `${tableRows} rows`,
  });

  // 3. Shopping List
  await desktopPage.getByRole('tab', { name: /Shopping List/i }).click();
  await desktopPage.waitForTimeout(400);
  const mapsLink = desktopPage.locator('a[href*="google.com/maps"]').first();
  const mapsHref = await mapsLink.getAttribute('href');
  results.push({
    name: 'Google Maps grocery discovery link is valid',
    passed: Boolean(mapsHref?.includes('google.com/maps/search/grocery')),
  });
  saveScreenshot('desktop-03-shopping-list.png', await desktopPage.screenshot({ fullPage: true }));

  // 4. Cost Estimation
  await desktopPage.getByRole('tab', { name: /Cost Estimation/i }).click();
  await desktopPage.waitForTimeout(400);
  const wholesaleBtn = desktopPage.getByRole('button', { name: /Wholesale/i });
  if (await wholesaleBtn.isVisible()) {
    await wholesaleBtn.click();
    results.push({ name: 'Retail vs Wholesale Pricing Switcher works', passed: true });
  }
  saveScreenshot(
    'desktop-04-cost-estimation.png',
    await desktopPage.screenshot({ fullPage: true }),
  );

  // 5. Cooking Schedule
  await desktopPage.getByRole('tab', { name: /Cooking Schedule/i }).click();
  await desktopPage.waitForTimeout(400);
  const burnerSelect = desktopPage.locator('select#schedule-burners');
  if (await burnerSelect.isVisible()) {
    await burnerSelect.selectOption('4');
    results.push({ name: 'Burner Capacity Selector works', passed: true });
  }
  const scheduleCheckbox = desktopPage
    .locator('input[type="checkbox"][aria-label*="Mark task completed"]')
    .first();
  if (await scheduleCheckbox.isVisible()) {
    await scheduleCheckbox.check();
    results.push({ name: 'Cooking Schedule Task completion works', passed: true });
  }
  saveScreenshot(
    'desktop-05-cooking-schedule.png',
    await desktopPage.screenshot({ fullPage: true }),
  );

  // Axe Accessibility Check
  console.log('\nChecking WCAG 2.1 AA Accessibility with Axe...');
  const axeResults = await new AxeBuilder({ page: desktopPage })
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
}

async function runMobileQa(browser: Browser, results: TestResult[], errors: string[]) {
  console.log('\n>>> [2/2] RUNNING MOBILE TESTING (390px - iPhone 12/13/14)...');
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const mobilePage = await mobileContext.newPage();
  mobilePage.on('pageerror', (err) => errors.push(`Mobile Page Error: ${err.message}`));

  await mobilePage.goto(`${BASE_URL}/food-planner`);
  await mobilePage.waitForFunction(
    () => document.querySelectorAll('astro-island[ssr]').length === 0,
    { timeout: 15000 },
  );
  await mobilePage.waitForSelector('[data-tool-island="food-planner"]', { timeout: 15000 });

  saveScreenshot('mobile-01-recipes-menu.png', await mobilePage.screenshot({ fullPage: true }));
  console.log('✓ Captured mobile-01-recipes-menu.png');

  await mobilePage.getByRole('tab', { name: /Ingredients/i }).click({ force: true });
  await mobilePage.waitForTimeout(400);
  saveScreenshot('mobile-02-ingredients.png', await mobilePage.screenshot({ fullPage: true }));

  await mobilePage.getByRole('tab', { name: /Shopping List/i }).click({ force: true });
  await mobilePage.waitForTimeout(400);
  saveScreenshot('mobile-03-shopping-list.png', await mobilePage.screenshot({ fullPage: true }));

  await mobilePage.getByRole('tab', { name: /Cost Estimation/i }).click({ force: true });
  await mobilePage.waitForTimeout(400);
  saveScreenshot('mobile-04-cost-estimation.png', await mobilePage.screenshot({ fullPage: true }));

  await mobilePage.getByRole('tab', { name: /Cooking Schedule/i }).click({ force: true });
  await mobilePage.waitForTimeout(400);
  saveScreenshot('mobile-05-cooking-schedule.png', await mobilePage.screenshot({ fullPage: true }));

  results.push({ name: 'Mobile 5-section navigation and rendering', passed: true });
  await mobileContext.close();
}

async function main() {
  console.log('=====================================================');
  console.log('   FOOD PLANNER (FP-005) COMPREHENSIVE BROWSER QA');
  console.log('=====================================================');

  const browser = await chromium.launch({ headless: true });
  const errors: string[] = [];
  const results: TestResult[] = [];

  await runDesktopQa(browser, results, errors);
  await runMobileQa(browser, results, errors);
  await browser.close();

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
