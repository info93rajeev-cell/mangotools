import { expect, test } from '@playwright/test';
import { inputArea, island, openTool, outputArea } from '../support/tool-page.ts';

const ID = 'base64-encode-decode';

test.describe('Base64 studio', () => {
  test('opens with the Unicode sample encoded', async ({ page }) => {
    await openTool(page, ID);
    await expect(outputArea(page, ID)).toHaveValue(/^SGVsbG8sIEJleW9uZFRoZUFJIS/);
    await expect(island(page, ID).getByText('Valid Base64')).toBeVisible();
  });

  test('Auto Detect decodes Base64 and encodes plain text', async ({ page }) => {
    await openTool(page, ID);
    await island(page, ID).getByRole('button', { name: 'Auto Detect', exact: true }).click();
    await inputArea(page, ID).fill('SGVsbG8sIOKCuQ==');
    await expect(outputArea(page, ID)).toHaveValue('Hello, ₹');
    await inputArea(page, ID).fill('Hello, world');
    await expect(outputArea(page, ID)).toHaveValue('SGVsbG8sIHdvcmxk');
  });

  test('URL safe and padding switches change the alphabet', async ({ page }) => {
    await openTool(page, ID);
    await inputArea(page, ID).fill('ûÿ');
    await expect(outputArea(page, ID)).toHaveValue('w7vDvw==');
    const studio = island(page, ID);
    await studio.locator('label', { hasText: 'URL safe encoding' }).click();
    await studio.locator('label', { hasText: 'Add padding' }).click();
    await expect(outputArea(page, ID)).toHaveValue('w7vDvw');
  });

  test('a Base64 image example decodes to a preview and a file download', async ({ page }) => {
    await openTool(page, ID);
    const studio = island(page, ID);
    await studio.getByRole('button', { name: 'File', exact: true }).last().click();
    await studio.getByRole('button', { name: 'Use' }).nth(1).click();
    await expect(studio.getByAltText('Decoded preview')).toBeVisible();
    await expect(studio.getByText('image/png', { exact: false }).first()).toBeVisible();
    const download = page.waitForEvent('download');
    await studio.getByRole('button', { name: 'Download as File' }).first().click();
    expect((await download).suggestedFilename()).toBe('decoded.png');
  });

  test('a file is encoded byte for byte', async ({ page }) => {
    await openTool(page, ID);
    const studio = island(page, ID);
    await studio.getByRole('button', { name: 'File', exact: true }).first().click();
    await studio.locator('label input[type="file"]').setInputFiles({
      name: 'bytes.bin',
      mimeType: 'application/octet-stream',
      buffer: Buffer.from([0, 255, 128, 65]),
    });
    await expect(outputArea(page, ID)).toHaveValue('AP+AQQ==');
  });

  test('invalid Base64 shows the engine error', async ({ page }) => {
    await openTool(page, ID);
    await island(page, ID).getByRole('button', { name: 'Decode', exact: true }).click();
    await inputArea(page, ID).fill('Zm9v!');
    await expect(island(page, ID).getByRole('alert')).toContainText('Invalid Base64 character');
  });
});
