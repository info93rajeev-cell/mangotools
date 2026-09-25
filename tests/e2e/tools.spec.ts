import { expect, test } from '@playwright/test';
import {
  copiedTexts,
  inputArea,
  island,
  openTool,
  outputArea,
  primaryResult,
  SAMPLES,
  stubClipboard,
  TOOL_IDS,
  waitForResult,
} from '../support/tool-page.ts';

test.describe('Try sample gives the fixture result', () => {
  for (const id of TOOL_IDS) {
    test(id, async ({ page }) => {
      await openTool(page, id);
      await page.getByRole('button', { name: 'Try sample' }).click();
      await waitForResult(page, id);
      const { archetype, result } = SAMPLES[id];
      if (archetype === 'B') await expect(primaryResult(page)).toHaveText(result);
      else
        await expect(outputArea(page, id)).toHaveValue(
          new RegExp(result.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
        );
    });
  }
});

test.describe('GST Calculator', () => {
  test('updates live, with Indian grouping', async ({ page }) => {
    await openTool(page, 'gst-calculator');
    await page.getByLabel('Amount (₹)').fill('100000');
    await expect(primaryResult(page)).toHaveText('₹1,18,000.00');
    await expect(page.locator('[data-output="cgst"] dd')).toHaveText('₹9,000.00');
    await expect(page.getByText('Show calculation')).toBeVisible();
  });

  test('removes GST inter-state with a custom rate', async ({ page }) => {
    await openTool(page, 'gst-calculator');
    await island(page, 'gst-calculator').getByText('Remove GST', { exact: true }).click();
    await island(page, 'gst-calculator').getByText('Inter-state: IGST', { exact: true }).click();
    await page.getByLabel('GST rate').selectOption({ label: 'Custom' });
    await page.getByLabel('Custom gst rate').fill('12');
    await page.getByLabel('Amount (₹)').fill('112');
    await expect(primaryResult(page)).toHaveText('₹100.00');
    await expect(page.locator('[data-output="igst"] dd')).toHaveText('₹12.00');
    await expect(page.locator('[data-output="cgst"]')).toHaveCount(0);
  });

  test('shows the odd-paisa split when removing GST', async ({ page }) => {
    await openTool(page, 'gst-calculator');
    await island(page, 'gst-calculator').getByText('Remove GST', { exact: true }).click();
    await page.getByLabel('Amount (₹)').fill('100');
    await expect(primaryResult(page)).toHaveText('₹84.75');
    await expect(page.locator('[data-output="cgst"] dd')).toHaveText('₹7.63');
    await expect(page.locator('[data-output="sgst"] dd')).toHaveText('₹7.62');
  });

  test('explains invalid input next to the field', async ({ page }) => {
    await openTool(page, 'gst-calculator');
    await page.getByLabel('Amount (₹)').fill('12a');
    await expect(page.getByText('Enter a number such as 1250 or 1250.50.')).toBeVisible();
    await expect(page.getByLabel('Amount (₹)')).toHaveAttribute('aria-invalid', 'true');
  });

  test('shows the disclaimer', async ({ page }) => {
    await openTool(page, 'gst-calculator');
    await expect(page.locator('[data-disclaimer]')).toContainText(
      'Results are provided for guidance.',
    );
  });
});

test.describe('Profit Margin Calculator', () => {
  test('solves all three modes and shows a loss', async ({ page }) => {
    await openTool(page, 'profit-margin-calculator');
    await page.getByLabel('Cost', { exact: true }).fill('100');
    await page.getByLabel('Selling price', { exact: true }).fill('80');
    await expect(primaryResult(page)).toHaveText('−25.00%');
    await expect(page.locator('[data-output="profit"] dd')).toHaveText('−₹20.00');

    await island(page, 'profit-margin-calculator')
      .getByText('Price from cost & margin', { exact: true })
      .click();
    await page.getByLabel('Margin', { exact: true }).fill('20');
    await expect(primaryResult(page)).toHaveText('₹125.00');

    await island(page, 'profit-margin-calculator')
      .getByText('Cost from price & margin', { exact: true })
      .click();
    await page.getByLabel('Selling price', { exact: true }).fill('200');
    await expect(primaryResult(page)).toHaveText('₹160.00');
    await expect(page.locator('[data-disclaimer]')).toBeVisible();
  });

  test('shows money in ₹ with Indian digit grouping', async ({ page }) => {
    await openTool(page, 'profit-margin-calculator');
    await page.getByLabel('Cost', { exact: true }).fill('1000000');
    await page.getByLabel('Selling price', { exact: true }).fill('1500000');
    await expect(primaryResult(page)).toHaveText('33.33%');
    await expect(page.locator('[data-output="profit"] dd')).toHaveText('₹5,00,000.00');
    await expect(island(page, 'profit-margin-calculator')).toContainText(
      'Profit = ₹15,00,000.00 − ₹10,00,000.00 = ₹5,00,000.00',
    );
  });
});

test.describe('Markup Calculator', () => {
  test('solves all three modes with ₹, working and disclaimer', async ({ page }) => {
    await openTool(page, 'markup-calculator');
    await page.getByLabel('Cost', { exact: true }).fill('1000000');
    await page.getByLabel('Markup', { exact: true }).fill('50');
    await expect(primaryResult(page)).toHaveText('₹15,00,000.00');
    await expect(page.locator('[data-output="profit"] dd')).toHaveText('₹5,00,000.00');
    await expect(page.locator('[data-output="marginPercent"] dd')).toHaveText('33.33%');
    await expect(island(page, 'markup-calculator')).toContainText(
      'Selling price = ₹10,00,000.00 × (1 + 50%) = ₹15,00,000.00',
    );

    await island(page, 'markup-calculator')
      .getByText('Markup from cost & price', { exact: true })
      .click();
    await page.getByLabel('Cost', { exact: true }).fill('100');
    await page.getByLabel('Selling price', { exact: true }).fill('80');
    await expect(primaryResult(page)).toHaveText('−20.00%');
    await expect(page.locator('[data-output="profit"] dd')).toHaveText('−₹20.00');

    await island(page, 'markup-calculator')
      .getByText('Cost from price & markup', { exact: true })
      .click();
    await page.getByLabel('Selling price', { exact: true }).fill('250');
    await page.getByLabel('Markup', { exact: true }).fill('25');
    await expect(primaryResult(page)).toHaveText('₹200.00');
    await expect(page.locator('[data-disclaimer]')).toBeVisible();
  });
});

test.describe('CBM Calculator', () => {
  test('calculates CBM and cubic feet in every unit, from the exact volume', async ({ page }) => {
    await openTool(page, 'cbm-calculator');
    const tool = island(page, 'cbm-calculator');
    await expect(page.getByLabel('Number of cartons')).toHaveValue('1');
    await page.getByLabel('Length').fill('25');
    await page.getByLabel('Width').fill('25');
    await page.getByLabel('Height').fill('20');
    await page.getByLabel('Number of cartons').fill('100');
    await expect(primaryResult(page)).toHaveText('1.250');
    await expect(page.locator('[data-output="cbmPerCarton"] dd')).toHaveText('0.013');
    await expect(page.locator('[data-output="totalCft"] dd')).toHaveText('44.143');
    await expect(page.locator('[data-output="cftPerCarton"] dd')).toHaveText('0.441');
    await expect(tool).toContainText(
      'Total CBM = 0.0125 m³ × 100 cartons = 1.25 m³ (from the exact volume, rounded only for display)',
    );
    await expect(tool).toContainText(
      'CBM per carton = 25 cm × 25 cm × 20 cm × 0.000001 m³ per cm³ = 0.0125 m³ (exact)',
    );

    await tool.getByText('inch', { exact: true }).click();
    await page.getByLabel('Length').fill('20');
    await page.getByLabel('Width').fill('16');
    await page.getByLabel('Height').fill('12');
    await page.getByLabel('Number of cartons').fill('10');
    await expect(primaryResult(page)).toHaveText('0.629');
    await expect(page.locator('[data-output="totalCft"] dd')).toHaveText('22.222');
    await expect(page.locator('[data-disclaimer]')).toBeVisible();
  });

  test('explains invalid dimensions and cartons next to the field', async ({ page }) => {
    await openTool(page, 'cbm-calculator');
    await page.getByLabel('Length').fill('50');
    await page.getByLabel('Width').fill('0');
    await page.getByLabel('Height').fill('30');
    await expect(page.getByText('This must be greater than zero.')).toBeVisible();
    await expect(page.getByLabel('Width')).toHaveAttribute('aria-invalid', 'true');

    await page.getByLabel('Width').fill('40');
    await page.getByLabel('Number of cartons').fill('2.5');
    await expect(page.getByText('The number of cartons must be a whole number.')).toBeVisible();
    await expect(page.getByLabel('Number of cartons')).toHaveAttribute('aria-invalid', 'true');

    await page.getByLabel('Number of cartons').fill('1000001');
    await expect(page.getByText('Enter at most 1,000,000 cartons.')).toBeVisible();
  });
});

test.describe('JSON Formatter', () => {
  test('reports line and column, and Go to moves the caret', async ({ page }) => {
    await openTool(page, 'json-formatter');
    await inputArea(page, 'json-formatter').fill('{\n  "a": 1,\n}');
    await expect(island(page, 'json-formatter')).toHaveAttribute('data-phase', 'error');
    await expect(
      page.getByText(
        'Invalid JSON at line 3, column 1. Expected a property name in double quotes.',
      ),
    ).toBeVisible();
    await page.getByRole('button', { name: /Go to line 3, column 1/ }).click();
    const caret = await inputArea(page, 'json-formatter').evaluate((el) => {
      const area = el as HTMLTextAreaElement;
      return { focused: document.activeElement === area, start: area.selectionStart };
    });
    expect(caret).toEqual({ focused: true, start: 12 });
  });

  test('minify keeps numbers exactly', async ({ page }) => {
    await openTool(page, 'json-formatter');
    await island(page, 'json-formatter').getByText('Minify', { exact: true }).click();
    await inputArea(page, 'json-formatter').fill('{ "big": 12345678901234567890123, "p": 1.10 }');
    await expect(outputArea(page, 'json-formatter')).toHaveValue(
      '{"big":12345678901234567890123,"p":1.10}',
    );
  });
});

test.describe('Swap and copy', () => {
  test('Base64 swap decodes the encoded text back', async ({ page }) => {
    await openTool(page, 'base64-encode-decode');
    await inputArea(page, 'base64-encode-decode').fill('Hello, ₹');
    await expect(outputArea(page, 'base64-encode-decode')).toHaveValue('SGVsbG8sIOKCuQ==');
    await page.getByRole('button', { name: /Swap input and output/ }).click();
    await expect(inputArea(page, 'base64-encode-decode')).toHaveValue('SGVsbG8sIOKCuQ==');
    await expect(outputArea(page, 'base64-encode-decode')).toHaveValue('Hello, ₹');
  });

  test('URL swap decodes the encoded text back', async ({ page }) => {
    await openTool(page, 'url-encode-decode');
    await inputArea(page, 'url-encode-decode').fill('café & crème');
    await expect(outputArea(page, 'url-encode-decode')).toHaveValue('caf%C3%A9%20%26%20cr%C3%A8me');
    await page.getByRole('button', { name: /Swap input and output/ }).click();
    await expect(outputArea(page, 'url-encode-decode')).toHaveValue('café & crème');
  });

  test('Copy puts the result on the clipboard', async ({ page }) => {
    await stubClipboard(page);
    await openTool(page, 'url-encode-decode');
    await inputArea(page, 'url-encode-decode').fill('a b');
    await expect(outputArea(page, 'url-encode-decode')).toHaveValue('a%20b');
    await page.getByRole('button', { name: 'Copy result' }).click();
    await expect(
      page.getByRole('status').filter({ hasText: 'Copied to clipboard.' }),
    ).toBeVisible();
    expect(await copiedTexts(page)).toEqual(['a%20b']);
  });

  test('Copy on a calculator copies the summary with working', async ({ page }) => {
    await stubClipboard(page);
    await openTool(page, 'gst-calculator');
    await page.getByRole('button', { name: 'Try sample' }).click();
    await waitForResult(page, 'gst-calculator');
    await page.getByRole('button', { name: 'Copy result' }).click();
    const [text] = await copiedTexts(page);
    expect(text).toContain('Amount including GST: ₹1,180.00');
    expect(text).toContain('CGST = ₹1,000.00 × 9% = ₹90.00');
  });
});
