import { useMemo, useState } from 'preact/hooks';

export * from './sellerProfitabilityModel.ts';

import {
  calculateSellerProfitability,
  type SellerInputTab,
  type SellerPricingMode,
  type SellerProfitabilityCalculation,
} from './sellerProfitabilityModel.ts';

export interface SellerProfitabilityState {
  mode: SellerPricingMode;
  setMode: (m: SellerPricingMode) => void;
  activeTab: SellerInputTab;
  setActiveTab: (t: SellerInputTab) => void;
  sellingPrice: number;
  setSellingPrice: (v: number) => void;
  productCost: number;
  setProductCost: (v: number) => void;
  packagingCost: number;
  setPackagingCost: (v: number) => void;
  shippingCost: number;
  setShippingCost: (v: number) => void;
  warehousingCost: number;
  setWarehousingCost: (v: number) => void;
  labourCost: number;
  setLabourCost: (v: number) => void;
  overheadCost: number;
  setOverheadCost: (v: number) => void;
  monthlyQty: number;
  setMonthlyQty: (v: number) => void;
  commissionPercent: number;
  setCommissionPercent: (v: number) => void;
  closingFee: number;
  setClosingFee: (v: number) => void;
  adCost: number;
  setAdCost: (v: number) => void;
  otherCharges: number;
  setOtherCharges: (v: number) => void;
  gstRate: number;
  setGstRate: (v: number) => void;
  isGstInclusive: boolean;
  setIsGstInclusive: (v: boolean) => void;
  returnRate: number;
  setReturnRate: (v: number) => void;
  reverseShipping: number;
  setReverseShipping: (v: number) => void;
  damagedLossPercent: number;
  setDamagedLossPercent: (v: number) => void;
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

function useSellerCorePricingState() {
  const [mode, setMode] = useState<SellerPricingMode>('single');
  const [activeTab, setActiveTab] = useState<SellerInputTab>('pricing');
  const [sellingPrice, setSellingPrice] = useState(1000);
  const [productCost, setProductCost] = useState(400);
  const [packagingCost, setPackagingCost] = useState(30);
  const [shippingCost, setShippingCost] = useState(70);
  const [warehousingCost, setWarehousingCost] = useState(20);
  const [labourCost, setLabourCost] = useState(15);
  const [overheadCost, setOverheadCost] = useState(10);
  const [monthlyQty, setMonthlyQty] = useState(100);

  return {
    mode,
    setMode,
    activeTab,
    setActiveTab,
    sellingPrice,
    setSellingPrice,
    productCost,
    setProductCost,
    packagingCost,
    setPackagingCost,
    shippingCost,
    setShippingCost,
    warehousingCost,
    setWarehousingCost,
    labourCost,
    setLabourCost,
    overheadCost,
    setOverheadCost,
    monthlyQty,
    setMonthlyQty,
  };
}

function useSellerMarketplaceState() {
  const [commissionPercent, setCommissionPercent] = useState(10);
  const [closingFee, setClosingFee] = useState(25);
  const [adCost, setAdCost] = useState(50);
  const [otherCharges, setOtherCharges] = useState(10);
  const [gstRate, setGstRate] = useState(18);
  const [isGstInclusive, setIsGstInclusive] = useState(true);
  const [returnRate, setReturnRate] = useState(8);
  const [reverseShipping, setReverseShipping] = useState(90);
  const [damagedLossPercent, setDamagedLossPercent] = useState(20);
  const [targetProfit, setTargetProfit] = useState(300);
  const [targetMargin, setTargetMargin] = useState(30);
  const [showAdvanced, setShowAdvanced] = useState(false);

  return {
    commissionPercent,
    setCommissionPercent,
    closingFee,
    setClosingFee,
    adCost,
    setAdCost,
    otherCharges,
    setOtherCharges,
    gstRate,
    setGstRate,
    isGstInclusive,
    setIsGstInclusive,
    returnRate,
    setReturnRate,
    reverseShipping,
    setReverseShipping,
    damagedLossPercent,
    setDamagedLossPercent,
    targetProfit,
    setTargetProfit,
    targetMargin,
    setTargetMargin,
    showAdvanced,
    setShowAdvanced,
  };
}

function useSellerProfitInputs() {
  const core = useSellerCorePricingState();
  const mkt = useSellerMarketplaceState();
  return { ...core, ...mkt };
}

function createSellerSummaryText(
  sp: number,
  cost: number,
  calc: SellerProfitabilityCalculation,
  qty: number,
): string {
  return `Seller Profitability Summary:
Selling Price: ₹${sp.toFixed(2)}
GST inside price (paid to govt): ₹${(sp - calc.netBaseRevenue).toFixed(2)}
Product Cost: ₹${cost.toFixed(2)}
Fulfillment (Pack, Ship, Warehouse, Labour): ₹${calc.directFulfillment.toFixed(2)}
Fees & GST: ₹${(calc.totalMarketplaceFees + calc.marketplaceFeeGst).toFixed(2)}
RTO Drag: ₹${calc.rtoLossPerUnit.toFixed(2)}
Total Expenses: ₹${calc.totalExpenses.toFixed(2)}
--------------------------------------
Net Profit: ₹${calc.netProfit.toFixed(2)} (${calc.netMargin}%)
Markup on Cost: ${calc.markupOnCost}%
Bank Settlement (after 0.6% TCS/TDS): ₹${calc.cashSettlementPayout.toFixed(2)}
Monthly Profit (${qty} units): ₹${calc.monthlyProfit.toLocaleString()}`;
}

export function useSellerProfitability(notify?: (msg: string) => void): SellerProfitabilityState {
  const inputs = useSellerProfitInputs();

  const calculation = useMemo(
    () =>
      calculateSellerProfitability({
        ...inputs,
        marketplaceFeeGstRate: 18,
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
    void navigator.clipboard.writeText(text);
    notify?.('Seller profit summary copied to clipboard');
  };

  const downloadCsv = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      encodeURIComponent(
        `Metric,Amount (INR)\nSelling Price,${inputs.sellingPrice}\nGST inside price,${(inputs.sellingPrice - calculation.netBaseRevenue).toFixed(2)}\nProduct Cost,${inputs.productCost}\nDirect Fulfillment,${calculation.directFulfillment}\nMarketplace Fees,${calculation.totalMarketplaceFees}\nMarketplace Fee GST (18%),${calculation.marketplaceFeeGst}\nReturn Loss Allocation,${calculation.rtoLossPerUnit}\nTotal Expenses,${calculation.totalExpenses}\nNet Profit,${calculation.netProfit}\nNet Margin (%),${calculation.netMargin}\nMarkup on Cost (%),${calculation.markupOnCost}\nCash Payout,${calculation.cashSettlementPayout}\nMonthly Profit (${inputs.monthlyQty} units),${calculation.monthlyProfit}`,
      );
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', `seller_profitability_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    notify?.('Profitability CSV exported');
  };

  const resetToDefaults = () => {
    inputs.setSellingPrice(1000);
    inputs.setProductCost(400);
    inputs.setPackagingCost(30);
    inputs.setShippingCost(70);
    inputs.setWarehousingCost(20);
    inputs.setLabourCost(15);
    inputs.setOverheadCost(10);
    notify?.('Reset to default ecommerce benchmarks');
  };

  return {
    ...inputs,
    calculation,
    copySummary,
    downloadCsv,
    resetToDefaults,
  };
}
