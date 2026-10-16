import { readdirSync, readFileSync } from 'node:fs';
import { createTestContext, executeOperation } from '@mangotools/core';
import type { ResolvedPreset } from '@mangotools/schemas';
import { expect, type Page, type Request } from '@playwright/test';
import { parse } from 'yaml';
import { marketplaceManualProfitability as realOperation } from '../../engines/estimate/src/index.ts';
import { defaultValues, type FieldValues } from '../../packages/runtime/src/tool-input.ts';
import { formatMoney, formatPercent } from '../../packages/ui/src/format/numbers.ts';
import { amazonManualProfitabilityInput } from '../../packages/ui/src/toolkit/amazonManualProfitabilityInput.ts';
import { gotoReady, primaryResult } from './tool-page.ts';

export const slug = 'amazon-india-seller-fee-profit-estimator';
const assets = new Set(readdirSync('apps/web/dist-prod/assets').map((name) => `/assets/${name}`));
const preset: ResolvedPreset = JSON.parse(
  readFileSync('generated/presets/estimate/amazon.manual-profitability.json', 'utf8'),
);
export const truth = (id: string) =>
  parse(readFileSync(`tools/${slug}/fixtures/${id}.yaml`, 'utf8')).expected;
export const control = (page: Page, key: string) => page.locator(`#tool-${slug}-${key}`);
const money = (value: unknown) => formatMoney(String(value), { currency: 'INR' });
// Hand-verified TASK-008L example, identical financial configuration to tool fixture 002.
export const manualFees = {
  referralMode: 'percent',
  referralRatePercent: '7',
  referralGstTreatment: 'none',
  closingMode: 'fixed',
  closingAmount: '10',
  closingGstTreatment: 'none',
  packagingAmount: '5',
  tcsMode: 'fixed',
  tcsValue: '2',
};
/** Observe real worker requests without replacing the worker, adapter or calculation. */
export async function openEvidence(page: Page) {
  await page.addInitScript(() => {
    const runs: unknown[] = [];
    Reflect.set(window, 'amazonRuns', runs);
    const post = Worker.prototype.postMessage;
    Worker.prototype.postMessage = function (message, ...options: []) {
      if (message.type === 'run') runs.push(structuredClone(message));
      return post.call(this, message, ...options);
    };
  });
  const driver = new AmazonEvidence(page);
  page.on('request', (r) => driver.requests.push(r));
  page.on('pageerror', (e) => driver.errors.push(e.message));
  page.on('console', (m) => driver.errors.push(m.text()));
  await gotoReady(page, `/${slug}`);
  await driver.configure({ sellingPricePerUnit: '1000', productCostPerUnit: '400' });
  return driver;
}
export class AmazonEvidence {
  values: FieldValues = defaultValues(preset);
  readonly errors: string[] = [];
  readonly requests: Request[] = [];
  constructor(readonly page: Page) {}
  async set(key: string, value: string) {
    const field = preset.fields[key];
    for (const section of Object.keys(field.visibleWhen ?? {}).filter((k) => k.startsWith('show')))
      if (this.values[section] !== 'true') await this.set(section, 'true');
    const target = control(this.page, key);
    if (field.kind === 'boolean') {
      if ((await target.getAttribute('aria-checked')) !== value) await target.click();
    } else if (field.kind === 'enum') await target.selectOption(value);
    else await target.fill(value);
    this.values[key] = value;
  }
  async configure(values: Record<string, string>) {
    for (const [key, value] of Object.entries(values)) await this.set(key, value);
  }
  async rows(key: string, rows: Record<string, string>[]) {
    const source = preset.fields[key].rows;
    if (!source) throw new Error('Rows missing');
    for (const [index, row] of rows.entries()) {
      await control(this.page, `${key}-add`).press('Enter');
      await expect(this.page.locator(`[data-row="${index}"] input:focus`)).toHaveCount(1);
      for (const [cell, value] of Object.entries(row))
        await control(this.page, `${key}-${index}-${cell}`).fill(value);
    }
    this.values[key] = JSON.stringify(
      rows.map((row) => ({
        ...Object.fromEntries(Object.entries(source.columns).map(([k, c]) => [k, c.default ?? ''])),
        ...row,
      })),
    );
  }
  request() {
    const result = amazonManualProfitabilityInput(preset, this.values);
    if (!result.ok) throw new Error(result.error.code);
    return result.value;
  }
  audit() {
    expect(this.errors).toEqual([]);
    for (const r of this.requests) {
      const url = new URL(r.url());
      if (['blob:', 'data:'].includes(url.protocol)) continue;
      expect(url.origin).toBe(new URL(this.page.url()).origin);
      expect(url.search).toBe('');
      expect(
        assets.has(url.pathname) || [`/${slug}`, '/theme-init.js'].includes(url.pathname),
      ).toBe(true);
      expect(r.method()).toBe('GET');
      expect(r.postData()).toBeNull();
    }
  }
  async verify() {
    const { input, params } = this.request();
    await expect
      .poll(() =>
        this.page.evaluate(() => {
          const { input, params, operationId } = Reflect.get(window, 'amazonRuns').at(-1) ?? {};
          return { input, params, operationId };
        }),
      )
      .toEqual({ input, params, operationId: preset.operation });
    const result = await executeOperation(realOperation, input, params, createTestContext());
    if (!result.ok) throw new Error(`${result.error.code}: ${result.error.path}`);
    const output = result.value as Record<string, unknown>;
    await expect(primaryResult(this.page)).toHaveText(money(output.economicProfit));
    const root = this.page.locator('[data-amazon-result]');
    const keys = await root
      .locator('[data-output]')
      .evaluateAll((els) => els.map((el) => el.getAttribute('data-output') ?? ''));
    for (const key of keys) {
      const value = output[key];
      if (typeof value !== 'string' || key === 'economicProfit') continue;
      await expect(root.locator(`[data-output="${key}"] dd`)).toHaveText(
        key.endsWith('Percent') ? formatPercent(value) : money(value),
      );
    }
    await expect(root.locator('[data-fee-row] td:nth-child(4)')).toHaveText(
      (output.marketplaceFees as { amount: string }[]).map(
        (fee) => `Fee amount${money(fee.amount)}`,
      ),
    );
    this.audit();
    return output;
  }
}
