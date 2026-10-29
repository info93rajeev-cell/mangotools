import type { ToolSnapshot, ToolStore } from '@mangotools/runtime';
import { useEffect, useMemo, useState } from 'preact/hooks';
import { copyText, downloadText } from '../actions.ts';

export const DEFAULT_CSV = `name,city,sku,active
Asha Rao,Delhi,00124,true
Ben Li,Singapore,00085,false
Mira Shah,Mumbai,00941,true
Evan Cole,London,04102,true`;

export function parseCsvLine(line: string, delimiter: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  return values;
}

export function detectDelimiter(firstLine: string): string {
  const c = (firstLine.match(/,/g) || []).length;
  const t = (firstLine.match(/\t/g) || []).length;
  const s = (firstLine.match(/;/g) || []).length;
  const p = (firstLine.match(/\|/g) || []).length;
  if (t > c && t > s) return '\t';
  if (s > c) return ';';
  if (p > c) return '|';
  return ',';
}

export function parseCsv(
  csvText: string,
  customDelimiter?: string,
): {
  headers: string[];
  rows: string[][];
  delimiter: string;
} {
  const lines = csvText
    .trim()
    .split(/\r?\n/)
    .filter((l) => l.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [], delimiter: ',' };
  const delimiter = customDelimiter || detectDelimiter(lines[0]);
  const headers = parseCsvLine(lines[0], delimiter);
  const rows: string[][] = [];
  for (let i = 1; i < lines.length; i++) {
    rows.push(parseCsvLine(lines[i], delimiter));
  }
  return { headers, rows, delimiter };
}

export function useCsvToJsonStudio(
  snapshot: ToolSnapshot,
  store: ToolStore,
  notify: (msg: string) => void,
) {
  const initialText =
    typeof snapshot.values.text === 'string' && snapshot.values.text.trim().length > 0
      ? snapshot.values.text
      : DEFAULT_CSV;
  const [input, setInput] = useState<string>(initialText);

  useEffect(() => {
    const val = snapshot.values.text;
    if (typeof val === 'string' && val.trim().length > 0 && val !== input) {
      setInput(val);
    }
  }, [snapshot.values.text]);

  const [delimiterChoice, setDelimiterChoice] = useState<'auto' | ',' | ';' | '\t' | '|'>('auto');
  const [formatShape, setFormatShape] = useState<'objects' | '2d-array' | 'ndjson'>('objects');
  const [minified, setMinified] = useState(false);

  const parsed = useMemo(() => {
    const delim = delimiterChoice === 'auto' ? undefined : delimiterChoice;
    return parseCsv(input, delim);
  }, [input, delimiterChoice]);

  const outputJson = useMemo(() => {
    if (!input.trim() || parsed.headers.length === 0) return '';
    const { headers, rows } = parsed;
    if (formatShape === '2d-array') {
      const all = [headers, ...rows];
      return minified ? JSON.stringify(all) : JSON.stringify(all, null, 2);
    }
    const objects = rows.map((row) => {
      const obj: Record<string, string> = {};
      headers.forEach((h, idx) => {
        obj[h] = row[idx] ?? '';
      });
      return obj;
    });
    if (formatShape === 'ndjson') return objects.map((obj) => JSON.stringify(obj)).join('\n');
    return minified ? JSON.stringify(objects) : JSON.stringify(objects, null, 2);
  }, [input, parsed, formatShape, minified]);

  const handleInput = (val: string) => {
    setInput(val);
    store.set('text', val);
  };

  const handleCopy = async () => {
    if (!outputJson) return;
    const ok = await copyText(outputJson);
    notify(ok ? 'JSON copied to clipboard!' : 'Failed to copy');
  };

  const handleDownload = () => {
    if (!outputJson) return;
    downloadText(outputJson, 'converted.json', 'application/json');
    notify('Downloaded converted.json');
  };

  const handleReset = () => {
    setInput(DEFAULT_CSV);
    store.set('text', DEFAULT_CSV);
    notify('Reset to default sample CSV');
  };

  return {
    input,
    handleInput,
    delimiterChoice,
    setDelimiterChoice,
    formatShape,
    setFormatShape,
    minified,
    setMinified,
    parsed,
    outputJson,
    handleCopy,
    handleDownload,
    handleReset,
  };
}
