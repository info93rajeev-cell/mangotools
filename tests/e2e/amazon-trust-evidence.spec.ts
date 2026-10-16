import { expect, test } from '@playwright/test';
import { control, manualFees, openEvidence } from '../support/amazon-evidence.ts';

test('Amazon final evidence: private editing, scenario changes and local presets', async ({
  page,
  context,
}) => {
  const d = await openEvidence(page);
  await control(page, 'sellingPricePerUnit').focus();
  for (const key of ['productCostPerUnit', 'quantity', 'scenario']) {
    await page.keyboard.press('Tab');
    await expect(control(page, key)).toBeFocused();
  }
  await d.configure(manualFees);
  await d.set('referralMode', 'price-slabs');
  await d.rows('referralPriceSlabs', [{ max: '2000', value: '7' }]);
  await d.verify();
  const runs = await page.evaluate(() => Reflect.get(window, 'amazonRuns').length);
  await d.set('productCostPerUnit', '401');
  await d.verify();
  expect(await page.evaluate(() => Reflect.get(window, 'amazonRuns').length)).toBe(runs + 1);
  const manager = page.locator('[data-tool-presets]');
  await manager.getByRole('button', { name: 'Save as new', exact: true }).press('Enter');
  await manager.getByLabel('Preset name').fill('Final synthetic evidence');
  await page.keyboard.press('Enter');
  const saved = await page.evaluate(() => localStorage.getItem('mt.toolPresets'));
  await page.getByRole('button', { name: 'Reset', exact: true }).click();
  await manager.getByRole('button', { name: 'Load', exact: true }).click();
  await d.verify();
  expect(await page.evaluate(() => localStorage.getItem('mt.toolPresets'))).toBe(saved);
  const keys = await page.evaluate(() => Object.keys(localStorage).sort());
  expect(keys).toEqual(['mt.recent', 'mt.toolPresets']);
  expect(await context.cookies()).toEqual([]);
});
for (const width of [320, 390, 1366]) {
  test(`Amazon evidence: ${width}px populated rows`, async ({ page, browserName }) => {
    await page.setViewportSize({ width, height: width === 1366 ? 768 : 844 });
    const d = await openEvidence(page);
    await d.configure({ referralMode: 'price-slabs', referralGstTreatment: 'none' });
    await d.rows('referralPriceSlabs', [{ max: '2000', value: '7' }]);
    await d.verify();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);
    await expect(page.locator('body')).not.toContainText(/MangoTools|MangoPie/);
    await expect(page.locator('main')).not.toContainText(/\b(?:NaN|Infinity|undefined|null)\b/);
    for (const key of ['showProductDetails', 'showAmazonFees'])
      await expect(control(page, key)).toBeChecked();
    if (browserName === 'chromium') {
      await page.emulateMedia({ colorScheme: 'light' });
      await page.evaluate(() => scrollTo(0, 0));
      await page.screenshot({
        path: `tests/artifacts/screenshots/amazon-final-${width}.png`,
        fullPage: true,
      });
    }
  });
}
