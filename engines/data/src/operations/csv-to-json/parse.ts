/**
 * Hand-written CSV tokenizer (RFC 4180-style): quoted fields, doubled `""` escapes, commas and
 * newlines inside quotes, CRLF/LF/lone-CR line endings. No `split(',')`. Plain functions over a
 * state object, mirroring engines/data's json-format/parse.ts.
 */

export interface CsvRow {
  line: number;
  fields: string[];
}

export type CsvSyntaxFailure =
  | { tag: 'unclosed-quote'; line: number }
  | { tag: 'invalid-quote'; line: number };

export function isCsvSyntaxFailure(value: unknown): value is CsvSyntaxFailure {
  return typeof value === 'object' && value !== null && 'tag' in value;
}

interface State {
  text: string;
  i: number;
  line: number;
  rowLine: number;
  openQuoteLine: number;
  field: string;
  inQuotes: boolean;
  quotedField: boolean;
  afterClosedQuote: boolean;
  row: string[];
  rows: CsvRow[];
}

function fail(tag: CsvSyntaxFailure['tag'], line: number): never {
  throw { tag, line } satisfies CsvSyntaxFailure;
}

function pushField(st: State): void {
  st.row.push(st.field);
  st.field = '';
  st.quotedField = false;
  st.afterClosedQuote = false;
}

function pushRow(st: State): void {
  pushField(st);
  st.rows.push({ line: st.rowLine, fields: st.row });
  st.row = [];
}

function consumeNewline(st: State): void {
  const crlf = st.text[st.i] === '\r' && st.text[st.i + 1] === '\n';
  pushRow(st);
  st.line++;
  st.i += crlf ? 2 : 1;
  st.rowLine = st.line;
}

function stepInsideQuotes(st: State): void {
  const c = st.text[st.i];
  if (c === '"') {
    if (st.text[st.i + 1] === '"') {
      st.field += '"';
      st.i += 2;
      return;
    }
    st.inQuotes = false;
    st.afterClosedQuote = true;
    st.i++;
    return;
  }
  if (c === '\n') st.line++;
  st.field += c;
  st.i++;
}

function stepAfterClosedQuote(st: State): void {
  const c = st.text[st.i];
  if (c === ',') {
    pushField(st);
    st.i++;
    return;
  }
  if (c === '\r' || c === '\n') {
    consumeNewline(st);
    return;
  }
  fail('invalid-quote', st.line);
}

function stepUnquoted(st: State): void {
  const c = st.text[st.i];
  if (c === '"') {
    if (st.field.length === 0 && !st.quotedField) {
      st.inQuotes = true;
      st.quotedField = true;
      st.openQuoteLine = st.line;
      st.i++;
      return;
    }
    fail('invalid-quote', st.line);
  }
  if (c === ',') {
    pushField(st);
    st.i++;
    return;
  }
  if (c === '\r' || c === '\n') {
    consumeNewline(st);
    return;
  }
  st.field += c;
  st.i++;
}

/** Tokenizes raw CSV text into rows of raw (already-unescaped) field strings. */
export function tokenizeCsv(text: string): CsvRow[] {
  const st: State = {
    text,
    i: 0,
    line: 1,
    rowLine: 1,
    openQuoteLine: 1,
    field: '',
    inQuotes: false,
    quotedField: false,
    afterClosedQuote: false,
    row: [],
    rows: [],
  };
  while (st.i < text.length) {
    if (st.inQuotes) stepInsideQuotes(st);
    else if (st.afterClosedQuote) stepAfterClosedQuote(st);
    else stepUnquoted(st);
  }
  if (st.inQuotes) fail('unclosed-quote', st.openQuoteLine);
  if (st.field !== '' || st.row.length > 0) pushRow(st);
  return st.rows;
}
