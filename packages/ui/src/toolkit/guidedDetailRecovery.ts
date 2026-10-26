export interface BackgroundColorRef {
  r: number;
  g: number;
  b: number;
  tolerance: number;
  wall?: { r: number; g: number; b: number; tolerance: number };
  floor?: { r: number; g: number; b: number; tolerance: number };
  hasTableFloor?: boolean;
  contactBaseY?: number;
}

interface BoundarySeeds {
  y: number[];
  x: number[];
  localBgR: number;
  localBgG: number;
  localBgB: number;
}

function sampleAdjacentBg(
  ref: Uint8ClampedArray,
  rawAlpha: Float32Array,
  w: number,
  h: number,
  y: number,
  x: number,
  defaultBg: BackgroundColorRef,
): [number, number, number] | null {
  const neighbors: readonly [number, number][] = [
    [y - 1, x],
    [y + 1, x],
    [y, x - 1],
    [y, x + 1],
  ];
  const maxBgDev = Math.max(30, defaultBg.tolerance * 1.5);
  for (const [ny, nx] of neighbors) {
    if (ny >= 0 && ny < h && nx >= 0 && nx < w) {
      const nidx = ny * w + nx;
      if (rawAlpha[nidx] < 0.1) {
        const off = nidx * 4;
        const dist = Math.hypot(
          ref[off] - defaultBg.r,
          ref[off + 1] - defaultBg.g,
          ref[off + 2] - defaultBg.b,
        );
        if (dist <= maxBgDev) {
          return [ref[off], ref[off + 1], ref[off + 2]];
        }
      }
    }
  }
  return null;
}

function isPixelBoundary(rawAlpha: Float32Array, idx: number, w: number): boolean {
  if (rawAlpha[idx] < 0.35) return false;
  return (
    rawAlpha[idx - 1] < 0.25 ||
    rawAlpha[idx + 1] < 0.25 ||
    rawAlpha[idx - w] < 0.25 ||
    rawAlpha[idx + w] < 0.25
  );
}

function collectBoundarySeeds(
  rawAlpha: Float32Array,
  ref: Uint8ClampedArray,
  w: number,
  h: number,
  defaultBg: BackgroundColorRef,
): BoundarySeeds {
  const seedsY: number[] = [];
  const seedsX: number[] = [];
  let sumBgR = 0;
  let sumBgG = 0;
  let sumBgB = 0;
  let bgSamples = 0;

  for (let y = 1; y < h - 1; y++) {
    const row = y * w;
    for (let x = 1; x < w - 1; x++) {
      const idx = row + x;
      if (!isPixelBoundary(rawAlpha, idx, w)) continue;
      seedsY.push(y);
      seedsX.push(x);
      const bgSample = sampleAdjacentBg(ref, rawAlpha, w, h, y, x, defaultBg);
      if (bgSample) {
        sumBgR += bgSample[0];
        sumBgG += bgSample[1];
        sumBgB += bgSample[2];
        bgSamples++;
      }
    }
  }

  return {
    y: seedsY,
    x: seedsX,
    localBgR: bgSamples > 0 ? sumBgR / bgSamples : defaultBg.r,
    localBgG: bgSamples > 0 ? sumBgG / bgSamples : defaultBg.g,
    localBgB: bgSamples > 0 ? sumBgB / bgSamples : defaultBg.b,
  };
}

function computeColorGradient(ref: Uint8ClampedArray, nidx: number, w: number): number {
  const left = (nidx - 1) * 4;
  const right = (nidx + 1) * 4;
  const up = (nidx - w) * 4;
  const down = (nidx + w) * 4;

  const dxR = ref[right] - ref[left];
  const dxG = ref[right + 1] - ref[left + 1];
  const dxB = ref[right + 2] - ref[left + 2];
  const dyR = ref[down] - ref[up];
  const dyG = ref[down + 1] - ref[up + 1];
  const dyB = ref[down + 2] - ref[up + 2];

  const dx = Math.hypot(dxR, dxG, dxB);
  const dy = Math.hypot(dyR, dyG, dyB);
  return Math.hypot(dx, dy);
}

