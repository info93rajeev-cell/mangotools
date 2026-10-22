import { join } from 'node:path';
import { test } from '@playwright/test';
import { gotoReady, island } from '../support/tool-page.ts';

const OUT_DIR = 'C:/Users/user/.gemini/antigravity/brain/69dd2223-e082-499a-9544-d181fd76ffa1';
const PHOTO = join(process.cwd(), 'tools/image-compress/fixtures/files/photo.jpg');

test('capture image compress visual states', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await gotoReady(page, '/image-compress');

  // 1. Empty state
  await page.screenshot({ path: join(OUT_DIR, 'image-compress-empty-state.png') });

  // 2. Upload image -> Active Stage 1 & 2
  await island(page, 'image-compress').locator('input[type="file"]').setInputFiles([PHOTO]);
  await page.waitForTimeout(600);
  await page.screenshot({ path: join(OUT_DIR, 'image-compress-active-state.png') });

  // 2b. Select 50 KB Target Preset
  await page.getByRole('button', { name: /50 KB/ }).click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: join(OUT_DIR, 'image-compress-target-50kb.png') });

  // 3. Compress -> Stage 3 Result
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download compressed image' }).click();
  await downloadPromise;
  await page.waitForTimeout(600);
  await page.screenshot({ path: join(OUT_DIR, 'image-compress-result-state.png') });

  // 4. Mobile 360x800 fullPage
  await page.setViewportSize({ width: 360, height: 800 });
  await page.waitForTimeout(400);
  await page.screenshot({
    path: join(OUT_DIR, 'image-compress-mobile-result.png'),
    fullPage: true,
  });
});
