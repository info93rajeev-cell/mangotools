import type { ToolSnapshot, ToolStore } from '@mangotools/runtime';
import { useEffect, useMemo, useState } from 'preact/hooks';
import { copyText, downloadText } from '../actions.ts';

export const DEFAULT_JSON = `[
  { "name": "Asha Rao", "city": "Delhi", "sku": "00124", "active": "true" },
  { "name": "Ben Li", "city": "Singapore", "sku": "00085", "active": "false" },
  { "name": "Mira Shah", "city": "Mumbai", "sku": "00941", "active": "true" },
  { "name": "Evan Cole", "city": "London", "sku": "04102", "active": "true" }
]`;

export function escapeCsvField(val: unknown, delimiter: string, formulaSafe: boolean): string {
  if (val === null || val === undefined) return '';
  let str = typeof val === 'object' ? JSON.stringify(val) : String(val);
  if (formulaSafe && /^[=+\-@]/.test(str)) str = `'${str}`;
  if (str.includes(delimiter) || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    str = `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function extractRecordRow(item: unknown, allKeys: string[]): string[] {
  const rowVals: string[] = [];
  const isObj = typeof item === 'object' && item !== null;
  for (const key of allKeys) {
    const val = isObj ? (item as Record<string, unknown>)[key] : item;
    const display =
      val === null || val === undefined
        ? ''
        : typeof val === 'object'
          ? JSON.stringify(val)
          : String(val);
    rowVals.push(display);
  }
  return rowVals;
}

export function processJsonToCsv(
  input: string,
  delimiter: ',' | ';' | '\t',
  includeHeaders: boolean,
  formulaSafety: boolean,
): {
  parsedData: unknown[] | null;
  error: string | null;
  headers: string[];
  rows: string[][];
  rawCsv: string;
} {
  if (!input.trim())
    return { parsedData: null, error: 'Empty JSON input', headers: [], rows: [], rawCsv: '' };
  try {
    const data = JSON.parse(input);
    const array = Array.isArray(data) ? data : [data];
    if (array.length === 0)
      return { parsedData: [], error: null, headers: [], rows: [], rawCsv: '' };
    const allKeys = Array.from(
      new Set(
        array.flatMap((item) =>
          typeof item === 'object' && item !== null ? Object.keys(item) : ['value'],
        ),
      ),
    );
    const tableRows: string[][] = [];
    const csvLines: string[] = [];

    if (includeHeaders) {
      csvLines.push(allKeys.map((k) => escapeCsvField(k, delimiter, false)).join(delimiter));
    }
    for (const item of array) {
      const rowVals = extractRecordRow(item, allKeys);
      tableRows.push(rowVals);
      csvLines.push(
        rowVals.map((v) => escapeCsvField(v, delimiter, formulaSafety)).join(delimiter),
      );
    }
    return {
      parsedData: array,
      error: null,
      headers: allKeys,
      rows: tableRows,
      rawCsv: csvLines.join('\n'),
    };
  } catch (err: unknown) {
    return {
      parsedData: null,
      error: err instanceof Error ? err.message : 'Invalid JSON format',
      headers: [],
      rows: [],
      rawCsv: '',
    };
  }
}

function createJsonToCsvHandlers(
  rawCsv: string,
  useBom: boolean,
  setInput: (v: string) => void,
  store: ToolStore,
  notify: (msg: string) => void,
) {
  const handleCopy = async () => {
    if (!rawCsv) return;
    const ok = await copyText(rawCsv);
    notify(ok ? 'CSV copied to clipboard!' : 'Failed to copy');
  };

  const handleDownload = () => {
    if (!rawCsv) return;
    const content = useBom ? `\uFEFF${rawCsv}` : rawCsv;
    downloadText(content, 'exported.csv', 'text/csv');
    notify('Downloaded exported.csv');
  };

  const handleReset = () => {
    setInput(DEFAULT_JSON);
    store.set('text', DEFAULT_JSON);
    notify('Reset to default sample JSON');
  };

  const handleClear = () => {
    setInput('');
    store.set('text', '');
    notify('Cleared input');
  };

  const handlePaste = async () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.readText) {
      try {
        const text = await navigator.clipboard.readText();
        if (text) {
          setInput(text);
          store.set('text', text);
          notify('Pasted from clipboard');
          return;
        }
      } catch {
        // Fallback
      }
    }
    notify('Use Ctrl+V or Cmd+V to paste');
  };

  const handleOpenFile = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const content = typeof reader.result === 'string' ? reader.result : '';
      setInput(content);
      store.set('text', content);
      notify(`Loaded ${file.name}`);
    };
    reader.readAsText(file);
    target.value = '';
  };

  return {
    handleCopy,
    handleDownload,
    handleReset,
    handleClear,
    handlePaste,
    handleOpenFile,
  };
}

export function useJsonToCsvStudio(
  snapshot: ToolSnapshot,
  store: ToolStore,
  notify: (msg: string) => void,
) {
  const initialText =
    typeof snapshot.values.text === 'string' && snapshot.values.text.trim().length > 0
      ? snapshot.values.text
      : DEFAULT_JSON;
  const [input, setInput] = useState<string>(initialText);

  useEffect(() => {
    const val = snapshot.values.text;
    if (typeof val === 'string' && val.trim().length > 0 && val !== input) {
      setInput(val);
    }
  }, [snapshot.values.text]);

  const [delimiter, setDelimiter] = useState<',' | ';' | '\t'>(',');
  const [includeHeaders, setIncludeHeaders] = useState(true);
  const [useBom, setUseBom] = useState(false);
  const [formulaSafety, setFormulaSafety] = useState(true);

  const { parsedData, error, headers, rows, rawCsv } = useMemo(
    () => processJsonToCsv(input, delimiter, includeHeaders, formulaSafety),
    [input, delimiter, includeHeaders, formulaSafety],
  );

  const handleInput = (val: string) => {
    setInput(val);
    store.set('text', val);
  };

  const handlers = createJsonToCsvHandlers(rawCsv, useBom, setInput, store, notify);

  return {
    input,
    handleInput,
    delimiter,
    setDelimiter,
    includeHeaders,
    setIncludeHeaders,
    useBom,
    setUseBom,
    formulaSafety,
    setFormulaSafety,
    parsedData,
    error,
    headers,
    rows,
    rawCsv,
    ...handlers,
  };
}
