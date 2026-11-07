import { expect, test } from '@playwright/test';
import { gotoReady, produceResult } from '../support/tool-page.ts';

test.describe('application-first tool pages', () => {
  test('supporting content is server-rendered but collapsed by default', async ({ page }) => {
    await gotoReady(page, '/gst-calculator');
    const sections = page.locator('details[data-tool-content-section]');
    expect(await sections.count()).toBeGreaterThan(2);
    for (const section of await sections.all()) await expect(section).not.toHaveAttribute('open');
    await expect(page.locator('#method')).toContainText('GST');
    await expect(page.locator('#method .content-body')).toBeHidden();
  });

  test('How to use opens its disclosure and remains keyboard operable', async ({ page }) => {
    await gotoReady(page, '/gst-calculator');
    const section = page.locator('#how-to-use');
    const summary = section.locator('summary');
    await expect(summary).toBeVisible();
    await summary.focus();
    await page.keyboard.press('Enter');
    await expect(section).toHaveAttribute('open');
    await page.keyboard.press('Enter');
    await expect(section).not.toHaveAttribute('open');
  });

  test('desktop calculator keeps its workspace and compact information controls in view', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await gotoReady(page, '/gst-calculator');
    const input = page.locator('[data-tax-inputs-card]');
    const result = page.locator('[data-tax-results-card]');
    const supporting = page.locator('[data-secondary-information]');
    const [inputBox, resultBox, supportingBox] = await Promise.all([
      input.boundingBox(),
      result.boundingBox(),
      supporting.boundingBox(),
    ]);
    if (!inputBox || !resultBox || !supportingBox) throw new Error('Workspace panels are missing.');
    expect(Math.max(inputBox.y, resultBox.y)).toBeLessThan(768);
    expect(supportingBox.y).toBeGreaterThan(0);
    await expect(input).toBeVisible();
    await expect(result).toBeVisible();
  });

  test('FAQ item disclosure is expandable and keyboard accessible', async ({ page }) => {
    await gotoReady(page, '/gst-calculator');
    const faqSection = page.locator('details#faq');
    await expect(faqSection).not.toHaveAttribute('open');
    const faqSummary = faqSection.locator('> summary');
    await faqSummary.scrollIntoViewIfNeeded();
    await faqSummary.focus();
    await page.keyboard.press('Enter');
    await expect(faqSection).toHaveAttribute('open');

    const firstFaqItem = faqSection.locator('details').first();
    await expect(firstFaqItem).not.toHaveAttribute('open');
    await expect(firstFaqItem.locator('.answer')).toBeHidden();
    const itemSummary = firstFaqItem.locator('> summary');
    await itemSummary.focus();
    await page.keyboard.press('Enter');
    await expect(firstFaqItem).toHaveAttribute('open');
    await expect(firstFaqItem.locator('.answer')).toBeVisible();
  });

  test('professional disclaimer is compact until deliberately opened', async ({ page }) => {
    await gotoReady(page, '/gst-calculator');
    const disclaimer = page.locator('details[data-disclaimer]');
    const summary = disclaimer.locator('summary');
    await expect(disclaimer).not.toHaveAttribute('open');
    await expect(disclaimer.locator('p')).toBeHidden();
    await summary.focus();
    await page.keyboard.press('Enter');
    await expect(disclaimer.locator('p')).toBeVisible();
  });

  test('Related tools links are server-rendered, collapsed and keyboard accessible', async ({
    page,
  }) => {
    await gotoReady(page, '/gst-calculator');
    const section = page.locator('details#related-tools');
    const summary = section.locator('summary');
    const renderedLink = section.locator('a[href="/profit-margin-calculator"]');
    await expect(section).not.toHaveAttribute('open');
    await expect(renderedLink).toHaveCount(1);
    await expect(renderedLink).toHaveText('Seller Profitability Calculator');
    await expect(renderedLink).toBeHidden();
    await summary.scrollIntoViewIfNeeded();
    await summary.focus();
    await page.keyboard.press('Enter');
    await expect(section).toHaveAttribute('open');
    const accessibleLink = section.getByRole('link', { name: 'Seller Profitability Calculator' });
    await expect(accessibleLink).toBeVisible();
    await page.keyboard.press('Tab');
    await expect(section.getByRole('link').first()).toBeFocused();
  });

  test('calculation details are collapsed until deliberately opened', async ({ page }) => {
    await gotoReady(page, '/volumetric-weight-calculator');
    await produceResult(page, 'volumetric-weight-calculator');
    const working = page.locator('details:has(> summary:has-text("Detailed Breakdown"))');
    await expect(working).not.toHaveAttribute('open');
    await expect(working.locator('table')).toBeHidden();
    const summary = working.locator('summary');
    await summary.scrollIntoViewIfNeeded();
    await summary.focus();
    await page.keyboard.press('Enter');
    await expect(working).toHaveAttribute('open');
    await expect(working.locator('table')).toBeVisible();
  });

  for (const [name, path] of [
    ['Business/Finance', '/profit-margin-calculator'],
    ['Developer/Data', '/json-formatter'],
    ['Image/Media', '/image-resize'],
    ['PDF', '/pdf-merge'],
  ] as const) {
    test(`${name} supporting content is collapsed`, async ({ page }) => {
      await gotoReady(page, path);
      const sections = page.locator('details[data-tool-content-section]');
      expect(await sections.count()).toBeGreaterThan(0);
      for (const section of await sections.all()) await expect(section).not.toHaveAttribute('open');
    });
  }

  test('the shared header does not widen a 360 px page', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await gotoReady(page, '/gst-calculator');
    const overflow = () =>
      page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
    expect(await overflow()).toBe(0);
    await page.getByRole('button', { name: 'Tools' }).click();
    expect(await overflow()).toBe(0);
  });
});
