/**
 * Architecture rules for Phase 1 (blueprint §2.4 and §9.4). Pure functions over file text so they
 * can be unit-tested; scripts/validate/architecture.ts applies them to the repository.
 */

export interface Violation {
  file: string;
  line?: number;
  rule: string;
  message: string;
}

export const FORBIDDEN_FOLDERS = [
  'apps/api',
  'apps/extension',
  'apps/mcp',
  'packages/adapters',
  'packages/workspace',
  'packages/io',
  'packages/client-platform',
  'modules',
  'deploy',
] as const;

/** Globals and APIs engines may not touch (determinism, privacy and portability). */
export const ENGINE_BANNED: readonly { pattern: RegExp; what: string }[] = [
  { pattern: /\bdocument\s*\./, what: 'DOM (document)' },
  { pattern: /\bwindow\b/, what: 'DOM (window)' },
  { pattern: /\bnavigator\b/, what: 'navigator' },
  { pattern: /\bfetch\s*\(/, what: 'network (fetch)' },
  { pattern: /\b(XMLHttpRequest|WebSocket|EventSource|sendBeacon)\b/, what: 'network API' },
  { pattern: /\b(localStorage|sessionStorage|indexedDB)\b/, what: 'browser storage' },
  {
    pattern: /\bDate\s*\.\s*now\b|\bnew\s+Date\s*\(\s*\)|(?<!new\s+)\bDate\s*\(/,
    what: 'Date (use ctx.clock)',
  },
  { pattern: /\bMath\s*\.\s*random\b/, what: 'Math.random (use ctx.random)' },
  { pattern: /\bgetRandomValues\b|\brandomUUID\b/, what: 'crypto randomness (use ctx.random)' },
  { pattern: /\bIntl\s*\./, what: 'Intl formatting' },
  {
    pattern: /\btoLocale\w*String\b|\blocaleCompare\b/,
    what: 'locale-dependent formatting or comparison',
  },
  { pattern: /\bparseFloat\b/, what: 'parseFloat (use engines/numeric)' },
  { pattern: /\bconsole\s*\./, what: 'console' },
  { pattern: /\bprocess\s*\./, what: 'process' },
  { pattern: /\b(setTimeout|setInterval|requestAnimationFrame)\b/, what: 'timers' },
  { pattern: /\brequire\s*\(/, what: 'require()' },
  {
    pattern: /^\s*(export\s+)?(default\s+)?(abstract\s+)?class\s+\w/m,
    what: 'class (use functions and data)',
  },
];

/** npm packages each engine may import, besides zod and @mangotools/core. */
export const ENGINE_IMPORTS: Readonly<Record<string, readonly string[]>> = {
  numeric: ['big.js'],
  data: [],
  estimate: ['@mangotools/engine-numeric'],
  logistics: ['@mangotools/engine-numeric'],
  search: ['minisearch'],
  pdf: ['pdf-lib'],
};

const ALWAYS_ALLOWED = ['zod', '@mangotools/core'];

/** Replaces comments and string contents with spaces, keeping line numbers. */
export function stripCommentsAndStrings(source: string): string {
  let out = '';
  let i = 0;
  const blank = (text: string) => text.replace(/[^\n]/g, ' ');
  while (i < source.length) {
    const rest = source.slice(i);
    const token =
      /^(\/\*[\s\S]*?\*\/|\/\/[^\n]*|'(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*"|`(?:\\.|[^`\\])*`)/.exec(
        rest,
      );
    if (token) {
      const text = token[0];
      const quote = text[0] === '/' ? '' : (text[0] ?? '');
      out += quote ? `${quote}${blank(text.slice(1, -1))}${quote}` : blank(text);
      i += text.length;
    } else {
      out += source[i];
      i++;
    }
  }
  return out;
}

/**
 * Module specifiers imported by a TypeScript file (static, dynamic, side-effect and re-exports).
 * Keywords are found in code with comments and strings blanked, so import-like text inside
 * strings (for example in tests) is ignored; the specifier is then read from the original.
 */
export function importSpecifiers(source: string): { specifier: string; line: number }[] {
  const code = stripCommentsAndStrings(source);
  const found: { specifier: string; line: number }[] = [];
  const pattern = /(?:\bfrom\s*|\bimport\s*\(\s*|^\s*import\s+)(['"])/gm;
  for (const match of code.matchAll(pattern)) {
    const quoteAt = match.index + match[0].length - 1;
    const quote = source[quoteAt] ?? "'";
    const end = source.indexOf(quote, quoteAt + 1);
    const line = source.slice(0, quoteAt).split('\n').length;
    found.push({ specifier: source.slice(quoteAt + 1, end), line });
  }
  return found;
}

const lineOf = (text: string, index: number) => text.slice(0, index).split('\n').length;

export function checkEngineSource(file: string, engineId: string, source: string): Violation[] {
  const violations: Violation[] = [];
  const code = stripCommentsAndStrings(source);
  for (const { pattern, what } of ENGINE_BANNED) {
    const match = new RegExp(
      pattern.source,
      pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`,
    ).exec(code);
    if (match)
      violations.push({
        file,
        line: lineOf(code, match.index),
        rule: 'engine-purity',
        message: `Engines must not use ${what}.`,
      });
  }
  const allowed = [...ALWAYS_ALLOWED, ...(ENGINE_IMPORTS[engineId] ?? [])];
  for (const { specifier, line } of importSpecifiers(source)) {
    if (specifier.startsWith('.')) continue;
    if (!allowed.includes(specifier)) {
      violations.push({
        file,
        line,
        rule: 'engine-imports',
        message: `engines/${engineId} may not import "${specifier}".`,
      });
    }
  }
  return violations;
}

/** Relative imports must not climb out of the engine package. */
export function checkRelativeEscape(
  file: string,
  packageRoot: string,
  source: string,
): Violation[] {
  const depth = file.slice(packageRoot.length + 1).split('/').length - 1;
  return importSpecifiers(source)
    .filter(
      ({ specifier }) =>
        specifier.startsWith('.') && (specifier.match(/\.\.\//g)?.length ?? 0) > depth,
    )
    .map(({ specifier, line }) => ({
      file,
      line,
      rule: 'package-boundary',
      message: `"${specifier}" leaves ${packageRoot}.`,
    }));
}

export function checkBigJs(file: string, source: string): Violation[] {
  if (file.startsWith('engines/numeric/')) return [];
  return importSpecifiers(source)
    .filter(({ specifier }) => specifier === 'big.js')
    .map(({ line }) => ({
      file,
      line,
      rule: 'decimal-isolation',
      message: 'Only engines/numeric may import big.js.',
    }));
}

/** packages/ui and apps/web reach engines only through packages/runtime. */
export function checkNoDirectEngineImport(file: string, source: string): Violation[] {
  return importSpecifiers(source)
    .filter(
      ({ specifier }) =>
        specifier.startsWith('@mangotools/engine-') || /(^|\/)engines\//.test(specifier),
    )
    .map(({ specifier, line }) => ({
      file,
      line,
      rule: 'layering',
      message: `Import engines through @mangotools/runtime, not "${specifier}".`,
    }));
}

/** scripts/ may not import the UI or the web app. */
export function checkScriptsLayer(file: string, source: string): Violation[] {
  return importSpecifiers(source)
    .filter(({ specifier }) =>
      /@mangotools\/(ui|web)\b|(^|\/)(packages\/ui|apps\/web)\//.test(specifier),
    )
    .map(({ specifier, line }) => ({
      file,
      line,
      rule: 'layering',
      message: `scripts/ may not import "${specifier}".`,
    }));
}

export const LIMITS = {
  sourceWarn: 300,
  sourceFail: 400,
  testFail: 600,
  manifest: 200,
  preset: 250,
} as const;

export function checkLength(
  file: string,
  source: string,
): { violation?: Violation; warning?: Violation } {
  const lines = source.split('\n').length;
  const isTest = /\.(test|spec)\.ts$/.test(file) || file.startsWith('tests/');
  const yamlLimit = file.endsWith('manifest.yaml')
    ? LIMITS.manifest
    : file.startsWith('presets/')
      ? LIMITS.preset
      : null;
  const fail = yamlLimit ?? (isTest ? LIMITS.testFail : LIMITS.sourceFail);
  const make = (message: string): Violation => ({ file, rule: 'file-length', message });
  if (lines > fail) return { violation: make(`${lines} lines (limit ${fail}).`) };
  if (!isTest && !yamlLimit && lines > LIMITS.sourceWarn)
    return { warning: make(`${lines} lines (aim for ≤ ${LIMITS.sourceWarn}).`) };
  return {};
}
