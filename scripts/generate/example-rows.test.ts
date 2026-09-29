import { describe, expect, it } from 'vitest';
import { loadEngines } from '../lib/engines.ts';
import { runPipeline } from './pipeline.ts';
import { loadSources } from './sources.ts';

const { output } = await runPipeline(loadSources().sources, await loadEngines());
if (!output) throw new Error('pnpm gen pipeline failed; run pnpm gen for details.');
const examples = output.registry.tools.flatMap((t) =>
  t.content.example ? [{ id: t.id, rows: t.content.example.rows }] : [],
);

describe('worked-example rows', () => {
  it('never show a list or object input as text such as "[object Object]"', () => {
    const bad = examples.flatMap(({ id, rows }) =>
      rows.filter((r) => r.value.includes('[object Object]')).map((r) => `${id}: ${r.key}`),
    );
    expect(bad).toEqual([]);
  });

  it('leave out list inputs, such as invoice items, and keep the scalar fields', () => {
    const invoice = examples.find((e) => e.id === 'export-commercial-invoice-generator');
    const keys = invoice?.rows.filter((r) => r.role === 'input').map((r) => r.key) ?? [];
    expect(keys).not.toContain('items');
    expect(keys).toContain('invoiceNumber');
  });
});