function computeLaplacian(
  ref: Uint8ClampedArray,
  nidx: number,
  w: number,
  nr: number,
  ng: number,
  nb: number,
): number {
  const left = (nidx - 1) * 4;
  const right = (nidx + 1) * 4;
  const up = (nidx - w) * 4;
  const down = (nidx + w) * 4;

  const avgR = (ref[left] + ref[right] + ref[up] + ref[down]) * 0.25;
  const avgG = (ref[left + 1] + ref[right + 1] + ref[up + 1] + ref[down + 1]) * 0.25;
  const avgB = (ref[left + 2] + ref[right + 2] + ref[up + 2] + ref[down + 2]) * 0.25;

  return Math.hypot(nr - avgR, ng - avgG, nb - avgB);
}

function evaluatePixelCandidate(
  ref: Uint8ClampedArray,
  nidx: number,
  w: number,
  bg: BackgroundColorRef,
  localBg: { r: number; g: number; b: number },
): { isStructure: boolean; strength: number } {
  const off = nidx * 4;
  const nr = ref[off];
  const ng = ref[off + 1];
  const nb = ref[off + 2];

  const distLocal = Math.hypot(nr - localBg.r, ng - localBg.g, nb - localBg.b);
  const distGlobal = Math.hypot(nr - bg.r, ng - bg.g, nb - bg.b);
  const distWall = bg.wall
    ? Math.hypot(nr - bg.wall.r, ng - bg.wall.g, nb - bg.wall.b)
    : distGlobal;
  const distBg = Math.min(distLocal, distGlobal, distWall);

  const grad = computeColorGradient(ref, nidx, w);
  const laplacian = computeLaplacian(ref, nidx, w, nr, ng, nb);

  const bgTol = Math.max(16, bg.tolerance);
  // High-frequency structural feature requirement:
  // Fine structures (dried twigs, hair strands, floral stems, whiskers) have high local
  // curvature (Laplacian >= 7) or a sharp edge (grad >= 14 with Laplacian >= 4).
  // Flat walls, vignettes, and smooth studio backdrops have Laplacian < 3 and are never structures.
  const hasStructuralEdge = laplacian >= 7 || (grad >= 14 && laplacian >= 4);
  const isStructure = distBg > bgTol && distLocal > bgTol * 0.7 && hasStructuralEdge;
  const metric = Math.max(distBg / 42.0, laplacian / 22.0);
  const strength = Math.min(1.0, Math.max(0.65, metric));

  return { isStructure, strength };
}

interface PropagationContext {
  ref: Uint8ClampedArray;
  w: number;
  h: number;
  bg: BackgroundColorRef;
  localBg: { r: number; g: number; b: number };
  maxDistance: number;
}

interface QueueState {
  y: number[];
  x: number[];
  dist: number[];
}

const DIRS: readonly [number, number][] = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
  [-1, -1],
  [-1, 1],
  [1, -1],
  [1, 1],
];

function tryBridgeGap(
  ctx: PropagationContext,
  cy: number,
  cx: number,
  dy: number,
  dx: number,
  cdist: number,
  visited: Uint8Array,
  outAlpha: Float32Array,
  queue: QueueState,
): void {
  const { ref, w, h, bg, localBg, maxDistance } = ctx;

  // Detail recovery (twigs, floral stems, whiskers, fine hair) only propagates upward or
  // laterally into the background. When a table/floor is present, never propagate downward
  // into table reflections.
  if (
    bg.hasTableFloor &&
    dy > 0 &&
    (cy > h * 0.45 || (bg.contactBaseY !== undefined && cy >= bg.contactBaseY - 5))
  ) {
    return;
  }

  if (cdist + 2 >= maxDistance) return;

  const gny = cy + dy * 2;
  const gnx = cx + dx * 2;
  if (gny <= 0 || gny >= h - 1 || gnx <= 0 || gnx >= w - 1) return;

  const gnidx = gny * w + gnx;
  if (visited[gnidx]) return;

  const candidate = evaluatePixelCandidate(ref, gnidx, w, bg, localBg);
  if (candidate.isStructure) {
    const gapIdx = (cy + dy) * w + (cx + dx);
    visited[gapIdx] = 1;
    visited[gnidx] = 1;
    outAlpha[gapIdx] = Math.max(outAlpha[gapIdx], candidate.strength * 0.75);
    outAlpha[gnidx] = Math.max(outAlpha[gnidx], candidate.strength);
    queue.y.push(gny);
    queue.x.push(gnx);
    queue.dist.push(cdist + 2);
  }
}

