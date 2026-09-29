import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Registry } from '@mangotools/schemas';
import { expect, test } from '@playwright/test';
import { TOOL_IDS } from '../support/tool-page.ts';

const registry = JSON.parse(
  readFileSync(join(process.cwd(), 'generated/registry.json'), 'utf8'),
) as Registry;
const listed = registry.tools.filter((t) => t.listed);
const covered = new Set<string>(TOOL_IDS);

/** Privacy claims follow the registry's evidence-based `processing`, never a hard-coded badge. */
test.describe('privacy badge', () => {
  test('every tool claiming on-device processing is covered by the network test', () => {
    const onDevice = listed.filter((t) => t.processing === 'device').map((t) => t.id);
    expect(onDevice.filter((id) => !covered.has(id))).toEqual([]);
  });

  for (const tool of listed) {
    test(`${tool.id}: badge matches processing "${tool.processing}"`, async ({ page }) => {
      await page.goto(tool.url);
      const badge = page.locator('.tool-header .privacy');
      if (tool.processing === 'device') {
        await expect(badge).toHaveText(/Runs on your device/);
        await expect(badge).toHaveAttribute('data-processing', 'device');
      } else {
        await expect(badge).toHaveCount(0);
      }
    });
  }
});
