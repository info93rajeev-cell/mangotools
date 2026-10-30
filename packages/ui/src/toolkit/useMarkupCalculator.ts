import { useMemo, useState } from 'preact/hooks';

export type MarkupPricingMode = 'find_price' | 'find_markup' | 'target_margin';
export type MarkupStudioTab = 'markup' | 'stacked_discount' | 'bogo_deals' | 'fake_mrp';

export interface MarkupCalculation {
  baseCost: number;
  markupAdded: number;
  sellingPrice: number;
  grossMargin: number;
  profitPerUnit: number;
  profitOnQuantity: number;
  costPct: number;
  profitPct: number;
}

export interface StackedDiscountCalculation {
  priceAfterD1: number;
  priceAfterD2: number;
  priceAfterD3: number;
  finalCustomerPrice: number;
  totalRealSavings: number;
  nominalSumDiscount: number;
  realEffectiveDiscount: number;
  marketingHypeGap: number;
  sellerProfit: number;
  sellerMargin: number;
}

export interface BogoCalculation {
  totalItemsReceived: number;
  totalCustomerPays: number;
  effectivePricePerItem: number;
  bogoEffectiveDiscount: number;
  totalCustomerSaved: number;
}

export interface FakeMrpCalculation {
  inflatedFakeMrp: number;
  artificialMultiplier: number;
}

export function calculateMarkup(params: {
  mode?: MarkupPricingMode;
  costPrice?: number;
  markupPercent?: number;
  givenSellingPrice?: number;
  targetMarginPercent?: number;
  quantity?: number;
  additionalCost?: number;
}): MarkupCalculation {
  const mode = params.mode || 'find_price';
  const costPrice = params.costPrice || 0;
  const markupPercent = params.markupPercent || 0;
  const givenSellingPrice = params.givenSellingPrice || 0;
  const targetMarginPercent = params.targetMarginPercent || 0;
  const quantity = params.quantity || 1;
  const additionalCost = params.additionalCost || 0;

  const baseCost = Math.max(0, costPrice + additionalCost);
  let sellingPrice = 0;

  if (mode === 'find_price') {
    const markupAmt = (baseCost * Math.max(-99, markupPercent)) / 100;
    sellingPrice = baseCost + markupAmt;
  } else if (mode === 'find_markup') {
    sellingPrice = Math.max(0, givenSellingPrice);
  } else if (mode === 'target_margin') {
    const safeMargin = Math.min(99.9, Math.max(0, targetMarginPercent));
    sellingPrice = safeMargin < 100 ? baseCost / (1 - safeMargin / 100) : baseCost;
  }

  const profitPerUnit = Math.max(0, sellingPrice - baseCost);
  const grossMargin = sellingPrice > 0 ? (profitPerUnit / sellingPrice) * 100 : 0;
  const profitOnQuantity = profitPerUnit * Math.max(1, quantity);

  const safeSale = sellingPrice > 0 ? sellingPrice : 1;
  const costPct = Math.min(100, Math.max(0, Math.round((baseCost / safeSale) * 1000) / 10));
  const profitPct = Math.max(0, Math.round((100 - costPct) * 10) / 10);

  return {
    baseCost: Math.round(baseCost * 100) / 100,
    markupAdded: Math.round(profitPerUnit * 100) / 100,
    sellingPrice: Math.round(sellingPrice * 100) / 100,
    grossMargin: Math.round(grossMargin * 100) / 100,
    profitPerUnit: Math.round(profitPerUnit * 100) / 100,
    profitOnQuantity: Math.round(profitOnQuantity * 100) / 100,
    costPct,
    profitPct,
  };
}

export function calculateStackedDiscount(
  mrp: number,
  d1: number,
  d2: number,
  d3: number,
  cost: number,
): StackedDiscountCalculation {
  const p1 = mrp * (1 - Math.min(99, Math.max(0, d1)) / 100);
  const p2 = p1 * (1 - Math.min(99, Math.max(0, d2)) / 100);
  const p3 = p2 * (1 - Math.min(99, Math.max(0, d3)) / 100);

  const finalCustomerPrice = Math.round(p3 * 100) / 100;
  const totalRealSavings = Math.round((mrp - finalCustomerPrice) * 100) / 100;
  const nominalSumDiscount = d1 + d2 + d3;
  const realEffectiveDiscount =
    mrp > 0 ? Math.round(((mrp - finalCustomerPrice) / mrp) * 1000) / 10 : 0;
  const marketingHypeGap = Math.round((nominalSumDiscount - realEffectiveDiscount) * 10) / 10;

  const sellerProfit = Math.round((finalCustomerPrice - cost) * 100) / 100;
  const sellerMargin =
    finalCustomerPrice > 0 ? Math.round((sellerProfit / finalCustomerPrice) * 1000) / 10 : 0;

  return {
    priceAfterD1: Math.round(p1 * 100) / 100,
    priceAfterD2: Math.round(p2 * 100) / 100,
    priceAfterD3: Math.round(p3 * 100) / 100,
    finalCustomerPrice,
    totalRealSavings,
    nominalSumDiscount,
    realEffectiveDiscount,
    marketingHypeGap,
    sellerProfit,
    sellerMargin,
  };
}

