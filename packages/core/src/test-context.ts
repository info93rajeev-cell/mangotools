import type { OperationContext } from './contract.ts';

/** Mulberry32 — tiny deterministic PRNG used only for fixtures and tests. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return (t ^ (t >>> 14)) >>> 0;
  };
}

export function createTestContext(options: { now?: number; seed?: number } = {}): OperationContext {
  const now = options.now ?? Date.UTC(2026, 0, 1);
  const next = mulberry32(options.seed ?? 1);
  return {
    clock: () => now,
    random: (byteLength) => {
      const out = new Uint8Array(byteLength);
      for (let i = 0; i < byteLength; i++) out[i] = next() & 0xff;
      return out;
    },
    signal: { aborted: false },
    log: () => undefined,
  };
}
