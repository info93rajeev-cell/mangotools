import { join } from 'node:path';
import { expect, test } from '@playwright/test';
import { island, openTool, produceResult } from '../support/tool-page.ts';

test('Crop shared preview decoding targets the source while both UI images remain', async ({
  page,
}) => {
  await openTool(page, 'image-crop');
  const tool = island(page, 'image-crop');
  await tool
    .locator('input[type="file"]')
    .setInputFiles(join(process.cwd(), 'tools/image-crop/fixtures/files/sample.jpg'));
  await expect(tool.getByRole('img', { name: 'sample.jpg', exact: true })).toBeVisible();
  await expect(tool.getByRole('img', { name: 'Live crop preview', exact: true })).toBeVisible();
  await produceResult(page, 'image-crop');
  await expect(tool.locator('[data-primary-result]')).toHaveText('sample-cropped.jpg');
  await expect(tool.getByRole('img', { name: 'sample.jpg', exact: true })).toBeVisible();
  await expect(tool.locator('[data-crop-result-image]')).toBeVisible();
});
