import { useMemo, useState } from 'preact/hooks';

export type SellerPricingMode = 'single' | 'compare' | 'targets';

export interface SellerProfitabilityState {
  mode: SellerPricingMode;
  setMode: (m: SellerPricingMode) => void;
  sellingPrice: number;
  setSellingPrice: (v: number) => void;
  productCost: number;
  setProductCost: (v: number) => void;
  packagingCost: number;
  setPackagingCost: (v: number) => void;
  shippingCost: number;
  setShippingCost: (v: number) => void;
  monthlyQty: number;
  setMonthlyQty: (v: number) => void;
  commissionPercent: number;
  setCommissionPercent: (v: number) => void;
  adCost: number;
  setAdCost: (v: number) => void;
  otherCharges: number;
  setOtherCharges: (v: number) => void;
  returnRate: number;
  setReturnRate: (v: number) => void;
  reverseShipping: number;
  setReverseShipping: (v: number) => void;
  targetProfit: number;
  setTargetProfit: (v: number) => void;
  targetMargin: number;
  setTargetMargin: (v: number) => void;
  showAdvanced: boolean;
  setShowAdvanced: (v: boolean) => void;
  calculation: SellerProfitabilityCalculation;
  copySummary: () => void;
  downloadCsv: () => void;
  resetToDefaults: () => void;
}

export interface SellerProfitabilityCalculation {
  packagingShipping: number;
  commissionAmount: number;
  adsOther: number;
  totalExpenses: number;
  netProfit: number;
  netMargin: number;
  markupOnCost: number;
  monthlyProfit: number;
  breakEvenPrice: number;
  costPct: number;
  extrasPct: number;
  feesPct: number;
  profitPct: number;
}

export function calculateSellerProfitability(params: {
  sellingPrice: number;
  productCost: number;
  packagingCost: number;
  shippingCost: number;
  monthlyQty: number;
  commissionPercent: number;
  adCost: number;
  otherCharges: number;
}): SellerProfitabilityCalculation {
  const {
    sellingPrice,
    productCost,
    packagingCost,
    shippingCost,
    monthlyQty,
    commissionPercent,
    adCost,
    otherCharges,
  } = params;

  const packagingShipping = packagingCost + shippingCost;
  const commissionAmount = (sellingPrice * commissionPercent) / 100;
  const adsOther = adCost + otherCharges;
  const totalExpenses = productCost + packagingShipping + commissionAmount + adsOther;
  const netProfit = sellingPrice - totalExpenses;
  const netMargin = sellingPrice > 0 ? (netProfit / sellingPrice) * 100 : 0;
  const markupOnCost = productCost > 0 ? (netProfit / productCost) * 100 : 0;
  const monthlyProfit = netProfit * monthlyQty;

  const commRate = Math.min(0.99, commissionPercent / 100);
  const breakEvenPrice = (productCost + packagingShipping + adsOther) / (1 - commRate);

  const safeSale = sellingPrice > 0 ? sellingPrice : 1;
  const costPct = Math.max(0, Math.round((productCost / safeSale) * 100));
  const extrasPct = Math.max(0, Math.round((packagingShipping / safeSale) * 100));
  const feesPct = Math.max(0, Math.round(((commissionAmount + adsOther) / safeSale) * 100));
  const profitPct = Math.max(0, 100 - costPct - extrasPct - feesPct);

  return {
    packagingShipping,
    commissionAmount,
    adsOther,
    totalExpenses,
    netProfit,
    netMargin: Math.round(netMargin * 10) / 10,
    markupOnCost: Math.round(markupOnCost * 10) / 10,
    monthlyProfit,
    breakEvenPrice: Math.round(breakEvenPrice * 100) / 100,
    costPct,
    extrasPct,
    feesPct,
    profitPct,
  };
}

