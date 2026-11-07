import { expect, test } from '@playwright/test';
import { control, openEvidence } from '../support/amazon-evidence.ts';
import { primaryResult } from '../support/tool-page.ts';

test('Amazon calculation evidence: initial sample default matches engine fixture 023', async ({
  page,
}) => {
  const d = await openEvidence(page);

  // Fixture 023 hand-verified sample:
  // ₹1,500 SP, ₹600 cost, ₹35 packaging, ₹60 ads, ₹40 returns, ₹120 referral, ₹25 closing, ₹100 weight handling.
  // 18% fee GST (₹44.10) claimed back as ITC.
  // Expected: ₹291.19 net profit, 22.91% margin, ₹1,203.27 bank settlement, ₹245.00 fees, ₹1,156.40 break-even.
  await expect(primaryResult(page)).toHaveText('₹291.19');
  await expect(page.getByText('Profit margin').locator('..').locator('strong')).toHaveText(
    '22.91%',
  );
  await expect(page.getByText('Bank settlement').locator('..').locator('strong')).toHaveText(
    '₹1,203.27',
  );
  await expect(page.getByText('Amazon fees').locator('..').locator('strong')).toHaveText('₹245.00');
  await expect(page.getByText('Break-even price').locator('..').locator('strong')).toHaveText(
    '₹1,156.40',
  );

  // Verify statement table itemization
  const statement = page.getByRole('table', { name: 'Statement Table' });
  await expect(statement).toBeVisible();
  await expect(statement).toContainText('₹1,500.00'); // Selling price
  await expect(statement).toContainText('−₹228.81'); // GST inside price
  await expect(statement).toContainText('−₹600.00'); // Product cost
  await expect(statement).toContainText('−₹135.00'); // Packaging, ads, returns
  await expect(statement).toContainText('−₹245.00'); // Amazon fees
  await expect(statement).toContainText('₹291.19'); // Net profit

  // Verify settlement table itemization
  const settlement = page.getByRole('table', { name: 'Settlement Table' });
  await expect(settlement).toBeVisible();
  await expect(settlement).toContainText('₹1,500.00'); // Selling price
  await expect(settlement).toContainText('−₹245.00'); // Amazon fees
  await expect(settlement).toContainText('−₹44.10'); // GST on fees (claim back as ITC)
  await expect(settlement).toContainText('−₹6.36'); // TCS 0.5%
  await expect(settlement).toContainText('−₹1.27'); // TDS 0.1%
  await expect(settlement).toContainText('₹1,203.27'); // Estimated settlement

  d.audit();
});

test('Amazon calculation evidence: unclaimed ITC matches engine fixture 024', async ({ page }) => {
  const d = await openEvidence(page);
  await expect(primaryResult(page)).toHaveText('₹291.19');

  // Uncheck ITC claim: fee GST of ₹44.10 becomes a cost deduction
  await d.set('claimFeeGstCredit', 'false');
  await expect(primaryResult(page)).toHaveText('₹247.09');
  await expect(page.getByText('Profit margin').locator('..').locator('strong')).toHaveText(
    '19.44%',
  );

  // Settlement amount is unchanged at ₹1,203.27 because GST is still deducted at settlement
  await expect(page.getByText('Bank settlement').locator('..').locator('strong')).toHaveText(
    '₹1,203.27',
  );

  const statement = page.getByRole('table', { name: 'Statement Table' });
  await expect(statement).toContainText('GST on fees (not claimed)');
  await expect(statement).toContainText('−₹44.10');
  await expect(statement).toContainText('₹247.09');

  // Re-checking ITC credit restores profit to ₹291.19
  await d.set('claimFeeGstCredit', 'true');
  await expect(primaryResult(page)).toHaveText('₹291.19');

  d.audit();
});

test('Amazon calculation evidence: dynamic pricing, loss scenario and break-even', async ({
  page,
}) => {
  const d = await openEvidence(page);
  await expect(primaryResult(page)).toHaveText('₹291.19');

  // Increase selling price to ₹2,500
  await d.set('sellingPrice', '2500');
  await expect(primaryResult(page)).not.toHaveText('…');
  await expect(primaryResult(page)).not.toHaveText('₹291.19');

  // Lower selling price below total costs to simulate loss
  await d.configure({
    sellingPrice: '500',
    productCost: '600',
  });
  await expect(page.getByText('Estimated loss per sale')).toBeVisible();
  const lossEl = page.locator('[data-primary-result]');
  await expect(lossEl).toBeVisible();
  await expect(lossEl).toContainText('−₹');

  // Reset restores initial profit state
  await page.getByRole('button', { name: /Reset/i }).click();
  await expect(primaryResult(page)).toHaveText('₹291.19');
  await expect(control(page, 'sellingPrice')).toHaveValue('1500');

  d.audit();
});
