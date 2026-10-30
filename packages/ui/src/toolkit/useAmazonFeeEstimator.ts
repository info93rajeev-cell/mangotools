import { useMemo, useState } from 'preact/hooks';

export type FulfilmentMode = 'fba' | 'easy_ship' | 'self_ship';
export type AmazonShippingZone = 'local' | 'regional' | 'national';
export type AmazonInputTab = 'listing' | 'costs' | 'returns';

export interface AmazonCategoryPreset {
  id: string;
  name: string;
  rate: number;
}

export const AMAZON_CATEGORY_PRESETS: AmazonCategoryPreset[] = [
  { id: 'electronics', name: 'Electronics & Mobiles (8.5%)', rate: 8.5 },
  { id: 'apparel', name: 'Apparel & Fashion (13.0%)', rate: 13.0 },
  { id: 'home', name: 'Home & Kitchen (10.0%)', rate: 10.0 },
  { id: 'beauty', name: 'Beauty & Personal Care (8.0%)', rate: 8.0 },
  { id: 'grocery', name: 'Grocery & Gourmet (6.0%)', rate: 6.0 },
  { id: 'books', name: 'Books & Media (6.0%)', rate: 6.0 },
  { id: 'custom', name: 'Custom Referral Rate', rate: 10.0 },
];

export interface AmazonFeeParams {
  sellingPrice: number;
  productPackagingCost?: number;
  referralFee?: number;
  closingHandling?: number;
  feeGst?: number;
  adsReturns?: number;
  monthlyQty?: number;
  fulfilmentMode?: FulfilmentMode;
  category?: string;
  weightGrams?: number;
  shippingZone?: AmazonShippingZone;
  adCost?: number;
  returnRate?: number;
  reverseShipping?: number;
}

export interface AmazonFeeCalculation {
  referralFee: number;
  closingFee: number;
  weightHandlingFee: number;
  totalAmazonFees: number;
  amazonFeesWithGst: number;
  costsExcludingFees: number;
  rtoLossPerUnit: number;
  totalExpenses: number;
  bankPayout: number;
  netProfit: number;
  netMargin: number;
  monthlyProfit: number;
  fbaProfit: number;
  easyShipProfit: number;
  selfShipProfit: number;
  costPct: number;
  feePct: number;
  otherPct: number;
  profitPct: number;
}

function getClosingTierIndex(sp: number): number {
  if (sp <= 250) return 0;
  if (sp <= 500) return 1;
  if (sp <= 1000) return 2;
  return 3;
}

const CLOSING_RATES: Record<FulfilmentMode, number[]> = {
  easy_ship: [5, 9, 30, 61],
  fba: [12, 12, 18, 42],
  self_ship: [15, 20, 40, 70],
};

function computeOfficialClosingFee(sp: number, mode: FulfilmentMode): number {
  const tier = getClosingTierIndex(sp);
  return CLOSING_RATES[mode]?.[tier] ?? 42;
}

function computeOfficialWeightFee(mode: FulfilmentMode, zone: AmazonShippingZone): number {
  if (mode === 'self_ship') return 0;
  if (zone === 'local') return 44;
  if (zone === 'regional') return 55;
  return 75;
}

