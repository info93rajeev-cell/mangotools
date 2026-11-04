import { join } from 'node:path';
import { expect, type Page } from '@playwright/test';

/** Expected results of each tool's preset sample (the same values as the tool fixtures). */
export const SAMPLES = {
  // The studio's sample is engine fixture 023 (₹1,500 sale, fees claimed as ITC).
  'amazon-india-seller-fee-profit-estimator': { archetype: 'B', result: '₹291.19' },
  'gst-calculator': { archetype: 'B', result: '₹1,180.00' },
  'profit-margin-calculator': { archetype: 'B', result: '₹81.36' },
  'markup-calculator': { archetype: 'B', result: '₹250.00' },
  'cbm-calculator': { archetype: 'B', resultPattern: /^6\.000 m³$/ },
  'concrete-quantity-calculator': { archetype: 'B', resultPattern: /^3\.150/ },
  'excavation-calculator': { archetype: 'B', resultPattern: /^12\.000/ },
  'brickwork-calculator': { archetype: 'B', resultPattern: /^538/ },
  'plaster-calculator': { archetype: 'B', resultPattern: /^0\.120/ },
  'tile-flooring-calculator': { archetype: 'B', resultPattern: /^245/ },
  'paint-calculator': { archetype: 'B', resultPattern: /^7\.504/ },
  'export-commercial-invoice-generator': { archetype: 'B', result: '1,750.00' },
  'export-packing-list-generator': { archetype: 'B', result: '10' },
  'volumetric-weight-calculator': { archetype: 'B', result: '120.000' },
  'container-loading-calculator': { archetype: 'B', result: '500' },
  'pallet-loading-calculator': { archetype: 'B', result: '56' },
  'json-formatter': { archetype: 'A', result: '"id": 12345678901234567890' },
  // The studio's Sample Text button loads the reference sample shown on first open.
  'base64-encode-decode': {
    archetype: 'A',
    result: 'SGVsbG8sIEJleW9uZFRoZUFJISDwn5GLCkJhc2U2NCBlbmNvZGluZyBleGFtcGxlIHdpdGggVW5pY29kZS4K',
  },
  // The studio's Example URLs button loads the reference example shown on first open.
  'url-encode-decode': {
    archetype: 'A',
    result: 'https%3A%2F%2Fbeyandtheai.com%2Fsearch%3Fq%3Ddeveloper%20tools\n%26lang%3Den',
  },
  // The studio's Sample CSV button loads the reference sample shown on first open.
  'csv-to-json': { archetype: 'A', result: '"name": "John Doe"' },
  // The studio's Load sample button loads the reference records shown on first open.
  'json-to-csv': { archetype: 'A', result: 'Asha Rao,Delhi,00124,true' },
  'timestamp-converter': { archetype: 'A', result: '2023-11-14T22:13:20.000Z' },
} as const;

/**
 * Tools with no canned "Try sample" (archetype D, file-based): real files are uploaded through the
 * underlying file input instead, and `result` is the expected primary-result text afterward. This
 * pattern is generic for any future file-based tool, not specific to PDF Merge.
 */
