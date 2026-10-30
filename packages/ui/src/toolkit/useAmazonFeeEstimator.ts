import { useMemo, useState } from 'preact/hooks';

export type FulfilmentMode = 'fba' | 'easy_ship' | 'self_ship';

export interface AmazonFeeEstimatorState {
  fulfilmentMode: FulfilmentMode;
  setFulfilmentMode: (m: FulfilmentMode) => void;
  sellingPrice: number;
  setSellingPrice: (v: number) => void;
  productPackagingCost: number;
  setProductPackagingCost: (v: number) => void;
  referralFee: number;
  setReferralFee: (v: number) => void;
  closingHandling: number;
  setClosingHandling: (v: number) => void;
  feeGst: number;
  setFeeGst: (v: number) => void;
  adsReturns: number;
  setAdsReturns: (v: number) => void;
  packedWeight: number;
  setPackedWeight: (v: number) => void;
  monthlyQty: number;
  setMonthlyQty: (v: number) => void;
  calculation: AmazonFeeCalculation;
  copySummary: () => void;
  downloadCsv: () => void;
  resetToDefaults: () => void;
}

export interface AmazonFeeCalculation {
  totalAmazonFees: number;
  amazonFeesWithGst: number;
  costsExcludingFees: number;
  totalExpenses: number;
  netProfit: number;
  netMargin: number;
  monthlyProfit: number;
  costPct: number;
  feePct: number;
  otherPct: number;
  profitPct: number;
}

export function calculateAmazonFees(params: {
  sellingPrice: number;
  productPackagingCost: number;
  referralFee: number;
  closingHandling: number;
  feeGst: number;
  adsReturns: number;
  monthlyQty: number;
}): AmazonFeeCalculation {
  const {
    sellingPrice,
    productPackagingCost,
    referralFee,
    closingHandling,
    feeGst,
    adsReturns,
    monthlyQty,
  } = params;

  const totalAmazonFees = referralFee + closingHandling;
  const amazonFeesWithGst = totalAmazonFees + feeGst;
  const costsExcludingFees = productPackagingCost + adsReturns;
  const totalExpenses = amazonFeesWithGst + costsExcludingFees;
  const netProfit = sellingPrice - totalExpenses;
  const netMargin = sellingPrice > 0 ? (netProfit / sellingPrice) * 100 : 0;
  const monthlyProfit = netProfit * monthlyQty;

  const safeSale = sellingPrice > 0 ? sellingPrice : 1;
  const costPct = Math.max(0, Math.round((productPackagingCost / safeSale) * 1000) / 10);
  const feePct = Math.max(0, Math.round((amazonFeesWithGst / safeSale) * 1000) / 10);
  const otherPct = Math.max(0, Math.round((adsReturns / safeSale) * 1000) / 10);
  const profitPct = Math.max(0, Math.round((100 - costPct - feePct - otherPct) * 10) / 10);

  return {
    totalAmazonFees,
    amazonFeesWithGst,
    costsExcludingFees,
    totalExpenses,
    netProfit: Math.round(netProfit * 100) / 100,
    netMargin: Math.round(netMargin * 10) / 10,
    monthlyProfit: Math.round(monthlyProfit),
    costPct,
    feePct,
    otherPct,
    profitPct,
  };
}

function useAmazonFeeInputs() {
  const [fulfilmentMode, setFulfilmentMode] = useState<FulfilmentMode>('fba');
  const [sellingPrice, setSellingPrice] = useState(1500);
  const [productPackagingCost, setProductPackagingCost] = useState(635);
  const [referralFee, setReferralFee] = useState(120);
  const [closingHandling, setClosingHandling] = useState(125);
  const [feeGst, setFeeGst] = useState(44.1);
  const [adsReturns, setAdsReturns] = useState(100);
  const [packedWeight, setPackedWeight] = useState(500);
  const [monthlyQty, setMonthlyQty] = useState(100);

  return {
    fulfilmentMode,
    setFulfilmentMode,
    sellingPrice,
    setSellingPrice,
    productPackagingCost,
    setProductPackagingCost,
    referralFee,
    setReferralFee,
    closingHandling,
    setClosingHandling,
    feeGst,
    setFeeGst,
    adsReturns,
    setAdsReturns,
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
Closing & Weight Handling: ₹${closing.toFixed(2)}
GST on Amazon Fees (18%): ₹${feeGst.toFixed(2)}
Total Amazon Fees with GST: ₹${calc.amazonFeesWithGst.toFixed(2)}
Ads & Returns Cost: ₹${ads.toFixed(2)}
----------------------------
Estimated Profit / Sale: ₹${calc.netProfit.toFixed(2)}
Profit Margin: ${calc.netMargin}%
Monthly Estimated Profit (${qty} units): ₹${calc.monthlyProfit.toLocaleString()}`;
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
    navigator.clipboard.writeText(text);
    notify?.('Amazon profit estimate copied to clipboard!');
  };

  const downloadCsv = () => {
    const csv = `Component,Amount (INR)
Selling Price,${inputs.sellingPrice}
Product & Packaging,${inputs.productPackagingCost}
Referral Fee,${inputs.referralFee}
Closing & Handling,${inputs.closingHandling}
Fee GST (18%),${inputs.feeGst}
Total Amazon Fees with GST,${calculation.amazonFeesWithGst}
Ads & Expected Returns,${inputs.adsReturns}
Total Expenses,${calculation.totalExpenses}
Net Profit,${calculation.netProfit}
Margin (%),${calculation.netMargin}
Monthly Quantity,${inputs.monthlyQty}
Monthly Profit,${calculation.monthlyProfit}
`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `amazon-profit-estimate-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    notify?.('CSV downloaded!');
  };

  const resetToDefaults = () => {
    inputs.setSellingPrice(1500);
    inputs.setProductPackagingCost(635);
    inputs.setReferralFee(120);
    inputs.setClosingHandling(125);
    inputs.setFeeGst(44.1);
    inputs.setAdsReturns(100);
    inputs.setPackedWeight(500);
    inputs.setMonthlyQty(100);
    notify?.('Reset to standard Amazon sample values.');
  };

  return {
    ...inputs,
    calculation,
    copySummary,
    downloadCsv,
    resetToDefaults,
  };
}
