import { useMemo, useState } from 'preact/hooks';
import {
  COUNTRIES,
  type CountryCode,
  calculateUniversalTax,
  DEFAULT_TAX_SLABS,
  type DiscountType,
  formatCurrencyNumber,
  type PriceMode,
  type SupplyType,
  type TaxSlab,
  type TaxSystemType,
  type UniversalTaxCalculationResult,
} from './universalTaxEngine.ts';

export interface UseUniversalTaxReturn {
  country: CountryCode;
  taxSystem: TaxSystemType;
  priceMode: PriceMode;
  amount: number;
  quantity: number;
  discountType: DiscountType;
  discountValue: number;
  shippingCharges: number;
  supplyType: SupplyType;
  gstRate: number;
  cessRate: number;
  isComposition: boolean;
  selectedStateIndex: number;
  localTaxRate: number;
  taxSlabs: TaxSlab[];
  showFormula: boolean;
  formulaTab: 'in' | 'vat' | 'sales_tax' | 'custom';
  results: UniversalTaxCalculationResult;
  currencySymbol: string;
  setCountry: (code: CountryCode) => void;
  setTaxSystem: (sys: TaxSystemType) => void;
  setPriceMode: (mode: PriceMode) => void;
  setAmount: (val: number) => void;
  setQuantity: (val: number) => void;
  setDiscountType: (dt: DiscountType) => void;
  setDiscountValue: (val: number) => void;
  setShippingCharges: (val: number) => void;
  setSupplyType: (st: SupplyType) => void;
  setGstRate: (rate: number) => void;
  setCessRate: (rate: number) => void;
  setIsComposition: (comp: boolean) => void;
  setSelectedStateIndex: (idx: number) => void;
  setLocalTaxRate: (rate: number) => void;
  setShowFormula: (show: boolean) => void;
  setFormulaTab: (tab: 'in' | 'vat' | 'sales_tax' | 'custom') => void;
  addTaxSlab: (slab: Omit<TaxSlab, 'id'>) => void;
  updateTaxSlab: (id: string, slab: Partial<TaxSlab>) => void;
  deleteTaxSlab: (id: string) => void;
  copySummary: () => void;
  downloadCsv: () => void;
}

function useTaxInputsState() {
  const [priceMode, setPriceMode] = useState<PriceMode>('exclusive');
  const [amount, setAmount] = useState<number>(1000);
  const [quantity, setQuantity] = useState<number>(1);
  const [discountType, setDiscountType] = useState<DiscountType>('currency');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [shippingCharges, setShippingCharges] = useState<number>(0);

  return {
    priceMode,
    setPriceMode,
    amount,
    setAmount,
    quantity,
    setQuantity,
    discountType,
    setDiscountType,
    discountValue,
    setDiscountValue,
    shippingCharges,
    setShippingCharges,
  };
}

function useTaxCountryState() {
  const [country, setCountryState] = useState<CountryCode>('in');
  const [taxSystem, setTaxSystem] = useState<TaxSystemType>('gst');
  const [supplyType, setSupplyType] = useState<SupplyType>('intra');
  const [gstRate, setGstRate] = useState<number>(18);
  const [cessRate, setCessRate] = useState<number>(0);
  const [isComposition, setIsComposition] = useState<boolean>(false);
  const [selectedStateIndex, setSelectedStateIndex] = useState<number>(0);
  const [localTaxRate, setLocalTaxRate] = useState<number>(1.6);
  const [formulaTab, setFormulaTab] = useState<'in' | 'vat' | 'sales_tax' | 'custom'>('in');

  const setCountry = (code: CountryCode) => {
    setCountryState(code);
    const prof = COUNTRIES.find((c) => c.id === code) ?? COUNTRIES[0];
    setTaxSystem(prof.defaultTaxSystem);
    setGstRate(prof.defaultRate);
    if (code === 'in') setFormulaTab('in');
    else if (code === 'us' || code === 'ca') setFormulaTab('sales_tax');
    else if (code === 'custom') setFormulaTab('custom');
    else setFormulaTab('vat');
  };

  return {
    country,
    setCountry,
    taxSystem,
    setTaxSystem,
    supplyType,
    setSupplyType,
    gstRate,
    setGstRate,
    cessRate,
    setCessRate,
    isComposition,
    setIsComposition,
    selectedStateIndex,
    setSelectedStateIndex,
    localTaxRate,
    setLocalTaxRate,
    formulaTab,
    setFormulaTab,
  };
}

