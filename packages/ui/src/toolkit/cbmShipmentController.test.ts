import type { RunFn, RunOutcome } from '@mangotools/runtime';
import { describe, expect, it } from 'vitest';
import { volumeShare } from './cbmComposition.ts';
import { createCbmController } from './cbmShipmentController.ts';
import { shipmentSummary } from './cbmShipmentCopy.ts';

const shipment = {
  rows: [{ index: 0, quantity: '100', totalCbm: '1.250', totalCbmExact: '1.25' }],
  totalCbmExact: '1.25',
  totalCbm: '1.250',
  totalCft: '44.143',
  totalPieces: '100',
  knownPackedWeightKg: null,
  weightCoverage: 'none',
  weightedPieces: '0',
};
function harness() {
  const calls: { operation: string; input: unknown; resolve: (outcome: RunOutcome) => void }[] = [];
  const run: RunFn = (operation, input) =>
    new Promise((resolve) => calls.push({ operation, input, resolve }));
  const controller = createCbmController(run);
  const finish = (index: number, value: Record<string, unknown> = shipment) =>
    calls[index]?.resolve({ ok: true, value, warnings: [] });
  return { calls, controller, finish };
}
const tick = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

describe('CBM workspace controller', () => {
  it('excludes descriptions and UI ids from numeric payloads', () => {
    const h = harness();
    h.controller.edit(0, 'description', 'private SKU');
    expect(JSON.stringify(h.calls[0]?.input)).not.toContain('private SKU');
    expect(JSON.stringify(h.calls[0]?.input)).not.toContain('description');
    expect(h.calls[0]?.operation).toBe('logistics.cbm.shipment@1');
  });
  it('invalidates all derived output synchronously and rejects older shipment replies', async () => {
    const h = harness();
    void h.controller.calculate();
    h.controller.edit(0, 'length', '25');
    h.finish(1);
    await tick();
    expect(h.controller.get().shipment).not.toBeNull();
    h.controller.edit(0, 'width', '25');
    expect(h.controller.get().shipment).toBeNull();
    expect(h.controller.get().cost).toBeNull();
    h.finish(0, { ...shipment, totalCbm: '999' });
    await tick();
    expect(h.controller.get().shipment).toBeNull();
    h.finish(2);
    await tick();
    expect(h.controller.get().shipment?.totalCbm).toBe('1.250');
  });
  it('uses exact current CBM for cost and rejects old cost replies', async () => {
    const h = harness();
    void h.controller.calculate();
    h.finish(0, { ...shipment, totalCbmExact: '1.234567', totalCbm: '1.235' });
    await tick();
    h.controller.setCost({ enabled: true, rate: '100' });
    expect(h.calls[1]?.operation).toBe('logistics.cost.estimate@1');
    expect(h.calls[1]?.input).toMatchObject({
      rateBasis: 'per-cbm',
      quantity: '1.234567',
      rate: '100',
    });
    h.controller.setCost({ rate: '200' });
    h.finish(1, { estimatedTotal: '125.00' });
    await tick();
    expect(h.controller.get().cost).toBeNull();
    h.finish(2, { estimatedTotal: '250.00' });
    await tick();
    expect(h.controller.get().cost?.estimatedTotal).toBe('250.00');
    expect(h.controller.get().shipment).not.toBeNull();
  });
  it('disabling cost rejects late replies and removes cost from copy', async () => {
    const h = harness();
    void h.controller.calculate();
    h.finish(0);
    await tick();
    h.controller.setCost({ enabled: true, rate: '100' });
    h.controller.setCost({ enabled: false });
    h.finish(1, { estimatedTotal: '125.00' });
    await tick();
    expect(h.controller.get().cost).toBeNull();
    expect(shipmentSummary(h.controller.get())).not.toContain('Estimated total');
  });
  it('keeps new-unit defaults separate and converts row measurements', () => {
    const h = harness();
    h.controller.setDefaultUnit('ft');
    expect(h.controller.get().packages[0]?.unit).toBe('cm');
    h.controller.add();
    expect(h.controller.get().packages[1]?.unit).toBe('ft');
    h.controller.edit(0, 'unit', 'm');
    expect(h.controller.get().packages[0]).toMatchObject({
      length: '0.5',
      width: '0.4',
      height: '0.3',
    });
  });
  it('duplicates independently, removes, clears, and enforces the technical row ceiling', () => {
    const h = harness();
    h.controller.duplicate(0);
    const id = h.controller.get().packages[1]?.id ?? -1;
    h.controller.edit(id, 'length', '20');
    expect(h.controller.get().packages[0]?.length).toBe('50');
    h.controller.remove(id);
    expect(h.controller.get().packages).toHaveLength(1);
    for (let i = 0; i < 55; i++) h.controller.add();
    expect(h.controller.get().packages).toHaveLength(50);
    h.controller.clear();
    expect(h.controller.get().packages).toHaveLength(1);
    expect(h.controller.get().packages[0]?.length).toBe('');
  });
  it('does not accept output after disposal', async () => {
    const h = harness();
    void h.controller.calculate();
    h.controller.dispose();
    h.finish(0);
    await tick();
    expect(h.controller.get().shipment).toBeNull();
  });
  it('copies valid shipment only and flattens description newlines', async () => {
    const h = harness();
    expect(shipmentSummary(h.controller.get())).toBe('');
    h.controller.edit(0, 'description', 'Carton\nA');
    h.finish(0);
    await tick();
    expect(shipmentSummary(h.controller.get())).toContain('Carton A:');
    expect(shipmentSummary(h.controller.get())).toContain('Not provided');
  });
  it('calculates composition with decimal-string precision', () => {
    expect(volumeShare('0.96', '3.84')).toBe('25.0');
    expect(volumeShare('2.88', '3.84')).toBe('75.0');
    expect(volumeShare('0.000000000001', '0.000000000003')).toBe('33.3');
  });
});
