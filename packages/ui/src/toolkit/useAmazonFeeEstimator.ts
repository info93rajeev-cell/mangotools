import type { ResolvedPreset } from '@mangotools/schemas';
import { useState } from 'preact/hooks';
import { copyText, downloadText } from './actions.ts';
import { messageFor } from './presentation.ts';
import { useEngineRun } from './useEngineRun.ts';
import type { WorkingStep } from './WorkingSteps.tsx';

export type FulfilmentMode = 'fba' | 'easy_ship' | 'self_ship';

export interface AmazonCategoryPreset {
  id: string;
  name: string;
  /** Referral rate, %; null for "enter the ₹ fee yourself". */
  rate: number | null;
}

/** Reference rates only; the user confirms them in Seller Central. */
export const AMAZON_CATEGORY_PRESETS: AmazonCategoryPreset[] = [
  { id: 'custom', name: 'Enter referral fee in ₹', rate: null },
  { id: 'electronics', name: 'Electronics & Mobiles (8.5%)', rate: 8.5 },
  { id: 'apparel', name: 'Apparel & Fashion (13%)', rate: 13 },
  { id: 'home', name: 'Home & Kitchen (10%)', rate: 10 },
  { id: 'beauty', name: 'Beauty & Personal Care (8%)', rate: 8 },
  { id: 'grocery', name: 'Grocery & Gourmet (6%)', rate: 6 },
  { id: 'books', name: 'Books & Media (6%)', rate: 6 },
];

/** GST TCS (s.52 CGST Act) and income-tax TDS (s.194-O), both on the tax-exclusive value. */
export const AMAZON_TCS_PERCENT = '0.5';
export const AMAZON_TDS_PERCENT = '0.1';
export const AMAZON_FEE_GST_PERCENT = '18';

export interface AmazonInputs {
  fulfilmentMode: FulfilmentMode;
  sellingPrice: number;
  productCost: number;
  packagingCost: number;
  packedWeight: number;
  monthlyQty: number;
  category: string;
  referralFee: number;
  closingFee: number;
  weightHandling: number;
  productGstRate: number;
  /** A GST-registered seller claims the 18% GST on Amazon's fees back as input tax credit. */
  claimFeeGstCredit: boolean;
  adsPerOrder: number;
  returnsPerOrder: number;
}

export const AMAZON_DEFAULTS: AmazonInputs = {
  fulfilmentMode: 'fba',
  sellingPrice: 1500,
  productCost: 600,
  packagingCost: 35,
  packedWeight: 500,
  monthlyQty: 100,
  category: 'custom',
  referralFee: 120,
  closingFee: 25,
  weightHandling: 100,
  productGstRate: 18,
  claimFeeGstCredit: true,
  adsPerOrder: 60,
  returnsPerOrder: 40,
};

const SALE = ['successful-sale'];
const text = (n: number) => String(n);

/** One fixed ₹ fee per unit, with the GST treatment the seller chose. */
function fixedFee(id: string, amount: number, gstTreatment: string) {
  return {
    id,
    enabled: true,
    mode: 'fixed',
    amount: text(amount),
    quantityScope: 'per-unit',
    gstTreatment,
    scenarios: SALE,
  };
}

/** The `estimate.marketplace.manual-profitability@1` input for one sale. */
export function amazonEngineInput(i: AmazonInputs): Record<string, unknown> {
  const registered = i.productGstRate > 0;
  const gstTreatment = registered && i.claimFeeGstCredit ? 'recoverable' : 'non-recoverable';
  const rate = AMAZON_CATEGORY_PRESETS.find((c) => c.id === i.category)?.rate ?? null;
  const referral =
    rate === null
      ? fixedFee('referral', i.referralFee, gstTreatment)
      : {
          id: 'referral',
          enabled: true,
          mode: 'percent',
          ratePercent: text(rate),
          percentageBase: 'realized-customer-value',
          gstTreatment,
          scenarios: SALE,
        };
  return {
    sellingPricePerUnit: text(i.sellingPrice),
    quantity: '1',
    productCostPerUnit: text(i.productCost),
    productGstRatePercent: text(i.productGstRate),
    sellingPriceTaxMode: 'gst-inclusive',
    marketplaceFeeGstRatePercent: AMAZON_FEE_GST_PERCENT,
    feeLines: [
      referral,
      fixedFee('closing', i.closingFee, gstTreatment),
      fixedFee('weight-handling', i.weightHandling, gstTreatment),
    ],
    packagingCost: { amount: text(i.packagingCost), scenarios: SALE },
    advertisingCost: { amount: text(i.adsPerOrder), scenarios: SALE },
    otherTransactionCost: { amount: text(i.returnsPerOrder), scenarios: SALE },
    ...(registered
      ? {
          tcs: {
            mode: 'percent',
            value: AMAZON_TCS_PERCENT,
            percentageBase: 'tax-exclusive-revenue',
            scenarios: SALE,
          },
        }
      : {}),
    tds: {
      mode: 'percent',
      value: AMAZON_TDS_PERCENT,
      percentageBase: 'tax-exclusive-revenue',
      scenarios: SALE,
    },
  };
}

