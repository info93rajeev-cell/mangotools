import type { FieldValues } from '@mangotools/runtime';
import type { ResolvedPreset } from '@mangotools/schemas';
import { InlineAlert } from '../primitives/feedback.tsx';
import { amazonResultLabel } from '../strings/amazonManualProfitability.ts';
import { amazonManualProfitabilityInput } from './amazonManualProfitabilityInput.ts';

const ID = 'estimate/amazon.manual-profitability';
const FEES = ['referral', 'closing', 'weightHandling', 'pickPack', 'otherService'];
const SECTIONS = [
  'showProductDetails',
  'showTaxes',
  'showAmazonFees',
  'showShipping',
  'showAdjustments',
];
const PREFIX: Record<string, string> = {
  packagingCost: 'packaging',
  sellerShippingCost: 'sellerShipping',
  advertisingCost: 'advertising',
  otherTransactionCost: 'otherTransaction',
  otherSettlementDeductions: 'otherSettlement',
  settlementCredits: 'settlementCredit',
};
const SUFFIX: Record<string, string> = {
  amount: 'Amount',
  value: 'Value',
  mode: 'Mode',
  ratePercent: 'RatePercent',
  quantityScope: 'QuantityScope',
  gstTreatment: 'GstTreatment',
  percentageBase: 'PercentageBase',
  direction: 'Direction',
  economic: 'Effects',
  settlement: 'Effects',
};

/** Configuration notices, not engine warnings; explicit zero GST is configured, not absent. */
export function AmazonConfigurationNotices({
  id,
  values,
  active,
}: {
  id: string;
  values: FieldValues;
  active: boolean;
}) {
  if (!active || id !== ID) return null;
  const notices: string[] = [];
  if (
    !FEES.some((p) =>
      ['fixed', 'percent', 'price-slabs', 'weight-slabs'].includes(String(values[`${p}Mode`])),
    )
  )
    notices.push('noFees');
  if (String(values.productGstRatePercent ?? '').trim() === '') notices.push('noProductGst');
  return notices.map((key) => (
    <InlineAlert key={key} tone="info">
      <p>{amazonResultLabel(key)}</p>
    </InlineAlert>
  ));
}

function indexedPath(root: string, parts: string[], input: Record<string, unknown>): string {
  const items = input[root];
  const item = Array.isArray(items) ? items[Number(parts[1])] : null;
  if (!item || typeof item.id !== 'string') return '';
  const prefix = item.id.replace(/-([a-z])/g, (_: string, letter: string) => letter.toUpperCase());
  const key = parts[2] ?? '';
  if (key === 'priceSlabs' || key === 'weightSlabs') {
    if (parts[4] === 'unit') return 'chargeableWeightUnit';
    const tail = parts.slice(3);
    return [prefix + (key === 'priceSlabs' ? 'PriceSlabs' : 'WeightSlabs'), ...tail].join('.');
  }
  return memberPath(prefix, key, root === 'scenarioAdjustments');
}

function memberPath(prefix: string, member: string, adjustment = false): string {
  if (member === 'scenarios') return prefix + (adjustment ? 'ApplyReturn' : 'ApplySale');
  if (prefix === 'inventoryWriteOff') return `${prefix}Amount`;
  return prefix + (SUFFIX[member] ?? 'Mode');
}

function canonicalPath(preset: ResolvedPreset, values: FieldValues, parts: string[]): string {
  const [root = '', index = ''] = parts;
  if (root in preset.fields) return parts.join('.'); // Includes adapter-local errors.
  if (root === 'chargeableWeight') return `chargeableWeight${index === 'unit' ? 'Unit' : 'Value'}`;
  if (root === 'feeLines' || root === 'scenarioAdjustments') {
    const prepared = amazonManualProfitabilityInput(preset, values);
    return prepared.ok ? indexedPath(root, parts, prepared.value.input) : '';
  }
  return memberPath(PREFIX[root] ?? root, index);
}

export interface AmazonErrorTarget {
  field: string;
  path: string;
  section: string | undefined;
}
/** Resolve indices from the adapter's actual emitted ids, never from a fixed array offset. */
export function amazonErrorTarget(
  preset: ResolvedPreset,
  values: FieldValues,
  path: string | undefined,
): AmazonErrorTarget | null {
  if (preset.id !== ID || !path) return null;
  const mapped = canonicalPath(preset, values, path.replace(/\[(\d+)\]/g, '.$1').split('.'));
  const field = mapped.split('.')[0] ?? '';
  const control = preset.fields[field];
  if (!control) return null;
  const section = SECTIONS.find((key) => control.visibleWhen?.[key]?.includes('true'));
  return { field, path: mapped, section };
}