function useTaxSlabsState(notify?: (msg: string) => void) {
  const [taxSlabs, setTaxSlabs] = useState<TaxSlab[]>(DEFAULT_TAX_SLABS);
  const [showFormula, setShowFormula] = useState<boolean>(false);

  const addTaxSlab = (slab: Omit<TaxSlab, 'id'>) => {
    setTaxSlabs((prev) => [...prev, { ...slab, id: `slab-${Date.now()}` }]);
    notify?.('Tax slab added');
  };

  const updateTaxSlab = (id: string, updated: Partial<TaxSlab>) => {
    setTaxSlabs((prev) => prev.map((s) => (s.id === id ? { ...s, ...updated } : s)));
    notify?.('Tax slab updated');
  };

  const deleteTaxSlab = (id: string) => {
    setTaxSlabs((prev) => prev.filter((s) => s.id !== id));
    notify?.('Tax slab removed');
  };

  return { taxSlabs, showFormula, setShowFormula, addTaxSlab, updateTaxSlab, deleteTaxSlab };
}

function buildSummaryLines(
  country: string,
  taxSystem: string,
  priceMode: string,
  res: UniversalTaxCalculationResult,
  sym: string,
) {
  return [
    `--- Universal Tax Calculation Summary ---`,
    `Country: ${country.toUpperCase()} | Tax System: ${taxSystem.toUpperCase()} | Mode: ${priceMode.toUpperCase()}`,
    `Taxable Amount: ${formatCurrencyNumber(res.taxableAmount, sym)}`,
    `Total Tax: ${formatCurrencyNumber(res.totalTax, sym)} (${res.effectiveRate}% effective)`,
    `Final Amount: ${formatCurrencyNumber(res.finalAmount, sym)}`,
    `Breakdown:`,
    ...res.components.map(
      (c) => `  - ${c.name}: ${formatCurrencyNumber(c.amount, sym)} (${c.percentage}%)`,
    ),
  ];
}

function buildCsvRows(
  country: string,
  taxSystem: string,
  priceMode: string,
  res: UniversalTaxCalculationResult,
  sym: string,
) {
  return [
    ['Metric', 'Value', 'Unit/Notes'],
    ['Country', country.toUpperCase(), ''],
    ['Tax System', taxSystem.toUpperCase(), ''],
    ['Price Mode', priceMode, ''],
    ['Gross Subtotal', res.rawSubtotal.toFixed(2), sym],
    ['Discount', res.discountAmount.toFixed(2), sym],
    ['Shipping / Extras', res.shippingCharges.toFixed(2), sym],
    ['Taxable Base', res.taxableAmount.toFixed(2), sym],
    ['Total Tax', res.totalTax.toFixed(2), sym],
    ['Effective Tax Rate', `${res.effectiveRate}%`, ''],
    ['Final Payable Amount', res.finalAmount.toFixed(2), sym],
    [],
    ['Component Name', 'Tax Rate (%)', `Amount (${sym})`, 'Share (%)'],
    ...res.components.map((c) => [c.name, `${c.rate}%`, c.amount.toFixed(2), `${c.percentage}%`]),
  ];
}

function exportCsvFile(rows: (string | number)[][], filename: string) {
  const csvContent = `data:text/csv;charset=utf-8,${rows.map((e) => e.join(',')).join('\n')}`;
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function useUniversalTax(notify?: (msg: string) => void): UseUniversalTaxReturn {
  const inputs = useTaxInputsState();
  const geo = useTaxCountryState();
  const slabsState = useTaxSlabsState(notify);

  const results = useMemo(() => {
    return calculateUniversalTax({
      country: geo.country,
      taxSystem: geo.taxSystem,
      priceMode: inputs.priceMode,
      amount: inputs.amount,
      quantity: inputs.quantity,
      discountType: inputs.discountType,
      discountValue: inputs.discountValue,
      shippingCharges: inputs.shippingCharges,
      supplyType: geo.supplyType,
      gstRate: geo.gstRate,
      cessRate: geo.cessRate,
      isComposition: geo.isComposition,
      selectedStateIndex: geo.selectedStateIndex,
      localTaxRate: geo.localTaxRate,
      taxSlabs: slabsState.taxSlabs,
    });
  }, [inputs, geo, slabsState.taxSlabs]);

  const currencySymbol = results.currencySymbol;

  const copySummary = () => {
    const lines = buildSummaryLines(
      geo.country,
      geo.taxSystem,
      inputs.priceMode,
      results,
      currencySymbol,
    );
    void navigator.clipboard.writeText(lines.join('\n'));
    notify?.('Tax summary copied to clipboard');
  };

  const downloadCsv = () => {
    const csvRows = buildCsvRows(
      geo.country,
      geo.taxSystem,
      inputs.priceMode,
      results,
      currencySymbol,
    );
    exportCsvFile(csvRows, `tax_calculation_${geo.country}_${Date.now()}.csv`);
    notify?.('Tax breakdown exported to CSV');
  };

  return {
    ...inputs,
    ...geo,
    ...slabsState,
    results,
    currencySymbol,
    copySummary,
    downloadCsv,
  };
}
