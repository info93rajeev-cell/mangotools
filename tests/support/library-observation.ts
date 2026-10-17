import { canonicalHash, canonicalJson } from '@mangotools/core';

export interface LibraryCase {
  id: string;
  exportName: string;
  args: unknown[];
  expected: unknown;
}

/** Preserve every finite number's bits; JSON alone loses signed zero. */
export function numberBits(value: number): string {
  if (!Number.isFinite(value)) throw new Error('Non-finite library result');
  const view = new DataView(new ArrayBuffer(8));
  view.setFloat64(0, value === 0 ? 0 : value, false);
  return view.getBigUint64(0, false).toString(16).padStart(16, '0');
}

function inspect(value: unknown): { value: unknown; bits: unknown } {
  if (typeof value === 'number') {
    return { value: value === 0 ? 0 : value, bits: numberBits(value) };
  }
  if (Array.isArray(value)) {
    const entries = Array.from(value, inspect);
    return { value: entries.map((entry) => entry.value), bits: entries.map((entry) => entry.bits) };
  }
  if (
    value !== null &&
    typeof value === 'object' &&
    Object.getPrototypeOf(value) === Object.prototype
  ) {
    const entries = Object.entries(value).map(([key, item]) => [key, inspect(item)] as const);
    return {
      value: Object.fromEntries(entries.map(([key, item]) => [key, item.value])),
      bits: Object.fromEntries(entries.map(([key, item]) => [key, item.bits])),
    };
  }
  if (value !== null && !['string', 'boolean'].includes(typeof value)) {
    throw new Error('Unsupported library result');
  }
  return { value, bits: null };
}

export async function observe(value: unknown) {
  const result = inspect(value);
  return { ...result, json: canonicalJson(result.value), hash: await canonicalHash(result.value) };
}

export async function runLibraryCases(library: Record<string, unknown>, cases: LibraryCase[]) {
  const results = [];
  for (const item of cases) {
    const fn = Object.hasOwn(library, item.exportName) ? library[item.exportName] : undefined;
    if (typeof fn !== 'function') throw new Error(`Unknown public export: ${item.exportName}`);
    const value: unknown = await (fn as (...args: unknown[]) => unknown)(...item.args);
    results.push({ id: item.id, ...(await observe(value)) });
  }
  return results;
}
