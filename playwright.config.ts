import { defineConfig, devices, type Project } from '@playwright/test';

/**
 * Suites run against two builds made by scripts/test/e2e.ts:
 *   apps/web/dist-prod (production settings) on :4321 — e2e, a11y, seo, screenshots
 *   apps/web/dist-dev  (development, with /_dev pages) on :4322 — determinism, dev
 * PW_BROWSERS limits browsers locally (CI runs chromium, firefox and webkit);
 * PW_CHROMIUM_PATH points at a preinstalled Chromium when Playwright's own is unavailable.
 */
const PROD = 'http://127.0.0.1:4321';
const DEV = 'http://127.0.0.1:4322';
const browsers = (process.env.PW_BROWSERS ?? 'chromium,firefox,webkit')
  .split(',')
  .map((b) => b.trim());
const chromiumPath = process.env.PW_CHROMIUM_PATH;

const DEVICE = {
  chromium: devices['Desktop Chrome'],
  firefox: devices['Desktop Firefox'],
  webkit: devices['Desktop Safari'],
} as const;

function use(browser: string, baseURL: string): Project['use'] {
  const device = DEVICE[browser as keyof typeof DEVICE];
  if (!device) throw new Error(`Unknown browser "${browser}" in PW_BROWSERS.`);
  const launch =
    browser === 'chromium' && chromiumPath
      ? { launchOptions: { executablePath: chromiumPath } }
      : {};
  return { ...device, ...launch, baseURL };
}

const perBrowser = (
  suite: string,
  testDir: string,
  baseURL: string,
  extra: Partial<Project> = {},
): Project[] =>
  browsers.map((browser) => ({
    name: `${suite}-${browser}`,
    testDir,
    use: use(browser, baseURL),
    ...extra,
  }));

export default defineConfig({
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  timeout: 30_000,
  expect: { timeout: 7_000 },
  reporter: process.env.CI
    ? [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]]
    : 'list',
  use: { trace: 'retain-on-failure' },
  projects: [
    ...perBrowser('e2e', 'tests/e2e', PROD, { testIgnore: /screenshots\.spec\.ts/ }),
    ...perBrowser('determinism', 'tests/determinism', DEV),
    ...perBrowser('dev', 'tests/dev', DEV),
    { name: 'a11y', testDir: 'tests/a11y', use: use('chromium', PROD) },
    { name: 'seo', testDir: 'tests/seo', use: use('chromium', PROD) },
    {
      name: 'screenshots',
      testDir: 'tests/e2e',
      testMatch: /screenshots\.spec\.ts/,
      use: use('chromium', PROD),
    },
  ],
  webServer: [
    {
      command: 'tsx tests/support/serve.ts apps/web/dist-prod 4321',
      url: PROD,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'tsx tests/support/serve.ts apps/web/dist-dev 4322',
      url: DEV,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
