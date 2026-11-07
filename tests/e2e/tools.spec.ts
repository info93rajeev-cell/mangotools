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
    await page.locator('#tax-input-amount').fill('100000');
    await expect(primaryResult(page)).toHaveText('₹ 1,18,000.00');
    await expect(
      page
        .locator('[data-tax-results-card] [class*="breakdownRow"]')
        .filter({ hasText: 'CGST' })
        .locator('[class*="breakdownAmount"]'),
    ).toHaveText('₹ 9,000.00');
  });

  test('removes GST inter-state with rate', async ({ page }) => {
    await openTool(page, 'gst-calculator');
    await page.getByRole('button', { name: 'Inclusive Price' }).click();
    await page.getByRole('button', { name: 'Inter-state (IGST)' }).click();
    await page.getByLabel('Show pre-22 Sep 2025 rates (12%, 28%)').check();
    await page.locator('#gst-rate-select').selectOption('12');
    await page.locator('#tax-input-amount').fill('112');
    await expect(primaryResult(page)).toHaveText('₹ 112.00');
    await expect(
      page
        .locator('[data-tax-results-card] [class*="breakdownRow"]')
        .filter({ hasText: 'IGST' })
        .locator('[class*="breakdownAmount"]'),
    ).toHaveText('₹ 12.00');
    await expect(
      page.locator('[data-tax-results-card] [class*="breakdownRow"]').filter({ hasText: 'CGST' }),
    ).toHaveCount(0);
  });

  test('shows the odd-paisa split when removing GST', async ({ page }) => {
    await openTool(page, 'gst-calculator');
    await page.getByRole('button', { name: 'Inclusive Price' }).click();
    await page.locator('#tax-input-amount').fill('100');
    await expect(primaryResult(page)).toHaveText('₹ 100.00');
    await expect(
      page
        .locator('[data-tax-results-card] [class*="breakdownRow"]')
        .filter({ hasText: 'CGST' })
        .locator('[class*="breakdownAmount"]'),
    ).toHaveText('₹ 7.63');
    await expect(
      page
        .locator('[data-tax-results-card] [class*="breakdownRow"]')
        .filter({ hasText: 'SGST' })
        .locator('[class*="breakdownAmount"]'),
    ).toHaveText('₹ 7.62');
  });

  test('shows the disclaimer', async ({ page }) => {
    await openTool(page, 'gst-calculator');
    await expect(page.locator('[data-disclaimer]')).toContainText(
      'Results are provided for guidance.',
    );
  });
});

test.describe('Markup Calculator', () => {
  test('every mode comes from the engine, with ₹, working and errors', async ({ page }) => {
    await openTool(page, 'markup-calculator');
    const tool = island(page, 'markup-calculator');
    await page.locator('#markup-cost-price').fill('1000000');
    await page.locator('#markup-desired-pct').fill('50');
    await expect(primaryResult(page)).toHaveText('₹15,00,000.00');
    await expect(tool).toContainText('Selling price = ₹10,00,000.00 × (1 + 50%) = ₹15,00,000.00');

    await page.locator('#markup-gst-pricing').selectOption('18');
    await expect(tool).toContainText('Customer price with 18% GST');
    await expect(tool).toContainText('₹17,70,000.00');
    await page.locator('#markup-gst-pricing').selectOption('0');

    await tool.getByRole('tab', { name: 'Find markup %' }).click();
    await page.locator('#markup-cost-price').fill('100');
    await page.locator('#markup-mode-price').fill('80');
    await expect(primaryResult(page)).toHaveText('₹80.00');
    await expect(tool).toContainText('-20.00%');
    await expect(tool).toContainText('−₹20.00');

    await tool.getByRole('tab', { name: 'Target margin' }).click();
    await page.locator('#markup-cost-price').fill('500');
    await page.locator('#markup-mode-margin').fill('30');
    await expect(primaryResult(page)).toHaveText('₹714.29');
    await page.locator('#markup-mode-margin').fill('100');
    await expect(tool).toContainText('The margin must be less than 100%.');
  });
});

test.describe('Volumetric Weight Calculator', () => {
  test('compares actual and volumetric weight and states the billing basis', async ({ page }) => {
    await openTool(page, 'volumetric-weight-calculator');
    const tool = island(page, 'volumetric-weight-calculator');
    await expect(tool).toContainText('34.646 kg');
    await expect(tool).toContainText('VOLUMETRIC GOVERNS');
    await expect(page.locator('[data-disclaimer]')).toBeVisible();
    await openRelatedTools(page);
    await expect(page.getByRole('link', { name: 'CBM Calculator' }).first()).toBeVisible();
  });
});

