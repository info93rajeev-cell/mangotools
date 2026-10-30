export interface DetailedTypeStats {
  strings: number;
  stringsPct: number;
  numbers: number;
  numbersPct: number;
  booleans: number;
  booleansPct: number;
  nulls: number;
  nullsPct: number;
  objects: number;
  objectsPct: number;
  arrays: number;
  arraysPct: number;
}

export interface DetailedJsonStats {
  chars: number;
  lines: number;
  bytes: number;
  sizeKb: string;
  objects: number;
  arrays: number;
  totalKeys: number;
  totalValues: number;
  maxDepth: number;
  rootType: string;
  types: DetailedTypeStats;
}

export interface JsonStats extends DetailedJsonStats {}

export function analyzeJson(
  value: unknown,
  depth = 1,
): { objects: number; arrays: number; maxDepth: number } {
  if (Array.isArray(value)) {
    return analyzeArray(value, depth);
  }
  if (typeof value === 'object' && value !== null) {
    return analyzeObject(value as Record<string, unknown>, depth);
  }
  return { objects: 0, arrays: 0, maxDepth: depth };
}

function analyzeArray(
  arr: unknown[],
  depth: number,
): { objects: number; arrays: number; maxDepth: number } {
  let objects = 0;
  let arrays = 1;
  let maxDepth = depth;
  for (const item of arr) {
    if (typeof item === 'object' && item !== null) {
      const sub = analyzeJson(item, depth + 1);
      objects += sub.objects;
      arrays += sub.arrays;
      maxDepth = Math.max(maxDepth, sub.maxDepth);
    }
  }
  return { objects, arrays, maxDepth };
}

function analyzeObject(
  obj: Record<string, unknown>,
  depth: number,
): { objects: number; arrays: number; maxDepth: number } {
  let objects = 1;
  let arrays = 0;
  let maxDepth = depth;
  for (const k of Object.keys(obj)) {
    const val = obj[k];
    if (typeof val === 'object' && val !== null) {
      const sub = analyzeJson(val, depth + 1);
      objects += sub.objects;
      arrays += sub.arrays;
      maxDepth = Math.max(maxDepth, sub.maxDepth);
    }
  }
  return { objects, arrays, maxDepth };
}

interface RawCounters {
  objects: number;
  arrays: number;
  totalKeys: number;
  totalValues: number;
  strings: number;
  numbers: number;
  booleans: number;
  nulls: number;
  maxDepth: number;
}

function countLeafOrBranch(val: unknown, depth: number, c: RawCounters): void {
  if (val === null) {
    c.nulls++;
    c.totalValues++;
  } else if (typeof val === 'string') {
    c.strings++;
    c.totalValues++;
  } else if (typeof val === 'number' || typeof val === 'bigint') {
    c.numbers++;
    c.totalValues++;
  } else if (typeof val === 'boolean') {
    c.booleans++;
    c.totalValues++;
  } else if (Array.isArray(val)) {
    if (depth > c.maxDepth) c.maxDepth = depth;
    c.arrays++;
    for (const item of val) countLeafOrBranch(item, depth + 1, c);
  } else if (typeof val === 'object') {
    if (depth > c.maxDepth) c.maxDepth = depth;
    c.objects++;
    const keys = Object.keys(val as Record<string, unknown>);
    c.totalKeys += keys.length;
    for (const k of keys) {
      countLeafOrBranch((val as Record<string, unknown>)[k], depth + 1, c);
    }
  }
}

export function computeDetailedJsonStats(data: unknown, input: string): DetailedJsonStats {
  const c: RawCounters = {
    objects: 0,
    arrays: 0,
    totalKeys: 0,
    totalValues: 0,
    strings: 0,
    numbers: 0,
    booleans: 0,
    nulls: 0,
    maxDepth: 1,
  };
  countLeafOrBranch(data, 1, c);

  const totalTypes = c.strings + c.numbers + c.booleans + c.nulls + c.objects + c.arrays || 1;
  const toPct = (n: number) => Number(((n / totalTypes) * 100).toFixed(1));
  const bytes = new TextEncoder().encode(input).length;
  const sizeKb = bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`;

  return {
    chars: input.length,
    lines: input.split('\n').length,
    bytes,
    sizeKb,
    objects: c.objects,
    arrays: c.arrays,
    totalKeys: c.totalKeys,
    totalValues: c.totalValues,
    maxDepth: c.maxDepth,
    rootType: Array.isArray(data)
      ? 'Array'
      : typeof data === 'object' && data !== null
        ? 'Object'
        : typeof data,
    types: {
      strings: c.strings,
      stringsPct: toPct(c.strings),
      numbers: c.numbers,
      numbersPct: toPct(c.numbers),
      booleans: c.booleans,
      booleansPct: toPct(c.booleans),
      nulls: c.nulls,
      nullsPct: toPct(c.nulls),
      objects: c.objects,
      objectsPct: toPct(c.objects),
      arrays: c.arrays,
      arraysPct: toPct(c.arrays),
    },
  };
}

export function sortJsonKeys(value: unknown, order: 'asc' | 'desc' = 'asc'): unknown {
  if (Array.isArray(value)) return value.map((v) => sortJsonKeys(v, order));
  if (typeof value === 'object' && value !== null) {
    const sortedObj: Record<string, unknown> = {};
    const keys = Object.keys(value).sort((a, b) =>
      order === 'asc' ? a.localeCompare(b) : b.localeCompare(a),
    );
    for (const key of keys) {
      sortedObj[key] = sortJsonKeys((value as Record<string, unknown>)[key], order);
    }
    return sortedObj;
  }
  return value;
}
