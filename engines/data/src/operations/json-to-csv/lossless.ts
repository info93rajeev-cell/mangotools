/**
 * JSON → plain values without losing digits. JSON.parse turns 12345678901234567890 into
 * 12345678901234567000; here such a number keeps its exact text as a `JsonBigNumber`, which the
 * CSV writer prints as written. Numbers that round-trip exactly stay ordinary numbers.
 */
import { isParseFailure, type JsonNode, parseJson } from '../json-format/parse.ts';

const BIG = Symbol('json-big-number');

/** An integer too large for a JS number, kept as its exact text (String(value) gives the text). */
export interface JsonBigNumber {
  readonly [BIG]: true;
  readonly raw: string;
  toString(): string;
}

function bigNumber(raw: string): JsonBigNumber {
  return Object.freeze({ [BIG]: true as const, raw, toString: () => raw });
}

export function isJsonBigNumber(value: unknown): value is JsonBigNumber {
  return typeof value === 'object' && value !== null && BIG in value;
}

function scalar(raw: string): unknown {
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  if (raw === 'null') return null;
  if (raw.startsWith('"')) return JSON.parse(raw) as string;
  const n = Number(raw);
  return /^-?\d+$/.test(raw) && !Number.isSafeInteger(n) ? bigNumber(raw) : n;
}

function toValue(node: JsonNode): unknown {
  if (node.kind === 'scalar') return scalar(node.raw);
  if (node.kind === 'array') return node.items.map(toValue);
  const out: Record<string, unknown> = {};
  for (const m of node.members) out[m.key] = toValue(m.value);
  return out;
}

/** The parsed value, or null when the text is not valid JSON. */
export function parseLossless(text: string): { value: unknown } | null {
  try {
    return { value: toValue(parseJson(text).root) };
  } catch (e) {
    if (isParseFailure(e)) return null;
    throw e;
  }
}

/** JSON text for a nested value, writing big numbers exactly as they were given. */
export function stringifyLossless(value: unknown): string {
  if (isJsonBigNumber(value)) return value.raw;
  if (Array.isArray(value)) return `[${value.map(stringifyLossless).join(',')}]`;
  if (typeof value === 'object' && value !== null) {
    const parts = Object.entries(value).map(
      ([k, v]) => `${JSON.stringify(k)}:${stringifyLossless(v)}`,
    );
    return `{${parts.join(',')}}`;
  }
  return JSON.stringify(value) ?? 'null';
}
