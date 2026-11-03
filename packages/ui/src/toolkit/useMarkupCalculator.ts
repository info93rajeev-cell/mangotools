import type { ToolSnapshot, ToolStore } from '@mangotools/runtime';
import type { ResolvedPreset } from '@mangotools/schemas';
import { useEffect } from 'preact/hooks';
import {
  ENGINE_MODE,
  type MarkupCalculation,
  type MarkupPricingMode,
  readMarkupCalculation,
} from './markupResult.ts';
import { messageFor } from './presentation.ts';

export * from './markupResult.ts';

/** Studio input name → preset field of `estimate/pricing.price-plan`. */
const FIELD = {
  costPrice: 'productCost',
  additionalCost: 'additionalCost',
  markupPercent: 'markupPercent',
  givenSellingPrice: 'sellingPrice',
  targetMarginPercent: 'targetMarginPercent',
  quantity: 'quantity',
  gstRate: 'gstRatePercent',
} as const;

type NumberInput = keyof typeof FIELD;
type NumberInputs = { [K in NumberInput]: number } & {
  [K in NumberInput as `set${Capitalize<K>}`]: (v: number) => void;
};

export type MarkupCalculatorState = NumberInputs & {
  pricingMode: MarkupPricingMode;
  setPricingMode: (m: MarkupPricingMode) => void;
  calculation: MarkupCalculation;
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

function modeOf(snapshot: ToolSnapshot): MarkupPricingMode {
  const entry = Object.entries(ENGINE_MODE).find(([, v]) => v === snapshot.values.mode);
  return (entry?.[0] as MarkupPricingMode | undefined) ?? 'find_price';
}

const pctText = (v: number | null) => (v === null ? '—' : `${v}%`);

function summaryText(s: NumberInputs, c: MarkupCalculation): string {
  return `Markup Summary:
Total cost: ₹${c.baseCost.toFixed(2)}
Selling price: ₹${c.sellingPrice.toFixed(2)}
Markup: ${pctText(c.markupPercent)}
Gross margin: ${c.grossMargin}%
Profit per unit: ₹${c.profitPerUnit.toFixed(2)}
Profit on ${s.quantity} units: ₹${c.profitOnQuantity.toFixed(2)}
Price with ${s.gstRate}% GST: ₹${c.priceWithGst.toFixed(2)}`;
}

function csvText(s: NumberInputs, c: MarkupCalculation): string {
  const rows: [string, number | string][] = [
    ['Total cost', c.baseCost],
    ['Selling price', c.sellingPrice],
    ['Markup (%)', c.markupPercent ?? ''],
    ['Gross margin (%)', c.grossMargin],
    ['Profit per unit', c.profitPerUnit],
    [`Profit on ${s.quantity} units`, c.profitOnQuantity],
    [`GST (${s.gstRate}%)`, c.gstAmount],
    ['Price with GST', c.priceWithGst],
  ];
  return `Metric,Value\n${rows.map(([k, v]) => `${k},${v}`).join('\n')}`;
}

function download(name: string, csv: string): void {
  const link = document.createElement('a');
  link.setAttribute('href', `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`);
  link.setAttribute('download', name);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/** Inputs live in the tool store; the engine computes; this hook only reads and displays. */
export function useMarkupCalculator(
  preset: ResolvedPreset,
  snapshot: ToolSnapshot,
  store: ToolStore,
  notify?: (msg: string) => void,
): MarkupCalculatorState {
  // The defaults are a complete example, so show its result as soon as the studio opens.
  useEffect(() => {
    if (!snapshot.result) void store.runNow();
  }, [store]);
  const inputs = numberInputs(snapshot, store);
  const calculation = readMarkupCalculation(snapshot.result?.value);
  return {
    ...inputs,
    pricingMode: modeOf(snapshot),
    setPricingMode: (m) => store.set('mode', ENGINE_MODE[m]),
    calculation,
    error: snapshot.error ? messageFor(preset, snapshot.error) : null,
    copySummary: () => {
      void navigator.clipboard.writeText(summaryText(inputs, calculation));
      notify?.('Summary copied to clipboard');
    },
    downloadCsv: () => {
      download('markup_pricing.csv', csvText(inputs, calculation));
      notify?.('Pricing breakdown exported');
    },
    loadSample: () => {
      void store.loadSample('markup-40');
      notify?.('Sample ₹500 product at 40% markup loaded');
    },
    resetToDefaults: () => {
      store.reset();
      void store.runNow();
      notify?.('Reset to defaults');
    },
  };
}
