/**
 * Minimal static server for built sites (preview and Playwright). Mirrors the production host:
 * clean URLs map to .html files, 404.html is served for unknown paths, and headers from
 * dist/_headers are applied. Usage: tsx tests/support/serve.ts <dir> <port>
 */
import { existsSync, readFileSync, statSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
};

interface HeaderRule {
  pattern: RegExp;
  headers: [string, string][];
}

/** Parses Cloudflare Pages style _headers: a path line, then indented "Name: value" lines. */
export function parseHeaders(text: string): HeaderRule[] {
  const rules: HeaderRule[] = [];
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    if (!/^\s/.test(line)) {
      const source = line
        .trim()
        .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
        .replace(/\*/g, '.*');
      rules.push({ pattern: new RegExp(`^${source}$`), headers: [] });
    } else {
      const index = line.indexOf(':');
      rules.at(-1)?.headers.push([line.slice(0, index).trim(), line.slice(index + 1).trim()]);
    }
  }
  return rules;
}

function resolveFile(root: string, urlPath: string): string | null {
  const clean = normalize(decodeURIComponent(urlPath)).replace(/^(\.\.[/\\])+/, '');
  const candidates = [
    join(root, clean),
    join(root, `${clean}.html`),
    join(root, clean, 'index.html'),
  ];
  return (
    candidates.find((c) => c.startsWith(root) && existsSync(c) && statSync(c).isFile()) ?? null
  );
}

function headersFor(rules: HeaderRule[], pathname: string): [string, string][] {
  return rules.filter((rule) => rule.pattern.test(pathname)).flatMap((rule) => rule.headers);
}

export function startServer(dir: string, port: number): Promise<Server> {
  const root = resolve(dir);
  const headersFile = join(root, '_headers');
  const rules = existsSync(headersFile) ? parseHeaders(readFileSync(headersFile, 'utf8')) : [];
  const server = createServer((req, res) => {
    const url = new URL(req.url ?? '/', 'http://localhost');
    const path = url.pathname === '/' ? '/index.html' : url.pathname;
    const found = path.endsWith('/_headers') ? null : resolveFile(root, path);
    const file = found ?? join(root, '404.html');
    for (const [name, value] of headersFor(rules, url.pathname)) res.setHeader(name, value);
    res.statusCode = found ? 200 : 404;
    res.setHeader('Content-Type', TYPES[extname(file)] ?? 'application/octet-stream');
    res.end(req.method === 'HEAD' ? undefined : readFileSync(file));
  });
  return new Promise((ok) => server.listen(port, '127.0.0.1', () => ok(server)));
}

const isMain =
  process.argv[1] && resolve(process.argv[1]).endsWith(join('tests', 'support', 'serve.ts'));
if (isMain) {
  const [dir = 'apps/web/dist', port = '4321'] = process.argv.slice(2);
  await startServer(dir, Number(port));
  console.log(`Serving ${dir} at http://localhost:${port}`);
}
