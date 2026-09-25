/**
 * The only cross-runtime globals engines (and core) may use. Engines compile against ES2023 without
 * DOM or Node types; these declarations describe the subset that exists identically in browsers,
 * workers and Node. Do not add network, storage, timer or DOM APIs here.
 */
declare class TextEncoder {
  encode(input?: string): Uint8Array;
}
declare class TextDecoder {
  constructor(label?: string, options?: { fatal?: boolean; ignoreBOM?: boolean });
  decode(input?: Uint8Array): string;
}
declare const crypto: {
  readonly subtle: {
    digest(
      algorithm: 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512',
      data: Uint8Array,
    ): Promise<ArrayBuffer>;
  };
};
