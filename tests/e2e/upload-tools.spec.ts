import { mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';
import { island, openTool, primaryResult } from '../support/tool-page.ts';

const ids = ['signature-resizer', 'photo-size-reducer'] as const;
type ToolId = (typeof ids)[number];
const widthLabel = (id: ToolId) =>
  id === 'signature-resizer' ? 'Signature width' : 'Maximum width';
const action = (page: Page, id: ToolId) =>
  page.getByRole('button', {
    name: id === 'signature-resizer' ? 'Download signature' : 'Download reduced photo',
  });

async function selectImage(page: Page, id: ToolId, noisy = false) {
  const encoded = await page.evaluate((noise) => {
    const canvas = document.createElement('canvas');
    canvas.width = noise ? 512 : 32;
    canvas.height = noise ? 256 : 8;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas unavailable');
    if (noise) {
      const pixels = context.createImageData(canvas.width, canvas.height);
      let seed = 37;
      pixels.data.forEach((_value, i) => {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        pixels.data[i] = i % 4 === 3 ? 255 : seed >>> 24;
      });
      context.putImageData(pixels, 0, 0);
    } else context.fillRect(0, 0, 24, 8);
    return canvas.toDataURL('image/png').split(',')[1];
  }, noisy);
  await island(page, id)
    .locator('input[type="file"]')
    .setInputFiles({
      name: 'source.png',
      mimeType: 'image/png',
      buffer: Buffer.from(encoded, 'base64'),
    });
  await expect(page.getByLabel(widthLabel(id), { exact: true })).toHaveValue(noisy ? '512' : '32');
  await expect(
    page.getByLabel(id === 'signature-resizer' ? 'Signature height' : 'Maximum height', {
      exact: true,
    }),
  ).toHaveValue(noisy ? '256' : '8');
}

async function downloaded(page: Page, id: ToolId) {
  const pending = page.waitForEvent('download');
  await action(page, id).click();
  const download = await pending;
  const path = await download.path();
  if (!path) throw new Error('Download missing');
  const bytes = readFileSync(path);
  const decoded = await page.evaluate(async (raw) => {
    const bitmap = await createImageBitmap(new Blob([new Uint8Array(raw)]));
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas unavailable');
    context.drawImage(bitmap, 0, 0);
    const result = {
      width: bitmap.width,
      height: bitmap.height,
      pixels: [
        [0, 0],
        [33, 20],
        [34, 20],
        [50, 20],
        [63, 20],
      ].map(([x, y]) => Array.from(context.getImageData(x, y, 1, 1).data)),
    };
    bitmap.close();
    return result;
  }, Array.from(bytes));
  expect(Number(((await primaryResult(page).textContent()) ?? '').replace(/,/g, ''))).toBe(
    bytes.length,
  );
  return {
    ...decoded,
    size: bytes.length,
    name: download.suggestedFilename(),
    signature: Array.from(bytes.subarray(0, 3)),
  };
}

test('signature downloads exact centered pixels with white JPEG or preserved PNG alpha', async ({
  page,
}) => {
  await openTool(page, 'signature-resizer');
  await selectImage(page, 'signature-resizer');
  await page.getByLabel('Signature width', { exact: true }).fill('100');
  await page.getByLabel('Signature height', { exact: true }).fill('40');
  const jpg = await downloaded(page, 'signature-resizer');
  expect(jpg).toMatchObject({
    width: 100,
    height: 40,
    name: 'source-signature.jpg',
    signature: [255, 216, 255],
  });
  expect(jpg.pixels[0].slice(0, 3).every((value) => value >= 250)).toBe(true);
  expect(jpg.pixels[3].slice(0, 3).every((value) => value <= 10)).toBe(true);
  expect(jpg.pixels[4].slice(0, 3).every((value) => value >= 250)).toBe(true);
  await page.getByLabel('Output format').selectOption('png');
  const png = await downloaded(page, 'signature-resizer');
  expect(png).toMatchObject({
    width: 100,
    height: 40,
    name: 'source-signature.png',
    signature: [137, 80, 78],
  });
  expect(png.pixels).toEqual([
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 255],
    [0, 0, 0, 255],
    [0, 0, 0, 0],
  ]);
});

