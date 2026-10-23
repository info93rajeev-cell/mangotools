import { createTestContext, executeOperation } from '@mangotools/core';
import { describe, expect, it } from 'vitest';
import { containerLoad, costEstimate } from '../../engines/logistics/src/index.ts';
import { containerAllocation } from '../../packages/ui/src/toolkit/containerAllocation.ts';
import {
  boxFaces,
  projector,
  visiblePieces,
} from '../../packages/ui/src/toolkit/containerPlacementGeometry.ts';
import { matchesContainerReference } from '../../packages/ui/src/toolkit/containerReferenceSample.ts';
import {
  initialLoadState,
  type LoadResult,
} from '../../packages/ui/src/toolkit/containerWorkspaceModel.ts';

describe('Actual geometry integration', () => {
  it('limits reference artwork to the original numeric sample, independently of descriptions and rates', () => {
    const state = initialLoadState();
    expect(matchesContainerReference(state)).toBe(true);
    state.costInput.rate = '145000';
    if (state.packages[0]) state.packages[0].description = 'Browser-local SKU';
    expect(matchesContainerReference(state)).toBe(true);
    if (state.packages[0]) state.packages[0].length = '61';
    expect(matchesContainerReference(state)).toBe(false);
    state.packages = initialLoadState().packages;
    state.settings.allowRotation = false;
    expect(matchesContainerReference(state)).toBe(false);
  });
  it('uses two real containers even when total CBM is below one container volume', async () => {
    const result = await executeOperation(
      containerLoad,
      {
        containerType: 'custom',
        containerUnit: 'cm',
        containerLength: '100',
        containerWidth: '100',
        containerHeight: '100',
        packages: [{ length: '60', width: '60', height: '60', unit: 'cm', quantity: '2' }],
      },
      {},
      createTestContext(),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const value = result.value as unknown as LoadResult;
    expect(value.containersRequired).toBe('2');
    expect(value.loadedVolume).toBe('0.432');
    expect(containerAllocation(value, 0)[0]).toEqual({ volume: '0.216', share: '100.0' });
    const block = value.blocks[0];
    expect(block).toBeDefined();
    if (!block) return;
    const projected = boxFaces(block, projector(value, 'iso'));
    expect(projected).toHaveLength(3);
    expect(projected.join('')).not.toContain('NaN');
  });
  it('expands only actual grid coordinates and bounds viewer resource use', () => {
    const block = {
      container: 0,
      package: 0,
      x: '0',
      y: '0',
      z: '0',
      pieceLength: '10',
      pieceWidth: '20',
      pieceHeight: '30',
      countX: 10,
      countY: 10,
      countZ: 10,
      count: 1000,
    };
    const pieces = visiblePieces([block]);
    expect(pieces).toHaveLength(250);
    expect(pieces[1]?.x).toBe('10');
    expect(pieces[10]?.y).toBe('20');
    expect(pieces[100]?.z).toBe('30');
    expect(pieces.every((p) => p.count === 1)).toBe(true);
  });
  it('retains engine payload, partial-weight and exact shared cost semantics', async () => {
    const result = await executeOperation(
      costEstimate,
      {
        rateBasis: 'per-container',
        quantity: '2',
        rate: '145000',
        otherCharges: '12000',
        currency: 'INR',
      },
      {},
      createTestContext(),
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toMatchObject({ estimatedTotal: '302000.00' });
  });
});
