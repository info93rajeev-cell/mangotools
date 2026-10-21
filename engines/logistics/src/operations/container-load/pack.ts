import {
  ORIENTATIONS,
  type OrientationKey,
  orientationsToTry,
} from '../../lib/orientation-grid.ts';
import type { UnloadedReason } from './schema.ts';

/**
 * Deterministic placement of rectangular pieces into identical containers ("block building" with
 * guillotine free spaces). All geometry is exact bigint arithmetic in 0.1 µm sub-units.
 *
 * - A container starts as one free space. The most recently created free space is filled first.
 * - For a free space, every package with pieces left is tried in each allowed axis-aligned
 *   orientation; its best block is a grid of whole pieces anchored at the space's back-left-floor
 *   corner (full walls across the space first, then full columns, then one partial column). The
 *   block holding the most cargo volume wins; ties keep the earlier package and orientation.
 * - The space left around a block is split into three non-overlapping spaces: in front of it (full
 *   width and height), beside it, and on top of it. The space on top has exactly the block's
 *   footprint, so every piece stands fully on the floor or on a complete block below — nothing hangs.
 * - Pieces never overlap and never leave the container (or the usable stack height). A payload, when
 *   given, caps every block by the weight still available. When no free space can take any remaining
 *   piece, the next identical container is started.
 */

export type Vec = readonly [bigint, bigint, bigint];

export interface PackPiece {
  /** Length, width and height of one piece as entered. */
  dims: Vec;
  quantity: number;
  weightNg: bigint | null;
}

export interface PackSettings {
  /** Container length, width and usable height. */
  container: Vec;
  payloadNg: bigint | null;
  allowRotation: boolean;
  keepUpright: boolean;
  stackable: boolean;
  maxContainers: number;
  maxBlocks: number;
}

export interface PlacedBlock {
  container: number;
  pkg: number;
  orientation: OrientationKey;
  origin: Vec;
  piece: Vec;
  counts: readonly [number, number, number];
  count: number;
}

export interface ContainerClose {
  weightLimitReached: boolean;
  spaceLimitReached: boolean;
}

export interface PackResult {
  blocks: PlacedBlock[];
  loaded: number[];
  /** Pieces per package in each container: byContainer[container][package]. */
  byContainer: number[][];
  closes: ContainerClose[];
  unloadedReason: (UnloadedReason | null)[];
}

interface Space {
  origin: Vec;
  size: Vec;
}

interface Choice {
  pkg: number;
  orientation: OrientationKey;
  piece: Vec;
  counts: Vec;
  score: bigint;
}

interface Candidate {
  key: OrientationKey;
  piece: Vec;
}

interface State {
  pieces: readonly PackPiece[];
  settings: PackSettings;
  candidates: Candidate[][];
  volumes: bigint[];
  remaining: number[];
  result: PackResult;
}

/** Allowed orientations of one piece, without repeats (a cube has one, a square-end piece three). */
function candidatesFor(dims: Vec, settings: PackSettings): Candidate[] {
  const named = { length: dims[0], width: dims[1], height: dims[2] };
  const seen = new Set<string>();
  const out: Candidate[] = [];
  for (const key of orientationsToTry(settings.allowRotation, settings.keepUpright)) {
    const [a, b, c] = ORIENTATIONS[key];
    const piece: Vec = [named[a], named[b], named[c]];
    const id = piece.join(',');
    if (!seen.has(id)) out.push({ key, piece });
    seen.add(id);
  }
  return out;
}

const fitsIn = (piece: Vec, size: Vec) =>
  piece[0] <= size[0] && piece[1] <= size[1] && piece[2] <= size[2];

/** Why a package can never load, checked once against an empty container. */
function blockingReason(piece: PackPiece, options: Candidate[], s: PackSettings) {
  if (!options.some((c) => fitsIn(c.piece, s.container))) return 'no-feasible-orientation';
  const tooHeavy = s.payloadNg !== null && piece.weightNg !== null && piece.weightNg > s.payloadNg;
  return tooHeavy ? 'weight-exceeds-payload' : null;
}

function initState(pieces: readonly PackPiece[], settings: PackSettings): State {
  const candidates = pieces.map((p) => candidatesFor(p.dims, settings));
  const unloadedReason = pieces.map((p, i) =>
    blockingReason(p, candidates[i] ?? [], settings),
  ) as (UnloadedReason | null)[];
  return {
    pieces,
    settings,
    candidates,
    volumes: pieces.map((p) => p.dims[0] * p.dims[1] * p.dims[2]),
    remaining: pieces.map((p, i) => (unloadedReason[i] === null ? p.quantity : 0)),
    result: {
      blocks: [],
      loaded: pieces.map(() => 0),
      byContainer: [],
      closes: [],
      unloadedReason,
    },
  };
}

/** Grid of whole pieces for at most `cap` pieces: full walls, else full columns, else one column. */
function blockShape(n: Vec, cap: bigint): Vec {
  const [nx, ny, nz] = n;
  const wall = ny * nz;
  if (cap >= nx * wall) return n;
  if (cap >= wall) return [cap / wall, ny, nz];
  if (cap >= nz) return [1n, cap / nz, nz];
  return [1n, 1n, cap];
}

