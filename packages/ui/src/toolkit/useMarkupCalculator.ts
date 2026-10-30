import { useMemo, useState } from 'preact/hooks';

export type MarkupPricingMode = 'find_price' | 'find_markup' | 'target_margin';

export interface MarkupCalculatorState {
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
  calculation: MarkupCalculation;
  copySummary: () => void;
  downloadCsv: () => void;
  resetToDefaults: () => void;
}

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

export function calculateMarkup(params: {
  mode: MarkupPricingMode;
  costPrice: number;
  markupPercent: number;
  givenSellingPrice: number;
  targetMarginPercent: number;
  quantity: number;
  additionalCost: number;
}): MarkupCalculation {
  const {
    mode,
    costPrice,
    markupPercent,
    givenSellingPrice,
    targetMarginPercent,
    quantity,
    additionalCost,
  } = params;

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

function useMarkupInputs() {
  const [pricingMode, setPricingMode] = useState<MarkupPricingMode>('find_price');
  const [costPrice, setCostPrice] = useState(500);
  const [markupPercent, setMarkupPercent] = useState(40);
  const [givenSellingPrice, setGivenSellingPrice] = useState(700);
  const [targetMarginPercent, setTargetMarginPercent] = useState(30);
  const [quantity, setQuantity] = useState(20);
  const [additionalCost, setAdditionalCost] = useState(0);

  return {
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
  };
}

function createMarkupSummaryText(
  costPrice: number,
  additionalCost: number,
  markupPercent: number,
  calc: MarkupCalculation,
  quantity: number,
): string {
  return `Markup Calculation Summary:
Cost Price: ₹${costPrice.toFixed(2)}
Additional Costs: ₹${additionalCost.toFixed(2)}
Markup: ${markupPercent}%
----------------------------
Recommended Selling Price: ₹${calc.sellingPrice.toFixed(2)}
Gross Margin: ${calc.grossMargin}%
Profit per Unit: ₹${calc.profitPerUnit.toFixed(2)}
Profit on ${quantity} units: ₹${calc.profitOnQuantity.toLocaleString()}`;
}

export function useMarkupCalculator(notify?: (msg: string) => void): MarkupCalculatorState {
  const inputs = useMarkupInputs();

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

  const copySummary = () => {
    const text = createMarkupSummaryText(
      inputs.costPrice,
      inputs.additionalCost,
      inputs.markupPercent,
      calculation,
      inputs.quantity,
    );
    navigator.clipboard.writeText(text);
    notify?.('Markup summary copied to clipboard!');
  };

  const downloadCsv = () => {
    const csv = `Item,Value
Base Cost (INR),${calculation.baseCost}
Markup Percentage (%),${inputs.markupPercent}
Markup Added (INR),${calculation.markupAdded}
Selling Price (INR),${calculation.sellingPrice}
Gross Margin (%),${calculation.grossMargin}
Quantity,${inputs.quantity}
Total Profit (INR),${calculation.profitOnQuantity}
`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `markup-pricing-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    notify?.('CSV downloaded!');
  };

  const resetToDefaults = () => {
    inputs.setCostPrice(500);
    inputs.setMarkupPercent(40);
    inputs.setGivenSellingPrice(700);
    inputs.setTargetMarginPercent(30);
    inputs.setQuantity(20);
    inputs.setAdditionalCost(0);
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