export function calculateAmazonFees(params: AmazonFeeParams): AmazonFeeCalculation {
  const sellingPrice = params.sellingPrice || 0;
  const productPackagingCost = params.productPackagingCost || 0;
  const monthlyQty = params.monthlyQty || 1;
  const mode = params.fulfilmentMode || 'fba';
  const zone = params.shippingZone || 'national';

  const referralFee =
    params.referralFee !== undefined ? params.referralFee : (sellingPrice * 8) / 100;
  const closingFee =
    params.closingHandling !== undefined
      ? params.closingHandling
      : computeOfficialClosingFee(sellingPrice, mode);
  const weightHandlingFee = computeOfficialWeightFee(mode, zone);

  const totalAmazonFees = referralFee + closingFee;
  const feeGst = params.feeGst !== undefined ? params.feeGst : (totalAmazonFees * 18) / 100;
  const amazonFeesWithGst = totalAmazonFees + feeGst;

  const adsReturns = params.adsReturns || 0;
  const costsExcludingFees = productPackagingCost + adsReturns;
  const totalExpenses = amazonFeesWithGst + costsExcludingFees;
  const netProfit = sellingPrice - totalExpenses;
  const netMargin = sellingPrice > 0 ? (netProfit / sellingPrice) * 100 : 0;
  const monthlyProfit = netProfit * monthlyQty;

  const tcsTds = (sellingPrice * 2) / 100;
  const bankPayout = Math.max(0, sellingPrice - amazonFeesWithGst - tcsTds);

  const safeSale = sellingPrice > 0 ? sellingPrice : 1;
  const costPct = Math.max(0, Math.round((productPackagingCost / safeSale) * 1000) / 10);
  const feePct = Math.max(0, Math.round((amazonFeesWithGst / safeSale) * 1000) / 10);
  const otherPct = Math.max(0, Math.round((adsReturns / safeSale) * 1000) / 10);
  const profitPct = Math.max(0, Math.round((100 - costPct - feePct - otherPct) * 10) / 10);

  return {
    referralFee: Math.round(referralFee * 100) / 100,
    closingFee: Math.round(closingFee * 100) / 100,
    weightHandlingFee: Math.round(weightHandlingFee * 100) / 100,
    totalAmazonFees: Math.round(totalAmazonFees * 100) / 100,
    amazonFeesWithGst: Math.round(amazonFeesWithGst * 100) / 100,
    costsExcludingFees: Math.round(costsExcludingFees * 100) / 100,
    rtoLossPerUnit: Math.round(adsReturns * 0.4 * 100) / 100,
    totalExpenses: Math.round(totalExpenses * 100) / 100,
    bankPayout: Math.round(bankPayout * 100) / 100,
    netProfit: Math.round(netProfit * 100) / 100,
    netMargin: Math.round(netMargin * 10) / 10,
    monthlyProfit: Math.round(monthlyProfit),
    fbaProfit: Math.round(netProfit * 100) / 100,
    easyShipProfit: Math.round((netProfit - 18) * 100) / 100,
    selfShipProfit: Math.round((netProfit - 5) * 100) / 100,
    costPct,
    feePct,
    otherPct,
    profitPct,
  };
}

export interface AmazonFeeEstimatorState {
  fulfilmentMode: FulfilmentMode;
  setFulfilmentMode: (m: FulfilmentMode) => void;
  activeTab: AmazonInputTab;
  setActiveTab: (t: AmazonInputTab) => void;
  sellingPrice: number;
  setSellingPrice: (v: number) => void;
  productPackagingCost: number;
  setProductPackagingCost: (v: number) => void;
  category: string;
  setCategory: (v: string) => void;
  referralRate: number;
  setReferralRate: (v: number) => void;
  referralFee: number;
  setReferralFee: (v: number) => void;
  closingHandling: number;
  setClosingHandling: (v: number) => void;
  feeGst: number;
  setFeeGst: (v: number) => void;
  adsReturns: number;
  setAdsReturns: (v: number) => void;
  shippingZone: AmazonShippingZone;
  setShippingZone: (v: AmazonShippingZone) => void;
  packedWeight: number;
  setPackedWeight: (v: number) => void;
  monthlyQty: number;
  setMonthlyQty: (v: number) => void;
  calculation: AmazonFeeCalculation;
  copySummary: () => void;
  downloadCsv: () => void;
  resetToDefaults: () => void;
}

function useAmazonFeeInputs() {
  const [fulfilmentMode, setFulfilmentMode] = useState<FulfilmentMode>('fba');
  const [activeTab, setActiveTab] = useState<AmazonInputTab>('listing');
  const [sellingPrice, setSellingPrice] = useState(1500);
  const [productPackagingCost, setProductPackagingCost] = useState(635);
  const [category, setCategory] = useState('electronics');
  const [referralRate, setReferralRate] = useState(8.5);
  const [referralFee, setReferralFee] = useState(120);
  const [closingHandling, setClosingHandling] = useState(125);
  const [feeGst, setFeeGst] = useState(44.1);
  const [adsReturns, setAdsReturns] = useState(100);
  const [shippingZone, setShippingZone] = useState<AmazonShippingZone>('national');
  const [packedWeight, setPackedWeight] = useState(500);
  const [monthlyQty, setMonthlyQty] = useState(100);

  return {
    fulfilmentMode,
    setFulfilmentMode,
    activeTab,
    setActiveTab,
    sellingPrice,
    setSellingPrice,
    productPackagingCost,
    setProductPackagingCost,
    category,
    setCategory,
    referralRate,
    setReferralRate,
    referralFee,
    setReferralFee,
    closingHandling,
    setClosingHandling,
    feeGst,
    setFeeGst,
    adsReturns,
    setAdsReturns,
    shippingZone,
    setShippingZone,
    packedWeight,
    setPackedWeight,
    monthlyQty,
    setMonthlyQty,
  };
}

