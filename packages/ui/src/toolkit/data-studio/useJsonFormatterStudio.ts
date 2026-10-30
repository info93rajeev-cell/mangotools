import type { ToolSnapshot, ToolStore } from '@mangotools/runtime';
import { useEffect, useMemo, useState } from 'preact/hooks';
import { copyText, downloadText } from '../actions.ts';

export const DEFAULT_JSON = `{
  "user": {
    "id": 12345,
    "name": "John Doe",
    "roles": ["admin", "editor"],
    "active": true
  },
  "posts": [
    { "id": 1, "title": "Welcome" },
    { "id": 2, "title": "Guide" }
  ]
}`;

export interface JsonStats {
  chars: number;
  lines: number;
  bytes: number;
  objects: number;
  arrays: number;
  maxDepth: number;
  rootType: string;
}

export function analyzeJson(
  value: unknown,
  depth = 1,
): { objects: number; arrays: number; maxDepth: number } {
  let objects = 0;
  let arrays = 0;
  let maxDepth = depth;

  if (Array.isArray(value)) {
    arrays += 1;
    for (const item of value) {
      if (typeof item === 'object' && item !== null) {
        const sub = analyzeJson(item, depth + 1);
        objects += sub.objects;
        arrays += sub.arrays;
        maxDepth = Math.max(maxDepth, sub.maxDepth);
      }
    }
  } else if (typeof value === 'object' && value !== null) {
    objects += 1;
    for (const key of Object.keys(value)) {
      const subVal = (value as Record<string, unknown>)[key];
      if (typeof subVal === 'object' && subVal !== null) {
        const sub = analyzeJson(subVal, depth + 1);
        objects += sub.objects;
        arrays += sub.arrays;
        maxDepth = Math.max(maxDepth, sub.maxDepth);
      }
    }
  }

  return { objects, arrays, maxDepth };
}

export function sortJsonKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortJsonKeys);
  if (typeof value === 'object' && value !== null) {
    const sortedObj: Record<string, unknown> = {};
    const keys = Object.keys(value).sort();
    for (const key of keys) {
      sortedObj[key] = sortJsonKeys((value as Record<string, unknown>)[key]);
    }
    return sortedObj;
  }
  return value;
}

function parseAndAnalyzeJson(input: string) {
  if (!input.trim()) return { valid: false, error: 'Empty JSON input', data: null, stats: null };
  try {
    const data = JSON.parse(input);
    const sub = analyzeJson(data);
    const stats: JsonStats = {
      chars: input.length,
      lines: input.split('\n').length,
      bytes: new TextEncoder().encode(input).length,
      objects: sub.objects,
      arrays: sub.arrays,
      maxDepth: sub.maxDepth,
      rootType: Array.isArray(data)
        ? 'Array'
        : typeof data === 'object' && data !== null
          ? 'Object'
          : typeof data,
    };
    return { valid: true, error: null, data, stats };
  } catch (err: unknown) {
    return {
      valid: false,
      error: err instanceof Error ? err.message : String(err),
      data: null,
      stats: null,
    };
  }
}

export type ParseResult = ReturnType<typeof parseAndAnalyzeJson>;

function formatJsonOutput(
  parsedResult: { valid: boolean; data: unknown },
  sortKeys: boolean,
  action: 'format' | 'minify' | 'validate',
  indent: '2' | '4' | 'tab' | 'min',
) {
  if (!parsedResult.valid || parsedResult.data === null) return '';
  let processed: unknown = parsedResult.data;
  if (sortKeys) processed = sortJsonKeys(processed);
  if (action === 'minify' || indent === 'min') return JSON.stringify(processed);
  const space = indent === 'tab' ? '\t' : indent === '4' ? 4 : 2;
  return JSON.stringify(processed, null, space);
}

function extractTableData(
  parsedResult: ParseResult,
): { headers: string[]; rows: Record<string, unknown>[] } | null {
  if (!parsedResult.valid || !Array.isArray(parsedResult.data)) return null;
  const array = parsedResult.data;
  if (array.length === 0 || typeof array[0] !== 'object' || array[0] === null) return null;
  const headerSet = new Set<string>();
  for (const item of array) {
    if (item && typeof item === 'object') {
      for (const key of Object.keys(item as Record<string, unknown>)) {
        headerSet.add(key);
      }
    }
  }
  return {
    headers: Array.from(headerSet),
    rows: array as Record<string, unknown>[],
  };
}

function countSearchMatches(searchQuery: string, outputFormatted: string): number {
  if (!searchQuery.trim() || !outputFormatted) return 0;
  try {
    return (outputFormatted.match(new RegExp(searchQuery, 'gi')) || []).length;
  } catch {
    return 0;
  }
}

function createJsonHandlers(
  inputState: {
    activeTab: 'raw' | 'tree' | 'table';
    outputFormatted: string;
    parsedResult: ParseResult;
  },
  setInput: (v: string) => void,
  store: ToolStore,
  notify: (msg: string) => void,
) {
  const handleCopy = async () => {
    const text =
      inputState.activeTab === 'raw'
        ? inputState.outputFormatted
        : JSON.stringify(inputState.parsedResult.data, null, 2);
    if (!text) return;
    const ok = await copyText(text);
    notify(ok ? 'JSON copied to clipboard!' : 'Failed to copy');
  };

  const handleDownload = () => {
    if (!inputState.outputFormatted) return;
    downloadText(inputState.outputFormatted, 'formatted.json', 'application/json');
    notify('Downloaded formatted.json');
  };

  const handleReset = () => {
    setInput(DEFAULT_JSON);
    store.set('text', DEFAULT_JSON);
    notify('Reset to default sample JSON');
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
        // Fallback or permission denied
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

  return { handleCopy, handleDownload, handleReset, handlePaste, handleOpenFile };
}

export function useJsonFormatterStudio(
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

  const [indent, setIndent] = useState<'2' | '4' | 'tab' | 'min'>('2');
  const [action, setAction] = useState<'format' | 'minify' | 'validate'>('format');
  const [sortKeys, setSortKeys] = useState(false);
  const [syntaxHighlight, setSyntaxHighlight] = useState(true);
  const [lineNumbers, setLineNumbers] = useState(true);
  const [activeTab, setActiveTab] = useState<'raw' | 'tree' | 'table'>('raw');
  const [searchQuery, setSearchQuery] = useState('');

  const parsedResult = useMemo(() => parseAndAnalyzeJson(input), [input]);
  const outputFormatted = useMemo(
    () => formatJsonOutput(parsedResult, sortKeys, action, indent),
    [parsedResult, sortKeys, action, indent],
  );
  const searchMatches = useMemo(
    () => countSearchMatches(searchQuery, outputFormatted),
    [searchQuery, outputFormatted],
  );
  const tableData = useMemo(() => extractTableData(parsedResult), [parsedResult]);

  const handlers = createJsonHandlers(
    { activeTab, outputFormatted, parsedResult },
    setInput,
    store,
    notify,
  );

  const handleInput = (val: string) => {
    setInput(val);
    store.set('text', val);
  };

  return {
    input,
    handleInput,
    indent,
    setIndent,
    action,
    setAction,
    sortKeys,
    setSortKeys,
    syntaxHighlight,
    setSyntaxHighlight,
    lineNumbers,
    setLineNumbers,
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    parsedResult,
    outputFormatted,
    searchMatches,
    tableData,
    ...handlers,
  };
}
