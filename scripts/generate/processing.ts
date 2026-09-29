/**
 * Derives where a tool processes user input from implementation evidence, so that privacy claims
 * on tool pages follow the code rather than hand-written text. See `Processing` in schemas.
 */
import type { Runtime } from '@mangotools/core';
import type { Manifest, Processing } from '@mangotools/schemas';

export function processingOf(
  privacy: Manifest['privacy'],
  runtimes: readonly Runtime[],
): Processing {
  if (privacy.network !== 'none') return 'network';
  return runtimes.includes('worker') ? 'device' : 'unverified';
}
