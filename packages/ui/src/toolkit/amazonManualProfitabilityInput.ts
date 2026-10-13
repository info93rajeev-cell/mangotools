import type { OpError, Result } from '@mangotools/core';
import { buildRequest, type FieldValues, type ToolRequest } from '@mangotools/runtime';
import type { ResolvedPreset } from '@mangotools/schemas';

const GROUPS = [
  ['referral', 'referral', ['off', 'percent', 'price-slabs']],
  ['closing', 'closing', ['off', 'fixed', 'price-slabs']],
  ['weightHandling', 'weight-handling', ['off', 'fixed', 'weight-slabs']],
  ['pickPack', 'pick-pack', ['off', 'fixed']],
  ['otherService', 'other-service', ['off', 'fixed']],
] as const;
const SCENARIOS = [
  ['ApplySale', 'successful-sale'],
  ['ApplyReturn', 'customer-return'],
  ['ApplyRto', 'rto'],
  ['ApplyCancellation', 'cancellation'],
] as const;
const invalid = (path: string): OpError => ({
  code: 'INVALID_INPUT',
  messageKey: 'errors.INVALID_INPUT',
  path,
});

/** Strict adapter-local decoding: no defaults, truncation, blank-row dropping or numeric coercion. */
function slabRows(
  raw: string,
  key: string,
  kind: 'percent' | 'fixed' | 'weight',
): Result<Record<string, string>[]> {
  let decoded: unknown;
  try {
    decoded = raw.trim() === '' ? [] : JSON.parse(raw);
  } catch {
    return { ok: false, error: invalid(key) };
  }
  if (!Array.isArray(decoded) || decoded.length > 20) return { ok: false, error: invalid(key) };
  const output: Record<string, string>[] = [];
  for (const [index, row] of decoded.entries()) {
    const item = slabRow(row, `${key}.${index}`, kind);
    if (!item.ok) return item;
    output.push(item.value);
  }
  return { ok: true, value: output, warnings: [] };
}

const validCell = (value: unknown, required: boolean) =>
  value === undefined ? !required : typeof value === 'string' && (!required || value.trim() !== '');

function slabRow(
  raw: unknown,
  path: string,
  kind: 'percent' | 'fixed' | 'weight',
): Result<Record<string, string>> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw))
    return { ok: false, error: invalid(path) };
  const source = raw as Record<string, unknown>;
  const item: Record<string, string> = {};
  const amountKey = kind === 'weight' ? 'amount' : 'value';
  for (const cell of ['min', 'max', amountKey]) {
    const value = source[cell];
    if (!validCell(value, cell === amountKey))
      return { ok: false, error: invalid(`${path}.${cell}`) };
    if (typeof value === 'string' && value.trim() !== '') item[cell] = value;
  }
  if (kind !== 'weight') {
    if (source.chargeMode !== kind) return { ok: false, error: invalid(`${path}.chargeMode`) };
    item.chargeMode = kind;
  }
  return { ok: true, value: item, warnings: [] };
}

interface FeeForm {
  values: Readonly<FieldValues>;
  missing: string[];
  error: OpError | null;
}

function text(form: FeeForm, key: string): string {
  const value = form.values[key];
  if (value !== undefined && typeof value !== 'string') form.error ??= invalid(key);
  return typeof value === 'string' ? value : '';
}

function required(form: FeeForm, key: string, choices?: readonly string[]): string {
  const value = text(form, key);
  if (value.trim() === '' || value === 'unselected') form.missing.push(key);
  else if (choices && !choices.includes(value)) form.error ??= invalid(key);
  return value;
}

function scenarios(form: FeeForm, prefix: string): string[] {
  const selected = SCENARIOS.filter(([suffix]) => {
    const value = form.values[`${prefix}${suffix}`];
    if (value !== undefined && ![true, false, 'true', 'false'].includes(value))
      form.error ??= invalid(`${prefix}${suffix}`);
    return value === true || value === 'true';
  }).map(([, scenario]) => scenario);
  if (selected.length === 0) form.missing.push(`${prefix}ApplySale`);
  return selected;
}

function feeSlabs(form: FeeForm, prefix: string, mode: string): Record<string, unknown> {
  const price = mode === 'price-slabs';
  const key = `${prefix}${price ? 'PriceSlabs' : 'WeightSlabs'}`;
  const rows = slabRows(
    text(form, key),
    key,
    price ? (prefix === 'referral' ? 'percent' : 'fixed') : 'weight',
  );
  if (!rows.ok) {
    form.error ??= rows.error;
    return {};
  }
  if (rows.value.length === 0) form.missing.push(key);
  if (price) return { slabPriceBase: 'entered-unit-selling-price', priceSlabs: rows.value };
  required(form, 'chargeableWeightValue');
  const unit = required(form, 'chargeableWeightUnit', ['g', 'kg']);
  return { weightSlabs: rows.value.map((row) => ({ ...row, unit })) };
}

function fee(form: FeeForm, group: (typeof GROUPS)[number]): Record<string, unknown>[] {
  const [prefix, id, modes] = group;
  const mode = required(form, `${prefix}Mode`, modes);
  if (mode === 'off' || mode.trim() === '' || mode === 'unselected') return [];
  const line: Record<string, unknown> = {
    id,
    enabled: true,
    mode,
    gstTreatment: required(form, `${prefix}GstTreatment`, [
      'none',
      'recoverable',
      'non-recoverable',
    ]),
    scenarios: scenarios(form, prefix),
  };
  if (prefix === 'referral') line.percentageBase = 'realized-customer-value';
  else
    line.quantityScope =
      prefix === 'closing'
        ? 'per-order'
        : required(form, `${prefix}QuantityScope`, ['per-unit', 'per-order']);
  if (mode === 'percent') line.ratePercent = required(form, `${prefix}RatePercent`);
  if (mode === 'fixed') line.amount = required(form, `${prefix}Amount`);
  if (mode === 'price-slabs' || mode === 'weight-slabs')
    Object.assign(line, feeSlabs(form, prefix, mode));
  return [line];
}

/** Fee/weight core only; integration and other scoped objects belong to subsequent UI PRs. */
export function amazonManualProfitabilityInput(
  preset: ResolvedPreset,
  values: Readonly<FieldValues>,
): Result<ToolRequest> {
  const base = buildRequest(preset, values);
  const form: FeeForm = { values, missing: [...base.missing], error: null };
  const input = { ...base.input };
  const weight = text(form, 'chargeableWeightValue');
  delete input.chargeableWeight;
  if (weight.trim() !== '')
    input.chargeableWeight = {
      value: weight,
      unit: required(form, 'chargeableWeightUnit', ['g', 'kg']),
    };
  const feeLines = GROUPS.flatMap((group) => fee(form, group));
  if (form.error) return { ok: false, error: form.error };
  return {
    ok: true,
    warnings: [],
    value: {
      input: { ...input, feeLines },
      params: base.params,
      missing: [...new Set(form.missing)],
    },
  };
}
