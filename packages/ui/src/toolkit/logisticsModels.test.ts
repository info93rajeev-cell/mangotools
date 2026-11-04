import { describe, expect, it } from 'vitest';
import {
  bestLayer,
  computePalletLoading,
  DEFAULT_PALLET_INPUT,
  layerPattern,
} from './palletLoadingModel.ts';
import { isUsableItem, SAMPLE_VOLUMETRIC_ITEMS } from './volumetricWeightModel.ts';

describe('pallet loading model', () => {
  it('computes the default case: 9 per layer, 4 layers, 36 boxes', () => {
    const r = computePalletLoading(DEFAULT_PALLET_INPUT);
    expect([r.boxesPerLayer, r.totalLayers, r.totalBoxes, r.issue]).toEqual([9, 4, 36, null]);
    expect(r.weightBreakdown.totalGrossWeightKg).toBe(457);
    expect(r.loadedDimensions.height).toBe(134);
  });

  it('never invents a utilization: a box larger than the pallet gives 0 and an issue', () => {
    const r = computePalletLoading({ ...DEFAULT_PALLET_INPUT, boxLength: 130, boxWidth: 110 });
    expect(r.totalBoxes).toBe(0);
    expect(r.spaceUtilizationPercent).toBe(0);
    expect(r.issue).toContain('larger than the pallet');
  });

  it('does not claim a layer when the box is taller than the usable height', () => {
    const r = computePalletLoading({ ...DEFAULT_PALLET_INPUT, boxHeight: 140 });
    expect(r.totalLayers).toBe(0);
    expect(r.totalBoxes).toBe(0);
    expect(r.issue).toContain('taller than the usable height');
  });

  it('rejects zero or missing sizes instead of treating them as 1 cm', () => {
    const r = computePalletLoading({ ...DEFAULT_PALLET_INPUT, boxWidth: 0 });
    expect(r.issue).toContain('greater than zero');
    expect(r.totalBoxes).toBe(0);
  });

  it('describes a mixed pattern with its rotated strip', () => {
    // 110 × 100 pallet, 40 × 30 box: a 2 × 3 grid leaves a 30 cm strip that takes 2 boxes turned 90°.
    const layer = bestLayer(110, 100, 40, 30);
    expect(layer).toEqual({ count: 8, alongL: 2, alongW: 3, rotatedExtra: 2 });
    expect(layerPattern({ alongLength: 2, alongWidth: 3, rotatedExtra: 2 })).toBe(
      '(2 × 3 + 2 rotated)',
    );
  });

  it('respects a maximum number of layers', () => {
    expect(computePalletLoading({ ...DEFAULT_PALLET_INPUT, maxStackLayers: 2 }).totalBoxes).toBe(
      18,
    );
  });
});

describe('volumetric weight rows', () => {
  // The weights themselves come from logistics.weight.shipment@1 (engine fixtures); this only checks
  // which rows the tool sends to the engine and which it flags.
  it('counts the sample rows and flags rows the engine cannot take', () => {
    const items = [
      ...SAMPLE_VOLUMETRIC_ITEMS,
      { id: 'zero', description: 'x', length: 0, width: 10, height: 10, weightKg: 1, quantity: 1 },
      {
        id: 'half',
        description: 'y',
        length: 10,
        width: 10,
        height: 10,
        weightKg: 1,
        quantity: 2.5,
      },
      { id: 'none', description: 'z', length: 10, width: 10, height: 10, weightKg: 1, quantity: 0 },
      {
        id: 'light',
        description: 'w',
        length: 10,
        width: 10,
        height: 10,
        weightKg: 0,
        quantity: 1,
      },
    ];
    expect(items.filter((i) => !isUsableItem(i)).map((i) => i.id)).toEqual([
      'zero',
      'half',
      'none',
      'light',
    ]);
    expect(SAMPLE_VOLUMETRIC_ITEMS.every(isUsableItem)).toBe(true);
  });
});
