/**
 * A small tokenizer for PDF content streams: numbers, names, literal and hex strings, arrays and
 * operators. Inline image data (BI … ID … EI) and dictionaries are skipped. It is enough to follow
 * the text operators; it does not draw anything.
 */

export type Token =
  | { t: 'num'; v: number }
  | { t: 'name'; v: string }
  | { t: 'str'; v: Uint8Array }
  | { t: 'arr'; v: Token[] }
  | { t: 'op'; v: string };

const WS = new Set([0x00, 0x09, 0x0a, 0x0c, 0x0d, 0x20]);
const DELIM = new Set([0x28, 0x29, 0x3c, 0x3e, 0x5b, 0x5d, 0x7b, 0x7d, 0x2f, 0x25]);

const ESCAPES: Readonly<Record<number, number>> = {
  110: 0x0a,
  114: 0x0d,
  116: 0x09,
  98: 0x08,
  102: 0x0c,
};

export class Lexer {
  pos = 0;
  constructor(readonly b: Uint8Array) {}

  private skipSpace(): void {
    const b = this.b;
    while (this.pos < b.length) {
      const c = b[this.pos] ?? 0;
      if (WS.has(c)) this.pos++;
      else if (c === 0x25) while (this.pos < b.length && b[this.pos] !== 0x0a) this.pos++;
      else break;
    }
  }

  private literal(): Uint8Array {
    const out: number[] = [];
    let depth = 1;
    this.pos++;
    while (this.pos < this.b.length) {
      const c = this.b[this.pos++] ?? 0;
      if (c === 0x5c) {
        out.push(...this.escape());
        continue;
      }
      if (c === 0x28) depth++;
      if (c === 0x29 && --depth === 0) break;
      out.push(c);
    }
    return Uint8Array.from(out);
  }

  private octal(first: number): number {
    let v = first - 0x30;
    for (let i = 0; i < 2; i++) {
      const d = this.b[this.pos] ?? 0;
      if (d < 0x30 || d > 0x37) break;
      v = v * 8 + d - 0x30;
      this.pos++;
    }
    return v & 0xff;
  }

  private escape(): number[] {
    const c = this.b[this.pos++] ?? 0;
    const named = ESCAPES[c];
    if (named !== undefined) return [named];
    if (c === 0x0d && this.b[this.pos] === 0x0a) this.pos++;
    if (c === 0x0d || c === 0x0a) return [];
    if (c >= 0x30 && c <= 0x37) return [this.octal(c)];
    return [c];
  }

  private hex(): Uint8Array {
    this.pos++;
    let s = '';
    while (this.pos < this.b.length && this.b[this.pos] !== 0x3e) {
      const ch = String.fromCharCode(this.b[this.pos++] ?? 0);
      if (/[0-9a-fA-F]/.test(ch)) s += ch;
    }
    this.pos++;
    if (s.length % 2) s += '0';
    const out = new Uint8Array(s.length / 2);
    for (let i = 0; i < out.length; i++) out[i] = Number.parseInt(s.slice(i * 2, i * 2 + 2), 16);
    return out;
  }

  private word(): string {
    const start = this.pos;
    while (this.pos < this.b.length) {
      const c = this.b[this.pos] ?? 0;
      if (WS.has(c) || DELIM.has(c)) break;
      this.pos++;
    }
    return String.fromCharCode(...this.b.subarray(start, this.pos));
  }

  /** Skips a dictionary (<< … >>), including nested ones. */
  private skipDict(): void {
    let depth = 0;
    while (this.pos < this.b.length) {
      if (this.b[this.pos] === 0x3c && this.b[this.pos + 1] === 0x3c) {
        depth++;
        this.pos += 2;
      } else if (this.b[this.pos] === 0x3e && this.b[this.pos + 1] === 0x3e) {
        depth--;
        this.pos += 2;
        if (depth === 0) return;
      } else this.pos++;
    }
  }

  /** Skips inline image data after the ID operator, up to the EI operator. */
  skipInlineImage(): void {
    const b = this.b;
    while (this.pos < b.length - 2) {
      const isEI = b[this.pos] === 0x45 && b[this.pos + 1] === 0x49;
      const before = WS.has(b[this.pos - 1] ?? 0x20);
      const after = this.pos + 2 >= b.length || WS.has(b[this.pos + 2] ?? 0x20);
      if (isEI && before && after) {
        this.pos += 2;
        return;
      }
      this.pos++;
    }
    this.pos = b.length;
  }

  next(): Token | null {
    this.skipSpace();
    if (this.pos >= this.b.length) return null;
    const c = this.b[this.pos] ?? 0;
    if (c === 0x28) return { t: 'str', v: this.literal() };
    if (c === 0x3c) {
      if (this.b[this.pos + 1] === 0x3c) {
        this.skipDict();
        return this.next();
      }
      return { t: 'str', v: this.hex() };
    }
    if (c === 0x5b) return { t: 'arr', v: this.array() };
    if (c === 0x5d || c === 0x7b || c === 0x7d || c === 0x29 || c === 0x3e) {
      this.pos++;
      return this.next();
    }
    if (c === 0x2f) {
      this.pos++;
      return { t: 'name', v: this.word() };
    }
    const w = this.word();
    if (w === '') {
      this.pos++;
      return this.next();
    }
    const n = Number(w);
    return Number.isFinite(n) && /^[+-]?(\d+\.?\d*|\.\d+)$/.test(w)
      ? { t: 'num', v: n }
      : { t: 'op', v: w };
  }

  private array(): Token[] {
    this.pos++;
    const out: Token[] = [];
    for (;;) {
      this.skipSpace();
      if (this.pos >= this.b.length) return out;
      if (this.b[this.pos] === 0x5d) {
        this.pos++;
        return out;
      }
      const tok = this.next();
      if (!tok) return out;
      out.push(tok);
    }
  }
}
