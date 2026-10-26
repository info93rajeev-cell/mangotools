/**
 * Minimal static server for built sites (preview and Playwright). Mirrors the production host:
 * clean URLs map to .html files, 404.html is served for unknown paths, and headers from
 * dist/_headers are applied. Usage: tsx tests/support/serve.ts <dir> <port>
 */
import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs';
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
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
  '.wasm': 'application/wasm',
  '.onnx': 'application/octet-stream',
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

function handleModelRoute(
  req: IncomingMessage,
  res: ServerResponse,
  path: string,
  cacheDir: string,
): boolean {
  if (path === '/models-init.js') {
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
    res.setHeader('Content-Type', 'text/javascript; charset=utf-8');
    res.statusCode = 200;
    res.end('window.__MANGOTOOLS_MODELS_HOST__ = window.location.origin + "/";\n');
    return true;
  }

  const modelMatch = path.match(/^\/birefnet-lite-512\/[^/]+\/(.+)$/);
  if (!modelMatch) return false;

  const modelFile = join(cacheDir, modelMatch[1]);
  if (!existsSync(modelFile) || !statSync(modelFile).isFile()) return false;

  const stat = statSync(modelFile);
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('Content-Type', TYPES[extname(modelFile)] ?? 'application/octet-stream');

  const rangeHeader = req.headers.range;
  if (rangeHeader?.startsWith('bytes=')) {
    const parts = rangeHeader.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
    const chunksize = end - start + 1;
    res.statusCode = 206;
    res.setHeader('Content-Range', `bytes ${start}-${end}/${stat.size}`);
    res.setHeader('Content-Length', chunksize);
    createReadStream(modelFile, { start, end }).pipe(res);
    return true;
  }

  res.setHeader('Content-Length', stat.size);
  res.statusCode = 200;
  if (req.method === 'HEAD') {
    res.end();
    return true;
  }
  createReadStream(modelFile).pipe(res);
  return true;
}

function handleStaticFile(
  req: IncomingMessage,
  res: ServerResponse,
  root: string,
  path: string,
  rules: HeaderRule[],
): void {
  const found = path.endsWith('/_headers') ? null : resolveFile(root, path);
  const file = found ?? join(root, '404.html');
  for (const [name, value] of headersFor(rules, path)) res.setHeader(name, value);
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.statusCode = found ? 200 : 404;

  if (extname(file) === '.html') {
    let html = readFileSync(file, 'utf8');
    if (!html.includes('/models-init.js')) {
      html = html.replace('<head>', '<head><script src="/models-init.js"></script>');
    }
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(req.method === 'HEAD' ? undefined : html);
    return;
  }

  res.setHeader('Content-Type', TYPES[extname(file)] ?? 'application/octet-stream');
  res.end(req.method === 'HEAD' ? undefined : readFileSync(file));
}

export function startServer(dir: string, port: number): Promise<Server> {
  const root = resolve(dir);
  const repoRoot = resolve(process.cwd());
  const cacheDir = join(repoRoot, 'scripts', 'models', '.cache');
  const headersFile = join(root, '_headers');
  const rules = existsSync(headersFile) ? parseHeaders(readFileSync(headersFile, 'utf8')) : [];

  const server = createServer((req, res) => {
    const url = new URL(req.url ?? '/', 'http://localhost');
    const path = url.pathname === '/' ? '/index.html' : url.pathname;

    if (handleModelRoute(req, res, path, cacheDir)) return;

    handleStaticFile(req, res, root, path, rules);
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
