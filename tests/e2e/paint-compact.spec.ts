import { expect, type Page, test } from '@playwright/test';
import { island, openTool, primaryResult } from '../support/tool-page.ts';

const tool = 'paint-calculator';
const output = (page: Page, key: string) => page.locator(`[data-output="${key}"] dd`);
const choosePrecision = (page: Page, field: string, value: string) =>
  page.locator(`label[for="tool-${tool}-${field}-${value}"]`).click();

async function populateRoof(page: Page) {
  await page.getByLabel('What are you painting?').selectOption('roof');
  await page.getByLabel('Roof length').fill('10');
  await page.getByLabel('Roof width').fill('8');
  await page.getByLabel('Roof pitch angle').fill('30');
  await page.getByLabel('Same-size areas').fill('1');
  await page.getByLabel('Coats').fill('2');
  await page.getByLabel('Wastage %').fill('10');
  await page.getByLabel('Coverage / coat').fill('10');
  await page.getByLabel('Container size').fill('5');
}

async function addOpening(page: Page) {
  await island(page, tool).locator('[data-openings] > div button').last().click();
  await page.locator(`#tool-${tool}-openings-0-width`).fill('2');
  await page.locator(`#tool-${tool}-openings-0-height`).fill('1');
  await page.locator(`#tool-${tool}-openings-0-quantity`).fill('1');
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

test.describe('Paint compact Roof workspace', () => {
  test('fits the populated operational workspace and shows the footer on desktop', async ({
    page,
  }) => {
    for (const viewport of [
      { width: 1366, height: 768 },
      { width: 1440, height: 900 },
    ]) {
      await page.setViewportSize(viewport);
      await openTool(page, tool);
      await populateRoof(page);
      await expect(primaryResult(page)).toHaveText('20.323');
      await expect(output(page, 'containers')).toHaveText('5');
      await expect(island(page, tool).locator('[data-density]')).toHaveAttribute(
        'data-density',
        'compact',
      );
      await expect(page.locator('details[data-notes]')).not.toHaveAttribute('open');
      for (const section of await page.locator('details[data-tool-content-section]').all()) {
        await expect(section).not.toHaveAttribute('open');
      }
      const bounds = await page.evaluate(() => ({
        viewport: window.innerHeight,
        document: document.documentElement.scrollHeight,
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
        footer: document.querySelector('footer')?.getBoundingClientRect().bottom ?? Infinity,
        footerTop: document.querySelector('footer')?.getBoundingClientRect().top ?? Infinity,
      }));
      expect(Math.max(bounds.input, bounds.result, bounds.secondary)).toBeLessThanOrEqual(
        bounds.viewport,
      );
      expect(bounds.footerTop).toBeLessThan(bounds.viewport);
      const allowedFooterTail = viewport.height === 768 ? 24 : 0;
      expect(bounds.footer).toBeLessThanOrEqual(bounds.viewport + allowedFooterTail);
      expect(bounds.document).toBeLessThanOrEqual(bounds.viewport + allowedFooterTail);
    }
  });

  test('uses safe paired rows without horizontal overflow at 360 px', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await openTool(page, tool);
    await populateRoof(page);
    await addOpening(page);

    const id = (field: string) => `#tool-${tool}-${field}`;
    await expectSameMobileRow(page, id('mode'), id('unit'));
    await expectSameMobileRow(page, id('roofLength'), id('roofWidth'));
    await expectSameMobileRow(page, id('pitchAngle'), id('quantity'));
    await expectSameMobileRow(page, id('coats'), id('wastagePercent'));
    await expectSameMobileRow(page, id('coverage'), id('coverageUnit'));
    await expectSameMobileRow(page, id('containerSize'), `${id('containerUnit')}-l`);
    await expect(page.getByLabel('Room length')).toBeHidden();
    await expect(page.getByLabel('Surface length')).toBeHidden();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test('preserves Room and Single surface calculations', async ({ page }) => {
    await openTool(page, tool);
    await page.getByRole('button', { name: 'Try sample' }).click();
    await expect(primaryResult(page)).toHaveText('7.504');
    await page.getByRole('button', { name: 'Reset' }).click();
    await page.getByLabel('What are you painting?').selectOption('surface');
    await page.getByLabel('Surface length').fill('5');
    await page.getByLabel('Surface height or width').fill('4');
    await page.getByLabel('Coats').fill('2');
    await page.getByLabel('Wastage %').fill('10');
    await expect(primaryResult(page)).toHaveText('4.400');
  });

  test('calculates 0° and 30° roofs, openings, coats, wastage and whole containers', async ({
    page,
  }) => {
    await openTool(page, tool);
    await populateRoof(page);
    await expect(output(page, 'grossAreaM2')).toHaveText('92.376');
    await expect(output(page, 'paintLitres')).toHaveText('18.475');
    await expect(primaryResult(page)).toHaveText('20.323');
    await expect(output(page, 'containers')).toHaveText('5');

    await page.getByLabel('Roof pitch angle').fill('0');
    await expect(output(page, 'grossAreaM2')).toHaveText('80.000');
    await addOpening(page);
    await expect(output(page, 'openingAreaM2')).toHaveText('2.000');
    await expect(output(page, 'netAreaM2')).toHaveText('78.000');
  });

  test('converts roof and opening dimensions without changing the pitch or physical result', async ({
    page,
  }) => {
    await openTool(page, tool);
    await populateRoof(page);
    await addOpening(page);
    await expect(page.locator(`#tool-${tool}-openings-0-width`)).toHaveValue('2');
    await expect(page.locator(`#tool-${tool}-openings-0-height`)).toHaveValue('1');
    await expect(page.locator(`#tool-${tool}-openings-0-quantity`)).toHaveValue('1');
    await expect(primaryResult(page)).toHaveText('19.883');
    const before = await primaryResult(page).textContent();
    await page.getByLabel('Unit', { exact: true }).selectOption('cm');
    await expect(page.getByLabel('Roof length')).toHaveValue('1000');
    await expect(page.getByLabel('Roof width')).toHaveValue('800');
    await expect(page.getByLabel('Roof pitch angle')).toHaveValue('30');
    await expect(page.locator(`#tool-${tool}-openings-0-width`)).toHaveValue('200');
    await expect(page.locator(`#tool-${tool}-openings-0-height`)).toHaveValue('100');
    await expect(page.locator(`#tool-${tool}-openings-0-quantity`)).toHaveValue('1');
    await expect(primaryResult(page)).toHaveText(before ?? '');
  });

  test('formats outputs and validates wastage with 2, 3 or 4 places', async ({ page }) => {
    await openTool(page, tool);
    await populateRoof(page);
    const wastage = page.getByLabel('Wastage %');

    await choosePrecision(page, 'decimalPlaces', '2');
    await wastage.fill('1.25');
    await expect(primaryResult(page)).toHaveText('18.71');
    await wastage.fill('1.250');
    await expect(page.getByText('Use at most 2 decimal places.')).toBeVisible();

    await choosePrecision(page, 'decimalPlaces', '3');
    await expect(wastage).toHaveValue('1.250');
    await expect(primaryResult(page)).toHaveText('18.706');

    await choosePrecision(page, 'decimalPlaces', '4');
    await wastage.fill('1.2500');
    await expect(primaryResult(page)).toHaveText('18.7061');
    await expect(output(page, 'containers')).toHaveText('4');
  });

  test('rejects roof pitches outside 0°–89° and keeps help keyboard operable', async ({ page }) => {
    await openTool(page, tool);
    await populateRoof(page);
    await page.getByLabel('Roof pitch angle').fill('90');
    await expect(page.getByText('Enter a roof pitch angle from 0° to 89°.')).toBeVisible();
    const help = island(page, tool).locator('details[data-field-help]').first();
    await help.locator('summary').focus();
    await page.keyboard.press('Enter');
    await expect(help).toHaveAttribute('open');
  });
});