/** The best block of one package in one space, over its allowed orientations. */
function bestForPackage(state: State, pkg: number, space: Space, cap: bigint): Choice | null {
  let best: Choice | null = null;
  for (const { key, piece } of state.candidates[pkg] ?? []) {
    if (!fitsIn(piece, space.size)) continue;
    const layers = state.settings.stackable ? space.size[2] / piece[2] : 1n;
    const n: Vec = [space.size[0] / piece[0], space.size[1] / piece[1], layers];
    const counts = blockShape(n, cap);
    const score = counts[0] * counts[1] * counts[2] * (state.volumes[pkg] ?? 0n);
    if (best === null || score > best.score) best = { pkg, orientation: key, piece, counts, score };
  }
  return best;
}

/** Pieces of a package that may still go in: what is left, capped by the weight still available. */
function capacity(state: State, pkg: number, payloadLeft: bigint | null): bigint {
  const left = BigInt(state.remaining[pkg] ?? 0);
  const weight = state.pieces[pkg]?.weightNg ?? null;
  if (payloadLeft === null || weight === null) return left;
  const byWeight = payloadLeft / weight;
  return byWeight < left ? byWeight : left;
}

function bestBlock(state: State, space: Space, payloadLeft: bigint | null): Choice | null {
  let best: Choice | null = null;
  for (let pkg = 0; pkg < state.pieces.length; pkg++) {
    const cap = capacity(state, pkg, payloadLeft);
    if (cap === 0n) continue;
    const choice = bestForPackage(state, pkg, space, cap);
    if (choice && (best === null || choice.score > best.score)) best = choice;
  }
  return best;
}

/** The three spaces around a block, pushed so that "on top" is filled first and "in front" last. */
function residualSpaces(space: Space, choice: Choice, stackable: boolean): Space[] {
  const [ox, oy, oz] = space.origin;
  const [sx, sy, sz] = space.size;
  const ex = choice.piece[0] * choice.counts[0];
  const ey = choice.piece[1] * choice.counts[1];
  const ez = choice.piece[2] * choice.counts[2];
  const out: Space[] = [];
  if (sx > ex) out.push({ origin: [ox + ex, oy, oz], size: [sx - ex, sy, sz] });
  if (sy > ey) out.push({ origin: [ox, oy + ey, oz], size: [ex, sy - ey, sz] });
  if (stackable && sz > ez) out.push({ origin: [ox, oy, oz + ez], size: [ex, ey, sz - ez] });
  return out;
}

function commit(state: State, container: number, space: Space, choice: Choice): number {
  const count = Number(choice.counts[0] * choice.counts[1] * choice.counts[2]);
  const { result } = state;
  result.blocks.push({
    container,
    pkg: choice.pkg,
    orientation: choice.orientation,
    origin: space.origin,
    piece: choice.piece,
    counts: [Number(choice.counts[0]), Number(choice.counts[1]), Number(choice.counts[2])],
    count,
  });
  state.remaining[choice.pkg] = (state.remaining[choice.pkg] ?? 0) - count;
  result.loaded[choice.pkg] = (result.loaded[choice.pkg] ?? 0) + count;
  const row = result.byContainer[container];
  if (row) row[choice.pkg] = (row[choice.pkg] ?? 0) + count;
  return count;
}

/** Why pieces were still waiting when a container closed. */
function closeState(state: State, payloadLeft: bigint | null): ContainerClose {
  let weightLimitReached = false;
  let spaceLimitReached = false;
  state.remaining.forEach((left, pkg) => {
    if (left === 0) return;
    const weight = state.pieces[pkg]?.weightNg ?? null;
    const heavy = payloadLeft !== null && weight !== null && weight > payloadLeft;
    if (heavy) weightLimitReached = true;
    else spaceLimitReached = true;
  });
  return { weightLimitReached, spaceLimitReached };
}

/** Fills one container; returns how many pieces it took (0 leaves no trace in the result). */
function fillContainer(state: State, container: number): number {
  const { settings, result } = state;
  const spaces: Space[] = [{ origin: [0n, 0n, 0n], size: settings.container }];
  let payloadLeft = settings.payloadNg;
  let placed = 0;
  result.byContainer.push(state.pieces.map(() => 0));
  while (spaces.length > 0 && result.blocks.length < settings.maxBlocks) {
    const space = spaces.pop() as Space;
    const choice = bestBlock(state, space, payloadLeft);
    if (choice === null) continue;
    const count = commit(state, container, space, choice);
    placed += count;
    const weight = state.pieces[choice.pkg]?.weightNg ?? null;
    if (payloadLeft !== null && weight !== null) payloadLeft -= weight * BigInt(count);
    spaces.push(...residualSpaces(space, choice, settings.stackable));
  }
  if (placed === 0) result.byContainer.pop();
  else result.closes.push(closeState(state, payloadLeft));
  return placed;
}

const hasWaiting = (state: State) => state.remaining.some((left) => left > 0);

/** Places every piece it can, opening identical containers up to the planning limits. */
export function packContainers(pieces: readonly PackPiece[], settings: PackSettings): PackResult {
  const state = initState(pieces, settings);
  const { result } = state;
  for (let c = 0; c < settings.maxContainers && hasWaiting(state); c++) {
    if (result.blocks.length >= settings.maxBlocks) break;
    if (fillContainer(state, c) === 0) break;
  }
  const reason: UnloadedReason =
    result.blocks.length >= settings.maxBlocks ? 'plan-limit' : 'container-limit';
  state.remaining.forEach((left, pkg) => {
    if (left > 0) result.unloadedReason[pkg] = reason;
  });
  return result;
}
