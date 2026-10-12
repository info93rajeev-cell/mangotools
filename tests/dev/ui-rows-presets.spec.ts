import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import { expect, type Locator, type Page, test } from '@playwright/test';
import { gotoReady } from '../support/tool-page.ts';

const OUT = join(process.cwd(), 'tests/artifacts/screenshots');
const STORAGE_KEY = 'mt.toolPresets';
mkdirSync(OUT, { recursive: true });

const alpha = (page: Page) => page.locator('[data-tool-island="dev-preset-alpha"]');
const beta = (page: Page) => page.locator('[data-tool-island="dev-preset-beta"]');
const presetSelect = (manager: Locator) => manager.getByRole('combobox', { name: 'Saved preset' });

async function gotoHarness(page: Page) {
  await gotoReady(page, '/_dev/components');
  await expect(alpha(page).locator('[data-tool-presets]')).toBeVisible();
}

async function savePreset(manager: Locator, name: string) {
  await manager.getByRole('button', { name: 'Save as new' }).click();
  await manager.getByLabel('Preset name').fill(name);
  await manager.getByRole('button', { name: 'Save preset' }).click();
}

async function stored(page: Page) {
  return page.evaluate((key) => window.localStorage.getItem(key), STORAGE_KEY);
}

test('saved presets support explicit save, load, rename, delete, reset, and duplicate names', async ({
  page,
}) => {
  await gotoHarness(page);
  const manager = alpha(page);
  await expect(presetSelect(manager)).toBeDisabled();
  await manager.getByLabel('Amount (₹)').fill('1234.50');
  expect(await stored(page)).toBeNull();
  await savePreset(manager, 'Standard');
  const firstId = await presetSelect(manager).inputValue();
  await manager.getByLabel('Amount (₹)').fill('99');
  await manager.getByRole('button', { name: 'Load' }).click();
  await expect(manager.getByLabel('Amount (₹)')).toHaveValue('1234.50');
  await manager.getByRole('button', { name: 'Rename' }).click();
  await manager.getByLabel('Preset name').fill('Renamed');
  await manager.getByRole('button', { name: 'Save name' }).click();
  await expect(presetSelect(manager)).toHaveValue(firstId);
  await expect(presetSelect(manager).locator('option:checked')).toHaveText('Renamed');
  await savePreset(manager, 'Renamed');
  await expect(presetSelect(manager).locator('option')).toHaveCount(3);
  await manager.getByRole('button', { name: 'Reset', exact: true }).click();
  await expect(presetSelect(manager).locator('option')).toHaveCount(3);
  await manager.getByRole('button', { name: 'Delete', exact: true }).click();
  await manager.getByRole('button', { name: 'Delete preset' }).click();
  await expect(presetSelect(manager).locator('option')).toHaveCount(2);
  await manager.getByRole('button', { name: 'Delete all saved presets' }).click();
  await manager.getByRole('button', { name: 'Delete all', exact: true }).click();
  await expect(presetSelect(manager)).toBeDisabled();
});

test('saved presets isolate tools and accept names only from 1 through 60 characters', async ({
  page,
}) => {
  await gotoHarness(page);
  const manager = alpha(page);
  await savePreset(manager, '');
  await expect(manager.getByRole('alert')).toContainText('Enter a name');
  await manager.getByRole('button', { name: 'Cancel' }).click();
  await manager.getByRole('button', { name: 'Save as new' }).click();
  await expect(manager.getByLabel('Preset name')).toHaveAttribute('maxlength', '60');
  await manager.getByRole('button', { name: 'Cancel' }).click();
  await savePreset(manager, 'x'.repeat(60));
  await expect(presetSelect(manager).locator('option')).toHaveCount(2);
  await expect(presetSelect(beta(page))).toBeDisabled();
  const doc = JSON.parse((await stored(page)) ?? '{}');
  expect(Object.keys(doc.tools)).toEqual(['dev-preset-alpha']);
});

