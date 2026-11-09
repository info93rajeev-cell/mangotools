import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { type Browser, chromium } from '@playwright/test';
import { startServer } from '../tests/support/serve.ts';

const PORT = 4321;
const LOCAL_DIR = join(process.cwd(), 'tests/artifacts/food-planner');
const ARTIFACT_DIR =
  'C:/Users/user/.gemini/antigravity/brain/0d73044e-7f74-45a9-99aa-f9e87a72e13a/qa-evidence';

mkdirSync(LOCAL_DIR, { recursive: true });
mkdirSync(ARTIFACT_DIR, { recursive: true });

function save(name: string, buf: Buffer) {
  writeFileSync(join(LOCAL_DIR, name), buf);
  writeFileSync(join(ARTIFACT_DIR, name), buf);
  console.log(`✓ Saved ${name}`);
}

async function captureDesktop(browser: Browser) {
  console.log('\n--- CAPTURING DESKTOP SCREENS (1600x900) ---');
  const desktop = await browser.newContext({
    viewport: { width: 1600, height: 900 },
    deviceScaleFactor: 1,
  });
  const page = await desktop.newPage();
  await page.goto(`http://localhost:${PORT}/food-planner`);
  await page.waitForSelector('[data-tool-island="food-planner"]', { timeout: 15000 });
  await page.waitForTimeout(1000);

  save('desktop-01-recipes-menu.png', await page.screenshot({ fullPage: true }));

  await page
    .locator('button[role="tab"]')
    .filter({ hasText: /Ingredients/i })
    .click();
  await page.waitForTimeout(800);
  save('desktop-02-ingredients.png', await page.screenshot({ fullPage: true }));

  await page
    .locator('button[role="tab"]')
    .filter({ hasText: /Shopping/i })
    .click();
  await page.waitForTimeout(800);
  save('desktop-03-shopping-list.png', await page.screenshot({ fullPage: true }));

  await page.locator('button[role="tab"]').filter({ hasText: /Cost/i }).click();
  await page.waitForTimeout(800);
  save('desktop-04-cost-estimation.png', await page.screenshot({ fullPage: true }));

  await page
    .locator('button[role="tab"]')
    .filter({ hasText: /Schedule/i })
    .click();
  await page.waitForTimeout(800);
  save('desktop-05-cooking-schedule.png', await page.screenshot({ fullPage: true }));

  await desktop.close();
}

async function captureMobile(browser: Browser) {
  console.log('\n--- CAPTURING MOBILE SCREENS (430x932) ---');
  const mobile = await browser.newContext({
    viewport: { width: 430, height: 932 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const page = await mobile.newPage();
  await page.goto(`http://localhost:${PORT}/food-planner`);
  await page.waitForSelector('[data-tool-island="food-planner"]', { timeout: 15000 });
  await page.waitForTimeout(1000);

  save('mobile-01-recipes-menu.png', await page.screenshot({ fullPage: true }));

  await page
    .locator('button[role="tab"]')
    .filter({ hasText: /Ingredients/i })
    .click();
  await page.waitForTimeout(800);
  save('mobile-02-ingredients.png', await page.screenshot({ fullPage: true }));

  await page
    .locator('button[role="tab"]')
    .filter({ hasText: /Shopping/i })
    .click();
  await page.waitForTimeout(800);
  save('mobile-03-shopping-list.png', await page.screenshot({ fullPage: true }));

  await page.locator('button[role="tab"]').filter({ hasText: /Cost/i }).click();
  await page.waitForTimeout(800);
  save('mobile-04-cost-estimation.png', await page.screenshot({ fullPage: true }));

  await page
    .locator('button[role="tab"]')
    .filter({ hasText: /Schedule/i })
    .click();
  await page.waitForTimeout(800);
  save('mobile-05-cooking-schedule.png', await page.screenshot({ fullPage: true }));

  await mobile.close();
}

async function main() {
  const server = await startServer('apps/web/dist', PORT);
  const browser = await chromium.launch({ headless: true });
  try {
    await captureDesktop(browser);
    await captureMobile(browser);
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch((err) => {
  console.error('Fatal error during capture:', err);
  process.exit(1);
});
