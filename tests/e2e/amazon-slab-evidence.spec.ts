import { expect, test } from '@playwright/test';
import { control, openEvidence } from '../support/amazon-evidence.ts';

for (const prefix of ['referral', 'closing', 'weightHandling']) {
  test(`Amazon final evidence: ${prefix} slab bounds and canonical row correction`, async ({
    page,
  }) => {
    const d = await openEvidence(page);
    const weight = prefix === 'weightHandling';
    const key = `${prefix}${weight ? 'WeightSlabs' : 'PriceSlabs'}`;
    await d.configure({
      [`${prefix}Mode`]: weight ? 'weight-slabs' : 'price-slabs',
      [`${prefix}GstTreatment`]: 'none',
    });
    if (weight) await d.set('chargeableWeightValue', '1');
    const cell = weight ? 'amount' : 'value';
    await d.rows(key, [
      { max: weight ? '1' : '1000', [cell]: prefix === 'referral' ? '7' : '10' },
      { min: weight ? '1' : '1000', max: weight ? '2' : '2000', [cell]: '20' },
    ]);
    expect((await d.verify()).marketplaceFees).toMatchObject([
      { matchedSlabIndex: 0, amount: prefix === 'referral' ? '70.00' : '10.00' },
    ]);
    const matchKey = weight ? 'chargeableWeightValue' : 'sellingPricePerUnit';
    await d.set(matchKey, weight ? '1.001' : '1000.01');
    expect((await d.verify()).marketplaceFees).toMatchObject([{ matchedSlabIndex: 1 }]);
    await d.set(matchKey, weight ? '1' : '1000');
    if (weight) {
      await d.set('chargeableWeightUnit', 'g');
      await expect(control(page, 'chargeableWeightValue')).toHaveValue('1');
      await expect(control(page, `${key}-0-max`)).toHaveValue('1');
      await d.verify();
    }
    await control(page, `${key}-0-${cell}`).fill(prefix === 'referral' ? '101' : '-1');
    await d.set('showAmazonFees', 'false');
    await expect(control(page, 'showAmazonFees')).toBeChecked();
    await expect(control(page, `${key}-0-${cell}`)).toBeFocused();
    await expect(control(page, `${key}-0-${cell}`)).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('[data-primary-result]')).toHaveCount(0);
    await expect(control(page, 'showTaxes')).not.toBeChecked();
    await control(page, `${key}-0-${cell}`).fill('7');
    await expect(control(page, `${key}-0-${cell}`)).not.toHaveAttribute('aria-invalid', 'true');
    await control(page, `${key}-1-remove`).focus();
    await page.keyboard.press('Enter');
    await expect(control(page, `${key}-0-remove`)).toBeFocused();
    d.audit();
  });
}
for (const [key, section, value] of [
  ['productGstRatePercent', 'showTaxes', '101'],
  ['chargeableWeightValue', 'showShipping', '-1'],
  ['inventoryWriteOffAmount', 'showAdjustments', '-1'],
]) {
  test(`Amazon final evidence: reveal only ${section} for ${key}`, async ({ page }) => {
    const d = await openEvidence(page);
    if (key === 'inventoryWriteOffAmount') await d.set('inventoryWriteOffApplyReturn', 'true');
    await d.set(key, value);
    await d.set(section, 'false');
    await expect(control(page, section)).toBeChecked();
    await expect(control(page, key)).toBeFocused();
    await expect(control(page, key)).toHaveValue(value);
    for (const other of ['showTaxes', 'showShipping', 'showAdjustments'].filter(
      (s) => s !== section,
    ))
      await expect(control(page, other)).not.toBeChecked();
    d.audit();
  });
}
