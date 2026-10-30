import { useMemo, useState } from 'preact/hooks';

export type SellerPricingMode = 'single' | 'compare' | 'targets';
export type SellerInputTab = 'pricing' | 'fulfillment' | 'marketplace_gst' | 'returns';

export interface SellerProfitabilityParams {
  sellingPrice: number;
  productCost: number;
  packagingCost?: number;
  shippingCost?: number;
  warehousingCost?: number;
  labourCost?: number;
  overheadCost?: number;
  commissionPercent?: number;
  closingFee?: number;
  adCost?: number;
  otherCharges?: number;
  gstRate?: number;
  isGstInclusive?: boolean;
  marketplaceFeeGstRate?: number;
  returnRate?: number;
  reverseShipping?: number;
  damagedLossPercent?: number;
  monthlyQty?: number;
}

export interface SellerProfitabilityCalculation {
  directFulfillment: number;
  commissionAmount: number;
  totalMarketplaceFees: number;
  marketplaceFeeGst: number;
  outputGst: number;
  netBaseRevenue: number;
  rtoLossPerUnit: number;
  totalExpenses: number;
  netProfit: number;
  netMargin: number;
  markupOnCost: number;
  cashSettlementPayout: number;
  monthlyProfit: number;
  monthlyRevenue: number;
  breakEvenPrice: number;
  costPct: number;
  fulfillmentPct: number;
  feesPct: number;
  profitPct: number;
}

interface CostBreakdown {
  directFulfillment: number;
  commissionAmount: number;
  totalMarketplaceFees: number;
  marketplaceFeeGst: number;
  outputGst: number;
  netBaseRevenue: number;
  rtoLossPerUnit: number;
  totalExpenses: number;
}

function resolveSellerParams(p: SellerProfitabilityParams) {
  const {
    sellingPrice = 0,
    productCost = 0,
    packagingCost = 0,
    shippingCost = 0,
    warehousingCost = 0,
    labourCost = 0,
    overheadCost = 0,
    commissionPercent = 0,
    closingFee = 0,
    adCost = 0,
    otherCharges = 0,
    gstRate = 18,
    isGstInclusive = true,
    marketplaceFeeGstRate = 0,
    returnRate = 0,
    reverseShipping = 0,
    damagedLossPercent = 0,
  } = p;
  return {
    sp: sellingPrice,
    cost: productCost,
    pack: packagingCost,
    ship: shippingCost,
    wh: warehousingCost,
    lab: labourCost,
    ovh: overheadCost,
    commPct: commissionPercent,
    closing: closingFee,
    ad: adCost,
    other: otherCharges,
    gstRate,
    isInc: isGstInclusive,
    feeGstRate: marketplaceFeeGstRate,
    retRate: returnRate,
    revShip: reverseShipping,
    dmgPct: damagedLossPercent,
  };
}

function computeSellerCosts(params: SellerProfitabilityParams): CostBreakdown {
  const p = resolveSellerParams(params);

  const directFulfillment = p.pack + p.ship + p.wh + p.lab + p.ovh;
  const commissionAmount = (p.sp * p.commPct) / 100;
  const totalMarketplaceFees = commissionAmount + p.closing;
  const marketplaceFeeGst = (totalMarketplaceFees * p.feeGstRate) / 100;
  const outputGst = p.isInc ? (p.sp * p.gstRate) / (100 + p.gstRate) : (p.sp * p.gstRate) / 100;
  const netBaseRevenue = p.isInc ? p.sp - outputGst : p.sp;
  const rtoLossPerUnit = (p.retRate / 100) * (p.revShip + p.cost * (p.dmgPct / 100));
  const totalExpenses =
    p.cost +
    directFulfillment +
    totalMarketplaceFees +
    marketplaceFeeGst +
    p.ad +
    p.other +
    rtoLossPerUnit;

  return {
    directFulfillment,
    commissionAmount,
    totalMarketplaceFees,
    marketplaceFeeGst,
    outputGst,
    netBaseRevenue,
    rtoLossPerUnit,
    totalExpenses,
  };
}

