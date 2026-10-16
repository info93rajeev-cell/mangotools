import { expect, test } from '@playwright/test';
import type { AmazonEvidence } from '../support/amazon-evidence.ts';
import { control, manualFees, openEvidence, truth } from '../support/amazon-evidence.ts';

test('Amazon final evidence: basic and hand-verified manual fee estimate', async ({ page }) => {
  const d = await openEvidence(page);
  expect(await d.verify()).toMatchObject(truth('001-sample'));
  await expect(page.getByText('No Amazon fees are configured.', { exact: false })).toBeVisible();
  await expect(page.getByText('Product GST is not modelled.', { exact: false })).toBeVisible();
  await d.configure(manualFees);
  expect(await d.verify()).toMatchObject(truth('002-manual-fees'));
  await page.getByText('Amazon fee breakdown', { exact: true }).first().click();
  for (const name of ['Referral fee', 'Closing fee'])
    await expect(
      page.locator('[data-fee-row]').getByRole('cell', { name, exact: true }),
    ).toBeVisible();
});
test('Amazon final evidence: GST, withholding and exact collapse invariance', async ({ page }) => {
  const d = await openEvidence(page);
  await d.configure(manualFees);
  for (const mode of ['gst-inclusive', 'gst-exclusive']) {
    await d.configure({ productGstRatePercent: '12', sellingPriceTaxMode: mode });
    await d.verify();
  }
  await d.set('productGstRatePercent', '0');
  await d.verify();
  await expect(page.getByText('Product GST is not modelled.', { exact: false })).toHaveCount(0);
  await d.set('closingGstTreatment', 'recoverable');
  await expect(page.locator('[data-primary-result]')).toHaveCount(0);
  await expect(control(page, 'marketplaceFeeGstRatePercent')).toHaveValue('');
  await d.set('marketplaceFeeGstRatePercent', '5');
  const recovered = await d.verify();
  await d.set('closingGstTreatment', 'non-recoverable');
  const taxed = await d.verify();
  expect(recovered).toMatchObject({
    economicProfit: '515.00',
    recoverableMarketplaceFeeGst: '0.50',
  });
  expect(taxed).toMatchObject({
    economicProfit: '514.50',
    nonRecoverableMarketplaceFeeGst: '0.50',
  });
  expect(taxed.estimatedSettlement).toBe(recovered.estimatedSettlement);
  await d.set('productGstRatePercent', '12');
  for (const prefix of ['tcs', 'tds'])
    for (const mode of ['fixed', 'percent']) {
      await d.configure({ [`${prefix}Mode`]: mode, [`${prefix}Value`]: '2' });
      if (mode === 'percent')
        await d.set(
          `${prefix}PercentageBase`,
          prefix === 'tcs' ? 'customer-invoice-value' : 'tax-exclusive-revenue',
        );
      expect((await d.verify()).economicProfit).toBe(taxed.economicProfit);
    }
  await checkCollapse(d);
});
async function checkCollapse(d: AmazonEvidence) {
  const page = d.page;
  await d.configure({
    promotionalDiscount: '10',
    productGstRatePercent: '12',
    inventoryWriteOffAmount: '4',
    inventoryWriteOffApplyReturn: 'true',
  });
  const request = d.request();
  const result = await d.verify();
  const sections = [
    'showProductDetails',
    'showAmazonFees',
    'showShipping',
    'showTaxes',
    'showAdjustments',
  ];
  const entered = { ...d.values };
  for (const key of sections) await d.set(key, 'false');
  expect(d.request()).toEqual(request);
  expect(await d.verify()).toEqual(result);
  for (const key of sections) await d.set(key, 'true');
  for (const key of [
    'promotionalDiscount',
    'productGstRatePercent',
    'marketplaceFeeGstRatePercent',
  ])
    await expect(control(page, key)).toHaveValue(String(entered[key]));
}
for (const [scenario, suffix] of [
  ['customer-return', 'Return'],
  ['rto', 'Rto'],
  ['cancellation', 'Cancellation'],
]) {
  test(`Amazon final evidence: ${scenario} recognition and five adjustment effects`, async ({
    page,
  }) => {
    const d = await openEvidence(page);
    await d.configure({
      ...manualFees,
      scenario,
      productGstRatePercent: '12',
      otherAdjustmentDirection: 'credit',
    });
    for (const [prefix, amount, effects] of [
      ['returnCharge', '5', 'both'],
      ['reverseLogistics', '10', 'both'],
      ['reimbursement', '15', 'settlement'],
      ['inventoryWriteOff', '40', ''],
      ['otherAdjustment', '10', 'both'],
    ]) {
      await d.configure({ [`${prefix}Amount`]: amount, [`${prefix}Apply${suffix}`]: 'true' });
      if (effects) await d.set(`${prefix}Effects`, effects);
    }
    expect(await d.verify()).toMatchObject({
      revenueRecognised: '0.00',
      productCostRecognised: '0.00',
      productGstLiabilityRecognised: '0.00',
      marketplaceFeesTotal: '0.00',
      sellerControlledCostsTotal: '0.00',
      economicProfit: '-45.00',
      estimatedSettlement: '10.00',
      breakEvenSellingPrice: null,
    });
    await d.set('scenario', 'successful-sale');
    expect(await d.verify()).toMatchObject({
      scenarioEconomicCosts: '0.00',
      scenarioEconomicCredits: '0.00',
      scenarioSettlementDeductions: '0.00',
      scenarioSettlementCredits: '0.00',
    });
  });
}
