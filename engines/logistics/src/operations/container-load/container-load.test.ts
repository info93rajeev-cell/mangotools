import { createTestContext, executeOperation } from '@mangotools/core';
import { compare } from '@mangotools/engine-numeric';
import { describe, expect, it } from 'vitest';
import { messages } from '../../errors.ts';
import { toSub } from './measure.ts';
import { containerLoad } from './operation.ts';
import { type PackPiece, type PlacedBlock, packContainers, type Vec } from './pack.ts';

const run = (input: Record<string, unknown>, params: Record<string, unknown> = {}) =>
  executeOperation(containerLoad, input, params, createTestContext());

const piece = (l: number, w: number, h: number, quantity: number, weightKg?: number) => ({
  length: String(l),
  width: String(w),
  height: String(h),
  unit: 'cm',
  quantity: String(quantity),
  ...(weightKg === undefined ? {} : { weight: String(weightKg), weightUnit: 'kg' }),
});

/** Deterministic pseudo-random numbers for generated cases (tests only). */
function lcg(seed: number) {
  let state = seed;
  return (min: number, max: number) => {
    state = (state * 1103515245 + 12345) % 2147483648;
    return min + (state % (max - min + 1));
  };
}

const cm = (n: number) => toSub(String(n), 'cm');

function extent(b: PlacedBlock): Vec {
  return [
    b.piece[0] * BigInt(b.counts[0]),
    b.piece[1] * BigInt(b.counts[1]),
    b.piece[2] * BigInt(b.counts[2]),
  ];
}

function overlaps(a: PlacedBlock, b: PlacedBlock): boolean {
  const ea = extent(a);
  const eb = extent(b);
  return [0, 1, 2].every((axis) => {
    const a0 = a.origin[axis] as bigint;
    const b0 = b.origin[axis] as bigint;
    return a0 < b0 + (eb[axis] as bigint) && b0 < a0 + (ea[axis] as bigint);
  });
}

/** Every block of `b`'s footprint rests on the floor or wholly on top of one block below it. */
function supported(b: PlacedBlock, all: readonly PlacedBlock[]): boolean {
  if (b.origin[2] === 0n) return true;
  const eb = extent(b);
  return all.some((under) => {
    if (under.container !== b.container || under === b) return false;
    const eu = extent(under);
    const top = under.origin[2] + eu[2];
    const inX = under.origin[0] <= b.origin[0] && b.origin[0] + eb[0] <= under.origin[0] + eu[0];
    const inY = under.origin[1] <= b.origin[1] && b.origin[1] + eb[1] <= under.origin[1] + eu[1];
    return top === b.origin[2] && inX && inY;
  });
}

function checkInvariants(
  pieces: readonly PackPiece[],
  container: Vec,
  blocks: readonly PlacedBlock[],
) {
  for (const b of blocks) {
    const e = extent(b);
    for (const axis of [0, 1, 2]) {
      expect(b.origin[axis] as bigint).toBeGreaterThanOrEqual(0n);
      expect((b.origin[axis] as bigint) + (e[axis] as bigint)).toBeLessThanOrEqual(
        container[axis] as bigint,
      );
    }
    const dims = [...(pieces[b.pkg]?.dims ?? [])].sort().join(',');
    expect([...b.piece].sort().join(',')).toBe(dims);
    expect(supported(b, blocks)).toBe(true);
  }
  for (let i = 0; i < blocks.length; i++) {
    for (let j = i + 1; j < blocks.length; j++) {
      const a = blocks[i] as PlacedBlock;
      const b = blocks[j] as PlacedBlock;
      if (a.container === b.container) expect(overlaps(a, b)).toBe(false);
    }
  }
}

const settings = (container: Vec, extra: Partial<Parameters<typeof packContainers>[1]> = {}) => ({
  container,
  payloadNg: null,
  allowRotation: true,
  keepUpright: false,
  stackable: true,
  maxContainers: 20,
  maxBlocks: 5000,
  ...extra,
});

