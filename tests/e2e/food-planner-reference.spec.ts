import { expect, type Page, test } from '@playwright/test';
import { openTool } from '../support/tool-page.ts';

test('Food Planner recipe gallery follows approved desktop proportions', async ({ page }) => {
  await page.setViewportSize({ width: 1672, height: 941 });
  await openTool(page, 'food-planner');
  const gallery = page.getByRole('heading', { name: /Recipe Gallery/ }).locator('xpath=../../..');
  const card = gallery.locator('[class*="recipeCard"]').first();
  const galleryBox = await gallery.boundingBox();
  const cardBox = await card.boundingBox();
  const footerBox = await page.locator('body > footer').boundingBox();
  if (!galleryBox || !cardBox || !footerBox) throw new Error('Food Planner layout missing');
  expect(galleryBox.x).toBeGreaterThanOrEqual(50);
  expect(galleryBox.y).toBeLessThanOrEqual(305);
  expect(cardBox.height).toBeLessThanOrEqual(155);
  expect(footerBox.y).toBeLessThanOrEqual(975);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(1672);
  await page.getByRole('tab', { name: /Shopping List/ }).click();
  const discovery = page.locator('details[class*="groceryDiscoveryCard"]');
  await expect(discovery).not.toHaveAttribute('open');
  const actions = page.getByRole('button', { name: /^(Add Item|Edit Price|Print List)$/ });
  const actionBoxes = await Promise.all(
    (await actions.all()).map((button) => button.boundingBox()),
  );
  expect(actionBoxes).toHaveLength(3);
  expect(new Set(actionBoxes.map((box) => Math.round(box?.y ?? -1))).size).toBe(1);
  await discovery.locator('summary').click();
  await expect(discovery.getByRole('link', { name: /Open in Google Maps/ })).toBeVisible();
});

const sizes = [
  { layout: 'portrait', width: 941, height: 1672 },
  { layout: 'desktop', width: 1672, height: 941 },
];
for (const size of sizes) {
  test(`Food Planner approved ${size.layout} reference viewports`, async ({ page }, info) => {
    await page.setViewportSize(size);
    await openTool(page, 'food-planner');
    await expect(page.locator('#related-tools')).toHaveCount(1);
    for (let index = 0; index < 5; index++) {
      const cost = index === 3;
      await page.setViewportSize({
        width: cost ? (size.layout === 'portrait' ? 952 : 1673) : size.width,
        height: cost ? (size.layout === 'portrait' ? 1652 : 940) : size.height,
      });
      await page.getByRole('tab').nth(index).click();
      await expect(
        page.getByTestId(
          size.layout === 'portrait'
            ? [
                'mobile-recipes',
                'mobile-ingredients',
                'mobile-shopping',
                'mobile-cost',
                'mobile-schedule',
              ][index]
            : 'mobile-recipes',
        ),
      ).toBeVisible({ visible: size.layout === 'portrait' });
      await expect(page.locator('[data-fullscreen-toggle]')).toBeInViewport();
      await expectReadableReadiness(page, size.layout, index);
      await page.waitForTimeout(500);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
      ).toBe(true);
      await page.screenshot({
        path: info.outputPath(`${size.layout}-${index}.png`),
        fullPage: true,
      });
    }
  });
}

async function expectReadableReadiness(page: Page, layout: string, index: number) {
  if (layout !== 'portrait' || index !== 4) return;
  const names = page
    .getByTestId('mobile-schedule')
    .getByRole('progressbar')
    .locator('..')
    .locator('p');
  expect(await names.count()).toBeGreaterThan(0);
  for (const name of await names.all()) {
    expect(await name.evaluate((element) => element.getBoundingClientRect().width)).toBeGreaterThan(
      100,
    );
  }
}
