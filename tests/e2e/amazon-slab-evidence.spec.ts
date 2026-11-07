import { expect, test } from '@playwright/test';
import { control, openEvidence } from '../support/amazon-evidence.ts';
import { primaryResult } from '../support/tool-page.ts';

test('Amazon category evidence: category presets dynamically calculate referral fee', async ({
  page,
}) => {
  const d = await openEvidence(page);
  await expect(primaryResult(page)).toHaveText('₹291.19');

  // Default is 'custom': referral fee is editable input with default ₹120
  const refFee = control(page, 'referralFee');
  await expect(refFee).toHaveValue('120');
  await expect(refFee).not.toHaveAttribute('readonly', '');

  // Select Electronics (8.5%): 8.5% of 1500 = ₹127.50
  await d.set('category', 'electronics');
  await expect(refFee).toHaveValue('₹127.50');
  await expect(refFee).toHaveAttribute('readonly', '');

  // Select Apparel (13%): 13% of 1500 = ₹195.00
  await d.set('category', 'apparel');
  await expect(refFee).toHaveValue('₹195.00');

  // Select Home & Kitchen (10%): 10% of 1500 = ₹150.00
  await d.set('category', 'home');
  await expect(refFee).toHaveValue('₹150.00');

  // Select Beauty (8%): 8% of 1500 = ₹120.00
  await d.set('category', 'beauty');
  await expect(refFee).toHaveValue('₹120.00');

  // Select Grocery (6%): 6% of 1500 = ₹90.00
  await d.set('category', 'grocery');
  await expect(refFee).toHaveValue('₹90.00');

  // Select Books & Media (6%): 6% of 1500 = ₹90.00
  await d.set('category', 'books');
  await expect(refFee).toHaveValue('₹90.00');

  // Switch back to custom: user can type custom numeric amount
  await d.set('category', 'custom');
  await expect(refFee).not.toHaveAttribute('readonly', '');
  await refFee.fill('150');
  await expect(primaryResult(page)).not.toHaveText('…');

  d.audit();
});

test('Amazon fulfilment evidence: mode tabs and scenario comparison', async ({ page }) => {
  const d = await openEvidence(page);
  await expect(primaryResult(page)).toHaveText('₹291.19');

  // Initial mode is FBA
  const fbaTab = page.getByRole('tab', { name: 'FBA' });
  await expect(fbaTab).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('[data-fulfilment-hint]')).toContainText('FBA');

  // Switch to Easy Ship
  const easyShipTab = page.getByRole('tab', { name: 'Easy Ship' });
  await easyShipTab.click();
  await expect(easyShipTab).toHaveAttribute('aria-selected', 'true');
  await expect(fbaTab).toHaveAttribute('aria-selected', 'false');
  await expect(page.locator('[data-fulfilment-hint]')).toContainText('Easy Ship');

  // Switch to Self Ship
  const selfShipTab = page.getByRole('tab', { name: 'Self Ship' });
  await selfShipTab.click();
  await expect(selfShipTab).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('[data-fulfilment-hint]')).toContainText('Self Ship');

  // Scenario comparison table reflects selected mode
  const scenarioTable = page.getByRole('table', { name: 'Scenario Comparison Table' });
  await expect(scenarioTable).toBeVisible();
  await expect(scenarioTable).toContainText('Self Ship · your fees');

  // Comparison tab shows guidance
  await page
    .locator('[aria-label="Comparison Tabs"]')
    .getByRole('tab', { name: 'Compare' })
    .click();
  await expect(page.getByText('Fees differ by mode. To compare')).toBeVisible();

  d.audit();
});

test('Amazon tax evidence: GST rates and ITC registration conditional display', async ({
  page,
}) => {
  const d = await openEvidence(page);
  await expect(primaryResult(page)).toHaveText('₹291.19');

  // Default is 18% GST: ITC checkbox visible
  const itc = control(page, 'claimFeeGstCredit');
  await expect(itc).toBeVisible();

  // Change GST to 0% (unregistered): ITC checkbox hidden
  await d.set('productGstRatePercent', '0');
  await expect(itc).toHaveCount(0);

  // Statement table does not show GST deduction inside selling price
  const statement = page.getByRole('table', { name: 'Statement Table' });
  await expect(statement).not.toContainText('GST inside the price');

  // Change GST to 5%: ITC checkbox reappears
  await d.set('productGstRatePercent', '5');
  await expect(control(page, 'claimFeeGstCredit')).toBeVisible();
  await expect(statement).toContainText('GST inside the price');

  d.audit();
});