describe('logistics.container.load placement', () => {
  it('never overlaps, never leaves the container and never leaves a piece unsupported', () => {
    const rand = lcg(20261021);
    for (let trial = 0; trial < 60; trial++) {
      const container: Vec = [cm(rand(150, 1203)), cm(rand(100, 235)), cm(rand(100, 270))];
      const pieces: PackPiece[] = Array.from({ length: rand(1, 6) }, () => ({
        dims: [cm(rand(10, 140)), cm(rand(10, 120)), cm(rand(10, 120))] as Vec,
        quantity: rand(1, 120),
        weightNg: null,
      }));
      const result = packContainers(pieces, settings(container, { keepUpright: trial % 3 === 0 }));
      checkInvariants(pieces, container, result.blocks);
      pieces.forEach((p, pkg) => {
        const placed = result.blocks.filter((b) => b.pkg === pkg).reduce((n, b) => n + b.count, 0);
        expect(placed).toBe(result.loaded[pkg]);
        expect(placed).toBeLessThanOrEqual(p.quantity);
        const perContainer = result.byContainer.reduce((n, row) => n + (row[pkg] ?? 0), 0);
        expect(perContainer).toBe(placed);
      });
    }
  });

  it('respects the payload in every container', () => {
    const rand = lcg(7);
    for (let trial = 0; trial < 30; trial++) {
      const payload = BigInt(rand(500, 5000)) * 10n ** 12n;
      const pieces: PackPiece[] = Array.from({ length: rand(1, 4) }, () => ({
        dims: [cm(rand(20, 80)), cm(rand(20, 80)), cm(rand(20, 80))] as Vec,
        quantity: rand(1, 60),
        weightNg: BigInt(rand(1, 400)) * 10n ** 12n,
      }));
      const result = packContainers(
        pieces,
        settings([cm(589.8), cm(235.2), cm(239.3)], { payloadNg: payload }),
      );
      result.byContainer.forEach((row) => {
        const weight = row.reduce(
          (total, n, pkg) => total + BigInt(n) * (pieces[pkg]?.weightNg ?? 0n),
          0n,
        );
        expect(weight).toBeLessThanOrEqual(payload);
      });
    }
  });

  it('keeps every piece upright, or unrotated, when asked', () => {
    const pieces: PackPiece[] = [{ dims: [cm(60), cm(40), cm(30)], quantity: 300, weightNg: null }];
    const container: Vec = [cm(589.8), cm(235.2), cm(239.3)];
    const upright = packContainers(pieces, settings(container, { keepUpright: true }));
    expect(upright.blocks.every((b) => b.orientation === 'lwh' || b.orientation === 'wlh')).toBe(
      true,
    );
    const fixed = packContainers(pieces, settings(container, { allowRotation: false }));
    expect(fixed.blocks.every((b) => b.orientation === 'lwh')).toBe(true);
    const flat = packContainers(pieces, settings(container, { stackable: false }));
    expect(flat.blocks.every((b) => b.origin[2] === 0n && b.counts[2] === 1)).toBe(true);
  });

  it('places at least as many identical pieces as the simple single-orientation grid', async () => {
    const cases: [number, number, number, string, number][] = [
      [60, 40, 40, '20gp', 225],
      [40, 30, 20, '20gp', 1078],
      [120, 100, 120, '40gp', 20],
      [45, 35, 25, '40hc', 1700],
    ];
    for (const [l, w, h, containerType, grid] of cases) {
      const result = await run({ packages: [piece(l, w, h, 100000)], containerType });
      if (!result.ok) throw new Error('expected success');
      expect(Number(result.value.containers[0]?.pieces)).toBeGreaterThanOrEqual(grid);
    }
  });

  it('is deterministic: the same input gives the same plan', async () => {
    const input = {
      packages: [
        piece(60, 40, 40, 100, 12),
        piece(50, 30, 30, 80, 8),
        piece(120, 100, 180, 10, 250),
      ],
      containerType: '20gp',
      maxPayload: '28000',
      payloadUnit: 'kg',
    };
    const first = await run(input);
    const second = await run(input);
    expect(JSON.stringify(second)).toBe(JSON.stringify(first));
  });

  it('keeps package order and reports each package separately', async () => {
    const result = await run({
      packages: [
        { ...piece(60, 40, 40, 100), description: 'Carton A' },
        { ...piece(50, 30, 30, 80), description: 'Carton B' },
      ],
      containerType: '40hc',
    });
    if (!result.ok) throw new Error('expected success');
    expect(result.value.packages.map((p) => [p.index, p.description, p.loaded])).toEqual([
      [0, 'Carton A', '100'],
      [1, 'Carton B', '80'],
    ]);
  });

  it('never derives the container count from volume alone', async () => {
    // By volume, 8 pieces of 0.6 m³ (4.8 m³) "fit" a 6 m³ container. Physically, unrotated
    // 200×100×30 cm pieces fit 1 × 1 × 6 = 6 per 300×100×200 cm container, so 2 are needed.
    const result = await run(
      {
        packages: [piece(200, 100, 30, 8)],
        containerType: 'custom',
        containerUnit: 'cm',
        containerLength: '300',
        containerWidth: '100',
        containerHeight: '200',
      },
      { allowRotation: false },
    );
    if (!result.ok) throw new Error('expected success');
    expect(result.value.containersRequired).toBe('2');
  });

  it('handles a large single-type load quickly', async () => {
    const start = performance.now();
    const result = await run({ packages: [piece(10, 10, 10, 100000)], containerType: '20gp' });
    expect(performance.now() - start).toBeLessThan(2000);
    expect(result.ok && result.value.loadedPieces).toBe('100000');
  });

  it('stops at the container limit and says why', async () => {
    const result = await run({ packages: [piece(100, 100, 100, 1000)], containerType: '20gp' });
    if (!result.ok) throw new Error('expected success');
    expect(result.value.containersRequired).toBe('20');
    expect(result.value.status).toBe('partial');
    expect(result.value.packages[0]?.unloadedReason).toBe('container-limit');
  });

  it('accepts converted 12-place dimensions without changing an exact fit', async () => {
    const inches = await run({
      packages: [
        {
          length: '23.622047244094',
          width: '19.685039370079',
          height: '19.685039370079',
          unit: 'in',
          quantity: '8',
        },
      ],
      containerType: 'custom',
      containerUnit: 'cm',
      containerLength: '120',
      containerWidth: '100',
      containerHeight: '100',
    });
    expect(inches.ok && inches.value.loadedPieces).toBe('8');
  });

  it('reports utilization that never exceeds 100% of the used containers', async () => {
    const result = await run({ packages: [piece(50, 50, 50, 2000)], containerType: '20gp' });
    if (!result.ok) throw new Error('expected success');
    for (const c of result.value.containers) {
      expect(compare(c.volumeUtilizationPercent, '100')).toBeLessThanOrEqual(0);
    }
  });

  it('has a message for every error and notice code it can return', () => {
    const notices = [
      'LOGISTICS_LOAD_PLANNING_AID',
      'LOGISTICS_CONTAINER_NOMINAL_REFERENCE',
      'LOGISTICS_CONTAINER_VERIFY_PROFESSIONAL',
      'LOGISTICS_LOAD_PARTIAL',
      'LOGISTICS_LOAD_MULTIPLE_CONTAINERS',
      'LOGISTICS_LOAD_WEIGHT_LIMIT_REACHED',
      'LOGISTICS_LOAD_STACK_HEIGHT_ABOVE_CONTAINER',
      'LOGISTICS_LOAD_WEIGHTS_INCOMPLETE',
      'LOGISTICS_LOAD_PAYLOAD_NOT_CHECKED',
    ];
    for (const code of [...containerLoad.errors, ...notices])
      expect(messages[code], code).toBeTruthy();
  });
});
