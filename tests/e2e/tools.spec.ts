import { expect, test } from '@playwright/test';
import {
  copiedTexts,
  FILE_TOOLS,
  hasSample,
  inputArea,
  island,
  openRelatedTools,
  openTool,
  outputArea,
  primaryResult,
  produceResult,
  SAMPLES,
  stubClipboard,
  TOOL_IDS,
} from '../support/tool-page.ts';

test.describe('Try sample gives the fixture result', () => {
  for (const id of TOOL_IDS) {
    test(id, async ({ page }) => {
      await openTool(page, id);
      await produceResult(page, id);
      const sample = hasSample(id) ? SAMPLES[id] : FILE_TOOLS[id];
      if (sample.archetype === 'A') {
        await expect(outputArea(page, id)).toHaveValue(
          new RegExp(sample.result.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
        );
      } else if ('resultPattern' in sample) {
        await expect(primaryResult(page)).toHaveText(sample.resultPattern);
      } else {
        await expect(primaryResult(page)).toHaveText(sample.result);
      }
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
    await expect(page.getByLabel('Cartons')).toHaveValue('1');
    await page.getByLabel('Length').fill('25');
    await page.getByLabel('Width').fill('25');
    await page.getByLabel('Height').fill('20');
    await page.getByLabel('Cartons').fill('100');
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

    await tool.getByText('in', { exact: true }).click();
    await page.getByLabel('Length').fill('20');
    await page.getByLabel('Width').fill('16');
    await page.getByLabel('Height').fill('12');
    await page.getByLabel('Cartons').fill('10');
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
    await page.getByLabel('Cartons').fill('2.5');
    await expect(page.getByText('The number of cartons must be a whole number.')).toBeVisible();
    await expect(page.getByLabel('Cartons')).toHaveAttribute('aria-invalid', 'true');

    await page.getByLabel('Cartons').fill('1000001');
    await expect(page.getByText('Enter at most 1,000,000 cartons.')).toBeVisible();
  });
});

test.describe('Volumetric Weight Calculator', () => {
  test('compares actual and volumetric weight and states the billing basis', async ({ page }) => {
    await openTool(page, 'volumetric-weight-calculator');
    const tool = island(page, 'volumetric-weight-calculator');
    await expect(page.getByLabel('Packages')).toHaveValue('1');
    await expect(page.getByLabel('Divisor (cm³ per kg)')).toHaveValue('5000');
    await page.getByRole('button', { name: 'Try sample' }).click();
    await expect(primaryResult(page)).toHaveText('120.000');
    await expect(page.locator('[data-output="chargeablePerPackage"] dd')).toHaveText('12.000');
    await expect(page.locator('[data-output="volumetricPerPackage"] dd')).toHaveText('12.000');
    await expect(page.locator('[data-output="actualTotal"] dd')).toHaveText('80.000');
    await expect(tool).toContainText(
      'Volumetric weight is higher, so volumetric weight is used for billing.',
    );

    await page.getByLabel('Divisor (cm³ per kg)').selectOption({ label: '6000' });
    await expect(primaryResult(page)).toHaveText('100.000');

    await page.getByLabel('Actual weight').fill('25');
    await expect(primaryResult(page)).toHaveText('250.000');
    await expect(tool).toContainText(
      'Actual weight is higher, so actual weight is used for billing.',
    );

    await page.getByLabel('Divisor (cm³ per kg)').selectOption({ label: 'Custom' });
    await page.getByLabel('Custom divisor (cm³ per kg)').fill('2400');
    await expect(page.locator('[data-output="volumetricPerPackage"] dd')).toHaveText('25.000');
    await expect(tool).toContainText(
      'Actual and volumetric weight are the same, so either value may be used for billing.',
    );
    await expect(page.locator('[data-disclaimer]')).toBeVisible();
    await openRelatedTools(page);
    await expect(page.getByRole('link', { name: 'CBM Calculator' }).first()).toBeVisible();
  });

  test('converts inches and pounds', async ({ page }) => {
    await openTool(page, 'volumetric-weight-calculator');
    const tool = island(page, 'volumetric-weight-calculator');
    await tool.getByText('in', { exact: true }).click();
    await tool.getByText('lb', { exact: true }).click();
    await page.getByLabel('Length').fill('20');
    await page.getByLabel('Width').fill('16');
    await page.getByLabel('Height').fill('12');
    await page.getByLabel('Actual weight').fill('22');
    await expect(primaryResult(page)).toHaveText('12.585');
    await expect(page.locator('[data-output="actualPerPackage"] dd')).toHaveText('9.979');
    await expect(tool).toContainText(
      'Actual weight per package = 22 lb × 0.45359237 = 9.97903214 kg',
    );
  });

  test('explains invalid inputs next to the field', async ({ page }) => {
    await openTool(page, 'volumetric-weight-calculator');
    await page.getByLabel('Length').fill('50');
    await page.getByLabel('Width').fill('40');
    await page.getByLabel('Height').fill('30');
    await page.getByLabel('Actual weight').fill('0');
    await expect(page.getByText('This must be greater than zero.')).toBeVisible();
    await expect(page.getByLabel('Actual weight')).toHaveAttribute('aria-invalid', 'true');

    await page.getByLabel('Actual weight').fill('100001');
    await expect(page.getByText('Enter at most 100,000 kg per package.')).toBeVisible();

    await page.getByLabel('Actual weight').fill('8');
    await page.getByLabel('Packages').fill('2.5');
    await expect(page.getByText('The number of cartons must be a whole number.')).toBeVisible();

    await page.getByLabel('Packages').fill('1');
    await page.getByLabel('Divisor (cm³ per kg)').selectOption({ label: 'Custom' });
    await page.getByLabel('Custom divisor (cm³ per kg)').fill('999');
    await expect(
      page.getByText('Enter a divisor between 1,000 and 10,000 cm³ per kg.'),
    ).toBeVisible();
    await page.getByLabel('Custom divisor (cm³ per kg)').fill('5000.5');
    await expect(
      page.getByText('Enter a divisor between 1,000 and 10,000 cm³ per kg.'),
    ).toBeVisible();
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

test.describe('CSV to JSON', () => {
  test('converts the sample and links to JSON Formatter', async ({ page }) => {
    await openTool(page, 'csv-to-json');
    await page.getByRole('button', { name: 'Try sample' }).click();
    await expect(outputArea(page, 'csv-to-json')).toHaveValue(/"name": "Raj"/);
    await expect(island(page, 'csv-to-json')).toContainText('Rows');
    await openRelatedTools(page);
    await expect(
      page.getByRole('link', { name: 'JSON Formatter & Validator' }).first(),
    ).toBeVisible();
  });

  test('rejects a duplicate header with a clear error', async ({ page }) => {
    await openTool(page, 'csv-to-json');
    await inputArea(page, 'csv-to-json').fill('name,age,name\nRaj,50,Kumar');
    await expect(island(page, 'csv-to-json')).toHaveAttribute('data-phase', 'error');
    await expect(page.getByText('Duplicate column header "name" (column 3).')).toBeVisible();
  });

  test('rejects an inconsistent row length, naming the line', async ({ page }) => {
    await openTool(page, 'csv-to-json');
    await inputArea(page, 'csv-to-json').fill('name,age\nRaj,50\nAiva');
    await expect(island(page, 'csv-to-json')).toHaveAttribute('data-phase', 'error');
    await expect(
      page.getByText('Row at line 3 has 1 columns, but the header has 2.'),
    ).toBeVisible();
  });
});

test.describe('JSON to CSV', () => {
  test('converts the sample and links to CSV to JSON', async ({ page }) => {
    await openTool(page, 'json-to-csv');
    await page.getByRole('button', { name: 'Try sample' }).click();
    await expect(outputArea(page, 'json-to-csv')).toHaveValue(/name,age\nRaj,50\nAiva,19/);
    await expect(island(page, 'json-to-csv')).toContainText('Rows');
    await openRelatedTools(page);
    await expect(page.getByRole('link', { name: 'CSV to JSON' }).first()).toBeVisible();
  });

  test('shows a clear error for invalid JSON', async ({ page }) => {
    await openTool(page, 'json-to-csv');
    await inputArea(page, 'json-to-csv').fill('{not json}');
    await expect(island(page, 'json-to-csv')).toHaveAttribute('data-phase', 'error');
    await expect(page.getByText('The input is not valid JSON.')).toBeVisible();
  });

  test('rejects a nested object value, naming the key and item', async ({ page }) => {
    await openTool(page, 'json-to-csv');
    await inputArea(page, 'json-to-csv').fill('[{"a":{"b":1}}]');
    await expect(island(page, 'json-to-csv')).toHaveAttribute('data-phase', 'error');
    await expect(
      page.getByText(
        'The value for "a" in item 1 is a nested object or array, which is not supported in this version.',
      ),
    ).toBeVisible();
  });
});

test.describe('Timestamp Converter', () => {
  test('converts the sample timestamp to a UTC ISO date and links to JSON Formatter', async ({
    page,
  }) => {
    await openTool(page, 'timestamp-converter');
    await page.getByRole('button', { name: 'Try sample' }).click();
    await expect(outputArea(page, 'timestamp-converter')).toHaveValue('2023-11-14T22:13:20.000Z');
    await expect(island(page, 'timestamp-converter')).toContainText('Unix seconds');
    await openRelatedTools(page);
    await expect(
      page.getByRole('link', { name: 'JSON Formatter & Validator' }).first(),
    ).toBeVisible();
  });

  test('converts a date to a Unix timestamp, interpreted as UTC', async ({ page }) => {
    await openTool(page, 'timestamp-converter');
    await island(page, 'timestamp-converter')
      .getByText('Date → Timestamp', { exact: true })
      .click();
    await island(page, 'timestamp-converter').getByText('UTC', { exact: true }).click();
    await inputArea(page, 'timestamp-converter').fill('2023-11-14T22:13:20');
    await expect(outputArea(page, 'timestamp-converter')).toHaveValue('1700000000');
  });

  test('shows a clear error for an ambiguous-length timestamp', async ({ page }) => {
    await openTool(page, 'timestamp-converter');
    await inputArea(page, 'timestamp-converter').fill('12345678901');
    await expect(island(page, 'timestamp-converter')).toHaveAttribute('data-phase', 'error');
    await expect(
      page.getByText(
        'A 11-digit number could be seconds or milliseconds. Choose a unit to continue.',
      ),
    ).toBeVisible();
  });

  test('shows a clear error for an invalid date', async ({ page }) => {
    await openTool(page, 'timestamp-converter');
    await island(page, 'timestamp-converter')
      .getByText('Date → Timestamp', { exact: true })
      .click();
    await inputArea(page, 'timestamp-converter').fill('2023-02-30');
    await expect(island(page, 'timestamp-converter')).toHaveAttribute('data-phase', 'error');
    await expect(
      page.getByText(
        'That date or time does not exist, such as a day, month or time out of range.',
      ),
    ).toBeVisible();
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
    await produceResult(page, 'gst-calculator');
    await page.getByRole('button', { name: 'Copy result' }).click();
    const [text] = await copiedTexts(page);
    expect(text).toContain('Amount including GST: ₹1,180.00');
    expect(text).toContain('CGST = ₹1,000.00 × 9% = ₹90.00');
  });
});
