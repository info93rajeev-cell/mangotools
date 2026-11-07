import { expect, type Page, type Request } from '@playwright/test';
import { gotoReady } from './tool-page.ts';

export const slug = 'amazon-india-seller-fee-profit-estimator';

export const FIELD_TO_ID: Record<string, string> = {
  sellingPricePerUnit: '#amz-sp',
  sellingPrice: '#amz-sp',
  productCostPerUnit: '#amz-cost',
  productCost: '#amz-cost',
  packagingAmount: '#amz-packaging',
  packagingCost: '#amz-packaging',
  chargeableWeightValue: '#amz-weight',
  packedWeight: '#amz-weight',
  quantity: '#amz-qty',
  monthlyQty: '#amz-qty',
  productGstRatePercent: '#amz-product-gst',
  productGstRate: '#amz-product-gst',
  category: '#amz-category',
  referralAmount: '#amz-ref-fee',
  referralFee: '#amz-ref-fee',
  closingAmount: '#amz-closing-fee',
  closingFee: '#amz-closing-fee',
  weightHandlingAmount: '#amz-weight-handling',
  weightHandling: '#amz-weight-handling',
  claimFeeGstCredit: '#amz-itc',
  promotionalDiscount: '#amz-ads',
  adsPerOrder: '#amz-ads',
  inventoryWriteOffAmount: '#amz-returns',
  returnsPerOrder: '#amz-returns',
};

export const control = (page: Page, key: string) => {
  const sel = FIELD_TO_ID[key];
  return sel ? page.locator(sel) : page.locator(`#${key}`);
};

/** Observe real worker requests without replacing the worker, adapter or calculation. */
export async function openEvidence(page: Page) {
  await page.addInitScript(() => {
    const runs: unknown[] = [];
    Reflect.set(window, 'amazonRuns', runs);
    const post = Worker.prototype.postMessage;
    Worker.prototype.postMessage = function (message, ...options: []) {
      if (message && typeof message === 'object' && message.type === 'run') {
        runs.push(structuredClone(message));
      }
      return post.call(this, message, ...options);
    };
  });
  const driver = new AmazonEvidence(page);
  page.on('request', (r) => driver.requests.push(r));
  page.on('pageerror', (e) => driver.errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error' || /hydration|content[- ]security[- ]policy|\bCSP\b/i.test(m.text()))
      driver.errors.push(m.text());
  });
  await gotoReady(page, `/${slug}`);
  return driver;
}

export class AmazonEvidence {
  readonly errors: string[] = [];
  readonly requests: Request[] = [];
  constructor(readonly page: Page) {}

  async set(key: string, value: string) {
    const target = control(this.page, key);
    if (key === 'claimFeeGstCredit') {
      const isChecked = await target.isChecked();
      if (value === 'true' && !isChecked) await target.check();
      if (value === 'false' && isChecked) await target.uncheck();
    } else if (key === 'category' || key === 'productGstRatePercent' || key === 'productGstRate') {
      await target.selectOption(value);
    } else {
      await target.fill(value);
    }
  }

  async configure(values: Record<string, string>) {
    for (const [key, value] of Object.entries(values)) {
      await this.set(key, value);
    }
  }

  audit() {
    expect(this.errors).toEqual([]);
    for (const r of this.requests) {
      const url = new URL(r.url());
      if (['blob:', 'data:'].includes(url.protocol)) continue;
      expect(url.origin).toBe(new URL(this.page.url()).origin);
      expect(url.search).toBe('');
      const allowed =
        url.pathname.startsWith('/assets/') ||
        [
          `/${slug}`,
          '/theme-init.js',
          '/models-init.js',
          '/favicon.svg',
          '/favicon.ico',
          '/site.webmanifest',
        ].includes(url.pathname);
      if (!allowed) {
        console.warn('Unexpected request pathname in audit:', url.pathname);
      }
      expect(allowed).toBe(true);
      expect(r.method()).toBe('GET');
      expect(r.postData()).toBeNull();
    }
  }
}
