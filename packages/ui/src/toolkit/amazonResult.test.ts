import { readFileSync } from 'node:fs';
import { defaultValues, type ToolSnapshot, type ToolStore } from '@mangotools/runtime';
import { fixtureSchema, type ResolvedPreset } from '@mangotools/schemas';
import type { VNode } from 'preact';
import { describe, expect, it } from 'vitest';
import { CalculatorLayout } from '../archetypes/CalculatorLayout.tsx';

type Element = VNode<Record<string, unknown>>;
const gst: ResolvedPreset = JSON.parse(
  readFileSync(
    new URL('../../../../generated/presets/estimate/gst.india.json', import.meta.url),
    'utf8',
  ),
);
const fixture = fixtureSchema.parse(
  JSON.parse(readFileSync(new URL('./amazonResult.fixture.json', import.meta.url), 'utf8')),
);
const data = fixture.input.value as Record<string, unknown>;
const expected = fixture.expected ?? {};
function elements(value: unknown): Element[] {
  if (Array.isArray(value)) return value.flatMap(elements);
  if (!value || typeof value !== 'object' || !('type' in value)) return [];
  const node = value as Element;
  return typeof node.type === 'function'
    ? elements((node.type as (props: Element['props']) => unknown)(node.props))
    : [node, ...elements(node.props.children)];
}
function words(value: unknown): string {
  if (Array.isArray(value)) return value.map(words).join(' ');
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  return value && typeof value === 'object' && 'props' in value
    ? words((value as Element).props.children)
    : '';
}
function view(
  value = data,
  id = 'estimate/amazon.manual-profitability',
  warnings: NonNullable<ToolSnapshot['result']>['warnings'] = [],
) {
  const preset = { ...gst, id, operation: 'estimate.marketplace.manual-profitability@1' };
  const layout = CalculatorLayout({
    idPrefix: 'test',
    preset,
    store: {} as ToolStore,
    snapshot: {
      phase: 'result',
      values: defaultValues(preset),
      result: { value, warnings },
      error: null,
      missing: [],
    },
    actions: { hasResult: true, onReset: () => {}, onCopy: () => {} },
  }) as Element;
  return elements((layout.props.children as unknown[])[1]);
}
const row = (nodes: Element[], key: string) =>
  words(nodes.find((n) => n.props['data-output'] === key)?.props.children);

describe('bounded Amazon result presentation', () => {
  it.each([
    'estimate/amazon.manual-profitability',
    'estimate/gst.india',
    'estimate/other',
    'estimate/amazon.manual-profitability-extra',
  ])('selects by exact preset id only: %s', (id) => {
    const nodes = view({ ...data, grossAmount: '118.00' }, id);
    expect(nodes.some((n) => n.props['data-amazon-result'] !== undefined)).toBe(
      id === 'estimate/amazon.manual-profitability',
    );
    if (id !== 'estimate/amazon.manual-profitability')
      expect(
        words(nodes.find((n) => n.props['data-primary-result'] !== undefined)?.props.children),
      ).toContain('₹118.00');
  });
  it('uses untouched engine values, preserving negative money and all metrics', () => {
    const before = JSON.stringify(data);
    const nodes = view(Object.freeze({ ...data }));
    for (const [key, value] of Object.entries(expected.metrics as Record<string, string>))
      expect(row(nodes, key)).toBe(value);
    expect(JSON.stringify(data)).toBe(before);
  });
  it('does not substitute zero for null ratios or break-even', () => {
    const nodes = view({
      ...data,
      profitMarginPercent: null,
      roiPercent: null,
      effectiveMarketplaceFeePercent: null,
      breakEvenSellingPrice: null,
    });
    for (const key of ['profitMarginPercent', 'roiPercent', 'effectiveMarketplaceFeePercent'])
      expect(row(nodes, key)).toContain('Not available');
    expect(row(nodes, 'breakEvenSellingPrice')).toContain('Not determinable');
    expect(nodes.map((n) => words(n.props.children)).join(' ')).not.toMatch(
      /NaN|undefined|\bnull\b/,
    );
  });
  it.each([
    ['scenario', 'Not determinable for this scenario'],
    ['price-slabs', 'Not determinable with price-slab fees'],
    ['no-positive-solution', 'No positive break-even price'],
    ['unknown', 'Not determinable'],
  ])('uses warning reason only: %s', (reason, expected) => {
    const nodes = view({ ...data, breakEvenSellingPrice: null }, undefined, [
      { code: 'ESTIMATE_BREAK_EVEN_NOT_DETERMINABLE', messageKey: 'warning', details: { reason } },
    ]);
    expect(row(nodes, 'breakEvenSellingPrice')).toContain(expected);
  });
  it('shows each fee, labels, applicability, bases, amounts and GST without recalculation', () => {
    const nodes = view();
    const rows = nodes.filter((n) => n.props['data-fee-row'] !== undefined);
    expect(rows).toHaveLength(6);
    const text = rows.map((n) => words(n.props.children)).join(' ');
    for (const value of expected.feeText as string[]) expect(text).toContain(value);
    expect(nodes.filter((n) => n.type === 'th' && n.props.scope === 'col')).toHaveLength(6);
  });
  it('keeps all details closed, shows all supporting totals, and reuses engine working', () => {
    const nodes = view();
    for (const [key, value] of Object.entries(expected.breakdown as Record<string, string>))
      expect(row(nodes, key)).toBe(value);
    const details = nodes.filter((n) => n.type === 'details');
    expect(details).toHaveLength(3);
    expect(details.every((n) => !n.props.open)).toBe(true);
    expect(nodes.some((n) => n.type === 'li' && words(n.props.children).includes('17.00'))).toBe(
      true,
    );
    expect(
      view({
        ...data,
        marketplaceFees: Array(21).fill((data.marketplaceFees as unknown[])[0]),
      }).filter((n) => n.props['data-fee-row'] !== undefined),
    ).toHaveLength(20);
  });
});