export function calculateBogoDeals(buy: number, get: number, price: number): BogoCalculation {
  const totalItemsReceived = Math.max(1, buy + get);
  const totalCustomerPays = buy * price;
  const effectivePricePerItem = Math.round((totalCustomerPays / totalItemsReceived) * 100) / 100;
  const bogoEffectiveDiscount = Math.round((get / totalItemsReceived) * 1000) / 10;
  const totalCustomerSaved = get * price;

  return {
    totalItemsReceived,
    totalCustomerPays,
    effectivePricePerItem,
    bogoEffectiveDiscount,
    totalCustomerSaved,
  };
}

export function calculateFakeMrp(targetSp: number, bannerDiscount: number): FakeMrpCalculation {
  const discRate = Math.min(0.99, Math.max(0.01, bannerDiscount / 100));
  const inflatedFakeMrp = Math.round((targetSp / (1 - discRate)) * 100) / 100;
  const artificialMultiplier = Math.round((inflatedFakeMrp / Math.max(1, targetSp)) * 10) / 10;

  return { inflatedFakeMrp, artificialMultiplier };
}

export interface MarkupCalculatorState {
  activeTab: MarkupStudioTab;
  setActiveTab: (t: MarkupStudioTab) => void;
  pricingMode: MarkupPricingMode;
  setPricingMode: (m: MarkupPricingMode) => void;
  costPrice: number;
  setCostPrice: (v: number) => void;
  markupPercent: number;
  setMarkupPercent: (v: number) => void;
  givenSellingPrice: number;
  setGivenSellingPrice: (v: number) => void;
  targetMarginPercent: number;
  setTargetMarginPercent: (v: number) => void;
  quantity: number;
  setQuantity: (v: number) => void;
  additionalCost: number;
  setAdditionalCost: (v: number) => void;
  mrp: number;
  setMrp: (v: number) => void;
  discount1: number;
  setDiscount1: (v: number) => void;
  discount2: number;
  setDiscount2: (v: number) => void;
  discount3: number;
  setDiscount3: (v: number) => void;
  sellerCostForDiscount: number;
  setSellerCostForDiscount: (v: number) => void;
  bogoBuyQty: number;
  setBogoBuyQty: (v: number) => void;
  bogoGetQty: number;
  setBogoGetQty: (v: number) => void;
  bogoItemPrice: number;
  setBogoItemPrice: (v: number) => void;
  flashTargetSp: number;
  setFlashTargetSp: (v: number) => void;
  flashDiscountBanner: number;
  setFlashDiscountBanner: (v: number) => void;
  calculation: MarkupCalculation;
  stackedCalc: StackedDiscountCalculation;
  bogoCalc: BogoCalculation;
  fakeMrpCalc: FakeMrpCalculation;
  copySummary: () => void;
  downloadCsv: () => void;
  resetToDefaults: () => void;
}

function useMarkupAllInputs() {
  const [activeTab, setActiveTab] = useState<MarkupStudioTab>('markup');
  const [pricingMode, setPricingMode] = useState<MarkupPricingMode>('find_price');
  const [costPrice, setCostPrice] = useState(500);
  const [markupPercent, setMarkupPercent] = useState(40);
  const [givenSellingPrice, setGivenSellingPrice] = useState(700);
  const [targetMarginPercent, setTargetMarginPercent] = useState(30);
  const [quantity, setQuantity] = useState(20);
  const [additionalCost, setAdditionalCost] = useState(0);

  const [mrp, setMrp] = useState(2000);
  const [discount1, setDiscount1] = useState(50);
  const [discount2, setDiscount2] = useState(20);
  const [discount3, setDiscount3] = useState(10);
  const [sellerCostForDiscount, setSellerCostForDiscount] = useState(500);

  const [bogoBuyQty, setBogoBuyQty] = useState(2);
  const [bogoGetQty, setBogoGetQty] = useState(1);
  const [bogoItemPrice, setBogoItemPrice] = useState(600);

  const [flashTargetSp, setFlashTargetSp] = useState(500);
  const [flashDiscountBanner, setFlashDiscountBanner] = useState(80);

  return {
    activeTab,
    setActiveTab,
    pricingMode,
    setPricingMode,
    costPrice,
    setCostPrice,
    markupPercent,
    setMarkupPercent,
    givenSellingPrice,
    setGivenSellingPrice,
    targetMarginPercent,
    setTargetMarginPercent,
    quantity,
    setQuantity,
    additionalCost,
    setAdditionalCost,
    mrp,
    setMrp,
    discount1,
    setDiscount1,
    discount2,
    setDiscount2,
    discount3,
    setDiscount3,
    sellerCostForDiscount,
    setSellerCostForDiscount,
    bogoBuyQty,
    setBogoBuyQty,
    bogoGetQty,
    setBogoGetQty,
    bogoItemPrice,
    setBogoItemPrice,
    flashTargetSp,
    setFlashTargetSp,
    flashDiscountBanner,
    setFlashDiscountBanner,
  };
}

