/**
 * Workstream B wording (#219): visualization, results, composition, cost result and output actions.
 * Legacy shared wording stays in the frozen `cbmStrings.ts`; labels that existing tests and region
 * names depend on are reused from there rather than redefined here.
 */
export const cbmResultText = {
  viewName: '{view} view',
  noDimensions: 'Enter length, width and height to see the package drawn.',
  illustrationLabel:
    '{name}: {length} × {width} × {height} {unit}, {view} view. Fixed illustrative arrangement; not a loading plan.',
  breakdown: 'Show cost breakdown',
  cbmUnit: 'm³',
  cftUnit: 'ft³',
  kgUnit: 'kg',
  weightTotal: 'Total Weight',
  weightKnown: 'Known Weight',
  partialBadge: 'Partial',
  coverageNote:
    '{label}: {weighted} of {total} pieces weighed. Pieces without a weight are not counted.',
  announce: 'Results updated: {cbm} m³ total, {pieces} pieces.',
  compositionShare: '{cbm} ({share}%)',
  compositionUnit: '(CBM)',
  calculated: 'Estimate calculated',
  freightBasis: 'Freight ({quantity} m³ × {rate})',
  freightMinimum: 'Freight (minimum charge applied)',
  minimumNote: 'Rate × CBM = {base}, below your minimum of {minimum}.',
  otherCharges: 'Other charges',
  estimatedTotal: 'Estimated Total',
  costPending: 'Calculating the estimate for the current shipment…',
  costWaiting: 'The estimate appears once the shipment volume is current.',
  costAnnounce: 'Estimated total {total}.',
} as const;

/** Fills {name} placeholders. */
export function fillText(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    values[key] === undefined ? match : String(values[key]),
  );
}
