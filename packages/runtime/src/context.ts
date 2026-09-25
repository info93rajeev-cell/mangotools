import type { ContextSignal, OperationContext } from '@mangotools/core';

export interface ContextOptions {
  signal: ContextSignal;
  /** Receives structured log codes (never user content). Defaults to a no-op. */
  log?: OperationContext['log'];
}

/** Production context: real clock, Web Crypto randomness, per-request abort signal. */
export function createBrowserContext(options: ContextOptions): OperationContext {
  return {
    clock: () => Date.now(),
    random: (byteLength) => crypto.getRandomValues(new Uint8Array(byteLength)),
    signal: options.signal,
    log: options.log ?? (() => {}),
  };
}
