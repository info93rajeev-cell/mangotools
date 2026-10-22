import { formatDecimal } from '../format/numbers.ts';
import { volumeShare } from './cbmComposition.ts';
import { fillText, cbmResultText as r } from './cbmResultStrings.ts';
import type { CbmCostResult, CbmResult, CbmSnapshot } from './cbmShipmentModel.ts';
import { cbmText as t } from './cbmStrings.ts';

/**
 * Presentation helpers for the CBM results (#219, Workstream B). They group figures the engines
 * already rounded and never re-round them. The only derived figure, the average CBM per piece, uses
 * exact integer arithmetic on the engine's exact total, like the existing composition share.
 */

/** Groups an engine figure for display (1234.5 → 1,234.5); decimals are kept as given. */
export const groupFigure = (value: string) => formatDecimal(value, 'international');

/**
 * An amount in the selected currency with two decimals: ₹ and Indian grouping for INR
 * (₹2,12,600.00); the ISO code and international grouping otherwise (USD 191,000.00).
 */
export function formatAmount(value: string, currency: string): string {
  if (currency === 'INR') return `₹${formatDecimal(value, 'indian', 2)}`;
  return `${currency} ${formatDecimal(value, 'international', 2)}`;
}

const DECIMAL = /^(\d+)(?:\.(\d+))?$/;

/**
 * Exact total CBM ÷ total pieces, rounded half-up to `decimals` places, without floating point.
 * Null when it cannot be derived safely (no pieces or a value that is not a plain decimal).
 */
export function averagePerPiece(
  totalExact: string,
  pieces: string,
  decimals: number,
): string | null {
  const total = DECIMAL.exec(totalExact.trim());
  if (!total || !/^\d+$/.test(pieces.trim()) || !Number.isInteger(decimals) || decimals < 0)
    return null;
  const count = BigInt(pieces.trim());
  if (count === 0n) return null;
  const fraction = total[2] ?? '';
  const numerator = BigInt(`${total[1]}${fraction}`) * 10n ** BigInt(decimals);
  const denominator = count * 10n ** BigInt(fraction.length);
  const rounded = (numerator * 2n + denominator) / (denominator * 2n);
  const digits = rounded.toString().padStart(decimals + 1, '0');
  return decimals === 0 ? digits : `${digits.slice(0, -decimals)}.${digits.slice(-decimals)}`;
}

export interface WeightView {
  label: string;
  /** Grouped figure, or null when no weight was entered. */
  value: string | null;
  /** Only for partial coverage: the figure covers part of the shipment, never all of it. */
  note: string | null;
}

/** Packed weight honest about coverage; a partial figure is never labelled as the shipment weight. */
export function weightView(result: CbmResult): WeightView {
  if (result.weightCoverage === 'none' || result.knownPackedWeightKg === null) {
    return { label: r.weightTotal, value: null, note: null };
  }
  const value = groupFigure(result.knownPackedWeightKg);
  if (result.weightCoverage === 'complete') return { label: r.weightTotal, value, note: null };
  const note = fillText(r.coverageNote, {
    label: t.partialWeight,
    weighted: groupFigure(result.weightedPieces),
    total: groupFigure(result.totalPieces),
  });
  return { label: r.weightKnown, value, note };
}

export interface CompositionItem {
  key: number;
  number: number;
  name: string;
  cbm: string;
  /** One decimal, from exact row CBM ÷ exact total CBM. */
  share: string;
}

/** One item per engine row, named from its own worksheet row (or "Package N"). */
export function compositionItems(state: CbmSnapshot): CompositionItem[] {
  const result = state.shipment;
  if (!result) return [];
  return result.rows.map((row, position) => {
    const index = Number.isInteger(row.index) ? row.index : position;
    const source = state.packages[index];
    return {
      key: source?.id ?? -1 - position,
      number: index + 1,
      name: source?.description.replace(/\s+/g, ' ').trim() || `${t.package} ${index + 1}`,
      cbm: groupFigure(row.totalCbm),
      share: volumeShare(row.totalCbmExact, result.totalCbmExact),
    };
  });
}

export interface FreightView {
  label: string;
  value: string;
  note: string | null;
}

/** The freight line keeps the engine's minimum-charge semantics: freight = max(rate × CBM, minimum). */
export function freightView(cost: CbmCostResult): FreightView {
  const amount = (value: string) => formatAmount(value, cost.currency);
  if (cost.minimumApplied && cost.minimumCharge !== null) {
    return {
      label: r.freightMinimum,
      value: amount(cost.freightCharge),
      note: fillText(r.minimumNote, {
        base: amount(cost.baseCharge),
        minimum: amount(cost.minimumCharge),
      }),
    };
  }
  return {
    label: fillText(r.freightBasis, {
      quantity: groupFigure(cost.quantity),
      rate: amount(cost.rate),
    }),
    value: amount(cost.freightCharge),
    note: null,
  };
}
