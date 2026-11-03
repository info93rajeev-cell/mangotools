/**
 * The Markup Calculator studio's view of `estimate.pricing.price-plan@1`. The engine does all the
 * maths in exact decimals; this module only turns its decimal strings into numbers for display.
 */

export type MarkupPricingMode = 'find_price' | 'find_markup' | 'target_margin';

/** Studio mode → engine mode. */
export const ENGINE_MODE: Record<MarkupPricingMode, string> = {
  find_price: 'from-markup',
  find_markup: 'from-price',
  target_margin: 'from-margin',
};

export interface MarkupCalculation {
  baseCost: number;
  sellingPrice: number;
  /** Markup actually achieved; null when the cost is zero. */
  markupPercent: number | null;
  grossMargin: number;
  profitPerUnit: number;
  profitOnQuantity: number;
  gstAmount: number;
  priceWithGst: number;
  /** NaN when no target margin is set. */
  priceForTargetMargin: number;
  costPct: number;
  profitPct: number;
}

const num = (raw: unknown): number =>
  typeof raw === 'string' && raw.trim() !== '' ? Number(raw) : Number.NaN;

export const EMPTY_MARKUP_CALCULATION: MarkupCalculation = {
  baseCost: 0,
  sellingPrice: 0,
  markupPercent: null,
  grossMargin: 0,
  profitPerUnit: 0,
  profitOnQuantity: 0,
  gstAmount: 0,
  priceWithGst: 0,
  priceForTargetMargin: Number.NaN,
  costPct: 0,
  profitPct: 0,
};

export function readMarkupCalculation(
  value: Record<string, unknown> | undefined,
): MarkupCalculation {
  if (!value) return EMPTY_MARKUP_CALCULATION;
  return {
    baseCost: num(value.totalCost),
    sellingPrice: num(value.sellingPrice),
    markupPercent: value.markupPercent === null ? null : num(value.markupPercent),
    grossMargin: value.marginPercent === null ? 0 : num(value.marginPercent),
    profitPerUnit: num(value.profitPerUnit),
    profitOnQuantity: num(value.profitOnQuantity),
    gstAmount: num(value.gstAmount),
    priceWithGst: num(value.priceWithGst),
    priceForTargetMargin: num(value.priceForTargetMargin),
    costPct: value.costSharePercent === null ? 0 : num(value.costSharePercent),
    profitPct: value.profitSharePercent === null ? 0 : num(value.profitSharePercent),
  };
}
