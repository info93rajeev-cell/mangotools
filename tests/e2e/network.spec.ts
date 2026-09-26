import { expect, type Request, test } from '@playwright/test';
import { openTool, produceResult, TOOL_IDS } from '../support/tool-page.ts';

/** Privacy: only same-origin GET requests for static files, with no request bodies. */
test.describe('network', () => {
  for (const id of TOOL_IDS) {
    test(`${id} makes no third-party requests and sends no data`, async ({ page, baseURL }) => {
      const requests: Request[] = [];
      page.on('request', (r) => requests.push(r));
      await openTool(page, id);
      await produceResult(page, id);
      await page.getByRole('combobox', { name: 'Search tools' }).fill('json');
      await expect(page.getByRole('option').first()).toBeVisible();
      const origin = new URL(baseURL ?? '').origin;
      for (const r of requests) {
        const url = new URL(r.url());
        if (url.protocol === 'data:' || url.protocol === 'blob:') continue;
        expect(url.origin, r.url()).toBe(origin);
        expect(r.method(), r.url()).toBe('GET');
        expect(r.postData(), r.url()).toBeNull();
      }
      expect(requests.some((r) => r.url().endsWith('/search-index.json'))).toBe(true);
    });
  }
});