test('saved presets reject over-limit, newer-version, and corrupt browser data safely', async ({
  page,
}) => {
  await gotoHarness(page);
  const overLimit = { version: 1, tools: { 'dev-preset-alpha': [] as unknown[] } };
  for (let index = 0; index < 20; index++) {
    overLimit.tools['dev-preset-alpha'].push({ id: `p${index}`, name: `P${index}`, values: {} });
  }
  await page.evaluate(
    ([key, value]) => localStorage.setItem(key, value),
    [STORAGE_KEY, JSON.stringify(overLimit)],
  );
  await page.reload();
  await savePreset(alpha(page), 'One more');
  await expect(alpha(page).getByRole('alert')).toContainText('limit of saved presets');
  await page.evaluate((key) => localStorage.setItem(key, '{broken'), STORAGE_KEY);
  await page.reload();
  await expect(presetSelect(alpha(page))).toBeDisabled();
  await page.evaluate((key) => localStorage.setItem(key, '{"version":2,"tools":{}}'), STORAGE_KEY);
  await page.reload();
  await savePreset(alpha(page), 'Blocked');
  await expect(alpha(page).getByRole('alert')).toContainText('newer version');
});

test('preset actions stay local and never put entered values in requests, URLs, or console', async ({
  page,
}) => {
  const browserCalls: string[] = [];
  const messages: string[] = [];
  page.on('request', (request) => {
    if (request.resourceType() === 'fetch' || request.resourceType() === 'xhr') {
      browserCalls.push(`${request.method()} ${request.url()} ${request.postData() ?? ''}`);
    }
  });
  page.on('console', (message) => messages.push(message.text()));
  await gotoHarness(page);
  await page.evaluate(() => {
    const probe = { beacons: 0, history: 0 };
    Object.assign(window, { __privacyProbe: probe });
    const beacon = navigator.sendBeacon.bind(navigator);
    navigator.sendBeacon = (...args) => {
      probe.beacons += 1;
      return beacon(...args);
    };
    const push = history.pushState.bind(history);
    const replace = history.replaceState.bind(history);
    history.pushState = (...args) => {
      probe.history += 1;
      return push(...args);
    };
    history.replaceState = (...args) => {
      probe.history += 1;
      return replace(...args);
    };
  });
  const initialUrl = page.url();
  const secret = 'private-value-8462';
  await alpha(page).getByLabel('Amount (₹)').fill('8462');
  await savePreset(alpha(page), secret);
  expect(browserCalls).toEqual([]);
  expect(messages.join('\n')).not.toContain(secret);
  expect(page.url()).toBe(initialUrl);
  expect(
    await page.evaluate(
      () =>
        (window as unknown as { __privacyProbe: { beacons: number; history: number } })
          .__privacyProbe,
    ),
  ).toEqual({ beacons: 0, history: 0 });
  expect(await stored(page)).toContain(secret);
});

test('preset managers are keyboard accessible and have no serious accessibility violations', async ({
  page,
}) => {
  await gotoHarness(page);
  const manager = alpha(page);
  await manager.getByRole('button', { name: 'Save as new' }).focus();
  await page.keyboard.press('Enter');
  await expect(manager.getByLabel('Preset name')).toBeVisible();
  await manager.getByLabel('Preset name').focus();
  await page.keyboard.type('Keyboard');
  await page.keyboard.press('Enter');
  await expect(manager.getByRole('status')).toContainText('Saved');
  const results = await new AxeBuilder({ page }).include('[data-dev-presets-section]').analyze();
  expect(
    results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical'),
  ).toEqual([]);
});

test('preset manager screenshots remain overflow-free on desktop and mobile', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await gotoHarness(page);
  await savePreset(alpha(page), 'Desktop');
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    .toBe(true);
  await page.addStyleTag({ content: '.site-header { position: static !important; }' });
  await page
    .locator('[data-dev-presets-section]')
    .screenshot({ path: join(OUT, 'platform-presets-desktop.png') });
  await page.setViewportSize({ width: 360, height: 800 });
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    .toBe(true);
  await page
    .locator('[data-dev-presets-section]')
    .screenshot({ path: join(OUT, 'platform-presets-mobile.png') });
});

test('public tools remain opted out', async ({ page }) => {
  await gotoReady(page, '/gst-calculator');
  await expect(page.locator('[data-tool-island="gst-calculator"]')).toBeVisible();
  await expect(page.locator('[data-tool-presets]')).toHaveCount(0);
});
