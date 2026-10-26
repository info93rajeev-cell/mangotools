export interface BackgroundColorRef {
  r: number;
  g: number;
  b: number;
  tolerance: number;
}

interface BoundarySeeds {
  y: number[];
  x: number[];
}

function collectBoundarySeeds(rawAlpha: Float32Array, w: number, h: number): BoundarySeeds {
  const seedsY: number[] = [];
  const seedsX: number[] = [];

  for (let y = 1; y < h - 1; y++) {
    const row = y * w;
    for (let x = 1; x < w - 1; x++) {
      const idx = row + x;
      if (rawAlpha[idx] < 0.5) continue;
      const isBoundary =
        rawAlpha[idx - 1] < 0.2 ||
        rawAlpha[idx + 1] < 0.2 ||
        rawAlpha[idx - w] < 0.2 ||
        rawAlpha[idx + w] < 0.2;
      if (isBoundary) {
        seedsY.push(y);
        seedsX.push(x);
      }
    }
  }

  return { y: seedsY, x: seedsX };
}

function evaluatePixelCandidate(
  ref: Uint8ClampedArray,
  nidx: number,
  w: number,
  bg: BackgroundColorRef,
): { isStructure: boolean; strength: number } {
  const noff = nidx * 4;
  const nr = ref[noff];
  const ng = ref[noff + 1];
  const nb = ref[noff + 2];

  const distBg = Math.hypot(nr - bg.r, ng - bg.g, nb - bg.b);
  const leftOff = (nidx - 1) * 4;
  const rightOff = (nidx + 1) * 4;
  const upOff = (nidx - w) * 4;
  const downOff = (nidx + w) * 4;

  const dx = Math.abs(ref[rightOff] - ref[leftOff]);
  const dy = Math.abs(ref[downOff] - ref[upOff]);
  const grad = Math.hypot(dx, dy);

  const bgTol = Math.max(22, bg.tolerance);
  const isStructure = grad > 18 || distBg > bgTol;
  const strength = Math.min(1.0, Math.max(0.4, distBg / 48.0));

  return { isStructure, strength };
}

interface PropagationContext {
  ref: Uint8ClampedArray;
  w: number;
  h: number;
  bg: BackgroundColorRef;
  maxDistance: number;
}

function processNeighbor(
  ny: number,
  nx: number,
  cdist: number,
  ctx: PropagationContext,
  visited: Uint8Array,
  outAlpha: Float32Array,
  queue: { y: number[]; x: number[]; dist: number[] },
): void {
  const { ref, w, h, bg, maxDistance } = ctx;
  if (ny <= 0 || ny >= h - 1 || nx <= 0 || nx >= w - 1) return;

  const nidx = ny * w + nx;
  if (visited[nidx]) return;
  visited[nidx] = 1;

  const { isStructure, strength } = evaluatePixelCandidate(ref, nidx, w, bg);
  if (!isStructure) return;

  if (strength > outAlpha[nidx]) {
    outAlpha[nidx] = strength;
  }
  if (cdist + 1 < maxDistance) {
    queue.y.push(ny);
    queue.x.push(nx);
    queue.dist.push(cdist + 1);
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
  maxDistance = 260,
): Float32Array {
  const seeds = collectBoundarySeeds(rawAlpha, w, h);
  if (seeds.y.length === 0) return rawAlpha;

  const total = w * h;
  const outAlpha = new Float32Array(rawAlpha);
  const visited = new Uint8Array(total);
  const queue = {
    y: [...seeds.y],
    x: [...seeds.x],
    dist: new Array(seeds.y.length).fill(0),
  };

  for (let i = 0; i < seeds.y.length; i++) {
    visited[seeds.y[i] * w + seeds.x[i]] = 1;
  }

  const pCtx: PropagationContext = { ref, w, h, bg, maxDistance };
  let head = 0;

  while (head < queue.y.length) {
    const cy = queue.y[head];
    const cx = queue.x[head];
    const cdist = queue.dist[head];
    head++;

    processNeighbor(cy - 1, cx, cdist, pCtx, visited, outAlpha, queue);
    processNeighbor(cy + 1, cx, cdist, pCtx, visited, outAlpha, queue);
    processNeighbor(cy, cx - 1, cdist, pCtx, visited, outAlpha, queue);
    processNeighbor(cy, cx + 1, cdist, pCtx, visited, outAlpha, queue);
  }

  return outAlpha;
}
