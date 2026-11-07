import type { ToolSnapshot, ToolStore } from '@mangotools/runtime';
import type { ResolvedPreset } from '@mangotools/schemas';
import { useEffect, useState } from 'preact/hooks';
import { messageFor } from './presentation.ts';
import {
  readSellerCalculation,
  type SellerInputTab,
  type SellerPricingMode,
  type SellerProfitabilityCalculation,
} from './sellerProfitabilityResult.ts';

export * from './sellerProfitabilityResult.ts';

/** Studio input name → preset field of `estimate/seller.unit-economics`. */
const FIELD = {
  sellingPrice: 'sellingPrice',
  productCost: 'productCost',
  packagingCost: 'packagingCost',
  shippingCost: 'shippingCost',
  warehousingCost: 'warehousingCost',
  labourCost: 'labourCost',
  overheadCost: 'overheadCost',
  monthlyQty: 'quantity',
  commissionPercent: 'commissionPercent',
  closingFee: 'closingFee',
  feeGstRate: 'feeGstRatePercent',
  adCost: 'advertisingCost',
  otherCharges: 'otherCost',
  gstRate: 'gstRatePercent',
  returnRate: 'returnRatePercent',
  reverseShipping: 'reverseShippingCost',
  damagedLossPercent: 'damagedLossPercent',
  withholdingPercent: 'withholdingPercent',
  targetProfit: 'targetProfit',
  targetMargin: 'targetMarginPercent',
} as const;

type NumberInput = keyof typeof FIELD;
type Setter<K extends string> = `set${Capitalize<K>}`;
type NumberInputs = { [K in NumberInput]: number } & {
  [K in NumberInput as Setter<K>]: (v: number) => void;
};

export type SellerProfitabilityState = NumberInputs & {
  mode: SellerPricingMode;
  setMode: (m: SellerPricingMode) => void;
  activeTab: SellerInputTab;
  setActiveTab: (t: SellerInputTab) => void;
  isGstInclusive: boolean;
  setIsGstInclusive: (v: boolean) => void;
  showAdvanced: boolean;
  setShowAdvanced: (v: boolean) => void;
  calculation: SellerProfitabilityCalculation;
  /** The engine's message when the inputs cannot be calculated (the last result stays shown). */
  error: string | null;
  copySummary: () => void;
  downloadCsv: () => void;
  loadSample: () => void;
  resetToDefaults: () => void;
};

const toNumber = (raw: unknown) => {
  const n = Number(typeof raw === 'string' ? raw : '');
  return Number.isFinite(n) ? n : 0;
};

function numberInputs(snapshot: ToolSnapshot, store: ToolStore): NumberInputs {
  const out: Record<string, unknown> = {};
  for (const [name, key] of Object.entries(FIELD)) {
    out[name] = toNumber(snapshot.values[key]);
    out[`set${name[0]?.toUpperCase()}${name.slice(1)}`] = (v: number) => store.set(key, String(v));
  }
  return out as NumberInputs;
}

const rupees = (v: number) => `₹${v.toFixed(2)}`;

function summaryText(s: NumberInputs, c: SellerProfitabilityCalculation): string {
  return `Seller Profitability Summary:
Selling Price: ${rupees(s.sellingPrice)}
GST inside price (paid to govt): ${rupees(c.outputGst)}
Product Cost: ${rupees(s.productCost)}
Fulfillment (Pack, Ship, Warehouse, Labour, Overhead): ${rupees(c.directFulfillment)}
Marketplace fees: ${rupees(c.totalMarketplaceFees)} + GST ${rupees(c.marketplaceFeeGst)}
Returns: ${rupees(c.rtoLossPerUnit)}
Total Expenses: ${rupees(c.totalExpenses)}
--------------------------------------
Net Profit: ${rupees(c.netProfit)} (${c.netMargin}%)
Markup on Cost: ${c.markupOnCost === null ? '—' : `${c.markupOnCost}%`}
Bank Settlement (after ${s.withholdingPercent}% TCS/TDS): ${rupees(c.cashSettlementPayout)}
Monthly Profit (${s.monthlyQty} units): ${rupees(c.monthlyProfit)}`;
}

function csvText(s: NumberInputs, c: SellerProfitabilityCalculation): string {
  const rows: [string, number | string][] = [
    ['Selling Price', s.sellingPrice],
    ['GST inside price', c.outputGst],
    ['Product Cost', s.productCost],
    ['Direct Fulfillment', c.directFulfillment],
    ['Marketplace Fees', c.totalMarketplaceFees],
    [`Marketplace Fee GST (${s.feeGstRate}%)`, c.marketplaceFeeGst],
    ['Advertising and Other', c.otherCosts],
    ['Returns', c.rtoLossPerUnit],
    ['Total Expenses', c.totalExpenses],
    ['Net Profit', c.netProfit],
    ['Net Margin (%)', c.netMargin],
    ['Markup on Cost (%)', c.markupOnCost ?? ''],
    ['Bank Settlement', c.cashSettlementPayout],
    [`Monthly Profit (${s.monthlyQty} units)`, c.monthlyProfit],
  ];
  return `Metric,Amount (INR)\n${rows.map(([k, v]) => `${k},${v}`).join('\n')}`;
}

function download(name: string, csv: string): void {
  const link = document.createElement('a');
  link.setAttribute('href', `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`);
  link.setAttribute('download', name);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function errorText(preset: ResolvedPreset, snapshot: ToolSnapshot): string | null {
  if (snapshot.missing.length > 0) return 'Enter the selling price, product cost and quantity.';
  return snapshot.error ? messageFor(preset, snapshot.error) : null;
}

/** Inputs live in the tool store; the engine computes; this hook only reads and displays. */
export function useSellerProfitability(
  preset: ResolvedPreset,
  snapshot: ToolSnapshot,
  store: ToolStore,
  notify?: (msg: string) => void,
): SellerProfitabilityState {
  const [mode, setMode] = useState<SellerPricingMode>('single');
  const [activeTab, setActiveTab] = useState<SellerInputTab>('pricing');
  const [showAdvanced, setShowAdvanced] = useState(false);
  // The defaults are a complete example, so show its result as soon as the studio opens.
  useEffect(() => {
    if (!snapshot.result) void store.runNow();
  }, [store]);
  const inputs = numberInputs(snapshot, store);
  const calculation = readSellerCalculation(snapshot.result?.value);
  return {
    ...inputs,
    mode,
    setMode,
    activeTab,
    setActiveTab,
    showAdvanced,
    setShowAdvanced,
    isGstInclusive: snapshot.values.priceIncludesGst !== 'no',
    setIsGstInclusive: (v) => store.set('priceIncludesGst', v ? 'yes' : 'no'),
    calculation,
    error: errorText(preset, snapshot),
    copySummary: () => {
      void navigator.clipboard.writeText(summaryText(inputs, calculation));
      notify?.('Seller profit summary copied to clipboard');
    },
    downloadCsv: () => {
      download('seller_profitability.csv', csvText(inputs, calculation));
      notify?.('Profitability CSV exported');
    },
    loadSample: () => {
      void store.loadSample('marketplace-seller');
      notify?.('Sample ecommerce product loaded (₹1,000 SP)');
    },
    resetToDefaults: () => {
      store.reset();
      void store.runNow();
      notify?.('Reset to the default example');
    },
  };
}
