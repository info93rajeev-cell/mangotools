import { expect, test } from '@playwright/test';

// The Universal Tax Calculator must never be wider than a phone screen.
// Regression: a nowrap rate-finder title inflated the page to 412px on a 360px screen.
for (const width of [320, 360, 375]) {
  test(`Universal Tax Calculator has no horizontal overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 740 });
    await page.goto('/gst-calculator');
    await expect(page.locator('#gst-rate-select')).toBeVisible();
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(width);
  });
}
