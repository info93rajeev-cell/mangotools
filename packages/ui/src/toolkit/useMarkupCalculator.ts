import type { ResolvedPreset } from '@mangotools/schemas';
import { useState } from 'preact/hooks';
import { copyText, downloadText } from './actions.ts';
import { messageFor } from './presentation.ts';
import { useEngineRun } from './useEngineRun.ts';
import type { WorkingStep } from './WorkingSteps.tsx';

export type MarkupPricingMode = 'find_price' | 'find_markup' | 'target_margin';

/** What `estimate.pricing.margin@1` returns: decimal strings, money already rounded. */
export interface MarginResult {
  cost: string;
  price: string;
  profit: string;
  marginPercent: string | null;
  markupPercent: string | null;
  profitTotal: string | null;
  priceWithGst: string | null;
  working: WorkingStep[];
}

const SOLVE: Record<MarkupPricingMode, string> = {
  find_price: 'price-from-cost-and-markup',
  find_markup: 'from-cost-and-price',
  target_margin: 'price-from-cost-and-margin',
};

export interface MarkupInputs {
  pricingMode: MarkupPricingMode;
  costPrice: number;
  markupPercent: number;
  givenSellingPrice: number;
  targetMarginPercent: number;
  quantity: number;
  additionalCost: number;
  gstPercent: number;
}

/** The engine input for the main result; every field is sent as text. */
export function markupEngineInput(i: MarkupInputs): Record<string, unknown> {
  const input: Record<string, unknown> = {
    solve: SOLVE[i.pricingMode],
    cost: String(i.costPrice),
    quantity: String(i.quantity),
  };
  if (i.pricingMode === 'find_price') input.markupPercent = String(i.markupPercent);
  if (i.pricingMode === 'find_markup') input.price = String(i.givenSellingPrice);
  if (i.pricingMode === 'target_margin') input.marginPercent = String(i.targetMarginPercent);
  if (i.additionalCost > 0) input.extraCost = String(i.additionalCost);
  if (i.gstPercent > 0) input.gstPercent = String(i.gstPercent);
  return input;
}

export interface MarkupCalculatorState extends MarkupInputs {
  preset: ResolvedPreset;
  setPricingMode: (m: MarkupPricingMode) => void;
  setCostPrice: (v: number) => void;
  setMarkupPercent: (v: number) => void;
  setGivenSellingPrice: (v: number) => void;
  setTargetMarginPercent: (v: number) => void;
  setQuantity: (v: number) => void;
  setAdditionalCost: (v: number) => void;
  setGstPercent: (v: number) => void;
  targetCost: number;
  setTargetCost: (v: number) => void;
  /** Main result from the engine, or null while it runs or when the input is invalid. */
  result: MarginResult | null;
  /** Message for invalid input (e.g. a margin of 100% or more). */
  error: string | null;
  /** Price needed for the Target Margin card, from the engine. */
  targetResult: MarginResult | null;
  targetError: string | null;
  copySummary: () => void;
  downloadCsv: () => void;
  resetToDefaults: () => void;
}

const DEFAULTS: MarkupInputs = {
  pricingMode: 'find_price',
  costPrice: 500,
  markupPercent: 40,
  givenSellingPrice: 700,
  targetMarginPercent: 30,
  quantity: 20,
  additionalCost: 0,
  gstPercent: 0,
};

function useMarkupInputs() {
  const [inputs, setInputs] = useState<MarkupInputs>(DEFAULTS);
  const [targetCost, setTargetCost] = useState(DEFAULTS.costPrice);
  const set =
    <K extends keyof MarkupInputs>(key: K) =>
    (value: MarkupInputs[K]) =>
      setInputs((prev) => ({ ...prev, [key]: value }));
  return {
    inputs,
    setInputs,
    targetCost,
    setTargetCost,
    setters: {
      setPricingMode: set('pricingMode'),
      setCostPrice: set('costPrice'),
      setMarkupPercent: set('markupPercent'),
      setGivenSellingPrice: set('givenSellingPrice'),
      setTargetMarginPercent: set('targetMarginPercent'),
      setQuantity: set('quantity'),
      setAdditionalCost: set('additionalCost'),
      setGstPercent: set('gstPercent'),
    },
  };
}

function summaryText(inputs: MarkupInputs, r: MarginResult): string {
  const lines = [
    'Markup Summary:',
    `Cost: ₹${r.cost}`,
    `Selling price: ₹${r.price}`,
    `Profit per unit: ₹${r.profit}`,
    `Markup: ${r.markupPercent ?? '—'}%`,
    `Margin: ${r.marginPercent ?? '—'}%`,
  ];
  if (r.profitTotal !== null) lines.push(`Profit on ${inputs.quantity} units: ₹${r.profitTotal}`);
  if (r.priceWithGst !== null) {
    lines.push(`Price with ${inputs.gstPercent}% GST: ₹${r.priceWithGst}`);
  }
  return lines.join('\n');
}

function summaryCsv(inputs: MarkupInputs, r: MarginResult): string {
  const rows: [string, string][] = [
    ['Cost (INR)', r.cost],
    ['Selling price (INR)', r.price],
    ['Profit per unit (INR)', r.profit],
    ['Markup (%)', r.markupPercent ?? ''],
    ['Margin (%)', r.marginPercent ?? ''],
    [`Profit on ${inputs.quantity} units (INR)`, r.profitTotal ?? ''],
    ['Price with GST (INR)', r.priceWithGst ?? ''],
  ];
  return `Metric,Value\n${rows.map(([k, v]) => `"${k}",${v}`).join('\n')}\n`;
}

export function useMarkupCalculator(
  preset: ResolvedPreset,
  notify?: (msg: string) => void,
): MarkupCalculatorState {
  const { inputs, setInputs, targetCost, setTargetCost, setters } = useMarkupInputs();
  const main = useEngineRun<MarginResult>(
    preset.operation,
    markupEngineInput(inputs),
    preset.params,
  );
  const target = useEngineRun<MarginResult>(
    preset.operation,
    {
      solve: 'price-from-cost-and-margin',
      cost: String(targetCost),
      marginPercent: String(inputs.targetMarginPercent),
    },
    preset.params,
  );

  return {
    ...inputs,
    ...setters,
    preset,
    targetCost,
    setTargetCost,
    result: main.value,
    error: main.error ? messageFor(preset, main.error) : null,
    targetResult: target.value,
    targetError: target.error ? messageFor(preset, target.error) : null,
    copySummary: async () => {
      if (!main.value) return;
      const done = await copyText(summaryText(inputs, main.value));
      notify?.(done ? 'Summary copied to clipboard' : 'Copy failed');
    },
    downloadCsv: () => {
      if (!main.value) return;
      downloadText(summaryCsv(inputs, main.value), 'markup-pricing.csv', 'text/csv');
      notify?.('Pricing summary downloaded');
    },
    resetToDefaults: () => {
      setInputs(DEFAULTS);
      setTargetCost(DEFAULTS.costPrice);
      notify?.('Reset to defaults');
    },
  };
}
