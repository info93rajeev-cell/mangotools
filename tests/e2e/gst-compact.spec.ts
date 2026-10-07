import { expect, type Page, test } from '@playwright/test';
import { island, openTool, primaryResult } from '../support/tool-page.ts';

const tool = 'gst-calculator';
const output = (page: Page, key: string) => page.locator(`[data-output="${key}"] dd`);
const choose = (page: Page, field: string, value: string) =>
  page.locator(`label[for="tool-${tool}-${field}-${value}"]`).click();

async function populateSample(page: Page) {
  await page.getByRole('button', { name: 'Try sample' }).click();
  await expect(primaryResult(page)).toHaveText('₹1,180.00');
}

async function expectSameMobileRow(page: Page, left: string, right: string) {
  const boxes = await page.evaluate(
    ({ left, right }) => {
      const box = (id: string) =>
        document
          .querySelector<HTMLElement>(id)
          ?.closest<HTMLElement>('[data-width]')
          ?.getBoundingClientRect()
          .toJSON();
      return { left: box(left), right: box(right) };
    },
    { left, right },
  );
  expect(boxes.left).toBeTruthy();
  expect(boxes.right).toBeTruthy();
  expect(Math.abs((boxes.left?.top ?? 0) - (boxes.right?.top ?? 0))).toBeLessThanOrEqual(2);
  expect(boxes.left?.right ?? 0).toBeLessThan(boxes.right?.left ?? 0);
}

test.describe('GST compact workspace', () => {
  test('fits populated inputs, results and collapsed supporting content on desktop', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await openTool(page, tool);
    await populateSample(page);

    await expect(island(page, tool).locator('[data-density]')).toHaveAttribute(
      'data-density',
      'compact',
    );
    const notes = page.locator('details[data-notes]');
    if ((await notes.count()) > 0) await expect(notes).not.toHaveAttribute('open');
    for (const section of await page.locator('details[data-tool-content-section]').all()) {
      await expect(section).not.toHaveAttribute('open');
    }

    const bounds = await page.evaluate(() => ({
      viewport: window.innerHeight,
      input:
        document.querySelector('[data-input-panel]')?.getBoundingClientRect().bottom ?? Infinity,
      result:
        document.querySelector('[data-result-panel]')?.getBoundingClientRect().bottom ?? Infinity,
      secondary: Math.max(
        ...Array.from(
          document.querySelectorAll(
            'details[data-disclaimer] > summary, details[data-tool-content-section] > summary',
          ),
          (element) => element.getBoundingClientRect().bottom,
        ),
      ),
    }));
    expect(Math.max(bounds.input, bounds.result, bounds.secondary)).toBeLessThanOrEqual(
      bounds.viewport,
    );
    const pageOverflow = await page.evaluate(
      () => document.documentElement.scrollHeight - document.documentElement.clientHeight,
    );
    expect(pageOverflow).toBeLessThanOrEqual(0);
  });

  test('uses paired controls without mobile horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await openTool(page, tool);
    await populateSample(page);

    const id = (field: string) => `#tool-${tool}-${field}`;
    await expectSameMobileRow(page, `${id('mode')}-add`, `${id('supply')}-intra`);
    await expectSameMobileRow(page, id('amount'), id('rate'));

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test('preserves Add GST results for intra-state and inter-state supplies', async ({ page }) => {
    await openTool(page, tool);
    await page.getByLabel('Amount (₹)').fill('1000');
    await expect(primaryResult(page)).toHaveText('₹1,180.00');
    await expect(output(page, 'cgst')).toHaveText('₹90.00');
    await expect(output(page, 'sgst')).toHaveText('₹90.00');
    await expect(output(page, 'totalTax')).toHaveText('₹180.00');

    await choose(page, 'supply', 'inter');
    await expect(primaryResult(page)).toHaveText('₹1,180.00');
    await expect(output(page, 'igst')).toHaveText('₹180.00');
    await expect(page.locator('[data-output="cgst"]')).toHaveCount(0);
  });

  test('preserves Remove GST results and odd-paisa rounding', async ({ page }) => {
    await openTool(page, tool);
    await choose(page, 'mode', 'remove');
    await page.getByLabel('Amount (₹)').fill('100');
    await expect(primaryResult(page)).toHaveText('₹84.75');
    await expect(output(page, 'cgst')).toHaveText('₹7.63');
    await expect(output(page, 'sgst')).toHaveText('₹7.62');
    await expect(output(page, 'totalTax')).toHaveText('₹15.25');

    await choose(page, 'supply', 'inter');
    await expect(primaryResult(page)).toHaveText('₹84.75');
    await expect(output(page, 'igst')).toHaveText('₹15.25');
  });

  test('supports every predefined rate, zero, and a custom rate', async ({ page }) => {
    await openTool(page, tool);
    await page.getByLabel('Amount (₹)').fill('100');
    const rate = page.getByLabel('GST rate');
    for (const [value, gross] of [
      ['0', '₹100.00'],
      ['0.25', '₹100.26'],
      ['3', '₹103.00'],
      ['5', '₹105.00'],
      ['18', '₹118.00'],
      ['40', '₹140.00'],
    ]) {
      await rate.selectOption(value);
      await expect(primaryResult(page)).toHaveText(gross);
    }

    await rate.selectOption({ label: 'Custom' });
    await page.getByLabel('Custom gst rate').fill('12.5');
    await expect(primaryResult(page)).toHaveText('₹112.50');
  });
});