export const FILE_TOOLS = {
  'signature-resizer': {
    archetype: 'D',
    files: [join(process.cwd(), 'tools/image-resize/fixtures/files/sample.jpg')],
    downloadCta: 'Download signature',
    resultPattern: /^\d+$/,
  },
  'photo-size-reducer': {
    archetype: 'D',
    files: [join(process.cwd(), 'tools/image-resize/fixtures/files/sample.jpg')],
    downloadCta: 'Download reduced photo',
    resultPattern: /^\d+$/,
  },
  'pdf-merge': {
    archetype: 'D',
    files: [
      join(process.cwd(), 'tools/pdf-merge/fixtures/files/one-page.pdf'),
      join(process.cwd(), 'tools/pdf-merge/fixtures/files/two-page.pdf'),
    ],
    downloadCta: /Download (merged )?PDF/i,
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
  'pdf-split': {
    archetype: 'D',
    files: [join(process.cwd(), 'tools/pdf-split/fixtures/files/five-page.pdf')],
    downloadCta: /Download (ZIP|PDF)/i,
    // Defaults are startPage=1, endPage=1, always valid for any non-empty PDF (unlike Image Crop's own
    // real-world default, which needed a test-only override to fit the tiny shared sample.jpg fixture).
    // The primary output is the output file name, derived from the original name plus the page range.
    result: 'five-page-pages-1-1.pdf',
  },
  'image-background-remover': {
    archetype: 'D',
    files: [join(process.cwd(), 'tools/image-background-remover/fixtures/files/sample.jpg')],
    downloadCta: /Download (transparent image|PNG)/i,
    result: 'sample-no-bg.png',
  },
  'image-resize': {
    archetype: 'D',
    files: [join(process.cwd(), 'tools/image-resize/fixtures/files/sample.jpg')],
    downloadCta: 'Download resized image',
    // sample.jpg is 8x8; the preview prefills width/height from its natural size, and with
    // "keep aspect ratio" on (the default) an 8x8 target on an 8x8 source is an exact fit.
    result: '8',
  },
  'passport-photo-resizer': {
    archetype: 'D',
    files: [join(process.cwd(), 'tools/image-resize/fixtures/files/sample.jpg')],
    downloadCta: /Download( passport photo)?/i,
    // Existing 8x8 source dimensions initialize the fields; no official passport size is assumed.
    result: '8',
  },
  'image-compress': {
    archetype: 'D',
    files: [join(process.cwd(), 'tools/image-compress/fixtures/files/photo.jpg')],
    downloadCta: 'Download compressed image',
    // The primary output is the size-reduction percentage (strictly positive under the byte-reduction contract).
    resultPattern: /^\d+(\.\d+)?%$/,
  },
  'image-format-converter': {
    archetype: 'D',
    files: [join(process.cwd(), 'tools/image-format-converter/fixtures/files/sample.jpg')],
    downloadCta: 'Download converted image',
    // The primary output is the resolved output format; the preset's default target is PNG.
    result: 'png',
  },
  'image-metadata-remover': {
    archetype: 'D',
    files: [join(process.cwd(), 'tools/image-metadata-remover/fixtures/files/sample.jpg')],
    downloadCta: 'Download cleaned image',
    // The primary output is the output file name; the default output format is "same as input" (jpg for
    // this sample.jpg fixture), so the derived name keeps the .jpg extension.
    result: 'sample-cleaned.jpg',
  },
  'image-watermark': {
    archetype: 'D',
    files: [join(process.cwd(), 'tools/image-watermark/fixtures/files/sample.jpg')],
    downloadCta: 'Download watermarked image',
    // Unlike every other file tool so far, Watermark has a required field with no default value
    // (watermark text) — produceResult fills it by label before clicking download, generic for any
    // future file tool with its own required text field, not Watermark-specific.
    fillBeforeDownload: { 'Watermark text': 'Sample' },
    // The primary output is the output file name; the default output format is "same as input" (jpg for
    // this sample.jpg fixture), so the derived name keeps the .jpg extension.
    result: 'sample-watermarked.jpg',
  },
  'image-crop': {
    archetype: 'D',
    files: [join(process.cwd(), 'tools/image-crop/fixtures/files/sample.jpg')],
    downloadCta: 'Download cropped image',
    // sample.jpg is 8x8; the preset's own real-world default crop (100x100) would be out of bounds for
    // it, so the shared harness narrows the crop to fit this tiny fixture — a real user's own default
    // stays a normal-photo-sized 100x100, unaffected by this test-only override.
    fillBeforeDownload: { 'Crop width': '4', 'Crop height': '4' },
    // The primary output is the output file name; the default output format is "same as input" (jpg for
    // this sample.jpg fixture), so the derived name keeps the .jpg extension.
    result: 'sample-cropped.jpg',
  },
  'image-enlarger': {
    archetype: 'D',
    files: [join(process.cwd(), 'tools/image-resize/fixtures/files/sample.jpg')],
    downloadCta: 'Download enlarged image',
    result: '1600',
  },
} as const;

export type ToolId = keyof typeof SAMPLES | keyof typeof FILE_TOOLS;
export const TOOL_IDS = [...Object.keys(SAMPLES), ...Object.keys(FILE_TOOLS)] as ToolId[];

export const hasSample = (id: string): id is keyof typeof SAMPLES => id in SAMPLES;

export const CIVIL_TOOL_IDS = new Set([
  'brickwork-calculator',
  'concrete-quantity-calculator',
  'excavation-calculator',
  'paint-calculator',
  'plaster-calculator',
  'tile-flooring-calculator',
]);

export const isCivilTool = (id: string): boolean => CIVIL_TOOL_IDS.has(id);

export const LOGISTICS_STUDIO_IDS = new Set([
  'cbm-calculator',
  'container-loading-calculator',
  'pallet-loading-calculator',
  'volumetric-weight-calculator',
]);

export const isLogisticsStudio = (id: string): boolean => LOGISTICS_STUDIO_IDS.has(id);

export const island = (page: Page, id: string) => {
  if (id === 'cbm-calculator') return page.locator('[data-cbm-workspace]');
  if (id === 'container-loading-calculator') return page.locator('[data-container-workspace]');
  if (id === 'pallet-loading-calculator') return page.locator('[data-pallet-loading-workspace]');
  if (id === 'volumetric-weight-calculator')
    return page.locator('[data-volumetric-weight-workspace]');
  if (CIVIL_TOOL_IDS.has(id)) return page.locator('.civil-workspace-container');
  return page.locator(`[data-tool-island="${id}"]`);
};
export const primaryResult = (page: Page) =>
  page.locator(
    '[data-primary-result] output, [data-cbm-total], [data-container-workspace] strong[data-load-kpi="0"], [data-pallet-loading-workspace] span[class*="kpiValue"]:first-of-type, [data-volumetric-weight-workspace] [class*="chargeableValue"], [data-tax-results-card] span[class*="headlineAmount"], .civil-workspace-container .kpis .kpi:first-child strong',
  );
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

/** Opens the shared related-tools disclosure before interacting with its links. */
export async function openRelatedTools(page: Page): Promise<void> {
  const related = page.locator('details#related-tools');
  const summary = related.locator('summary');
  // Data studios show the guide sections as info pills in the action row instead of summaries.
  if (await summary.isVisible()) await summary.click();
  else await page.getByRole('button', { name: 'Related tools' }).first().click();
  await expect(related).toHaveAttribute('open');
}

export async function waitForResult(page: Page, id: string): Promise<void> {
  if (id === 'cbm-calculator') {
    await expect(page.locator('[data-cbm-total]')).toBeVisible();
    return;
  }
  if (id === 'container-loading-calculator') {
    await expect(
      page.locator('[data-container-workspace] strong[data-load-kpi="0"]'),
    ).toBeVisible();
    return;
  }
  if (id === 'pallet-loading-calculator') {
    await expect(
      page.locator('[data-pallet-loading-workspace] span[class*="kpiValue"]').first(),
    ).toBeVisible();
    return;
  }
  if (id === 'volumetric-weight-calculator') {
    await expect(
      page.locator('[data-volumetric-weight-workspace] [class*="chargeableValue"]'),
    ).toBeVisible();
    return;
  }
  if (id === 'gst-calculator') {
    await expect(page.locator('[data-tax-results-card]')).toBeVisible();
    return;
  }
  if (id === 'markup-calculator' || id === 'amazon-india-seller-fee-profit-estimator') {
    // The studio runs its engine in the worker and shows "…" until the answer arrives.
    await expect(primaryResult(page)).not.toHaveText('…');
    return;
  }
  if (id === 'pdf-merge' || id === 'pdf-split') {
    await expect(page.getByText(/Ready to (merge|split)/)).toBeVisible();
    return;
  }
  if (id === 'image-background-remover') {
    await expect(page.locator('[data-image-bg-remover-layout]')).toBeVisible();
    return;
  }
  if (CIVIL_TOOL_IDS.has(id)) {
    await expect(page.locator('.civil-workspace-container .results')).toHaveAttribute(
      'data-stale',
      'false',
    );
    await expect(
      page.locator('.civil-workspace-container .kpis .kpi strong').first(),
    ).toBeVisible();
    return;
  }
  await expect(island(page, id)).toHaveAttribute('data-phase', 'result');
}

/**
 * Waits for a single-file tool's image preview (if it has one) to finish decoding, so any fields
 * it prefills from the image's natural dimensions (Image Resize's width/height) are settled before
 * the caller acts on the form — generic for any future preview-based file tool, not Image Resize
 * specific.
 */
async function waitForPreviewDecode(page: Page, id: string): Promise<void> {
  const preview = island(page, id).locator(
    id === 'image-crop' ? 'section[aria-label="Visual Crop Canvas"] img' : 'img',
  );
  if ((await preview.count()) === 0) return;
  await preview
    .first()
    .evaluate(
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
    const tool = FILE_TOOLS[id as keyof typeof FILE_TOOLS];
    await island(page, id)
      .locator('input[type="file"]')
      .first()
      .setInputFiles([...tool.files]);
    await waitForPreviewDecode(page, id);
    if ('fillBeforeDownload' in tool) {
      for (const [label, value] of Object.entries(tool.fillBeforeDownload)) {
        await page.getByLabel(label).fill(value);
      }
    }
    // Crop has a separate processing action before its result download is available.
    if (id === 'image-crop') await island(page, id).locator('[data-crop-button]').click();
    await page.getByRole('button', { name: tool.downloadCta }).click();
  } else if (isLogisticsStudio(id) || id === 'gst-calculator') {
    // The Logistics studios and Universal Tax worksheets open already filled with their calculation result
    // (the approved designs have no "Try sample" control), so their result is waited for, not produced.
  } else if (CIVIL_TOOL_IDS.has(id)) {
    // Civil workspaces open pre-calculated with default reference values; pressing Calculate performs the calculation.
    const calc = island(page, id).locator('button.calculate');
    await calc.click();
  } else {
    // Every sample control carries data-try-sample, whatever its visible label.
    await island(page, id).locator('[data-try-sample]').first().click();
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
