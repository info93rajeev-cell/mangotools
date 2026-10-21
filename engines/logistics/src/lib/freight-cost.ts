import { type OpWarning, type WorkingStep, warning } from '@mangotools/core';
import { add, compare, mul } from '@mangotools/engine-numeric';

/**
 * The shared logistics freight-cost model (`logistics.cost.estimate@1`). Every Logistics tool that
 * offers a cost estimate uses this one function, so the arithmetic is identical everywhere:
 *
 *   baseCharge     = quantity × rate
 *   freightCharge  = max(baseCharge, minimumCharge)   (only when a minimum charge is given)
 *   estimatedTotal = freightCharge + otherCharges
 *
 * Rates are always the user's own: no live prices, no currency conversion. The currency is
 * accounting context only and never changes a value. All values are exact decimal strings; callers
 * round each output once, for display.
 */

/** Approved rate bases. Per-kg and per-pallet are deliberately not part of this version. */
export const rateBases = ['per-cbm', 'per-container'] as const;
export type RateBasis = (typeof rateBases)[number];

/**
 * Phase 1 currencies (founder-approved contract): identifiers and formatting context only, never
 * converted. All have two minor-unit decimals. More currencies need a separate contract extension.
 */
export const freightCurrencies = ['INR', 'USD', 'EUR', 'GBP', 'AED'] as const;
export type FreightCurrency = (typeof freightCurrencies)[number];

export interface FreightTerms {
  /** Price per unit of the rate basis (per m³ or per container); greater than zero. */
  rate: string;
  /** Optional floor for the freight charge; zero or more. */
  minimumCharge: string | null;
  /** Optional fixed charges added after the minimum is applied; zero or more. */
  otherCharges: string | null;
}

export interface FreightEstimate {
  baseCharge: string;
  /** True only when a minimum charge was given and is greater than the base charge. */
  minimumApplied: boolean;
  freightCharge: string;
  estimatedTotal: string;
}

/** The shared freight formula, at full precision. `quantity` must already be validated. */
export function estimateFreight(quantity: string, terms: FreightTerms): FreightEstimate {
  const baseCharge = mul(quantity, terms.rate);
  const minimum = terms.minimumCharge;
  const minimumApplied = minimum !== null && compare(minimum, baseCharge) > 0;
  const freightCharge = minimumApplied && minimum !== null ? minimum : baseCharge;
  const estimatedTotal = add(freightCharge, terms.otherCharges ?? '0');
  return { baseCharge, minimumApplied, freightCharge, estimatedTotal };
}

const step = (
  ref: string,
  formulaKey: string,
  variables: Record<string, string>,
  result: string,
): WorkingStep => ({ ref, formulaKey, variables, result });

/** Working steps for the three formula lines, with full-precision values. */
export function freightWorkingSteps(
  basis: RateBasis,
  quantity: string,
  terms: FreightTerms,
  estimate: FreightEstimate,
): WorkingStep[] {
  const steps = [
    step('baseCharge', `fc.base.${basis}`, { quantity, rate: terms.rate }, estimate.baseCharge),
  ];
  if (terms.minimumCharge !== null) {
    steps.push(
      step(
        'freightCharge',
        estimate.minimumApplied ? 'fc.minimum.applied' : 'fc.minimum.notApplied',
        { baseCharge: estimate.baseCharge, minimumCharge: terms.minimumCharge },
        estimate.freightCharge,
      ),
    );
  }
  steps.push(
    step(
      'estimatedTotal',
      'fc.total',
      { freightCharge: estimate.freightCharge, otherCharges: terms.otherCharges ?? '0' },
      estimate.estimatedTotal,
    ),
  );
  return steps;
}

/** The shared output shape: every money value rounded once, by `shown`, from its exact value. */
export function shapeFreight(
  basis: RateBasis,
  currency: FreightCurrency,
  quantity: string,
  terms: FreightTerms,
  estimate: FreightEstimate,
  shown: (value: string) => string,
) {
  return {
    rateBasis: basis,
    currency,
    quantity,
    rate: shown(terms.rate),
    baseCharge: shown(estimate.baseCharge),
    minimumCharge: terms.minimumCharge === null ? null : shown(terms.minimumCharge),
    minimumApplied: estimate.minimumApplied,
    freightCharge: shown(estimate.freightCharge),
    otherCharges: shown(terms.otherCharges ?? '0'),
    estimatedTotal: shown(estimate.estimatedTotal),
  };
}

/** The standing "your own rate" notice, plus a note when the minimum charge replaced the base. */
export function freightNotices(estimate: FreightEstimate): OpWarning[] {
  const notices = [warning('LOGISTICS_COST_USER_RATE', { details: { severity: 'info' } })];
  if (estimate.minimumApplied) notices.push(warning('LOGISTICS_COST_MINIMUM_APPLIED'));
  return notices;
}