function processDirection(
  cy: number,
  cx: number,
  dy: number,
  dx: number,
  cdist: number,
  ctx: PropagationContext,
  visited: Uint8Array,
  outAlpha: Float32Array,
  queue: QueueState,
): void {
  const { ref, w, h, bg, localBg, maxDistance } = ctx;

  // Detail recovery (twigs, floral stems, whiskers, fine hair) only propagates upward or
  // laterally into the background. When a table/floor is present, never propagate downward
  // into table reflections.
  if (
    bg.hasTableFloor &&
    dy > 0 &&
    (cy > h * 0.45 || (bg.contactBaseY !== undefined && cy >= bg.contactBaseY - 5))
  ) {
    return;
  }

  const ny = cy + dy;
  const nx = cx + dx;
  if (ny <= 0 || ny >= h - 1 || nx <= 0 || nx >= w - 1) return;

  const nidx = ny * w + nx;
  if (visited[nidx]) return;

  const candidate = evaluatePixelCandidate(ref, nidx, w, bg, localBg);
  if (candidate.isStructure) {
    visited[nidx] = 1;
    outAlpha[nidx] = Math.max(outAlpha[nidx], candidate.strength);
    if (cdist + 1 < maxDistance) {
      queue.y.push(ny);
      queue.x.push(nx);
      queue.dist.push(cdist + 1);
    }
  } else {
    tryBridgeGap(ctx, cy, cx, dy, dx, cdist, visited, outAlpha, queue);
  }
}

/**
 * Recovers fine high-frequency structures (e.g. dried floral twigs, thin stems,
 * whisker strands, wires, antennae) that connect to foreground objects but get
 * missed by low-resolution neural network feature grids.
 */
export function recoverFineStructures(
  rawAlpha: Float32Array,
  ref: Uint8ClampedArray,
  w: number,
  h: number,
  bg: BackgroundColorRef,
  maxDistance?: number,
): Float32Array {
  const seeds = collectBoundarySeeds(rawAlpha, ref, w, h, bg);
  if (seeds.y.length === 0) return rawAlpha;

  const total = w * h;
  const outAlpha = new Float32Array(rawAlpha);
  const visited = new Uint8Array(total);
  const queue: QueueState = {
    y: [...seeds.y],
    x: [...seeds.x],
    dist: new Array(seeds.y.length).fill(0),
  };

  for (let i = 0; i < seeds.y.length; i++) {
    visited[seeds.y[i] * w + seeds.x[i]] = 1;
  }

  const limit = maxDistance ?? Math.max(500, Math.round(Math.max(w, h) * 0.75));
  const localBg = { r: seeds.localBgR, g: seeds.localBgG, b: seeds.localBgB };
  const pCtx: PropagationContext = { ref, w, h, bg, localBg, maxDistance: limit };
  let head = 0;

  while (head < queue.y.length) {
    const cy = queue.y[head];
    const cx = queue.x[head];
    const cdist = queue.dist[head];
    head++;

    for (let i = 0; i < DIRS.length; i++) {
      processDirection(cy, cx, DIRS[i][0], DIRS[i][1], cdist, pCtx, visited, outAlpha, queue);
    }
  }

  return outAlpha;
}
