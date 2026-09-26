import { expect, test } from '@playwright/test';

interface CaseResult {
  ok: boolean;
  outputWidth?: number;
  outputHeight?: number;
  outputFormat?: string;
  warnings?: string[];
  errorCode?: string;
}

/**
 * TASK-005B PR 1: proves `image.resize@1`'s real canvas pipeline works in a real browser, before any
 * visible tool exists. Asserts decoded dimensions, format, warnings and error codes — never byte-hash
 * equality (see engines/image/README.md's "Determinism" section for why that bar does not apply here).
 */
test('image.resize@1 runs for real in the browser: dimensions, format, warnings, and error codes', async ({
  page,
}) => {
  await page.goto('/_dev/image-foundation');
  const results = page.locator('#image-foundation-results');
  await expect(results).toHaveAttribute('data-done', 'true', { timeout: 20_000 });
  const cases = JSON.parse((await results.textContent()) ?? '{}') as Record<string, CaseResult>;

  // 40x30 source, 20x15 target, matching aspect ratio: no distortion, no upscale.
  expect(cases['basic-resize-same-format']).toMatchObject({
    ok: true,
    outputWidth: 20,
    outputHeight: 15,
    outputFormat: 'png',
  });

  // 40x30 fit into a 100x10 box, aspect-locked: limited by height (scale 1/3) -> 13x10.
  expect(cases['keep-aspect-ratio-fit-box']).toMatchObject({
    ok: true,
    outputWidth: 13,
    outputHeight: 10,
  });

  // 40x30 requested at 80x60 (2x): larger than the source in both axes -> upscale warning.
  const upscale = cases['upscale-quality-warning'];
  expect(upscale).toMatchObject({ ok: true, outputWidth: 80, outputHeight: 60 });
  expect(upscale?.warnings).toContain('IMAGE_UPSCALED_QUALITY_LOSS');

  const transparent = cases['transparent-png-to-jpg'];
  expect(transparent?.ok).toBe(true);
  expect(transparent?.outputFormat).toBe('jpg');
  expect(transparent?.warnings).toContain('IMAGE_TRANSPARENT_FLATTENED_TO_WHITE');

  // WebP support is browser-dependent (see engines/image README) — either a real WebP output, or a
  // graceful PNG fallback with its warning, is acceptable; a hard failure is not.
  const webp = cases['webp-output-graceful'];
  expect(webp?.ok).toBe(true);
  expect(['webp', 'png']).toContain(webp?.outputFormat);
  if (webp?.outputFormat === 'png') {
    expect(webp?.warnings).toContain('IMAGE_WEBP_NOT_SUPPORTED_FALLBACK_PNG');
  }

  expect(cases['output-dimensions-too-large']).toMatchObject({
    ok: false,
    errorCode: 'IMAGE_OUTPUT_DIMENSIONS_TOO_LARGE',
  });
  expect(cases['invalid-dimensions']).toMatchObject({
    ok: false,
    errorCode: 'IMAGE_DIMENSIONS_INVALID',
  });
  expect(cases['corrupted-image']).toMatchObject({ ok: false, errorCode: 'IMAGE_UNREADABLE' });
});
