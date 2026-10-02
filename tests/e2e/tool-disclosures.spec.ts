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
    const input = page.locator('[data-input-panel]');
    const result = page.locator('[data-result-panel]');
    const supporting = page.locator('[data-secondary-information]');
    const [inputBox, resultBox, supportingBox] = await Promise.all([
      input.boundingBox(),
      result.boundingBox(),
      supporting.boundingBox(),
    ]);
    if (!inputBox || !resultBox || !supportingBox) throw new Error('Workspace panels are missing.');
    expect(inputBox.width / resultBox.width).toBeGreaterThan(1.4);
    expect(inputBox.width / resultBox.width).toBeLessThan(1.6);
    expect(Math.max(inputBox.y, resultBox.y, supportingBox.y)).toBeLessThan(768);
    expect(supportingBox.y + supportingBox.height).toBeLessThanOrEqual(768);
    await expect(input.getByRole('button', { name: 'Try sample' })).toBeVisible();
    await expect(input.getByRole('button', { name: 'Reset' })).toBeVisible();
    await expect(result.getByRole('button', { name: 'Copy result' })).toBeVisible();
  });

  test('field help is contextual and keyboard accessible', async ({ page }) => {
    await gotoReady(page, '/volumetric-weight-calculator');
    const fieldLabel = page.locator('label[for="tool-volumetric-weight-calculator-length"]');
    const help = fieldLabel.locator('..').getByLabel('Help');
    const disclosure = help.locator('..');
    await expect(help).toBeVisible();
    await expect(help).toHaveAttribute('title', 'Help for Length');
    await expect(disclosure.locator('p')).toBeHidden();
    await help.focus();
    await page.keyboard.press('Enter');
    await expect(disclosure).toHaveAttribute('open');
    await expect(disclosure.locator('p')).toBeVisible();
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
    await gotoReady(page, '/csv-to-json');
    const section = page.locator('details#related-tools');
    const summary = section.locator('summary');
    const renderedLink = section.locator('a[href="/json-formatter"]');
    await expect(section).not.toHaveAttribute('open');
    await expect(renderedLink).toHaveCount(1);
    await expect(renderedLink).toHaveText('JSON Formatter & Validator');
    await expect(renderedLink).toBeHidden();
    await summary.focus();
    await page.keyboard.press('Enter');
    await expect(section).toHaveAttribute('open');
    const accessibleLink = section.getByRole('link', { name: 'JSON Formatter & Validator' });
    await expect(accessibleLink).toBeVisible();
    await page.keyboard.press('Tab');
    await expect(section.getByRole('link').first()).toBeFocused();
  });

  test('calculation details are collapsed until deliberately opened', async ({ page }) => {
    await gotoReady(page, '/gst-calculator');
    await produceResult(page, 'gst-calculator');
    const working = page.locator('details[data-working]');
    await expect(working).not.toHaveAttribute('open');
    await expect(working).toContainText('CGST');
    await expect(working.locator('ol')).toBeHidden();
    const summary = working.locator('summary');
    await summary.focus();
    await page.keyboard.press('Enter');
    await expect(working).toHaveAttribute('open');
    await expect(working.locator('ol')).toBeVisible();
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