test('photo reducer verifies common and custom byte targets with explicit aspect-safe reduction', async ({
  page,
}) => {
  await openTool(page, 'photo-size-reducer');
  await selectImage(page, 'photo-size-reducer', true);
  await expect(page.getByRole('switch', { name: 'Allow smaller dimensions' })).not.toBeChecked();
  await page.getByRole('switch', { name: 'Allow smaller dimensions' }).click();
  for (const kb of [20, 50, 100, 200, 37]) {
    await page.getByLabel('Maximum file size', { exact: true }).fill(String(kb));
    const result = await downloaded(page, 'photo-size-reducer');
    expect(result.size).toBeLessThanOrEqual(kb * 1000);
    expect(result.name).toBe('source-reduced.jpg');
    expect(result.width).toBeLessThanOrEqual(512);
    expect(result.height).toBeLessThanOrEqual(256);
    expect(Math.abs(result.width - 2 * result.height)).toBeLessThanOrEqual(1);
    if (kb === 20) expect(result.width).toBeLessThan(512);
  }
});

for (const id of ids) {
  test(`${id} respects required controls before downloading`, async ({ page }) => {
    await openTool(page, id);
    await selectImage(page, id);
    const field = id === 'photo-size-reducer' ? 'Maximum file size' : 'Signature width';
    await page.getByLabel(field, { exact: true }).fill('');
    await action(page, id).click();
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(primaryResult(page)).toHaveCount(0);
  });
  test(`${id} rejects an unreachable target without downloading, recovers and resets`, async ({
    page,
  }) => {
    await openTool(page, id);
    await selectImage(page, id, true);
    const downloads: string[] = [];
    page.on('download', (download) => downloads.push(download.suggestedFilename()));
    await page.getByLabel('Output format').selectOption('png');
    await page.getByLabel('Maximum file size', { exact: true }).fill('1');
    await action(page, id).click();
    await expect(
      page.getByText(/The size limit was not reached within these settings/),
    ).toBeVisible();
    expect(downloads).toEqual([]);
    await expect(page.getByLabel(widthLabel(id), { exact: true })).toHaveValue('512');
    await page.getByLabel('Output format').selectOption('jpg');
    await page.getByLabel('Maximum file size', { exact: true }).fill('200');
    expect(await downloaded(page, id)).toMatchObject({ width: 512, height: 256 });
    await page.getByRole('button', { name: 'Clear all' }).click();
    await expect(primaryResult(page)).toHaveCount(0);
    await selectImage(page, id);
    await expect(page.getByLabel('Output format')).toHaveValue('jpg');
    await expect(page.getByLabel('Maximum file size', { exact: true })).toHaveValue(
      id === 'signature-resizer' ? '' : '100',
    );
  });
  for (const size of [
    { width: 1366, height: 768 },
    { width: 360, height: 800 },
  ]) {
    test(`${id} keyboard, accessibility and viewport ${size.width}`, async ({
      page,
      browserName,
    }) => {
      await page.setViewportSize(size);
      await openTool(page, id);
      await selectImage(page, id, id === 'photo-size-reducer');
      await page.getByLabel(widthLabel(id), { exact: true }).focus();
      await page.keyboard.press('Tab');
      await expect(
        page.getByLabel(id === 'signature-resizer' ? 'Signature height' : 'Maximum height', {
          exact: true,
        }),
      ).toBeFocused();
      await action(page, id).focus();
      const pending = page.waitForEvent('download');
      await page.keyboard.press('Enter');
      await pending;
      await expect(primaryResult(page)).toBeVisible();
      expect(await page.locator('details[open]').count()).toBe(0);
      const notes = page.locator('details[data-notes]');
      await expect(notes).toBeVisible();
      await notes.locator('summary').focus();
      await page.keyboard.press('Enter');
      await expect(notes.getByText('Verify the resized image before using it.')).toBeVisible();
      await page.keyboard.press('Enter');
      await expect(notes).not.toHaveAttribute('open');
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      const accessibility = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();
      expect(
        accessibility.violations.filter((violation) =>
          ['serious', 'critical'].includes(violation.impact ?? ''),
        ),
      ).toEqual([]);
      const directory = join(process.cwd(), 'tests/artifacts/screenshots');
      mkdirSync(directory, { recursive: true });
      await expect(page.getByRole('status').filter({ hasText: 'Downloaded' })).toHaveCount(0);
      await page.evaluate(() => scrollTo(0, 0));
      await page.screenshot({
        path: join(directory, `${id}-${browserName}-${size.width}x${size.height}.png`),
        fullPage: true,
      });
    });
  }
}
