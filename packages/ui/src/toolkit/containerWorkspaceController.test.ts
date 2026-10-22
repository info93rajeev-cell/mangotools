import type { RunFn, RunOutcome } from '@mangotools/runtime';
import { describe, expect, it } from 'vitest';
import { createLoadController } from './containerWorkspaceController.ts';

const tick = async () => {
  await Promise.resolve();
  await Promise.resolve();
};
function harness() {
  const calls: {
    id: string;
    input: unknown;
    signal?: AbortSignal;
    resolve: (value: RunOutcome) => void;
  }[] = [];
  const run: RunFn = (id, input, _params, signal) =>
    new Promise((resolve) => calls.push({ id, input, signal, resolve }));
  const controller = createLoadController(run);
  const finish = (index: number, value: Record<string, unknown>) =>
    calls[index]?.resolve({ ok: true, value, warnings: [] });
  return { calls, controller, finish };
}
const complete = { status: 'complete', containersRequired: '7' };
describe('Container workspace controller', () => {
  it('sends numeric packages without descriptions or UI ids and preserves optional zero weight', () => {
    const h = harness();
    h.controller.edit(0, 'description', 'PRIVATE SKU');
    expect(h.calls[0]?.id).toBe('logistics.container.load@1');
    expect(JSON.stringify(h.calls[0]?.input)).not.toContain('PRIVATE SKU');
    expect(JSON.stringify(h.calls[0]?.input)).not.toContain('description');
    h.controller.edit(0, 'weight', '0');
    expect(JSON.stringify(h.calls.at(-1)?.input)).toContain('"weight":"0"');
    h.controller.edit(0, 'weight', '');
    expect(
      (h.calls.at(-1)?.input as { packages?: unknown[] } | undefined)?.packages?.[0],
    ).not.toHaveProperty('weight');
  });
  it('invalidates synchronously and rejects out-of-order placement results', async () => {
    const h = harness();
    void h.controller.calculate();
    h.controller.settings({ containerType: '40gp' });
    expect(h.calls[0]?.signal?.aborted).toBe(true);
    h.finish(1, complete);
    await tick();
    h.controller.edit(0, 'length', '1');
    expect(h.controller.get().result).toBeNull();
    h.finish(0, { ...complete, containersRequired: '999' });
    await tick();
    expect(h.controller.get().result).toBeNull();
  });
  it('prices ONLY the actual container count on complete placements', async () => {
    const h = harness();
    h.controller.cost({ enabled: true, rate: '4500' });
    void h.controller.calculate();
    h.finish(0, complete);
    await tick();
    expect(h.calls[1]?.id).toBe('logistics.cost.estimate@1');
    expect(h.calls[1]?.input).toMatchObject({
      rateBasis: 'per-container',
      quantity: '7',
      rate: '4500',
    });
  });
  it.each(['partial', 'none'])('does not price %s placement', async (status) => {
    const h = harness();
    h.controller.cost({ enabled: true });
    void h.controller.calculate();
    h.finish(0, { ...complete, status });
    await tick();
    expect(h.calls).toHaveLength(1);
  });
  it('rejects stale cost after shipment edits, disable and disposal', async () => {
    const h = harness();
    h.controller.cost({ enabled: true });
    void h.controller.calculate();
    h.finish(0, complete);
    await tick();
    h.controller.edit(0, 'length', '30');
    h.finish(1, { estimatedTotal: '999.00' });
    await tick();
    expect(h.controller.get().cost).toBeNull();
    h.finish(2, complete);
    await tick();
    h.controller.cost({ enabled: false });
    h.finish(3, { estimatedTotal: '888.00' });
    await tick();
    expect(h.controller.get().cost).toBeNull();
    h.controller.dispose();
    expect(h.calls[2]?.signal?.aborted).toBe(true);
  });
  it('converts dimensions on unit edits and independently duplicates rows', () => {
    const h = harness();
    h.controller.edit(0, 'unit', 'm');
    expect(h.controller.get().packages[0]?.length).toBe('0.6');
    h.controller.duplicate(0);
    h.controller.edit(4, 'length', '2');
    expect(h.controller.get().packages[0]?.length).toBe('0.6');
  });
  it('bounds rows at 50 and clear leaves one new editable package', () => {
    const h = harness();
    for (let i = 0; i < 60; i++) h.controller.add();
    expect(h.controller.get().packages).toHaveLength(50);
    h.controller.clear();
    expect(h.controller.get().packages).toHaveLength(1);
    expect(h.controller.get().packages[0]?.length).toBe('');
  });
});