function useSellerProfitInputs() {
  const [mode, setMode] = useState<SellerPricingMode>('single');
  const [sellingPrice, setSellingPrice] = useState(1000);
  const [productCost, setProductCost] = useState(400);
  const [packagingCost, setPackagingCost] = useState(30);
  const [shippingCost, setShippingCost] = useState(70);
  const [monthlyQty, setMonthlyQty] = useState(100);
  const [commissionPercent, setCommissionPercent] = useState(10);
  const [adCost, setAdCost] = useState(50);
  const [otherCharges, setOtherCharges] = useState(20);
  const [returnRate, setReturnRate] = useState(5);
  const [reverseShipping, setReverseShipping] = useState(90);
  const [targetProfit, setTargetProfit] = useState(300);
  const [targetMargin, setTargetMargin] = useState(30);
  const [showAdvanced, setShowAdvanced] = useState(false);

  return {
    mode,
    setMode,
    sellingPrice,
    setSellingPrice,
    productCost,
    setProductCost,
    packagingCost,
    setPackagingCost,
    shippingCost,
    setShippingCost,
    monthlyQty,
    setMonthlyQty,
    commissionPercent,
    setCommissionPercent,
    adCost,
    setAdCost,
    otherCharges,
    setOtherCharges,
    returnRate,
    setReturnRate,
    reverseShipping,
    setReverseShipping,
    targetProfit,
    setTargetProfit,
    targetMargin,
    setTargetMargin,
    showAdvanced,
    setShowAdvanced,
  };
}

function createSellerSummaryText(
  sp: number,
  cost: number,
  calc: SellerProfitabilityCalculation,
  qty: number,
): string {
  return `Seller Profitability Summary:
Selling Price: ₹${sp.toFixed(2)}
Product Cost: ₹${cost.toFixed(2)}
Packaging & Shipping: ₹${calc.packagingShipping.toFixed(2)}
Marketplace Commission: ₹${calc.commissionAmount.toFixed(2)}
Ads & Other Costs: ₹${calc.adsOther.toFixed(2)}
Total Expenses: ₹${calc.totalExpenses.toFixed(2)}
----------------------------
Net Profit / Sale: ₹${calc.netProfit.toFixed(2)}
Net Margin: ${calc.netMargin}%
Markup on Cost: ${calc.markupOnCost}%
Monthly Profit (${qty} units): ₹${calc.monthlyProfit.toLocaleString()}`;
}

export function useSellerProfitability(notify?: (msg: string) => void): SellerProfitabilityState {
  const inputs = useSellerProfitInputs();

  const calculation = useMemo(
    () =>
      calculateSellerProfitability({
        sellingPrice: inputs.sellingPrice,
        productCost: inputs.productCost,
        packagingCost: inputs.packagingCost,
        shippingCost: inputs.shippingCost,
        monthlyQty: inputs.monthlyQty,
        commissionPercent: inputs.commissionPercent,
        adCost: inputs.adCost,
        otherCharges: inputs.otherCharges,
      }),
    [inputs],
  );

  const copySummary = () => {
    const text = createSellerSummaryText(
      inputs.sellingPrice,
      inputs.productCost,
      calculation,
      inputs.monthlyQty,
    );
    navigator.clipboard.writeText(text);
    notify?.('Summary copied to clipboard!');
  };

  const downloadCsv = () => {
    const csv = `Item,Amount (INR)
Selling Price,${inputs.sellingPrice}
Product Cost,${inputs.productCost}
Packaging & Shipping,${calculation.packagingShipping}
Marketplace Commission,${calculation.commissionAmount}
Ads & Other Expenses,${calculation.adsOther}
Total Expenses,${calculation.totalExpenses}
Net Profit,${calculation.netProfit}
Net Margin (%),${calculation.netMargin}
Markup on Cost (%),${calculation.markupOnCost}
Monthly Quantity,${inputs.monthlyQty}
Monthly Profit,${calculation.monthlyProfit}
`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `seller-profitability-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    notify?.('CSV downloaded!');
  };

  const resetToDefaults = () => {
    inputs.setSellingPrice(1000);
    inputs.setProductCost(400);
    inputs.setPackagingCost(30);
    inputs.setShippingCost(70);
    inputs.setMonthlyQty(100);
    inputs.setCommissionPercent(10);
    inputs.setAdCost(50);
    inputs.setOtherCharges(20);
    notify?.('Reset to standard sample values.');
  };

  return {
    ...inputs,
    calculation,
    copySummary,
    downloadCsv,
    resetToDefaults,
  };
}
