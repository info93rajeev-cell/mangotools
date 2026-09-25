import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { test } from '@playwright/test';
import { gotoReady, TOOL_IDS, waitForResult } from '../support/tool-page.ts';

const OUT = join(process.cwd(), 'tests/artifacts/screenshots');
mkdirSync(OUT, { recursive: true });

const SIZES = [
  { name: 'mobile', width: 360, height: 800 },
  { name: 'desktop', width: 1366, height: 768 },
];
const PAGES = [
  { name: 'home', path: '/', tool: null },
  { name: 'business', path: '/business', tool: null },
  { name: 'logistics', path: '/logistics', tool: null },
  ...TOOL_IDS.map((id) => ({ name: id, path: `/${id}`, tool: id })),
];

for (const size of SIZES) {
  for (const p of PAGES) {
    test(`${p.name} @ ${size.width}×${size.height}`, async ({ page }) => {
      await page.setViewportSize({ width: size.width, height: size.height });
      await gotoReady(page, p.path);
      if (p.tool) {
        await page.getByRole('button', { name: 'Try sample' }).click();
        await waitForResult(page, p.tool);
        await page.mouse.move(0, 0);
      }
      await page.screenshot({ path: join(OUT, `${p.name}-${size.name}.png`) });
    });
  }
}
