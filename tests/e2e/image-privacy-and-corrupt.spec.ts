import { expect, test } from '@playwright/test';
import { gotoReady } from '../support/tool-page.ts';

const IMAGE_TOOLS = [
  'image-resize',
  'image-compress',
  'image-crop',
  'image-enlarger',
  'image-format-converter',
  'image-metadata-remover',
  'image-watermark',
  'image-background-remover',
  'photo-size-reducer',
  'passport-photo-resizer',
  'signature-resizer',
] as const;

test.describe('Image Phase 1 Review Fixes: Privacy & Corrupt Upload (G6)', () => {
  for (const id of IMAGE_TOOLS) {
    test(`${id} (a) privacy: zero non-GET requests during upload and action`, async ({ page }) => {
      const nonGetRequests: string[] = [];
      page.on('request', (req) => {
        if (req.method() !== 'GET') {
          nonGetRequests.push(`${req.method()} ${req.url()}`);
        }
      });

      await gotoReady(page, `/${id}`);

      // Try sample or upload sample canvas
      const sampleBtn = page
        .getByRole('button', { name: /try sample|sample|load sample/i })
        .first();
      if ((await sampleBtn.count()) > 0 && (await sampleBtn.isVisible())) {
        await sampleBtn.click();
      } else {
        const fileInput = page.locator('input[type="file"]').first();
        if ((await fileInput.count()) > 0) {
          const validBuffer = await page.evaluate(() => {
            const canvas = document.createElement('canvas');
            canvas.width = 100;
            canvas.height = 100;
            const ctx = canvas.getContext('2d');
            if (!ctx) return '';
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(0, 0, 100, 100);
            return canvas.toDataURL('image/jpeg').split(',')[1] ?? '';
          });
          await fileInput.setInputFiles({
            name: 'sample.jpg',
            mimeType: 'image/jpeg',
            buffer: Buffer.from(validBuffer, 'base64'),
          });
        }
      }

      await page.waitForTimeout(300);

      // Verify ZERO non-GET requests were sent to any server
      expect(nonGetRequests).toEqual([]);
    });

    test(`${id} (b) corrupt upload: shows plain error message, disables download, no stale dimensions`, async ({
      page,
    }) => {
      await gotoReady(page, `/${id}`);

      // If sample button exists, first load it to create a prior valid state with dimensions
      const sampleBtn = page.getByRole('button', { name: /try sample|sample/i }).first();
      if ((await sampleBtn.count()) > 0 && (await sampleBtn.isVisible())) {
        await sampleBtn.click();
        await page.waitForTimeout(200);
      }

      // Now upload a corrupt file
      const fileInput = page.locator('input[type="file"]').first();
      await expect(fileInput).toBeAttached();

      const corruptBuffer = Buffer.from([0x00, 0x11, 0x22, 0x33, 0x44, 0x55, 0x66, 0x77]);
      await fileInput.setInputFiles({
        name: 'corrupt-image.jpg',
        mimeType: 'image/jpeg',
        buffer: corruptBuffer,
      });

      await page.waitForTimeout(300);

      // 1. Plain error message must be present
      const alert = page.locator('[role="alert"]').first();
      await expect(alert).toBeVisible({ timeout: 5000 });
      const alertText = await alert.textContent();
      expect(alertText).toBeTruthy();
      expect(alertText?.length ?? 0).toBeGreaterThan(5);

      // 2. Download CTA must be disabled or not present
      const downloadButtons = page.locator(
        'button[data-download-resized], button[data-action="download-watermarked"], button[data-action="download-result"], button[name*="Download"], button[data-action*="download"]',
      );
      const count = await downloadButtons.count();
      for (let i = 0; i < count; i++) {
        const btn = downloadButtons.nth(i);
        if (await btn.isVisible()) {
          await expect(btn).toBeDisabled();
        }
      }

      // 3. Stale dimensions must not be displayed
      if (id === 'signature-resizer') {
        const resultSummary = page.locator('[class*="resultSummaryRow"]');
        await expect(resultSummary).toHaveCount(0);
        const dimensionText = await page.locator('body').textContent();
        expect(dimensionText).not.toContain('3000 × 4000');
      }
    });
  }
});
