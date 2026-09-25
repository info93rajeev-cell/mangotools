import type { JsonMember, JsonNode } from './parse.ts';

/** Compares strings by Unicode code point (not UTF-16 code unit). */
export function compareCodePoints(a: string, b: string): number {
  const ia = a[Symbol.iterator]();
  const ib = b[Symbol.iterator]();
  for (;;) {
    const x = ia.next();
    const y = ib.next();
    if (x.done || y.done) return x.done === y.done ? 0 : x.done ? -1 : 1;
    const cx = x.value.codePointAt(0) ?? 0;
    const cy = y.value.codePointAt(0) ?? 0;
    if (cx !== cy) return cx - cy;
  }
}

function orderedMembers(members: JsonMember[], sortKeys: boolean): JsonMember[] {
  return sortKeys ? [...members].sort((a, b) => compareCodePoints(a.key, b.key)) : members;
}

export function printJson(node: JsonNode, unit: string | null, sortKeys: boolean): string {
  const out: string[] = [];
  write(node, 0, unit, sortKeys, out);
  return out.join('');
}

function write(
  node: JsonNode,
  depth: number,
  unit: string | null,
  sortKeys: boolean,
  out: string[],
): void {
  if (node.kind === 'scalar') {
    out.push(node.raw);
    return;
  }
  const isObject = node.kind === 'object';
  const children = isObject ? orderedMembers(node.members, sortKeys) : node.items;
  const [open, close] = isObject ? ['{', '}'] : ['[', ']'];
  if (children.length === 0) {
    out.push(open, close);
    return;
  }
  const inner = unit === null ? '' : `\n${unit.repeat(depth + 1)}`;
  const outer = unit === null ? '' : `\n${unit.repeat(depth)}`;
  out.push(open);
  children.forEach((child, index) => {
    out.push(index === 0 ? inner : `,${inner}`);
    if (isObject) {
      const member = child as JsonMember;
      out.push(member.rawKey, unit === null ? ':' : ': ');
      write(member.value, depth + 1, unit, sortKeys, out);
    } else {
      write(child as JsonNode, depth + 1, unit, sortKeys, out);
    }
  });
  out.push(outer, close);
}
