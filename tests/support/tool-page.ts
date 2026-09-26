import { join } from 'node:path';
import { expect, type Page } from '@playwright/test';

/** Expected results of each tool's preset sample (the same values as the tool fixtures). */
export const SAMPLES = {
  'gst-calculator': { archetype: 'B', result: '₹1,180.00' },
  'profit-margin-calculator': { archetype: 'B', result: '20.00%' },
  'markup-calculator': { archetype: 'B', result: '₹250.00' },
  'cbm-calculator': { archetype: 'B', result: '6.000' },
  'volumetric-weight-calculator': { archetype: 'B', result: '120.000' },
  'container-loading-calculator': { archetype: 'B', result: '500' },
  'pallet-loading-calculator': { archetype: 'B', result: '56' },
  'json-formatter': { archetype: 'A', result: '"id": 12345678901234567890' },
  'base64-encode-decode': { archetype: 'A', result: 'SGVsbG8sIOKCuSB3b3JsZA==' },
  'url-encode-decode': {
    archetype: 'A',
    result: 'price%20range%3D%E2%82%B9500%E2%80%93%E2%82%B91%2C000%20%26%20sort%3Dasc',
  },
} as const;

/**
 * Tools with no canned "Try sample" (archetype D, file-based): real files are uploaded through the
 * underlying file input instead, and `result` is the expected primary-result text afterward. This
 * pattern is generic for any future file-based tool, not specific to PDF Merge.
 */
export const FILE_TOOLS = {
  'pdf-merge': {
    archetype: 'D',
    files: [
      join(process.cwd(), 'tools/pdf-merge/fixtures/files/one-page.pdf'),
      join(process.cwd(), 'tools/pdf-merge/fixtures/files/two-page.pdf'),
    ],
    result: '2',
  },
} as const;

export type ToolId = keyof typeof SAMPLES | keyof typeof FILE_TOOLS;
export const TOOL_IDS = [...Object.keys(SAMPLES), ...Object.keys(FILE_TOOLS)] as ToolId[];

export const hasSample = (id: string): id is keyof typeof SAMPLES => id in SAMPLES;

export const island = (page: Page, id: string) => page.locator(`[data-tool-island="${id}"]`);
export const primaryResult = (page: Page) => page.locator('[data-primary-result] output');
export const inputArea = (page: Page, id: string) => page.locator(`#tool-${id}-input`);
export const outputArea = (page: Page, id: string) => page.locator(`#tool-${id}-output`);

/** Opens a page and waits until every island on it has hydrated. */
export async function gotoReady(page: Page, path: string): Promise<void> {
  await page.goto(path);
  await page.waitForFunction(() => document.querySelectorAll('astro-island[ssr]').length === 0);
}

/** Opens a tool page and waits until its island is interactive. */
export async function openTool(page: Page, id: string): Promise<void> {
  await gotoReady(page, `/${id}`);
  await expect(island(page, id)).toBeVisible();
}

export async function waitForResult(page: Page, id: string): Promise<void> {
  await expect(island(page, id)).toHaveAttribute('data-phase', 'result');
}

/**
 * Produces a result the same way every shared suite (network, axe, screenshots, "Try sample")
 * checks it: clicking "Try sample" for a tool that has one, or uploading real files through the
 * underlying file input for a file-based tool (archetype D) that has none.
 */
export async function produceResult(page: Page, id: string): Promise<void> {
  if (id in FILE_TOOLS) {
    const files = FILE_TOOLS[id as keyof typeof FILE_TOOLS].files;
    await island(page, id)
      .locator('input[type="file"]')
      .setInputFiles([...files]);
    await page.getByRole('button', { name: 'Download merged PDF' }).click();
  } else {
    await page.getByRole('button', { name: 'Try sample' }).click();
  }
  await waitForResult(page, id);
}

/** Replaces the async clipboard with an in-page recorder (works in every browser engine). */
export async function stubClipboard(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const copied: string[] = [];
    Object.defineProperty(window, '__copied', { value: copied });
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async (text: string) => {
          copied.push(text);
        },
        readText: async () => copied.at(-1) ?? '',
      },
    });
  });
}

export const copiedTexts = (page: Page) =>
  page.evaluate(() => (window as unknown as { __copied: string[] }).__copied);
