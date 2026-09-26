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
    downloadCta: 'Download merged PDF',
    result: '2',
  },
  'jpg-to-pdf': {
    archetype: 'D',
    files: [
      join(process.cwd(), 'tools/jpg-to-pdf/fixtures/files/small-square.jpg'),
      join(process.cwd(), 'tools/jpg-to-pdf/fixtures/files/wide.jpg'),
    ],
    downloadCta: 'Download PDF',
    result: '2',
  },
  'image-resize': {
    archetype: 'D',
    files: [join(process.cwd(), 'tools/image-resize/fixtures/files/sample.jpg')],
    downloadCta: 'Download resized image',
    // sample.jpg is 8x8; the preview prefills width/height from its natural size, and with
    // "keep aspect ratio" on (the default) an 8x8 target on an 8x8 source is an exact fit.
    result: '8',
  },
  'image-compress': {
    archetype: 'D',
    files: [join(process.cwd(), 'tools/image-compress/fixtures/files/sample.jpg')],
    downloadCta: 'Download compressed image',
    // The primary output is the size-change percentage. This tiny (331-byte) hand-built source is
    // already smaller than any real photo's re-encode overhead, so Chromium's default-quality JPEG
    // re-encode actually grows it — a real, honest demonstration of "the output can be larger than the
    // original" (see the "warns when the output is larger" test below), not a chosen worst case.
    result: '−128.4%',
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
 * Waits for a single-file tool's image preview (if it has one) to finish decoding, so any fields
 * it prefills from the image's natural dimensions (Image Resize's width/height) are settled before
 * the caller acts on the form — generic for any future preview-based file tool, not Image Resize
 * specific.
 */
async function waitForPreviewDecode(page: Page, id: string): Promise<void> {
  const preview = island(page, id).locator('img');
  if ((await preview.count()) === 0) return;
  await preview.evaluate(
    (img: HTMLImageElement) =>
      img.complete ||
      new Promise((resolve) => img.addEventListener('load', resolve, { once: true })),
  );
}

/**
 * Produces a result the same way every shared suite (network, axe, screenshots, "Try sample")
 * checks it: clicking "Try sample" for a tool that has one, or uploading real files through the
 * underlying file input for a file-based tool (archetype D) that has none.
 */
export async function produceResult(page: Page, id: string): Promise<void> {
  if (id in FILE_TOOLS) {
    const { files, downloadCta } = FILE_TOOLS[id as keyof typeof FILE_TOOLS];
    await island(page, id)
      .locator('input[type="file"]')
      .setInputFiles([...files]);
    await waitForPreviewDecode(page, id);
    await page.getByRole('button', { name: downloadCta }).click();
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
