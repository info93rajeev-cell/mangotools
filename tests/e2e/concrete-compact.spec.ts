import { expect, type Page, test } from '@playwright/test';
import { island, openTool, primaryResult } from '../support/tool-page.ts';

const tool = 'concrete-quantity-calculator';
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

test.describe('Concrete compact workspace', () => {
  test('fits populated inputs, results and collapsed disclosures on desktop', async ({ page }) => {
    for (const viewport of [
      { width: 1366, height: 768 },
      { width: 1440, height: 900 },
    ]) {
      await page.setViewportSize(viewport);
      await openTool(page, tool);
      await page.getByRole('button', { name: 'Try sample' }).click();
      await page.getByLabel('Yield per bag (optional)').fill('14');
      await expect(output(page, 'bags')).toHaveText('225');
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
          input: bottom('[data-input-panel]'),
          result: bottom('[data-result-panel]'),
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

      expect(Math.max(bounds.input, bounds.result, bounds.secondary)).toBeLessThanOrEqual(
        bounds.viewport,
      );
      await expect(page.locator('details[data-notes]')).not.toHaveAttribute('open');
      for (const section of await page.locator('details[data-tool-content-section]').all()) {
        await expect(section).not.toHaveAttribute('open');
      }
    }
  });

  test('uses readable paired fields without horizontal overflow at 360 px', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await openTool(page, tool);
    await page.getByRole('button', { name: 'Try sample' }).click();

    const id = (field: string) => `#tool-${tool}-${field}`;
    await expectSameMobileRow(page, id('memberType'), `${id('unit')}-m`);
    await expectSameMobileRow(page, id('length'), id('width'));
    await expectSameMobileRow(page, id('depth'), id('quantity'));
    await expectSameMobileRow(page, id('overagePercent'), id('bagYield'));
    await expectSameMobileRow(page, `${id('bagYieldUnit')}-l`, `${id('decimalPlaces')}-3`);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test('keeps contextual help and result notes keyboard operable', async ({ page }) => {
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

  test('converts dimensions and switches to only the selected shape fields', async ({ page }) => {
    await openTool(page, tool);
    await page.getByRole('button', { name: 'Try sample' }).click();
    await expect(primaryResult(page)).toHaveText('3.150');
    await choose(page, 'unit', 'ft');
    await expect(page.getByLabel('Length')).toHaveValue('16.404199475066');
    await expect(page.getByLabel('Width')).toHaveValue('13.123359580052');
    await expect(page.getByLabel('Depth / thickness / height')).toHaveValue('0.492125984252');
    await expect(primaryResult(page)).toHaveText('4.120');
    await expect(output(page, 'orderVolumeM3')).toHaveText('3.150');

    await page.getByLabel('Member type').selectOption('circular-column');
    await expect(page.getByLabel('Diameter')).toBeVisible();
    await expect(page.getByLabel('Height', { exact: true })).toBeVisible();
    await expect(page.getByLabel('Length')).toHaveCount(0);
    await expect(page.getByLabel('Width')).toHaveCount(0);
    await expect(page.getByLabel('Depth / thickness / height')).toHaveCount(0);
  });

  test('formats decimal quantities with the selected 2, 3 or 4 places', async ({ page }) => {
    await openTool(page, tool);
    await page.getByRole('button', { name: 'Try sample' }).click();
    await page.getByLabel('Yield per bag (optional)').fill('14');
    await expect(page.locator(`#tool-${tool}-decimalPlaces-3`)).toBeChecked();
    await expect(primaryResult(page)).toHaveText('3.150');

    const expected = {
      '2': {
        primary: '3.15',
        orderVolumeYd3: '4.12',
        orderVolumeFt3: '111.24',
        netVolumeM3: '3.00',
        overageVolumeM3: '0.15',
      },
      '3': {
        primary: '3.150',
        orderVolumeYd3: '4.120',
        orderVolumeFt3: '111.241',
        netVolumeM3: '3.000',
        overageVolumeM3: '0.150',
      },
      '4': {
        primary: '3.1500',
        orderVolumeYd3: '4.1200',
        orderVolumeFt3: '111.2412',
        netVolumeM3: '3.0000',
        overageVolumeM3: '0.1500',
      },
    } as const;

    for (const places of ['2', '3', '4'] as const) {
      await choose(page, 'decimalPlaces', places);
      await expect(primaryResult(page)).toHaveText(expected[places].primary);
      for (const key of [
        'orderVolumeYd3',
        'orderVolumeFt3',
        'netVolumeM3',
        'overageVolumeM3',
      ] as const) {
        await expect(output(page, key)).toHaveText(expected[places][key]);
      }
      await expect(output(page, 'overagePercent')).toHaveText('5%');
      await expect(output(page, 'bags')).toHaveText('225');
      await expect(output(page, 'quantity')).toHaveText('1');
    }
  });

  test('uses the selector as the overage input precision without rewriting values', async ({
    page,
  }) => {
    await openTool(page, tool);
    await page.getByRole('button', { name: 'Try sample' }).click();
    const overage = page.getByLabel('Overage allowance %');

    await choose(page, 'decimalPlaces', '2');
    await overage.fill('1.25');
    await expect(primaryResult(page)).toHaveText('3.04');
    await overage.fill('1.250');
    await expect(page.getByText('Use at most 2 decimal places.')).toBeVisible();
    await expect(overage).toHaveValue('1.250');

    await choose(page, 'decimalPlaces', '3');
    await expect(overage).toHaveValue('1.250');
    await expect(primaryResult(page)).toHaveText('3.038');

    await choose(page, 'decimalPlaces', '4');
    await overage.fill('1.2500');
    await expect(primaryResult(page)).toHaveText('3.0375');
    await expect(output(page, 'overagePercent')).toHaveText('1.25%');
  });
});
