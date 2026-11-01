import type { ToolSnapshot, ToolStore } from '@mangotools/runtime';
import { useEffect, useMemo, useState } from 'preact/hooks';
import {
  analyzeJson,
  computeDetailedJsonStats,
  type DetailedJsonStats,
  type JsonStats,
  sortJsonKeys,
} from './jsonStats.ts';
import { useJsonStudioHandlers } from './useJsonStudioHandlers.ts';
import { useJsonStudioOptions } from './useJsonStudioState.ts';

export { analyzeJson, type DetailedJsonStats, type JsonStats, sortJsonKeys };

export const DEFAULT_JSON = `{
  "user": {
    "id": 12345,
    "name": "John Doe",
    "email": "john@example.com",
    "active": true,
    "roles": ["admin", "editor", "user"],
    "profile": {
      "age": 30,
      "city": "New York",
      "preferences": {
        "theme": "dark",
        "notifications": true
      }
    }
  },
  "posts": [
    { "id": 1, "title": "Introduction", "views": 100 },
    { "id": 2, "title": "Getting Started", "views": 250 }
  ]
}`;

export const JSON_PRESET_EXAMPLES: Record<string, string> = {
  user: DEFAULT_JSON,
  api: `{
  "status": "success",
  "code": 200,
  "data": {
    "requestId": "req_9921bc4f",
    "timestamp": 1729864200,
    "items": [
      { "sku": "SKU-001", "name": "Wireless Mouse", "price": 24.99, "inStock": true },
      { "sku": "SKU-002", "name": "Mechanical Keyboard", "price": 89.99, "inStock": false }
    ],
    "pagination": { "page": 1, "pageSize": 20, "totalPages": 5, "totalItems": 95 }
  }
}`,
  ecommerce: `{
  "product": {
    "id": "prod_7718",
    "title": "Ergonomic Office Chair",
    "brand": "BeyondTheAI Ergonomics",
    "price": { "amount": 299.00, "currency": "USD", "discount": 0.15 },
    "dimensions": { "width": 65, "height": 115, "depth": 60, "unit": "cm" },
    "features": [
      "Lumbar support adjustment",
      "Breathable mesh backrest",
      "3D adjustable armrests"
    ],
    "inStock": true,
    "rating": 4.8
  }
}`,
  config: `{
  "server": {
    "port": 8080,
    "host": "0.0.0.0",
    "ssl": { "enabled": true, "certPath": "/etc/ssl/cert.pem" },
    "cors": { "allowedOrigins": ["*"], "methods": ["GET", "POST"] }
  },
  "database": {
    "driver": "postgres",
    "poolSize": 10,
    "timeoutMs": 5000
  },
  "logging": {
    "level": "info",
    "structured": true
  }
}`,
};

function parseAndAnalyzeJson(input: string) {
  if (!input.trim()) return { valid: false, error: 'Empty JSON input', data: null, stats: null };
  try {
    const data = JSON.parse(input);
    const stats = computeDetailedJsonStats(data, input);
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
  keySorting: 'original' | 'asc' | 'desc',
  action: 'format' | 'minify' | 'validate',
  indent: '2' | '4' | 'tab' | 'min',
) {
  if (!parsedResult.valid || parsedResult.data === null) return '';
  let processed: unknown = parsedResult.data;
  if (keySorting === 'asc' || keySorting === 'desc') {
    processed = sortJsonKeys(processed, keySorting);
  }
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

function countSearchMatches(
  searchQuery: string,
  outputFormatted: string,
  matchCase: boolean,
  useRegex: boolean,
): number {
  if (!searchQuery.trim() || !outputFormatted) return 0;
  try {
    const flags = matchCase ? 'g' : 'gi';
    const regex = useRegex
      ? new RegExp(searchQuery, flags)
      : new RegExp(searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);
    return (outputFormatted.match(regex) || []).length;
  } catch {
    return 0;
  }
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

  const opts = useJsonStudioOptions();

  const parsedResult = useMemo(() => parseAndAnalyzeJson(input), [input]);
  const outputFormatted = useMemo(
    () => formatJsonOutput(parsedResult, opts.keySorting, opts.action, opts.indent),
    [parsedResult, opts.keySorting, opts.action, opts.indent],
  );
  const searchMatches = useMemo(
    () =>
      countSearchMatches(opts.searchQuery, outputFormatted, opts.searchMatchCase, opts.searchRegex),
    [opts.searchQuery, outputFormatted, opts.searchMatchCase, opts.searchRegex],
  );
  const tableData = useMemo(() => extractTableData(parsedResult), [parsedResult]);

  const handlers = useJsonStudioHandlers(
    input,
    setInput,
    store,
    notify,
    parsedResult,
    outputFormatted,
    opts.activeTab,
    opts.autoFormatOnPaste,
  );

  return {
    input,
    ...opts,
    sortKeys: opts.keySorting !== 'original',
    setSortKeys: (v: boolean) => opts.setKeySorting(v ? 'asc' : 'original'),
    parsedResult,
    outputFormatted,
    searchMatches,
    tableData,
    ...handlers,
  };
}