test.describe('JSON Formatter', () => {
  test('validates syntax and provides error diagnostics', async ({ page }) => {
    await openTool(page, 'json-formatter');
    await inputArea(page, 'json-formatter').fill('{\n  "a": 1,\n}');
    await expect(page.getByText('Invalid JSON', { exact: true })).toBeVisible();
  });

  test('minify keeps numbers exactly', async ({ page }) => {
    await openTool(page, 'json-formatter');
    await island(page, 'json-formatter').getByText('Minify', { exact: true }).click();
    await inputArea(page, 'json-formatter').fill('{ "big": 12345678901234567890123, "p": 1.10 }');
    await expect(outputArea(page, 'json-formatter')).toHaveValue(
      '{"big":1.2345678901234568e+22,"p":1.1}',
    );
  });
});

test.describe('CSV to JSON', () => {
  test('converts the sample and links to JSON Formatter', async ({ page }) => {
    await openTool(page, 'csv-to-json');
    await island(page, 'csv-to-json').getByRole('button', { name: 'Sample CSV' }).click();
    await expect(outputArea(page, 'csv-to-json')).toHaveValue(/"name": "John Doe"/);
    await expect(island(page, 'csv-to-json')).toContainText('Total Rows');
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
    await page.getByRole('button', { name: 'Load sample' }).click();
    await expect(outputArea(page, 'json-to-csv')).toHaveValue(
      /name,city,sku,active\nAsha Rao,Delhi,00124,true/,
    );
    await expect(island(page, 'json-to-csv')).toContainText('Records');
    await openRelatedTools(page);
    await expect(page.getByRole('link', { name: 'CSV to JSON' }).first()).toBeVisible();
  });

  test('shows a clear error for invalid JSON', async ({ page }) => {
    await openTool(page, 'json-to-csv');
    await inputArea(page, 'json-to-csv').fill('{not json}');
    await expect(island(page, 'json-to-csv')).toHaveAttribute('data-phase', 'error');
    await expect(page.getByText('The input is not valid JSON.')).toBeVisible();
  });

  test('rejects a nested object value when asked to, naming the key and item', async ({ page }) => {
    await openTool(page, 'json-to-csv');
    await island(page, 'json-to-csv').getByLabel('Object handling').selectOption('reject');
    await inputArea(page, 'json-to-csv').fill('[{"a":{"b":1}}]');
    await expect(island(page, 'json-to-csv')).toHaveAttribute('data-phase', 'error');
    await expect(
      page.getByText(
        'The value for "a" in item 1 is a nested object or array. Flatten it or keep it as JSON text to convert it.',
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
    await expect(island(page, 'timestamp-converter')).toContainText('Unix Timestamp');
    await openRelatedTools(page);
    await expect(
      page.getByRole('link', { name: 'JSON Formatter & Validator' }).first(),
    ).toBeVisible();
  });

  test('converts a date to a Unix timestamp', async ({ page }) => {
    await openTool(page, 'timestamp-converter');
    await page.locator('input[type="date"]').fill('2024-01-01');
    await expect(island(page, 'timestamp-converter')).toContainText('1704067200');
  });

  test('shows clear status for custom timestamp', async ({ page }) => {
    await openTool(page, 'timestamp-converter');
    await inputArea(page, 'timestamp-converter').fill('1700000000');
    await expect(outputArea(page, 'timestamp-converter')).toHaveValue('2023-11-14T22:13:20.000Z');
  });
});

test.describe('Swap and copy', () => {
  test('Base64 swap decodes the encoded text back', async ({ page }) => {
    await openTool(page, 'base64-encode-decode');
    await inputArea(page, 'base64-encode-decode').fill('Hello, ₹');
    await expect(outputArea(page, 'base64-encode-decode')).toHaveValue('SGVsbG8sIOKCuQ==');
    await page.getByRole('button', { name: /Swap Input/ }).click();
    await expect(inputArea(page, 'base64-encode-decode')).toHaveValue('SGVsbG8sIOKCuQ==');
    await expect(outputArea(page, 'base64-encode-decode')).toHaveValue('Hello, ₹');
  });

  test('URL swap decodes the encoded text back', async ({ page }) => {
    await openTool(page, 'url-encode-decode');
    await inputArea(page, 'url-encode-decode').fill('café & crème');
    await expect(outputArea(page, 'url-encode-decode')).toHaveValue('caf%C3%A9%20%26%20cr%C3%A8me');
    await page.getByRole('button', { name: /Swap Input/ }).click();
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
    await page.getByRole('button', { name: /Copy Summary|Copy result/i }).click();
    const [text] = await copiedTexts(page);
    expect(text).toContain('Final Amount: ₹ 11,800.00');
    expect(text).toContain('CGST @ 9%: ₹ 900.00 (50%)');
  });
});
