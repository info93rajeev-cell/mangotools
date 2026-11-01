import { expect, test } from '@playwright/test';

function checkVerticalAlignment(): string[] {
  const getR = (sel: string) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { top: r.top, bottom: r.bottom };
  };

  const work = getR('main[class*="work"]');
  const inputPanel = getR('section[class*="inputPanel"]');
  const outputPanel = getR('section[class*="outputPanel"]');
  const aux = getR('div[class*="aux"]');
  const statusBar = getR('div[class*="statusBar"]');

  const violations: string[] = [];

  if (work && inputPanel && inputPanel.bottom > work.bottom + 1.5) {
    violations.push(`inputPanel bottom extends past work bottom`);
  }
  if (work && outputPanel && outputPanel.bottom > work.bottom + 1.5) {
    violations.push(`outputPanel bottom extends past work bottom`);
  }
  if (work && aux && aux.top < work.bottom - 1.5) {
    violations.push(`aux top is above work bottom`);
  }
  if (aux && statusBar && statusBar.top < aux.bottom - 1.5) {
    violations.push(`statusBar top is above aux bottom`);
  }

  return violations;
}

function checkCardClipping(): string[] {
  const violations: string[] = [];
  const cards = Array.from(document.querySelectorAll('div[class*="aux"] > section'));
  for (let i = 0; i < cards.length; i++) {
    const c = cards[i] as HTMLElement;
    if (c.scrollHeight > c.clientHeight + 2) {
      violations.push(`Option card ${i + 1} has clipped overflow`);
    }
  }
  return violations;
}

const REQUIRED_LABELS = [
  'Indentation',
  'Key sorting',
  'Highlight syntax',
  'Show line numbers',
  'Auto format on paste',
  'Detect duplicate keys',
  'Validate against JSON Schema',
  'Allow comments (JSON5)',
  'Handle large numbers safely',
  'Validation Result',
  'Valid JSON',
  'Characters',
  'Lines',
  'Size',
  'Depth',
  'Search in JSON',
  'Match case',
  'Use regex',
  'Examples',
];

const DATA_STUDIO_TOOLS = [
  'base64-encode-decode',
  'url-encode-decode',
  'csv-to-json',
  'json-to-csv',
  'timestamp-converter',
];

test('json-formatter desktop layout checks at 1440x900 and 1366x768', async ({ page }) => {
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 1366, height: 768 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto('/json-formatter');
    await page.waitForLoadState('networkidle');
    await page.waitForFunction(() => document.querySelectorAll('astro-island[ssr]').length === 0);

    // 1. Assert visible H1 and description
    const h1 = page.locator('h1').first();
    await expect(h1).toBeVisible();
    await expect(h1).toHaveText('JSON Formatter & Validator');

    const summary = page.locator('.summary').first();
    await expect(summary).toBeVisible();

    // 2. Assert all option labels are visible in full
    for (const label of REQUIRED_LABELS) {
      await expect(page.getByText(label, { exact: false }).first()).toBeVisible();
    }

    // 3. Assert panels and rows do not intersect vertically
    const alignViolations = await page.evaluate(checkVerticalAlignment);
    expect(alignViolations).toEqual([]);

    const clipViolations = await page.evaluate(checkCardClipping);
    expect(clipViolations).toEqual([]);
  }
});

test('other data studio desktop layouts check at 1440x900 and 1366x768', async ({ page }) => {
  for (const slug of DATA_STUDIO_TOOLS) {
    for (const viewport of [
      { width: 1440, height: 900 },
      { width: 1366, height: 768 },
    ]) {
      await page.setViewportSize(viewport);
      await page.goto(`/${slug}`);
      await page.waitForLoadState('networkidle');
      await page.waitForFunction(() => document.querySelectorAll('astro-island[ssr]').length === 0);

      // Assert visible H1
      const h1 = page.locator('h1').first();
      await expect(h1).toBeVisible();

      // Assert panels and rows do not intersect vertically
      const alignViolations = await page.evaluate(checkVerticalAlignment);
      expect(alignViolations).toEqual([]);

      const clipViolations = await page.evaluate(checkCardClipping);
      expect(clipViolations).toEqual([]);
    }
  }
});