function createAmazonSummaryText(
  mode: FulfilmentMode,
  sp: number,
  cost: number,
  ref: number,
  closing: number,
  feeGst: number,
  calc: AmazonFeeCalculation,
  ads: number,
  qty: number,
): string {
  return `Amazon India Seller Fee & Profit Estimate:
Fulfilment Mode: ${mode.toUpperCase()}
Selling Price: ₹${sp.toFixed(2)}
Product & Packaging Cost: ₹${cost.toFixed(2)}
Amazon Referral Fee: ₹${ref.toFixed(2)}
Closing & Weight Fee: ₹${closing.toFixed(2)}
GST on Amazon Fees (18%): ₹${feeGst.toFixed(2)}
Total Amazon Deductions: ₹${calc.amazonFeesWithGst.toFixed(2)}
Advertising & Other: ₹${ads.toFixed(2)}
---------------------------------------------
Net Seller Profit: ₹${calc.netProfit.toFixed(2)} (${calc.netMargin}%)
Bank Settlement Payout: ₹${calc.bankPayout.toFixed(2)}
Monthly Profit (${qty} units): ₹${calc.monthlyProfit.toLocaleString()}`;
}

export function useAmazonFeeEstimator(notify?: (msg: string) => void): AmazonFeeEstimatorState {
  const inputs = useAmazonFeeInputs();

  const calculation = useMemo(
    () =>
      calculateAmazonFees({
        sellingPrice: inputs.sellingPrice,
        productPackagingCost: inputs.productPackagingCost,
        referralFee: inputs.referralFee,
        closingHandling: inputs.closingHandling,
        feeGst: inputs.feeGst,
        adsReturns: inputs.adsReturns,
        monthlyQty: inputs.monthlyQty,
        fulfilmentMode: inputs.fulfilmentMode,
        shippingZone: inputs.shippingZone,
      }),
    [inputs],
  );

  const copySummary = () => {
    const text = createAmazonSummaryText(
      inputs.fulfilmentMode,
      inputs.sellingPrice,
      inputs.productPackagingCost,
      inputs.referralFee,
      inputs.closingHandling,
      inputs.feeGst,
      calculation,
      inputs.adsReturns,
      inputs.monthlyQty,
    );
    void navigator.clipboard.writeText(text);
    notify?.('Amazon fee summary copied to clipboard');
  };

  const downloadCsv = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      encodeURIComponent(
        `Metric,Amount (INR)\nFulfilment Mode,${inputs.fulfilmentMode}\nSelling Price,${inputs.sellingPrice}\nProduct Cost,${inputs.productPackagingCost}\nReferral Fee,${inputs.referralFee}\nClosing & Weight Fee,${inputs.closingHandling}\nAmazon Fee GST (18%),${inputs.feeGst}\nTotal Amazon Deductions,${calculation.amazonFeesWithGst}\nBank Payout,${calculation.bankPayout}\nNet Profit,${calculation.netProfit}\nNet Margin (%),${calculation.netMargin}\nMonthly Profit (${inputs.monthlyQty} units),${calculation.monthlyProfit}`,
      );
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', `amazon_fees_estimate_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    notify?.('Amazon fee breakdown exported to CSV');
  };

  const resetToDefaults = () => {
    inputs.setSellingPrice(1500);
    inputs.setProductPackagingCost(635);
    inputs.setReferralFee(120);
    inputs.setClosingHandling(125);
    inputs.setFeeGst(44.1);
    inputs.setAdsReturns(100);
    inputs.setFulfilmentMode('fba');
    notify?.('Reset to Amazon India benchmarks');
  };

  return {
    ...inputs,
    calculation,
    copySummary,
    downloadCsv,
    resetToDefaults,
  };
}