/** The fields of the engine output this studio shows (all decimal strings). */
export interface AmazonResult {
  grossCustomerValue: string;
  orderProductGstAmount: string;
  taxExclusiveRevenue: string;
  productCostRecognised: string;
  marketplaceFees: { id: string; amount: string; gstAmount: string }[];
  marketplaceFeesTotal: string;
  marketplaceFeeGstTotal: string;
  recoverableMarketplaceFeeGst: string;
  nonRecoverableMarketplaceFeeGst: string;
  sellerControlledCostsTotal: string;
  tcsAmount: string;
  tdsAmount: string;
  estimatedSettlement: string;
  totalEconomicInvestment: string;
  economicProfit: string;
  profitMarginPercent: string | null;
  breakEvenSellingPrice: string | null;
  working: WorkingStep[];
}

/** Profit × monthly units, from the pricing engine (price − cost = this sale's profit). */
interface MonthlyResult {
  profitTotal: string | null;
}

export interface AmazonFeeEstimatorState extends AmazonInputs {
  set: <K extends keyof AmazonInputs>(key: K, value: AmazonInputs[K]) => void;
  load: (values: AmazonInputs) => void;
  result: AmazonResult | null;
  error: string | null;
  monthlyProfit: string | null;
  copySummary: () => void;
  downloadCsv: () => void;
  resetToDefaults: () => void;
}

function summaryRows(i: AmazonInputs, r: AmazonResult, monthly: string | null): [string, string][] {
  return [
    ['Selling price', r.grossCustomerValue],
    ['GST inside the price', r.orderProductGstAmount],
    ['Product cost', r.productCostRecognised],
    ['Packaging, ads and returns', r.sellerControlledCostsTotal],
    ['Amazon fees', r.marketplaceFeesTotal],
    ['GST on Amazon fees', r.marketplaceFeeGstTotal],
    ['  of which claimed back as ITC', r.recoverableMarketplaceFeeGst],
    ['TCS', r.tcsAmount],
    ['TDS', r.tdsAmount],
    ['Net profit per sale', r.economicProfit],
    ['Profit margin (%)', r.profitMarginPercent ?? ''],
    ['Estimated bank settlement', r.estimatedSettlement],
    ['Break-even selling price', r.breakEvenSellingPrice ?? ''],
    [`Profit on ${i.monthlyQty} sales`, monthly ?? ''],
  ];
}

export function useAmazonFeeEstimator(
  preset: ResolvedPreset,
  notify?: (msg: string) => void,
): AmazonFeeEstimatorState {
  const [inputs, setInputs] = useState<AmazonInputs>(AMAZON_DEFAULTS);
  const main = useEngineRun<AmazonResult>(
    preset.operation,
    amazonEngineInput(inputs),
    preset.params,
  );
  const r = main.value;
  const monthly = useEngineRun<MonthlyResult>(
    'estimate.pricing.margin@1',
    r && Number(r.taxExclusiveRevenue) > 0 && inputs.monthlyQty >= 1
      ? {
          solve: 'from-cost-and-price',
          price: r.taxExclusiveRevenue,
          cost: r.totalEconomicInvestment,
          quantity: text(Math.floor(inputs.monthlyQty)),
        }
      : null,
    { rounding: 'half-up' },
  );
  const monthlyProfit = monthly.value?.profitTotal ?? null;
  const rows = r ? summaryRows(inputs, r, monthlyProfit) : [];

  return {
    ...inputs,
    set: (key, value) => setInputs((prev) => ({ ...prev, [key]: value })),
    load: setInputs,
    result: r,
    error: main.error ? messageFor(preset, main.error) : null,
    monthlyProfit,
    copySummary: async () => {
      if (!r) return;
      const body = rows.map(([k, v]) => `${k}: ${v}`).join('\n');
      const done = await copyText(`Amazon India profit estimate\n${body}`);
      notify?.(done ? 'Amazon fee summary copied to clipboard' : 'Copy failed');
    },
    downloadCsv: () => {
      if (!r) return;
      const csv = `Metric,Amount (INR)\n${rows.map(([k, v]) => `"${k.trim()}",${v}`).join('\n')}\n`;
      downloadText(csv, 'amazon-profit-estimate.csv', 'text/csv');
      notify?.('Amazon fee breakdown exported to CSV');
    },
    resetToDefaults: () => {
      setInputs(AMAZON_DEFAULTS);
      notify?.('Reset to the sample values');
    },
  };
}