function createMarkupTabSummary(
  inputs: ReturnType<typeof useMarkupAllInputs>,
  calc: MarkupCalculation,
  stacked: StackedDiscountCalculation,
  bogo: BogoCalculation,
): string {
  if (inputs.activeTab === 'markup') {
    return `Markup Summary:\nCost Price: ₹${inputs.costPrice}\nMarkup: ${inputs.markupPercent}%\nSelling Price: ₹${calc.sellingPrice}\nGross Margin: ${calc.grossMargin}%`;
  }
  if (inputs.activeTab === 'stacked_discount') {
    return `Stacked Discount Summary:\nMRP: ₹${inputs.mrp}\nDiscounts: ${inputs.discount1}% + ${inputs.discount2}% + ${inputs.discount3}%\nNominal: ${stacked.nominalSumDiscount}%\nActual Real Discount: ${stacked.realEffectiveDiscount}%\nFinal Price: ₹${stacked.finalCustomerPrice}`;
  }
  return `Deal Summary:\nBuy ${inputs.bogoBuyQty} Get ${inputs.bogoGetQty} Free\nEffective Discount: ${bogo.bogoEffectiveDiscount}%\nEffective Price: ₹${bogo.effectivePricePerItem}`;
}

function useMarkupCalculations(inputs: ReturnType<typeof useMarkupAllInputs>) {
  const calculation = useMemo(
    () =>
      calculateMarkup({
        mode: inputs.pricingMode,
        costPrice: inputs.costPrice,
        markupPercent: inputs.markupPercent,
        givenSellingPrice: inputs.givenSellingPrice,
        targetMarginPercent: inputs.targetMarginPercent,
        quantity: inputs.quantity,
        additionalCost: inputs.additionalCost,
      }),
    [inputs],
  );

  const stackedCalc = useMemo(
    () =>
      calculateStackedDiscount(
        inputs.mrp,
        inputs.discount1,
        inputs.discount2,
        inputs.discount3,
        inputs.sellerCostForDiscount,
      ),
    [
      inputs.mrp,
      inputs.discount1,
      inputs.discount2,
      inputs.discount3,
      inputs.sellerCostForDiscount,
    ],
  );

  const bogoCalc = useMemo(
    () => calculateBogoDeals(inputs.bogoBuyQty, inputs.bogoGetQty, inputs.bogoItemPrice),
    [inputs.bogoBuyQty, inputs.bogoGetQty, inputs.bogoItemPrice],
  );

  const fakeMrpCalc = useMemo(
    () => calculateFakeMrp(inputs.flashTargetSp, inputs.flashDiscountBanner),
    [inputs.flashTargetSp, inputs.flashDiscountBanner],
  );

  return { calculation, stackedCalc, bogoCalc, fakeMrpCalc };
}

export function useMarkupCalculator(notify?: (msg: string) => void): MarkupCalculatorState {
  const inputs = useMarkupAllInputs();
  const { calculation, stackedCalc, bogoCalc, fakeMrpCalc } = useMarkupCalculations(inputs);

  const copySummary = () => {
    const text = createMarkupTabSummary(inputs, calculation, stackedCalc, bogoCalc);
    void navigator.clipboard.writeText(text);
    notify?.('Summary copied to clipboard');
  };

  const downloadCsv = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      encodeURIComponent(
        `Metric,Value\nMRP,${inputs.mrp}\nReal Effective Discount,${stackedCalc.realEffectiveDiscount}%\nNominal Claimed,${stackedCalc.nominalSumDiscount}%\nFinal Price,${stackedCalc.finalCustomerPrice}\nSavings,${stackedCalc.totalRealSavings}`,
      );
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', `pricing_discount_breakdown_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    notify?.('Pricing & discount breakdown exported');
  };

  const resetToDefaults = () => {
    inputs.setCostPrice(500);
    inputs.setMarkupPercent(40);
    inputs.setMrp(2000);
    inputs.setDiscount1(50);
    inputs.setDiscount2(20);
    inputs.setDiscount3(10);
    notify?.('Reset to defaults');
  };

  return {
    ...inputs,
    calculation,
    stackedCalc,
    bogoCalc,
    fakeMrpCalc,
    copySummary,
    downloadCsv,
    resetToDefaults,
  };
}
