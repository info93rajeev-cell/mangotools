import type { ChildProcess } from 'node:child_process';
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium, type Page } from '@playwright/test';

const CURRENT_DIR =
  'C:/Users/user/.gemini/antigravity/brain/0d73044e-7f74-45a9-99aa-f9e87a72e13a/current-screenshots';
const QA_DIR =
  'C:/Users/user/.gemini/antigravity/brain/0d73044e-7f74-45a9-99aa-f9e87a72e13a/qa-evidence';

mkdirSync(CURRENT_DIR, { recursive: true });
mkdirSync(QA_DIR, { recursive: true });

async function isPortOpen(port: number): Promise<boolean> {
  try {
    const res = await fetch(`http://127.0.0.1:${port}/food-planner.html`);
    return res.ok;
  } catch {
    return false;
  }
}

async function captureScreen(page: Page, baseName: string, num: string) {
  const currentPath = join(CURRENT_DIR, `current-${num}-${baseName}-1600x900.png`);
  const qaDesktopPath = join(QA_DIR, `desktop-${num}-${baseName}.png`);
  const buf = await page.screenshot({ fullPage: false });
  writeFileSync(currentPath, buf);
  writeFileSync(qaDesktopPath, buf);
  console.log(`Saved desktop: ${currentPath}`);
}

async function captureMobileScreen(page: Page, baseName: string, num: string) {
  const qaMobilePath = join(QA_DIR, `mobile-${num}-${baseName}.png`);
  const buf = await page.screenshot({ fullPage: false });
  writeFileSync(qaMobilePath, buf);
  console.log(`Saved mobile: ${qaMobilePath}`);
}

async function main() {
  let serverProcess: ChildProcess | null = null;
  const running = await isPortOpen(4321);
  if (!running) {
    console.log('Starting static server on :4321 with apps/web/dist...');
    serverProcess = spawn('npx', ['tsx', 'tests/support/serve.ts', 'apps/web/dist', '4321'], {
      cwd: 'E:/Tools/mangotools-fp005',
      stdio: 'pipe',
      shell: true,
    });
    for (let i = 0; i < 30; i++) {
      if (await isPortOpen(4321)) break;
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  const browser = await chromium.launch({ headless: true });

  // 1. Desktop 1600x900
  console.log('--- Capturing Desktop (1600x900) ---');
  const desktopContext = await browser.newContext({
    viewport: { width: 1600, height: 900 },
    deviceScaleFactor: 1,
  });

  const page = await desktopContext.newPage();
  await page.goto('http://127.0.0.1:4321/food-planner.html');
  await page.waitForFunction(() => document.querySelectorAll('astro-island[ssr]').length === 0, {
    timeout: 15000,
  });
  await page.waitForSelector('[data-tool-island="food-planner"]', { timeout: 15000 });
  await page.waitForTimeout(1000);

  // Tab 1: Recipes & Menu
  await captureScreen(page, 'recipes-menu', '01');

  // Tab 2: Ingredients
  await page.locator('button:has-text("Ingredients")').first().click();
  await page.waitForTimeout(600);
  await captureScreen(page, 'ingredients', '02');

  // Tab 3: Shopping List
  await page.locator('button:has-text("Shopping List")').first().click();
  await page.waitForTimeout(600);
  await captureScreen(page, 'shopping-list', '03');

  // Tab 4: Cost Estimation
  await page.locator('button:has-text("Cost Estimation")').first().click();
  await page.waitForTimeout(600);
  await captureScreen(page, 'cost-estimation', '04');

  // Tab 5: Cooking Schedule
  await page.locator('button:has-text("Cooking Schedule")').first().click();
  await page.waitForTimeout(600);
  await captureScreen(page, 'cooking-schedule', '05');

  await desktopContext.close();

  // 2. Mobile 390x844
  console.log('--- Capturing Mobile (390x844) ---');
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
  });

  const mobPage = await mobileContext.newPage();
  await mobPage.goto('http://127.0.0.1:4321/food-planner.html');
  await mobPage.waitForFunction(() => document.querySelectorAll('astro-island[ssr]').length === 0, {
    timeout: 15000,
  });
  await mobPage.waitForSelector('[data-tool-island="food-planner"]', { timeout: 15000 });
  await mobPage.waitForTimeout(1000);

  // Tab 1
  await captureMobileScreen(mobPage, 'recipes-menu', '01');

  // Tab 2
  await mobPage.locator('button:has-text("Ingredients")').first().click();
  await mobPage.waitForTimeout(600);
  await captureMobileScreen(mobPage, 'ingredients', '02');

  // Tab 3
  await mobPage.locator('button:has-text("Shopping List")').first().click();
  await mobPage.waitForTimeout(600);
  await captureMobileScreen(mobPage, 'shopping-list', '03');

  // Tab 4
  await mobPage.locator('button:has-text("Cost Estimation")').first().click();
  await mobPage.waitForTimeout(600);
  await captureMobileScreen(mobPage, 'cost-estimation', '04');

  // Tab 5
  await mobPage.locator('button:has-text("Cooking Schedule")').first().click();
  await mobPage.waitForTimeout(600);
  await captureMobileScreen(mobPage, 'cooking-schedule', '05');

  await mobileContext.close();
  await browser.close();

  if (serverProcess) {
    serverProcess.kill();
  }
  console.log('Capture finished successfully!');
}

main().catch((err) => {
  console.error('Error in capture script:', err);
  process.exit(1);
});