export function calculateSellerProfitability(
  params: SellerProfitabilityParams,
): SellerProfitabilityCalculation {
  const sp = params.sellingPrice || 0;
  const cost = params.productCost || 0;
  const qty = params.monthlyQty || 1;
  const commPct = params.commissionPercent || 0;
  const ship = params.shippingCost || 0;
  const costs = computeSellerCosts(params);

  const netProfit = sp - costs.totalExpenses;
  const netMargin = sp > 0 ? (netProfit / sp) * 100 : 0;
  const markupOnCost = cost > 0 ? (netProfit / cost) * 100 : 0;
  const tcsTds = (costs.netBaseRevenue * 2) / 100;
  const cashPayout = Math.max(
    0,
    sp - costs.totalMarketplaceFees - costs.marketplaceFeeGst - tcsTds - ship,
  );

  const commRate = Math.min(0.95, commPct / 100);
  const fixedCosts = costs.totalExpenses - costs.commissionAmount;
  const breakEvenPrice = fixedCosts / (1 - commRate);

  const safeSale = sp > 0 ? sp : 1;
  const costPct = Math.max(0, Math.round((cost / safeSale) * 100));
  const fulfillmentPct = Math.max(0, Math.round((costs.directFulfillment / safeSale) * 100));
  const otherFees = costs.totalExpenses - cost - costs.directFulfillment;
  const feesPct = Math.max(0, Math.round((otherFees / safeSale) * 100));
  const profitPct = Math.max(0, 100 - costPct - fulfillmentPct - feesPct);

  return {
    directFulfillment: Math.round(costs.directFulfillment * 100) / 100,
    commissionAmount: Math.round(costs.commissionAmount * 100) / 100,
    totalMarketplaceFees: Math.round(costs.totalMarketplaceFees * 100) / 100,
    marketplaceFeeGst: Math.round(costs.marketplaceFeeGst * 100) / 100,
    outputGst: Math.round(costs.outputGst * 100) / 100,
    netBaseRevenue: Math.round(costs.netBaseRevenue * 100) / 100,
    rtoLossPerUnit: Math.round(costs.rtoLossPerUnit * 100) / 100,
    totalExpenses: Math.round(costs.totalExpenses * 100) / 100,
    netProfit: Math.round(netProfit * 100) / 100,
    netMargin: Math.round(netMargin * 10) / 10,
    markupOnCost: Math.round(markupOnCost * 10) / 10,
    cashSettlementPayout: Math.round(cashPayout * 100) / 100,
    monthlyProfit: Math.round(netProfit * qty),
    monthlyRevenue: Math.round(sp * qty),
    breakEvenPrice: Math.round(breakEvenPrice * 100) / 100,
    costPct,
    fulfillmentPct,
    feesPct,
    profitPct,
  };
}

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
Product Cost: ₹${cost.toFixed(2)}
Fulfillment (Pack, Ship, Warehouse, Labour): ₹${calc.directFulfillment.toFixed(2)}
Fees & GST: ₹${(calc.totalMarketplaceFees + calc.marketplaceFeeGst).toFixed(2)}
RTO Drag: ₹${calc.rtoLossPerUnit.toFixed(2)}
Total Expenses: ₹${calc.totalExpenses.toFixed(2)}
--------------------------------------
Net Profit: ₹${calc.netProfit.toFixed(2)} (${calc.netMargin}%)
Markup on Cost: ${calc.markupOnCost}%
Bank Settlement: ₹${calc.cashSettlementPayout.toFixed(2)}
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
        `Metric,Amount (INR)\nSelling Price,${inputs.sellingPrice}\nProduct Cost,${inputs.productCost}\nDirect Fulfillment,${calculation.directFulfillment}\nMarketplace Fees,${calculation.totalMarketplaceFees}\nMarketplace Fee GST (18%),${calculation.marketplaceFeeGst}\nReturn Loss Allocation,${calculation.rtoLossPerUnit}\nTotal Expenses,${calculation.totalExpenses}\nNet Profit,${calculation.netProfit}\nNet Margin (%),${calculation.netMargin}\nMarkup on Cost (%),${calculation.markupOnCost}\nCash Payout,${calculation.cashSettlementPayout}\nMonthly Profit (${inputs.monthlyQty} units),${calculation.monthlyProfit}`,
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
