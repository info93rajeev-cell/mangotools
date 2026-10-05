import { expect, type Page, test } from '@playwright/test';
import { island, openTool, primaryResult } from '../support/tool-page.ts';

const tool = 'excavation-calculator';
const output = (page: Page, key: string) => page.locator(`[data-output="${key}"] dd`);
const choose = (page: Page, field: string, value: string) =>
  page.locator(`label[for="tool-${tool}-${field}-${value}"]`).click();

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

test.describe('Excavation compact workspace', () => {
  test('fits the populated workspace, collapsed disclosures and footer on desktop', async ({
    page,
  }) => {
    for (const viewport of [
      { width: 1366, height: 768 },
      { width: 1440, height: 900 },
    ]) {
      await page.setViewportSize(viewport);
      await openTool(page, tool);
      await page.getByRole('button', { name: 'Try sample' }).click();
      await expect(output(page, 'truckLoads')).toHaveText('3');
      await expect(island(page, tool).locator('[data-density]')).toHaveAttribute(
        'data-density',
        'compact',
      );

      const bounds = await page.evaluate(() => {
        const bottom = (selector: string) =>
          document.querySelector(selector)?.getBoundingClientRect().bottom ??
          Number.POSITIVE_INFINITY;
        return {
          viewport: window.innerHeight,
          document: document.documentElement.scrollHeight,
          input: bottom('[data-input-panel]'),
          result: bottom('[data-result-panel]'),
          footer: bottom('footer'),
          secondary: Math.max(
            ...Array.from(
              document.querySelectorAll(
                'details[data-disclaimer] > summary, details[data-tool-content-section] > summary',
              ),
              (element) => element.getBoundingClientRect().bottom,
            ),
          ),
        };
      });

      expect(
        Math.max(bounds.input, bounds.result, bounds.secondary, bounds.footer),
      ).toBeLessThanOrEqual(bounds.viewport);
      expect(bounds.document).toBeLessThanOrEqual(bounds.viewport);
      await expect(page.locator('details[data-notes]')).not.toHaveAttribute('open');
      for (const section of await page.locator('details[data-tool-content-section]').all()) {
        await expect(section).not.toHaveAttribute('open');
      }
    }
  });

  test('uses readable paired rows without horizontal overflow at 360 px', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await openTool(page, tool);
    await page.getByRole('button', { name: 'Try sample' }).click();

    const id = (field: string) => `#tool-${tool}-${field}`;
    await expectSameMobileRow(page, id('excavationType'), `${id('unit')}-m`);
    await expectSameMobileRow(page, id('length'), id('width'));
    await expectSameMobileRow(page, id('depth'), id('quantity'));
    await expectSameMobileRow(page, id('swellPercent'), id('truckCapacity'));
    await expectSameMobileRow(page, `${id('truckCapacityUnit')}-m3`, `${id('decimalPlaces')}-3`);

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test('keeps contextual help and Important notes keyboard operable', async ({ page }) => {
    await openTool(page, tool);
    await page.getByRole('button', { name: 'Try sample' }).click();
    for (const details of [
      island(page, tool).locator('details[data-field-help]').first(),
      page.locator('details[data-notes]'),
    ]) {
      await expect(details).not.toHaveAttribute('open');
      await details.locator('summary').focus();
      await page.keyboard.press('Enter');
      await expect(details).toHaveAttribute('open');
    }
  });

  test('converts entered dimensions and preserves physical volume and whole loads', async ({
    page,
  }) => {
    await openTool(page, tool);
    await page.getByRole('button', { name: 'Try sample' }).click();
    await expect(primaryResult(page)).toHaveText('12.000');
    await expect(output(page, 'truckLoads')).toHaveText('3');

    await choose(page, 'unit', 'ft');
    await expect(page.getByLabel('Length')).toHaveValue('65.616797900262');
    await expect(page.getByLabel('Width')).toHaveValue('1.968503937008');
    await expect(page.getByLabel('Depth')).toHaveValue('3.280839895013');
    await expect(primaryResult(page)).toHaveText('15.695');
    await expect(output(page, 'bankVolumeM3')).toHaveText('12.000');
    await expect(output(page, 'truckLoads')).toHaveText('3');
  });

  test('supports each excavation type without changing rectangular-volume semantics', async ({
    page,
  }) => {
    await openTool(page, tool);
    await page.getByRole('button', { name: 'Try sample' }).click();
    const type = page.getByLabel('Excavation type');
    await expect(type.locator('option')).toHaveText([
      'Rectangular pit / general excavation',
      'Trench',
      'Footing pit',
    ]);
    for (const mode of ['general', 'trench', 'footing']) {
      await type.selectOption(mode);
      await expect(primaryResult(page)).toHaveText('12.000');
      await expect(output(page, 'looseVolumeM3')).toHaveText('15.000');
      await expect(output(page, 'truckLoads')).toHaveText('3');
    }
  });

  test('applies swell once and rounds optional truck loads upward to a whole count', async ({
    page,
  }) => {
    await openTool(page, tool);
    await page.getByRole('button', { name: 'Try sample' }).click();
    await expect(primaryResult(page)).toHaveText('12.000');
    await expect(output(page, 'looseVolumeM3')).toHaveText('15.000');
    await expect(output(page, 'truckLoads')).toHaveText('3');

    await page.getByLabel('Usable truck volume').fill('');
    await expect(output(page, 'truckLoads')).toHaveCount(0);
    await page.getByLabel('Usable truck volume').fill('5');
    await expect(output(page, 'truckLoads')).toHaveText('3');
    await page.getByLabel('Usable truck volume').fill('5.1');
    await expect(output(page, 'truckLoads')).toHaveText('3');
    await page.getByLabel('Usable truck volume').fill('7.6');
    await expect(output(page, 'truckLoads')).toHaveText('2');
  });

  test('formats volumes and validates swell with the selected 2, 3 or 4 places', async ({
    page,
  }) => {
    await openTool(page, tool);
    await page.getByRole('button', { name: 'Try sample' }).click();
    const swell = page.getByLabel('Swell / bulking %');

    await choose(page, 'decimalPlaces', '2');
    await swell.fill('1.25');
    await expect(primaryResult(page)).toHaveText('12.00');
    await expect(output(page, 'looseVolumeM3')).toHaveText('12.15');
    await expect(output(page, 'truckLoads')).toHaveText('3');
    await swell.fill('1.250');
    await expect(page.getByText('Use at most 2 decimal places.')).toBeVisible();
    await expect(swell).toHaveValue('1.250');

    await choose(page, 'decimalPlaces', '3');
    await expect(swell).toHaveValue('1.250');
    await expect(output(page, 'looseVolumeM3')).toHaveText('12.150');

    await choose(page, 'decimalPlaces', '4');
    await swell.fill('1.2500');
    await expect(primaryResult(page)).toHaveText('12.0000');
    await expect(output(page, 'looseVolumeM3')).toHaveText('12.1500');
    await expect(output(page, 'swellPercent')).toHaveText('1.25%');
    await expect(output(page, 'truckLoads')).toHaveText('3');
  });
});
